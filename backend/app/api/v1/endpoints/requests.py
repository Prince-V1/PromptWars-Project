from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Profile
from app.schemas.requests import (
    DonationRequestCreate, DonationRequestResponse, DonationStatusUpdate
)
from app.services.request_service import request_service

router = APIRouter(prefix="/requests", tags=["Donation Requests"])


@router.post("", response_model=DonationRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_donation_request(
    payload: DonationRequestCreate,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    req = await request_service.create_request(payload, current_user, db)
    return DonationRequestResponse(
        id=req.id,
        listing_id=req.listing_id,
        recipient_id=req.recipient_id,
        organization_id=req.organization_id,
        requested_quantity=req.requested_quantity,
        status=req.status,
        notes=req.notes,
        delivery_mode=req.delivery_mode,
        created_at=req.created_at,
        updated_at=req.updated_at
    )


@router.get("", response_model=List[DonationRequestResponse])
async def list_donation_requests(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await request_service.list_user_requests(current_user, db)


@router.get("/{id}", response_model=DonationRequestResponse)
async def get_donation_request(
    id: str,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    req = await request_service.get_request_by_id(id, current_user, db)
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
        recipient_name=req.recipient.full_name if req.recipient else None,
        recipient_organization=req.recipient.organization.name if (req.recipient and req.recipient.organization) else None,
        created_at=req.created_at,
        updated_at=req.updated_at
    )


@router.post("/{id}/accept", response_model=DonationRequestResponse)
async def accept_donation_request(
    id: str,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    req = await request_service.accept_request(id, current_user, db)
    return DonationRequestResponse(
        id=req.id,
        listing_id=req.listing_id,
        recipient_id=req.recipient_id,
        organization_id=req.organization_id,
        requested_quantity=req.requested_quantity,
        status=req.status,
        notes=req.notes,
        delivery_mode=req.delivery_mode,
        created_at=req.created_at,
        updated_at=req.updated_at
    )


@router.post("/{id}/reject", response_model=DonationRequestResponse)
async def reject_donation_request(
    id: str,
    payload: DonationStatusUpdate = DonationStatusUpdate(),
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    req = await request_service.reject_request(id, payload.reason, current_user, db)
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
        created_at=req.created_at,
        updated_at=req.updated_at
    )


@router.post("/{id}/cancel", response_model=DonationRequestResponse)
async def cancel_donation_request(
    id: str,
    payload: DonationStatusUpdate = DonationStatusUpdate(),
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    req = await request_service.cancel_request(id, payload.reason, current_user, db)
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
        created_at=req.created_at,
        updated_at=req.updated_at
    )


@router.post("/{id}/complete", response_model=DonationRequestResponse)
async def complete_donation_request(
    id: str,
    proof_image_url: Optional[str] = None,
    notes: Optional[str] = None,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    req = await request_service.confirm_delivery(id, proof_image_url, notes, current_user, db)
    return DonationRequestResponse(
        id=req.id,
        listing_id=req.listing_id,
        recipient_id=req.recipient_id,
        organization_id=req.organization_id,
        requested_quantity=req.requested_quantity,
        status=req.status,
        notes=req.notes,
        delivery_mode=req.delivery_mode,
        created_at=req.created_at,
        updated_at=req.updated_at
    )
