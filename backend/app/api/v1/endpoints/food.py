from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, require_role, get_optional_current_user
from app.models.models import Profile, Organization
from app.schemas.food import (
    FoodListingCreate, FoodListingUpdate, FoodListingResponse, FoodFilterParams
)
from app.services.food_service import food_service

router = APIRouter(prefix="/food", tags=["Food Listings"])


@router.get("", response_model=List[FoodListingResponse])
async def list_food(
    category: Optional[str] = Query(None),
    dietary_type: Optional[str] = Query(None),
    status: Optional[str] = Query("available"),
    target_beneficiary: Optional[str] = Query(None, description="human, animal_feed"),
    suitable_species: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    max_distance_km: Optional[float] = Query(None),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    sort_by: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    params = FoodFilterParams(
        category=category,
        dietary_type=dietary_type,
        status=status,
        target_beneficiary=target_beneficiary,
        suitable_species=suitable_species,
        search=search,
        max_distance_km=max_distance_km,
        latitude=latitude,
        longitude=longitude,
        sort_by=sort_by,
        page=page,
        limit=limit
    )
    items, _ = await food_service.list_listings(params, db)
    return items


@router.get("/nearby", response_model=List[FoodListingResponse])
async def list_nearby_food(
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius_km: float = Query(25.0, ge=1.0, le=100.0),
    db: AsyncSession = Depends(get_db)
):
    params = FoodFilterParams(
        status="available",
        latitude=latitude,
        longitude=longitude,
        max_distance_km=radius_km,
        limit=50
    )
    items, _ = await food_service.list_listings(params, db)
    return items


@router.get("/{id}", response_model=FoodListingResponse)
async def get_food_listing(id: str, db: AsyncSession = Depends(get_db)):
    listing = await food_service.get_listing_by_id(id, db)
    return FoodListingResponse(
        id=listing.id,
        provider_id=listing.provider_id,
        organization_id=listing.organization_id,
        title=listing.title,
        description=listing.description,
        category=listing.category,
        quantity=listing.quantity,
        remaining_quantity=listing.remaining_quantity,
        unit=listing.unit,
        dietary_type=listing.dietary_type,
        status=listing.status,
        preparation_time=listing.preparation_time,
        pickup_deadline=listing.pickup_deadline,
        pickup_address=listing.pickup_address,
        latitude=listing.latitude,
        longitude=listing.longitude,
        image_url=listing.image_url,
        storage_instructions=listing.storage_instructions,
        allergens=listing.allergens or [],
        priority_score=listing.priority_score or 0.0,
        provider_name=listing.provider.full_name if listing.provider else None,
        organization_name=listing.organization.name if listing.organization else None,
        target_beneficiary=listing.target_beneficiary or "human",
        suitable_species=listing.suitable_species or [],
        animal_feed_safety_confirmed=listing.animal_feed_safety_confirmed,
        animal_feed_notes=listing.animal_feed_notes,
        created_at=listing.created_at,
        updated_at=listing.updated_at
    )


@router.post("", response_model=FoodListingResponse, status_code=status.HTTP_201_CREATED)
async def create_food_listing(
    payload: FoodListingCreate,
    current_user: Optional[Profile] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user:
        res = await db.execute(select(Profile).options(selectinload(Profile.organization)).where(Profile.role == "food_provider"))
        current_user = res.scalars().first()
        if not current_user:
            res = await db.execute(select(Profile).options(selectinload(Profile.organization)))
            current_user = res.scalars().first()

    listing = await food_service.create_listing(payload, current_user, db)

    org_name = "Taj Palace Hotel"
    if current_user and current_user.organization_id:
        org_res = await db.execute(select(Organization).where(Organization.id == current_user.organization_id))
        org_obj = org_res.scalars().first()
        if org_obj:
            org_name = org_obj.name

    return FoodListingResponse(
        id=listing.id,
        provider_id=listing.provider_id,
        organization_id=listing.organization_id,
        title=listing.title,
        description=listing.description,
        category=listing.category,
        quantity=listing.quantity,
        remaining_quantity=listing.remaining_quantity,
        unit=listing.unit,
        dietary_type=listing.dietary_type,
        status=listing.status,
        preparation_time=listing.preparation_time,
        pickup_deadline=listing.pickup_deadline,
        pickup_address=listing.pickup_address,
        latitude=listing.latitude,
        longitude=listing.longitude,
        image_url=listing.image_url,
        storage_instructions=listing.storage_instructions,
        allergens=listing.allergens or [],
        priority_score=listing.priority_score or 0.0,
        provider_name=current_user.full_name if current_user else "Chef Vikram Kapoor",
        organization_name=org_name,
        target_beneficiary=listing.target_beneficiary or "human",
        suitable_species=listing.suitable_species or [],
        animal_feed_safety_confirmed=listing.animal_feed_safety_confirmed,
        animal_feed_notes=listing.animal_feed_notes,
        created_at=listing.created_at,
        updated_at=listing.updated_at
    )


@router.patch("/{id}", response_model=FoodListingResponse)
async def update_food_listing(
    id: str,
    payload: FoodListingUpdate,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    listing = await food_service.update_listing(id, payload, current_user, db)
    return FoodListingResponse(
        id=listing.id,
        provider_id=listing.provider_id,
        organization_id=listing.organization_id,
        title=listing.title,
        description=listing.description,
        category=listing.category,
        quantity=listing.quantity,
        remaining_quantity=listing.remaining_quantity,
        unit=listing.unit,
        dietary_type=listing.dietary_type,
        status=listing.status,
        preparation_time=listing.preparation_time,
        pickup_deadline=listing.pickup_deadline,
        pickup_address=listing.pickup_address,
        latitude=listing.latitude,
        longitude=listing.longitude,
        image_url=listing.image_url,
        storage_instructions=listing.storage_instructions,
        allergens=listing.allergens or [],
        priority_score=listing.priority_score or 0.0,
        created_at=listing.created_at,
        updated_at=listing.updated_at
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_food_listing(
    id: str,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await food_service.delete_listing(id, current_user, db)
    return None
