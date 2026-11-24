from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password, create_access_token,
    get_current_user
)
from app.core.exceptions import FoodLoopException, UnauthorizedException
from app.models.models import Profile, Organization, OrganizationVerification, AuditLog
from app.schemas.auth import (
    UserRegisterRequest, UserLoginRequest, TokenResponse,
    UserProfileResponse, ProfileUpdateRequest
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    # 1. Check if email already registered
    existing_res = await db.execute(select(Profile).where(Profile.email == payload.email.lower()))
    if existing_res.scalars().first():
        raise FoodLoopException("An account with this email address already exists", status_code=400)

    # 2. Strict Role Verification: A public user can NEVER register directly as 'admin'
    allowed_registration_roles = ["food_provider", "recipient", "volunteer"]
    if payload.role not in allowed_registration_roles:
        raise FoodLoopException(
            f"Invalid role. Public registration permitted only for: {allowed_registration_roles}",
            status_code=400
        )

    org_id = None
    # 3. Create Organization if provided
    if payload.organization_name:
        is_animal_care = (
            payload.recipient_category == "animal_care" or
            (payload.organization_type in [
                "gaushala", "animal_shelter", "animal_rescue_centre",
                "veterinary_hospital", "animal_welfare_ngo", "livestock_care_centre"
            ])
        )
        recipient_cat = "animal_care" if is_animal_care else "human"
        
        org = Organization(
            name=payload.organization_name,
            organization_type=payload.organization_type or ("restaurant" if payload.role == "food_provider" else ("gaushala" if is_animal_care else "ngo")),
            recipient_category=recipient_cat,
            supported_species=payload.supported_species or [],
            description=payload.description or f"{payload.organization_name} - Registered {payload.organization_type or 'organization'}",
            image_url=payload.image_url,
            verification_status="unverified",
            registration_number=payload.registration_number,
            contact_email=payload.email.lower(),
            contact_phone=payload.phone_number or "0000000000",
            address=payload.address or "Address provided during registration",
            city=payload.city or "Delhi NCR",
            state=payload.state or "Delhi",
            postal_code=payload.postal_code or "110001",
            country="India",
            latitude=payload.latitude or 28.6139,
            longitude=payload.longitude or 77.2090,
            capacity_servings_per_day=150 if payload.role == "recipient" else 50,
            accepted_categories=["cooked_meals", "bakery", "produce", "packaged_groceries", "dairy"]
        )
        db.add(org)
        await db.flush()
        org_id = org.id

        # If registration number provided, automatically queue a verification
        if payload.registration_number:
            if payload.role == "food_provider":
                doc_type = "fssai_license"
            elif is_animal_care:
                doc_type = "awbi_registration"
            else:
                doc_type = "ngo_darpan"

            veri = OrganizationVerification(
                organization_id=org.id,
                submitted_by="",  # Updated after profile creation
                status="pending",
                document_type=doc_type,
                document_number=payload.registration_number
            )
            db.add(veri)

    # 4. Create Profile
    profile = Profile(
        email=payload.email.lower(),
        full_name=payload.full_name,
        phone_number=payload.phone_number,
        role=payload.role,
        organization_id=org_id,
        password_hash=hash_password(payload.password),
        is_active=True
    )
    db.add(profile)
    await db.flush()

    # Link verification submitted_by if created
    if org_id and payload.registration_number:
        veri_res = await db.execute(
            select(OrganizationVerification).where(OrganizationVerification.organization_id == org_id)
        )
        veri_obj = veri_res.scalars().first()
        if veri_obj:
            veri_obj.submitted_by = profile.id

    # 5. Audit Log
    audit = AuditLog(
        actor_id=profile.id,
        action="USER_REGISTRATION",
        entity_type="profiles",
        entity_id=profile.id,
        metadata_json={"role": profile.role, "org_id": org_id}
    )
    db.add(audit)
    await db.commit()

    token = create_access_token({
        "sub": profile.id,
        "email": profile.email,
        "role": profile.role,
        "name": profile.full_name
    })

    return TokenResponse(
        access_token=token,
        user_id=profile.id,
        email=profile.email,
        role=profile.role,
        full_name=profile.full_name,
        organization_id=org_id
    )


@router.post("/login", response_model=TokenResponse)
async def login_user(payload: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profile).where(Profile.email == payload.email.lower()))
    user = result.scalars().first()

    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise UnauthorizedException("Invalid email or password")

    if not user.is_active:
        raise UnauthorizedException("Account has been deactivated. Please contact support.")

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.full_name
    })

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        role=user.role,
        full_name=user.full_name,
        organization_id=user.organization_id
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_me(current_user: Profile = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return current_user


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: Profile = Depends(get_current_user)):
    return current_user


@router.patch("/profile", response_model=UserProfileResponse)
async def update_profile(
    payload: ProfileUpdateRequest,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.phone_number is not None:
        current_user.phone_number = payload.phone_number
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url

    await db.commit()
    await db.refresh(current_user)
    return current_user
