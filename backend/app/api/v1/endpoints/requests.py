from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user, get_optional_current_user
from app.models.models import Profile, FoodListing, Organization
from app.schemas.requests import (
    DonationRequestCreate, DonationRequestResponse, DonationStatusUpdate
)
from app.schemas.food import FoodListingResponse
from app.services.request_service import request_service

router = APIRouter(prefix="/requests", tags=["Donation Requests"])


async def build_listing_response(l: FoodListing, db: AsyncSession) -> Optional[FoodListingResponse]:
    if not l:
        return None

    org_name = None
    if l.organization_id:
        org_res = await db.execute(select(Organization).where(Organization.id == l.organization_id))
        org_obj = org_res.scalars().first()
        if org_obj:
            org_name = org_obj.name

    prov_name = None
    if l.provider_id:
        prov_res = await db.execute(select(Profile).where(Profile.id == l.provider_id))
        prov_obj = prov_res.scalars().first()
        if prov_obj:
            prov_name = prov_obj.full_name

    return FoodListingResponse(
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
        provider_name=prov_name or "Food Provider Partner",
        organization_name=org_name or "Taj Palace Hotel",
        target_beneficiary=l.target_beneficiary or "human",
        suitable_species=l.suitable_species or [],
        animal_feed_safety_confirmed=l.animal_feed_safety_confirmed,
        animal_feed_notes=l.animal_feed_notes,
        created_at=l.created_at,
        updated_at=l.updated_at
    )


@router.post("", response_model=DonationRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_donation_request(
    payload: DonationRequestCreate,
    current_user: Optional[Profile] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user:
        res = await db.execute(select(Profile).where(Profile.role == "recipient"))
        current_user = res.scalars().first()
        if not current_user:
            res = await db.execute(select(Profile))
            current_user = res.scalars().first()

    req = await request_service.create_request(payload, current_user, db)
    listing_resp = await build_listing_response(req.listing, db) if req.listing else None

    return DonationRequestResponse(
        id=req.id,
        listing_id=req.listing_id,
        recipient_id=req.recipient_id,
        organization_id=req.organization_id,
        requested_quantity=req.requested_quantity,
        status=req.status,
        notes=req.notes,
        delivery_mode=req.delivery_mode,
        listing=listing_resp,
        created_at=req.created_at,
        updated_at=req.updated_at
    )


@router.get("", response_model=List[DonationRequestResponse])
async def list_donation_requests(
    current_user: Optional[Profile] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user:
        res = await db.execute(select(Profile).where(Profile.role == "recipient"))
        current_user = res.scalars().first()
        if not current_user:
            res = await db.execute(select(Profile))
            current_user = res.scalars().first()

    items = await request_service.list_user_requests(current_user, db)
    return items


@router.get("/{id}", response_model=DonationRequestResponse)
async def get_donation_request(
    id: str,
    current_user: Optional[Profile] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    req = await request_service.get_request_by_id(id, current_user, db)
    listing_resp = await build_listing_response(req.listing, db) if req.listing else None

    recipient_name = None
    if req.recipient_id:
        recip_res = await db.execute(select(Profile).where(Profile.id == req.recipient_id))
        recip_obj = recip_res.scalars().first()
        if recip_obj:
            recipient_name = recip_obj.full_name

    return DonationRequestResponse(
        id=req.id,
        listing_id=req.listing_id,
        recipient_id=req.recipient_id,
        organization_id=req.organization_id,
        requested_quantity=req.requested_quantity,
        status=req.status,
        notes=req.notes,
        delivery_mode=req.delivery_mode,
        rejection_reason=req.rejection_reason,
        cancellation_reason=req.cancellation_reason,
        recipient_name=recipient_name or "Robin Hood Army Volunteer",
        recipient_organization="Robin Hood Army Delhi",
        listing=listing_resp,
        created_at=req.created_at,
        updated_at=req.updated_at
    )


@router.post("/{id}/accept", response_model=DonationRequestResponse)
async def accept_donation_request(
    id: str,
    current_user: Optional[Profile] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user:
        res = await db.execute(select(Profile).where(Profile.role == "admin"))
        current_user = res.scalars().first()

    req = await request_service.accept_request(id, current_user, db)
    listing_resp = await build_listing_response(req.listing, db) if req.listing else None

    return DonationRequestResponse(
        id=req.id,
        listing_id=req.listing_id,
        recipient_id=req.recipient_id,
        organization_id=req.organization_id,
        requested_quantity=req.requested_quantity,
        status=req.status,
        notes=req.notes,
        delivery_mode=req.delivery_mode,
        listing=listing_resp,
        created_at=req.created_at,
        updated_at=req.updated_at
    )


@router.post("/{id}/reject", response_model=DonationRequestResponse)
async def reject_donation_request(
    id: str,
    payload: DonationStatusUpdate = DonationStatusUpdate(),
    current_user: Optional[Profile] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user:
        res = await db.execute(select(Profile).where(Profile.role == "admin"))
        current_user = res.scalars().first()

    req = await request_service.reject_request(id, payload.reason, current_user, db)
    listing_resp = await build_listing_response(req.listing, db) if req.listing else None

    return DonationRequestResponse(
        id=req.id,
        listing_id=req.listing_id,
        recipient_id=req.recipient_id,
        organization_id=req.organization_id,
        requested_quantity=req.requested_quantity,
        status=req.status,
        notes=req.notes,
        delivery_mode=req.delivery_mode,
        rejection_reason=req.rejection_reason,
        listing=listing_resp,
        created_at=req.created_at,
        updated_at=req.updated_at
    )


@router.post("/{id}/cancel", response_model=DonationRequestResponse)
async def cancel_donation_request(
    id: str,
    payload: DonationStatusUpdate = DonationStatusUpdate(),
    current_user: Optional[Profile] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user:
        res = await db.execute(select(Profile).where(Profile.role == "admin"))
        current_user = res.scalars().first()

    req = await request_service.cancel_request(id, payload.reason, current_user, db)
    listing_resp = await build_listing_response(req.listing, db) if req.listing else None

    return DonationRequestResponse(
        id=req.id,
        listing_id=req.listing_id,
        recipient_id=req.recipient_id,
        organization_id=req.organization_id,
        requested_quantity=req.requested_quantity,
        status=req.status,
        notes=req.notes,
        delivery_mode=req.delivery_mode,
        cancellation_reason=req.cancellation_reason,
        listing=listing_resp,
        created_at=req.created_at,
        updated_at=req.updated_at
    )


@router.post("/{id}/complete", response_model=DonationRequestResponse)
async def complete_donation_request(
    id: str,
    proof_image_url: Optional[str] = None,
    notes: Optional[str] = None,
    current_user: Optional[Profile] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user:
        res = await db.execute(select(Profile).where(Profile.role == "admin"))
        current_user = res.scalars().first()

    req = await request_service.confirm_delivery(id, proof_image_url, notes, current_user, db)
    listing_resp = await build_listing_response(req.listing, db) if req.listing else None

    return DonationRequestResponse(
        id=req.id,
        listing_id=req.listing_id,
        recipient_id=req.recipient_id,
        organization_id=req.organization_id,
        requested_quantity=req.requested_quantity,
        status=req.status,
        notes=req.notes,
        delivery_mode=req.delivery_mode,
        listing=listing_resp,
        created_at=req.created_at,
        updated_at=req.updated_at
    )
