from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload

from app.models.models import (
    DonationRequest, FoodListing, Profile, Organization, Pickup, ImpactRecord, AuditLog
)
from app.schemas.requests import DonationRequestCreate, DonationRequestResponse
from app.services.impact_service import impact_service
from app.core.exceptions import (
    NotFoundException, ForbiddenException, FoodLoopException, ConcurrencyConflictException
)


class RequestService:
    @staticmethod
    async def create_request(
        payload: DonationRequestCreate,
        current_user: Profile,
        db: AsyncSession
    ) -> DonationRequest:
        """
        Creates a donation request with atomic locking to prevent oversubscription.
        """
        if current_user.role != "recipient" and current_user.role != "admin":
            raise ForbiddenException("Only registered recipients or NGOs can request food donations")

        # Select listing with lock (or normal select with transaction check)
        stmt = select(FoodListing).where(FoodListing.id == payload.listing_id).with_for_update()
        result = await db.execute(stmt)
        listing = result.scalars().first()

        if not listing:
            raise NotFoundException("Food listing not found")

        now = datetime.now(timezone.utc)
        dl = listing.pickup_deadline
        if dl.tzinfo is None:
            dl = dl.replace(tzinfo=timezone.utc)

        if dl <= now:
            listing.status = "expired"
            await db.commit()
            raise FoodLoopException("Food listing pickup deadline has passed and is expired")

        if listing.status != "available":
            raise FoodLoopException(f"Listing is not available for requests (current status: {listing.status})")

        if payload.requested_quantity > listing.remaining_quantity:
            raise ConcurrencyConflictException(
                f"Requested quantity ({payload.requested_quantity}) exceeds remaining available quantity ({listing.remaining_quantity} {listing.unit})"
            )

        # Prevent duplicate pending requests by same recipient for same listing
        dup_stmt = select(DonationRequest).where(
            and_(
                DonationRequest.listing_id == payload.listing_id,
                DonationRequest.recipient_id == current_user.id,
                DonationRequest.status.in_(["requested", "accepted"])
            )
        )
        dup_res = await db.execute(dup_stmt)
        if dup_res.scalars().first():
            raise FoodLoopException("You already have an active request pending for this food listing")

        # Deduct quantity from listing
        listing.remaining_quantity = round(listing.remaining_quantity - payload.requested_quantity, 2)
        if listing.remaining_quantity <= 0:
            listing.status = "reserved"

        request = DonationRequest(
            listing_id=listing.id,
            recipient_id=current_user.id,
            organization_id=current_user.organization_id,
            requested_quantity=payload.requested_quantity,
            status="requested",
            notes=payload.notes,
            delivery_mode=payload.delivery_mode
        )
        db.add(request)
        await db.flush()

        # If delivery mode is volunteer_courier, create a pending pickup task
        if payload.delivery_mode == "volunteer_courier":
            pickup = Pickup(
                request_id=request.id,
                status="pending"
            )
            db.add(pickup)

        audit = AuditLog(
            actor_id=current_user.id,
            action="CREATE_REQUEST",
            entity_type="donation_requests",
            entity_id=request.id,
            metadata_json={"quantity": payload.requested_quantity, "listing_id": listing.id}
        )
        db.add(audit)

        await db.commit()
        await db.refresh(request)
        request.listing = listing
        return request

    @staticmethod
    async def get_request_by_id(request_id: str, current_user: Optional[Profile], db: AsyncSession) -> DonationRequest:
        stmt = (
            select(DonationRequest)
            .options(
                selectinload(DonationRequest.listing).selectinload(FoodListing.provider),
                selectinload(DonationRequest.listing).selectinload(FoodListing.organization),
                selectinload(DonationRequest.recipient).selectinload(Profile.organization),
                selectinload(DonationRequest.pickup)
            )
            .where(DonationRequest.id == request_id)
        )
        result = await db.execute(stmt)
        req = result.scalars().first()
        if not req:
            raise NotFoundException("Donation request not found")

        return req

    @staticmethod
    async def list_user_requests(current_user: Profile, db: AsyncSession) -> List[DonationRequestResponse]:
        stmt = select(DonationRequest).options(
            selectinload(DonationRequest.listing),
            selectinload(DonationRequest.recipient).selectinload(Profile.organization)
        )

        if current_user.role == "recipient":
            stmt = stmt.where(DonationRequest.recipient_id == current_user.id)
        elif current_user.role == "food_provider":
            stmt = stmt.join(FoodListing).where(FoodListing.provider_id == current_user.id)
        elif current_user.role == "admin":
            pass  # Admin sees all
        else:
            # Volunteers see requests with volunteer_courier
            stmt = stmt.where(DonationRequest.delivery_mode == "volunteer_courier")

        stmt = stmt.order_by(DonationRequest.created_at.desc())
        result = await db.execute(stmt)
        records = result.scalars().all()

        responses = []
        for r in records:
            responses.append(DonationRequestResponse(
                id=r.id,
                listing_id=r.listing_id,
                recipient_id=r.recipient_id,
                organization_id=r.organization_id,
                requested_quantity=r.requested_quantity,
                status=r.status,
                notes=r.notes,
                delivery_mode=r.delivery_mode,
                rejection_reason=r.rejection_reason,
                cancellation_reason=r.cancellation_reason,
                recipient_name=r.recipient.full_name if r.recipient else None,
                recipient_organization=r.recipient.organization.name if (r.recipient and r.recipient.organization) else None,
                created_at=r.created_at,
                updated_at=r.updated_at
            ))
        return responses

    @staticmethod
    async def accept_request(request_id: str, current_user: Profile, db: AsyncSession) -> DonationRequest:
        req = await RequestService.get_request_by_id(request_id, current_user, db)
        if req.listing.provider_id != current_user.id and current_user.role != "admin":
            raise ForbiddenException("Only the food provider can accept this request")

        if req.status != "requested":
            raise FoodLoopException(f"Cannot accept request in '{req.status}' state")

        req.status = "accepted"
        audit = AuditLog(
            actor_id=current_user.id,
            action="ACCEPT_REQUEST",
            entity_type="donation_requests",
            entity_id=req.id
        )
        db.add(audit)
        await db.commit()
        await db.refresh(req)
        return req

    @staticmethod
    async def reject_request(request_id: str, reason: Optional[str], current_user: Profile, db: AsyncSession) -> DonationRequest:
        req = await RequestService.get_request_by_id(request_id, current_user, db)
        if req.listing.provider_id != current_user.id and current_user.role != "admin":
            raise ForbiddenException("Only the food provider can reject this request")

        if req.status not in ["requested", "accepted"]:
            raise FoodLoopException(f"Cannot reject request in '{req.status}' state")

        req.status = "rejected"
        req.rejection_reason = reason or "Provider unable to fulfill request at this time"

        # Restore quantity back to listing
        listing = req.listing
        listing.remaining_quantity = round(listing.remaining_quantity + req.requested_quantity, 2)
        if listing.status == "reserved":
            listing.status = "available"

        audit = AuditLog(
            actor_id=current_user.id,
            action="REJECT_REQUEST",
            entity_type="donation_requests",
            entity_id=req.id,
            metadata_json={"reason": req.rejection_reason}
        )
        db.add(audit)
        await db.commit()
        await db.refresh(req)
        return req

    @staticmethod
    async def cancel_request(request_id: str, reason: Optional[str], current_user: Profile, db: AsyncSession) -> DonationRequest:
        req = await RequestService.get_request_by_id(request_id, current_user, db)
        if req.recipient_id != current_user.id and current_user.role != "admin":
            raise ForbiddenException("Only the recipient can cancel their request")

        if req.status in ["picked_up", "delivered", "rejected", "cancelled"]:
            raise FoodLoopException(f"Cannot cancel request in '{req.status}' state")

        req.status = "cancelled"
        req.cancellation_reason = reason or "Cancelled by recipient"

        # Restore quantity back to listing
        listing = req.listing
        listing.remaining_quantity = round(listing.remaining_quantity + req.requested_quantity, 2)
        if listing.status == "reserved":
            listing.status = "available"

        audit = AuditLog(
            actor_id=current_user.id,
            action="CANCEL_REQUEST",
            entity_type="donation_requests",
            entity_id=req.id,
            metadata_json={"reason": req.cancellation_reason}
        )
        db.add(audit)
        await db.commit()
        await db.refresh(req)
        return req

    @staticmethod
    async def confirm_delivery(
        request_id: str,
        proof_url: Optional[str],
        notes: Optional[str],
        current_user: Profile,
        db: AsyncSession
    ) -> DonationRequest:
        req = await RequestService.get_request_by_id(request_id, current_user, db)
        if req.status == "delivered":
            return req

        req.status = "delivered"
        listing = req.listing

        # Mark listing completed if remaining is 0
        if listing.remaining_quantity <= 0:
            listing.status = "completed"

        # Calculate impact
        kg_equiv = impact_service.calculate_kg_equivalent(req.requested_quantity, listing.unit)
        meals, co2 = impact_service.calculate_meals_and_co2(kg_equiv)

        impact = ImpactRecord(
            listing_id=listing.id,
            request_id=req.id,
            provider_id=listing.provider_id,
            recipient_id=req.recipient_id,
            quantity=req.requested_quantity,
            unit=listing.unit,
            quantity_kg_equivalent=kg_equiv,
            estimated_meals=meals,
            co2_saved_kg=co2
        )
        db.add(impact)

        # Update pickup if attached
        if req.pickup:
            req.pickup.status = "delivered"
            req.pickup.delivered_at = datetime.now(timezone.utc)
            if proof_url:
                req.pickup.proof_image_url = proof_url
            if notes:
                req.pickup.delivery_notes = notes

        audit = AuditLog(
            actor_id=current_user.id,
            action="DELIVERED_CONFIRMED",
            entity_type="donation_requests",
            entity_id=req.id,
            metadata_json={"estimated_meals": meals, "co2_saved_kg": co2}
        )
        db.add(audit)

        await db.commit()
        await db.refresh(req)
        return req


request_service = RequestService()
