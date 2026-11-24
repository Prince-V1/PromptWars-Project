from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.models.models import Organization, FoodListing, Profile, ImpactRecord
from app.schemas.donor import DonorProfileResponse, DonorOrganizationDetails
from app.schemas.food import FoodListingResponse

router = APIRouter(prefix="/donors", tags=["Donor Organizations"])


@router.get("", response_model=List[DonorOrganizationDetails])
async def list_donors(db: AsyncSession = Depends(get_db)):
    """List all registered and verified food donor partner organizations."""
    stmt = (
        select(Organization)
        .where(
            Organization.organization_type.in_([
                "restaurant", "hotel", "bakery", "grocery_store", "event_organizer", "caterer"
            ])
        )
        .order_by(Organization.name.asc())
    )
    result = await db.execute(stmt)
    orgs = result.scalars().all()
    
    return [
        DonorOrganizationDetails(
            id=org.id,
            name=org.name,
            organization_type=org.organization_type,
            verification_status=org.verification_status,
            registration_number=org.registration_number,
            contact_email=org.contact_email,
            contact_phone=org.contact_phone,
            address=org.address,
            city=org.city,
            state=org.state,
            postal_code=org.postal_code,
            country=org.country,
            latitude=org.latitude,
            longitude=org.longitude,
            capacity_servings_per_day=org.capacity_servings_per_day,
            accepted_categories=org.accepted_categories or []
        )
        for org in orgs
    ]


@router.get("/{id}", response_model=DonorProfileResponse)
async def get_donor_profile(id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve full donor profile, contact, verification, and all posted food listings."""
    # 1. Lookup by Organization ID
    stmt = select(Organization).where(Organization.id == id)
    res = await db.execute(stmt)
    org = res.scalars().first()

    # Fallback: check if id belongs to a Profile with an organization_id
    if not org:
        prof_stmt = select(Profile).where(Profile.id == id)
        prof_res = await db.execute(prof_stmt)
        prof = prof_res.scalars().first()
        if prof and prof.organization_id:
            org_stmt = select(Organization).where(Organization.id == prof.organization_id)
            org_res = await db.execute(org_stmt)
            org = org_res.scalars().first()

    if not org:
        raise NotFoundException(f"Donor establishment '{id}' not found")

    # 2. Fetch all listings for this donor organization
    list_stmt = (
        select(FoodListing)
        .options(selectinload(FoodListing.provider), selectinload(FoodListing.organization))
        .where(FoodListing.organization_id == org.id)
        .order_by(desc(FoodListing.priority_score), desc(FoodListing.created_at))
    )
    list_res = await db.execute(list_stmt)
    all_listings = list_res.scalars().all()

    active_items = []
    past_items = []

    for l in all_listings:
        resp_item = FoodListingResponse(
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
            provider_name=l.provider.full_name if l.provider else None,
            organization_name=org.name,
            created_at=l.created_at,
            updated_at=l.updated_at
        )
        if l.status == "available":
            active_items.append(resp_item)
        else:
            past_items.append(resp_item)

    # 3. Calculate donor impact metrics
    # From ImpactRecord
    impact_stmt = (
        select(
            func.sum(ImpactRecord.quantity_kg_equivalent),
            func.sum(ImpactRecord.estimated_meals),
            func.sum(ImpactRecord.co2_saved_kg)
        )
        .join(FoodListing, ImpactRecord.listing_id == FoodListing.id)
        .where(FoodListing.organization_id == org.id)
    )
    impact_res = await db.execute(impact_stmt)
    tot_kg, tot_meals, tot_co2 = impact_res.first() or (0.0, 0, 0.0)

    # Completed listings count
    completed_count = len(past_items)
    kg_val = float(tot_kg or 0.0)
    meals_val = int(tot_meals or 0)
    co2_val = float(tot_co2 or 0.0)

    # If no impact record yet but completed listings exist, calculate based on formula
    if meals_val == 0 and completed_count > 0:
        kg_sum = sum(p.quantity for p in past_items if p.unit == "kg")
        kg_val = float(kg_sum)
        meals_val = int(kg_val * 2.5)
        co2_val = round(kg_val * 2.5, 1)

    org_details = DonorOrganizationDetails(
        id=org.id,
        name=org.name,
        organization_type=org.organization_type,
        verification_status=org.verification_status,
        registration_number=org.registration_number,
        contact_email=org.contact_email,
        contact_phone=org.contact_phone,
        address=org.address,
        city=org.city,
        state=org.state,
        postal_code=org.postal_code,
        country=org.country,
        latitude=org.latitude,
        longitude=org.longitude,
        capacity_servings_per_day=org.capacity_servings_per_day,
        accepted_categories=org.accepted_categories or []
    )

    return DonorProfileResponse(
        organization=org_details,
        total_active_listings=len(active_items),
        total_completed_donations=completed_count,
        total_kg_donated=kg_val,
        total_meals_provided=meals_val,
        total_co2_saved_kg=co2_val,
        active_listings=active_items,
        past_listings=past_items
    )
