from typing import List, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.orm import selectinload

from app.models.models import FoodListing, Profile, Organization, AuditLog
from app.schemas.food import FoodListingCreate, FoodListingUpdate, FoodFilterParams, FoodListingResponse
from app.services.priority_service import priority_service
from app.services.matching_service import calculate_haversine_distance
from app.core.exceptions import NotFoundException, ForbiddenException, FoodLoopException


class FoodService:
    @staticmethod
    async def create_listing(
        payload: FoodListingCreate,
        current_user: Profile,
        db: AsyncSession
    ) -> FoodListing:
        now = datetime.now(timezone.utc)
        deadline = payload.pickup_deadline
        prep_time = payload.preparation_time
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        if prep_time.tzinfo is None:
            prep_time = prep_time.replace(tzinfo=timezone.utc)

        if deadline <= now:
            raise FoodLoopException("Pickup deadline must be in the future", status_code=400)
        if deadline <= prep_time:
            raise FoodLoopException("Pickup deadline must be after preparation time", status_code=400)
        if payload.quantity <= 0:
            raise FoodLoopException("Listing quantity must be strictly greater than 0", status_code=400)

        # Calculate initial urgency priority score
        score = priority_service.calculate_priority_score(
            pickup_deadline=deadline,
            category=payload.category,
            quantity=payload.quantity,
            unit=payload.unit,
            storage_instructions=payload.storage_instructions
        )

        listing = FoodListing(
            provider_id=current_user.id,
            organization_id=current_user.organization_id,
            title=payload.title,
            description=payload.description,
            category=payload.category,
            quantity=payload.quantity,
            remaining_quantity=payload.quantity,
            unit=payload.unit,
            dietary_type=payload.dietary_type,
            status="available",
            preparation_time=prep_time,
            pickup_deadline=deadline,
            pickup_address=payload.pickup_address,
            latitude=payload.latitude,
            longitude=payload.longitude,
            image_url=payload.image_url,
            storage_instructions=payload.storage_instructions,
            allergens=payload.allergens,
            ai_analysis_metadata=payload.ai_analysis_metadata or {},
            priority_score=score,
            target_beneficiary=payload.target_beneficiary or "human",
            suitable_species=payload.suitable_species or [],
            animal_feed_safety_confirmed=payload.animal_feed_safety_confirmed,
            animal_feed_notes=payload.animal_feed_notes
        )
        db.add(listing)
        await db.flush()

        # Audit log
        audit = AuditLog(
            actor_id=current_user.id,
            action="CREATE_LISTING",
            entity_type="food_listings",
            entity_id=listing.id,
            metadata_json={"title": listing.title, "quantity": listing.quantity}
        )
        db.add(audit)
        await db.commit()
        await db.refresh(listing)
        return listing

    @staticmethod
    async def get_listing_by_id(listing_id: str, db: AsyncSession) -> FoodListing:
        stmt = (
            select(FoodListing)
            .options(selectinload(FoodListing.provider), selectinload(FoodListing.organization))
            .where(FoodListing.id == listing_id)
        )
        result = await db.execute(stmt)
        listing = result.scalars().first()
        if not listing:
            raise NotFoundException(f"Food listing '{listing_id}' not found")
        return listing

    @staticmethod
    async def list_listings(
        params: FoodFilterParams,
        db: AsyncSession
    ) -> Tuple[List[FoodListingResponse], int]:
        stmt = select(FoodListing).options(
            selectinload(FoodListing.provider),
            selectinload(FoodListing.organization)
        )
        conditions = []

        if params.status:
            conditions.append(FoodListing.status == params.status)
        if params.category:
            if params.category == "animal_feed":
                conditions.append(
                    or_(
                        FoodListing.category == "animal_feed",
                        FoodListing.target_beneficiary.in_(["animal_feed", "both"])
                    )
                )
            else:
                conditions.append(FoodListing.category == params.category)
        if params.dietary_type:
            conditions.append(FoodListing.dietary_type == params.dietary_type)
        if params.target_beneficiary:
            if params.target_beneficiary == "animal_feed":
                conditions.append(FoodListing.target_beneficiary.in_(["animal_feed", "both"]))
            else:
                conditions.append(FoodListing.target_beneficiary.in_(["human", "both"]))
        if params.search:
            pattern = f"%{params.search}%"
            conditions.append(
                or_(
                    FoodListing.title.ilike(pattern),
                    FoodListing.description.ilike(pattern),
                    FoodListing.pickup_address.ilike(pattern)
                )
            )

        if conditions:
            stmt = stmt.where(and_(*conditions))

        # Sort order: support latest (newest first) or default urgency
        if params.sort_by == "latest":
            stmt = stmt.order_by(desc(FoodListing.created_at))
        elif params.sort_by == "quantity":
            stmt = stmt.order_by(desc(FoodListing.remaining_quantity))
        else:
            stmt = stmt.order_by(desc(FoodListing.priority_score), FoodListing.pickup_deadline.asc())

        result = await db.execute(stmt)
        listings = result.scalars().all()

        # Check and update expired status on-the-fly
        now = datetime.now(timezone.utc)
        responses = []
        for l in listings:
            dl = l.pickup_deadline
            if dl.tzinfo is None:
                dl = dl.replace(tzinfo=timezone.utc)
            if dl < now and l.status == "available":
                l.status = "expired"

            # Distance calculation if recipient provided coordinates
            dist_km = None
            if params.latitude is not None and params.longitude is not None:
                dist_km = calculate_haversine_distance(
                    params.latitude, params.longitude,
                    l.latitude, l.longitude
                )
                if params.max_distance_km and dist_km > params.max_distance_km:
                    continue  # Filter out items beyond radius

            resp = FoodListingResponse(
                id=l.id,
                provider_id=l.provider_id,
                organization_id=l.organization_id,
                title=l.title,
                description=l.description,
                category=l.category,
                quantity=l.quantity,
                remaining_quantity=l.remaining_quantity,
                unit=l.unit,
                dietary_type=l.dietary_type,
                status=l.status,
                preparation_time=l.preparation_time,
                pickup_deadline=l.pickup_deadline,
                pickup_address=l.pickup_address,
                latitude=l.latitude,
                longitude=l.longitude,
                image_url=l.image_url,
                storage_instructions=l.storage_instructions,
                allergens=l.allergens or [],
                priority_score=l.priority_score or 0.0,
                distance_km=dist_km,
                provider_name=l.provider.full_name if l.provider else None,
                organization_name=l.organization.name if l.organization else None,
                target_beneficiary=l.target_beneficiary or "human",
                suitable_species=l.suitable_species or [],
                animal_feed_safety_confirmed=l.animal_feed_safety_confirmed,
                animal_feed_notes=l.animal_feed_notes,
                created_at=l.created_at,
                updated_at=l.updated_at
            )
            responses.append(resp)

        total_count = len(responses)
        # Apply pagination
        start = (params.page - 1) * params.limit
        end = start + params.limit
        return responses[start:end], total_count

    @staticmethod
    async def update_listing(
        listing_id: str,
        payload: FoodListingUpdate,
        current_user: Profile,
        db: AsyncSession
    ) -> FoodListing:
        listing = await FoodService.get_listing_by_id(listing_id, db)
        if listing.provider_id != current_user.id and current_user.role != "admin":
            raise ForbiddenException("You are not authorized to edit this listing")

        update_data = payload.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(listing, key, val)

        await db.commit()
        await db.refresh(listing)
        return listing

    @staticmethod
    async def delete_listing(
        listing_id: str,
        current_user: Profile,
        db: AsyncSession
    ) -> bool:
        listing = await FoodService.get_listing_by_id(listing_id, db)
        if listing.provider_id != current_user.id and current_user.role != "admin":
            raise ForbiddenException("You are not authorized to delete this listing")

        await db.delete(listing)
        await db.commit()
        return True


food_service = FoodService()
