from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.core.exceptions import NotFoundException, ForbiddenException, FoodLoopException
from app.models.models import Pickup, Profile, DonationRequest, FoodListing, AuditLog
from app.schemas.pickups import PickupResponse, PickupAssignRequest, PickupCompleteRequest
from app.services.request_service import request_service

router = APIRouter(prefix="/pickups", tags=["Volunteer Pickups"])


@router.get("", response_model=List[PickupResponse])
async def list_pickups(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Pickup).options(
        selectinload(Pickup.volunteer),
        selectinload(Pickup.request).selectinload(DonationRequest.listing)
    )

    if current_user.role == "volunteer":
        # Show tasks assigned to this volunteer OR available pending tasks
        stmt = stmt.where(
            or_(
                Pickup.volunteer_id == current_user.id,
                Pickup.status == "pending"
            )
        )
    elif current_user.role == "admin":
        pass
    else:
        # Provider or recipient sees tasks linked to their donations
        stmt = stmt.join(DonationRequest).join(FoodListing).where(
            or_(
                DonationRequest.recipient_id == current_user.id,
                FoodListing.provider_id == current_user.id
            )
        )

    stmt = stmt.order_by(Pickup.created_at.desc())
    result = await db.execute(stmt)
    pickups = result.scalars().all()

    responses = []
    for p in pickups:
        responses.append(PickupResponse(
            id=p.id,
            request_id=p.request_id,
            volunteer_id=p.volunteer_id,
            status=p.status,
            assigned_at=p.assigned_at,
            picked_up_at=p.picked_up_at,
            delivered_at=p.delivered_at,
            pickup_notes=p.pickup_notes,
            proof_image_url=p.proof_image_url,
            delivery_notes=p.delivery_notes,
            volunteer_name=p.volunteer.full_name if p.volunteer else None,
            created_at=p.created_at,
            updated_at=p.updated_at
        ))
    return responses


@router.post("/{id}/assign", response_model=PickupResponse)
async def assign_pickup_task(
    id: str,
    payload: PickupAssignRequest = PickupAssignRequest(),
    current_user: Profile = Depends(require_role(["volunteer"])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Pickup).where(Pickup.id == id)
    result = await db.execute(stmt)
    pickup = result.scalars().first()
    if not pickup:
        raise NotFoundException("Pickup task not found")

    if pickup.status != "pending" and pickup.volunteer_id != current_user.id:
        raise FoodLoopException("Task has already been claimed by another volunteer")

    pickup.volunteer_id = current_user.id
    pickup.status = "assigned"
    pickup.assigned_at = datetime.now(timezone.utc)
    if payload.notes:
        pickup.pickup_notes = payload.notes

    audit = AuditLog(
        actor_id=current_user.id,
        action="ASSIGN_PICKUP",
        entity_type="pickups",
        entity_id=pickup.id
    )
    db.add(audit)
    await db.commit()
    await db.refresh(pickup)

    return PickupResponse(
        id=pickup.id,
        request_id=pickup.request_id,
        volunteer_id=pickup.volunteer_id,
        status=pickup.status,
        assigned_at=pickup.assigned_at,
        volunteer_name=current_user.full_name,
        created_at=pickup.created_at,
        updated_at=pickup.updated_at
    )


@router.post("/{id}/complete", response_model=PickupResponse)
async def complete_pickup_task(
    id: str,
    payload: PickupCompleteRequest = PickupCompleteRequest(),
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Pickup).where(Pickup.id == id)
    result = await db.execute(stmt)
    pickup = result.scalars().first()
    if not pickup:
        raise NotFoundException("Pickup task not found")

    if pickup.volunteer_id != current_user.id and current_user.role != "admin":
        raise ForbiddenException("Only the assigned volunteer can complete this pickup")

    # Call request delivery confirmation
    await request_service.confirm_delivery(
        request_id=pickup.request_id,
        proof_url=payload.proof_image_url,
        notes=payload.delivery_notes,
        current_user=current_user,
        db=db
    )

    pickup.status = "delivered"
    pickup.delivered_at = datetime.now(timezone.utc)
    if payload.proof_image_url:
        pickup.proof_image_url = payload.proof_image_url
    if payload.delivery_notes:
        pickup.delivery_notes = payload.delivery_notes

    await db.commit()
    await db.refresh(pickup)

    return PickupResponse(
        id=pickup.id,
        request_id=pickup.request_id,
        volunteer_id=pickup.volunteer_id,
        status=pickup.status,
        delivered_at=pickup.delivered_at,
        proof_image_url=pickup.proof_image_url,
        delivery_notes=pickup.delivery_notes,
        volunteer_name=current_user.full_name,
        created_at=pickup.created_at,
        updated_at=pickup.updated_at
    )
