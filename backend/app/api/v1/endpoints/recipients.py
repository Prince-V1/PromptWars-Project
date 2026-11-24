from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.models.models import Organization, Profile, DonationRequest, ImpactRecord
from app.schemas.recipient import RecipientOrganizationDetails, RecipientProfileResponse

router = APIRouter(prefix="/recipients", tags=["Recipient & Animal Care Organizations"])

ANIMAL_CARE_TYPES = [
    "gaushala",
    "animal_shelter",
    "animal_rescue_centre",
    "veterinary_hospital",
    "animal_welfare_ngo",
    "livestock_care_centre"
]

HUMAN_RECIPIENT_TYPES = [
    "ngo",
    "food_bank",
    "community_kitchen",
    "shelter",
    "orphanage",
    "old_age_home"
]


@router.get("", response_model=List[RecipientOrganizationDetails])
async def list_recipients(
    category: Optional[str] = Query(None, description="human or animal_care"),
    organization_type: Optional[str] = Query(None),
    species: Optional[str] = Query(None, description="cows, bulls, buffaloes, dogs, cats, goats, sheep, birds, other"),
    city: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    verified_only: Optional[bool] = Query(False),
    db: AsyncSession = Depends(get_db)
):
    """
    List all recipient organizations (Human Food Relief and Animal Care Organizations).
    Keeps human food recipients and animal-care recipients cleanly categorized.
    """
    stmt = select(Organization)
    conditions = []

    # Category segregation (human vs animal_care)
    if category == "animal_care":
        conditions.append(
            or_(
                Organization.recipient_category == "animal_care",
                Organization.organization_type.in_(ANIMAL_CARE_TYPES)
            )
        )
    elif category == "human":
        conditions.append(
            and_(
                Organization.recipient_category == "human",
                Organization.organization_type.notin_(ANIMAL_CARE_TYPES)
            )
        )
    else:
        # Default: all recipient organizations (both human and animal care)
        all_recipient_types = ANIMAL_CARE_TYPES + HUMAN_RECIPIENT_TYPES
        conditions.append(
            or_(
                Organization.organization_type.in_(all_recipient_types),
                Organization.recipient_category.in_(["human", "animal_care"])
            )
        )

    if organization_type and organization_type != "all":
        conditions.append(Organization.organization_type == organization_type)

    if verified_only:
        conditions.append(Organization.verification_status == "verified")

    if city:
        conditions.append(Organization.city.ilike(f"%{city}%"))

    if search:
        p = f"%{search}%"
        conditions.append(
            or_(
                Organization.name.ilike(p),
                Organization.address.ilike(p),
                Organization.city.ilike(p),
                Organization.description.ilike(p)
            )
        )

    if conditions:
        stmt = stmt.where(and_(*conditions))

    stmt = stmt.order_by(
        # Put verified first, then alphabetical
        Organization.verification_status.desc(),
        Organization.name.asc()
    )

    result = await db.execute(stmt)
    orgs = result.scalars().all()

    # Filter species if requested (since supported_species is JSON array)
    if species and species != "all":
        orgs = [
            org for org in orgs
            if org.supported_species and species.lower() in [s.lower() for s in org.supported_species]
        ]

    # Map to response model
    responses = []
    for org in orgs:
        # Derive recipient_category if not explicitly saved
        is_animal = org.recipient_category == "animal_care" or org.organization_type in ANIMAL_CARE_TYPES
        rec_cat = "animal_care" if is_animal else "human"
        
        responses.append(
            RecipientOrganizationDetails(
                id=org.id,
                name=org.name,
                organization_type=org.organization_type,
                recipient_category=rec_cat,
                supported_species=org.supported_species or [],
                description=org.description,
                image_url=org.image_url,
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
        )

    return responses


@router.get("/{id}", response_model=RecipientProfileResponse)
async def get_recipient_profile(id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve detailed recipient profile, supported species, and safety requirements."""
    stmt = select(Organization).where(Organization.id == id)
    res = await db.execute(stmt)
    org = res.scalars().first()

    if not org:
        # Check by Profile ID
        prof_res = await db.execute(select(Profile).where(Profile.id == id))
        prof = prof_res.scalars().first()
        if prof and prof.organization_id:
            org = (await db.execute(select(Organization).where(Organization.id == prof.organization_id))).scalars().first()

    if not org:
        raise NotFoundException(f"Recipient organization '{id}' not found")

    is_animal = org.recipient_category == "animal_care" or org.organization_type in ANIMAL_CARE_TYPES
    rec_cat = "animal_care" if is_animal else "human"

    # Feed safety guidelines depending on species / organization type
    guidelines = []
    if is_animal:
        guidelines = [
            "All feed must be clean, free from plastic wrappers, packaging, toothpicks, or wire ties.",
            "Cattle, Cows & Bulls (Herbivores): Fresh vegetable trimmings, safe unseasoned breads, wheat bran, chappatis, dry greens. Strictly NO cooked meat, poultry, onions, or garlic.",
            "Dogs & Cats (Carnivores): Plain boiled rice, cooked meat broth, eggs, pet kibble. Strictly NO chocolate, onions, garlic, grapes, raisins, cooked chicken bones, or xylitol.",
            "Birds: Fresh grains, millets, crushed seeds, clean water. No salty or fried items.",
            "Animal feed must be stored in cool, dry conditions away from moisture to prevent mold growth."
        ]
    else:
        guidelines = [
            "All human food donations must adhere strictly to FSSAI hygiene guidelines.",
            "Surplus meals must be packaged in clean, food-grade containers.",
            "Cooked meals must be maintained in hot holding (≥60°C) or chilled (≤5°C) until pickup."
        ]

    # Calculate impact stats
    impact_stmt = select(func.sum(ImpactRecord.quantity_kg_equivalent)).where(ImpactRecord.recipient_id == org.id)
    impact_res = await db.execute(impact_stmt)
    total_kg = impact_res.scalar() or 0.0

    return RecipientProfileResponse(
        organization=RecipientOrganizationDetails(
            id=org.id,
            name=org.name,
            organization_type=org.organization_type,
            recipient_category=rec_cat,
            supported_species=org.supported_species or [],
            description=org.description,
            image_url=org.image_url,
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
        ),
        total_received_kg=round(total_kg, 1),
        total_meals_received=int(total_kg * 2.5),
        active_requests_count=0,
        completed_donations_count=int(total_kg / 15) if total_kg else 0,
        supported_species=org.supported_species or [],
        feed_safety_guidelines=guidelines
    )
