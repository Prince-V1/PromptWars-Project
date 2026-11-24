from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import (
    Profile, FoodListing, DonationRequest, ImpactRecord
)
from app.schemas.dashboard import (
    ProviderDashboardResponse, RecipientDashboardResponse, ImpactMetricsResponse
)
from app.schemas.food import FoodListingResponse
from app.schemas.requests import DonationRequestResponse
from app.services.impact_service import impact_service

router = APIRouter(prefix="/dashboard", tags=["Dashboards"])


@router.get("/provider", response_model=ProviderDashboardResponse)
async def get_provider_dashboard(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Active listings count
    active_res = await db.execute(
        select(func.count(FoodListing.id)).where(
            and_(FoodListing.provider_id == current_user.id, FoodListing.status == "available")
        )
    )
    active_count = active_res.scalar() or 0

    # 2. Pending requests count
    pending_res = await db.execute(
        select(func.count(DonationRequest.id))
        .join(FoodListing)
        .where(
            and_(FoodListing.provider_id == current_user.id, DonationRequest.status == "requested")
        )
    )
    pending_count = pending_res.scalar() or 0

    # 3. Completed donations count
    completed_res = await db.execute(
        select(func.count(DonationRequest.id))
        .join(FoodListing)
        .where(
            and_(FoodListing.provider_id == current_user.id, DonationRequest.status == "delivered")
        )
    )
    completed_count = completed_res.scalar() or 0

    # 4. Totals from impact records
    impact_res = await db.execute(
        select(
            func.sum(ImpactRecord.quantity_kg_equivalent),
            func.sum(ImpactRecord.estimated_meals),
            func.sum(ImpactRecord.co2_saved_kg)
        ).where(ImpactRecord.provider_id == current_user.id)
    )
    imp_row = impact_res.first()
    total_kg = float(imp_row[0] or 0.0) if imp_row else 0.0
    total_meals = int(imp_row[1] or 0) if imp_row else 0
    total_co2 = float(imp_row[2] or 0.0) if imp_row else 0.0

    # 5. Recent listings
    list_stmt = (
        select(FoodListing)
        .where(FoodListing.provider_id == current_user.id)
        .order_by(FoodListing.created_at.desc())
        .limit(5)
    )
    recent_listings_raw = (await db.execute(list_stmt)).scalars().all()
    recent_listings = [
        FoodListingResponse.model_validate(l) for l in recent_listings_raw
    ]

    # 6. Recent requests
    req_stmt = (
        select(DonationRequest)
        .join(FoodListing)
        .options(selectinload(DonationRequest.recipient).selectinload(Profile.organization))
        .where(FoodListing.provider_id == current_user.id)
        .order_by(DonationRequest.created_at.desc())
        .limit(5)
    )
    recent_reqs_raw = (await db.execute(req_stmt)).scalars().all()
    recent_requests = [
        DonationRequestResponse(
            id=r.id,
            listing_id=r.listing_id,
            recipient_id=r.recipient_id,
            requested_quantity=r.requested_quantity,
            status=r.status,
            notes=r.notes,
            delivery_mode=r.delivery_mode,
            recipient_name=r.recipient.full_name if r.recipient else None,
            created_at=r.created_at,
            updated_at=r.updated_at
        ) for r in recent_reqs_raw
    ]

    return ProviderDashboardResponse(
        active_listings_count=active_count,
        pending_requests_count=pending_count,
        completed_donations_count=completed_count,
        total_kg_donated=round(total_kg, 2),
        total_meals_provided=total_meals,
        total_co2_saved_kg=round(total_co2, 2),
        recent_listings=recent_listings,
        recent_requests=recent_requests
    )


@router.get("/recipient", response_model=RecipientDashboardResponse)
async def get_recipient_dashboard(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Active requests
    active_res = await db.execute(
        select(func.count(DonationRequest.id)).where(
            and_(DonationRequest.recipient_id == current_user.id, DonationRequest.status.in_(["requested", "accepted"]))
        )
    )
    active_count = active_res.scalar() or 0

    # Delivered count
    delivered_res = await db.execute(
        select(func.count(DonationRequest.id)).where(
            and_(DonationRequest.recipient_id == current_user.id, DonationRequest.status == "delivered")
        )
    )
    delivered_count = delivered_res.scalar() or 0

    # Impact totals
    impact_res = await db.execute(
        select(
            func.sum(ImpactRecord.quantity_kg_equivalent),
            func.sum(ImpactRecord.estimated_meals)
        ).where(ImpactRecord.recipient_id == current_user.id)
    )
    imp_row = impact_res.first()
    total_kg = float(imp_row[0] or 0.0) if imp_row else 0.0
    total_meals = int(imp_row[1] or 0) if imp_row else 0

    # Available listings count
    avail_res = await db.execute(
        select(func.count(FoodListing.id)).where(FoodListing.status == "available")
    )
    avail_count = avail_res.scalar() or 0

    # Recent requests
    req_stmt = (
        select(DonationRequest)
        .where(DonationRequest.recipient_id == current_user.id)
        .order_by(DonationRequest.created_at.desc())
        .limit(5)
    )
    recent_reqs_raw = (await db.execute(req_stmt)).scalars().all()
    recent_requests = [
        DonationRequestResponse(
            id=r.id,
            listing_id=r.listing_id,
            recipient_id=r.recipient_id,
            requested_quantity=r.requested_quantity,
            status=r.status,
            notes=r.notes,
            delivery_mode=r.delivery_mode,
            created_at=r.created_at,
            updated_at=r.updated_at
        ) for r in recent_reqs_raw
    ]

    return RecipientDashboardResponse(
        active_requests_count=active_count,
        delivered_donations_count=delivered_count,
        total_kg_received=round(total_kg, 2),
        total_meals_received=total_meals,
        nearby_available_listings_count=avail_count,
        recent_requests=recent_requests
    )


@router.get("/impact", response_model=ImpactMetricsResponse)
async def get_impact_dashboard(db: AsyncSession = Depends(get_db)):
    return await impact_service.get_global_impact_metrics(db)
