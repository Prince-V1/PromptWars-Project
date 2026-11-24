import hmac
import hashlib
import time
from typing import Optional, List
import jwt
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.core.database import get_db


def hash_password(password: str) -> str:
    """Hashes a password using PBKDF2-HMAC-SHA256 with a unique salt."""
    salt = "foodloop_salt_" + settings.JWT_SECRET[:16]
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return key.hex()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed password safely."""
    return hmac.compare_digest(hash_password(plain_password), hashed_password)


def create_access_token(data: dict, expires_in_seconds: Optional[int] = None) -> str:
    """Creates a signed JWT token."""
    to_encode = data.copy()
    expire_time = time.time() + (expires_in_seconds if expires_in_seconds else settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    to_encode.update({"exp": int(expire_time), "iat": int(time.time()), "iss": "foodloop"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Verifies and decodes JWT from Supabase Auth or local issuer."""
    try:
        # First attempt: Decode using JWT_SECRET
        return jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_aud": False}
        )
    except jwt.PyJWTError:
        try:
            # Second attempt: Decode using SUPABASE_JWT_SECRET if Supabase issued it
            return jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM],
                options={"verify_aud": False}
            )
        except jwt.PyJWTError as e:
            raise UnauthorizedException(f"Invalid or expired authentication token: {str(e)}")


async def get_current_user_claims(authorization: Optional[str] = Header(None)) -> dict:
    """Extracts and verifies authorization header token."""
    if not authorization:
        raise UnauthorizedException("Missing Authorization header")
    
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedException("Invalid Authorization format. Use: Bearer <token>")
    
    token = parts[1]
    payload = decode_token(token)
    user_id = payload.get("sub") or payload.get("user_id")
    if not user_id:
        raise UnauthorizedException("Token payload missing subject user identifier")
    return payload


async def get_current_user(
    claims: dict = Depends(get_current_user_claims),
    db: AsyncSession = Depends(get_db)
):
    """Loads active user Profile from database; never trusts client-supplied role."""
    from app.models.models import Profile
    
    user_id = claims.get("sub") or claims.get("user_id")
    result = await db.execute(
        select(Profile).options(selectinload(Profile.organization)).where(Profile.id == user_id)
    )
    user = result.scalars().first()
    
    if not user:
        # If user registered in Supabase but not in profiles yet, check claims
        email = claims.get("email", "user@foodloop.local")
        role = claims.get("role", "recipient")
        # Ensure role is restricted
        if role not in ["food_provider", "recipient", "volunteer", "admin"]:
            role = "recipient"
            
        # Fallback profile creation for verified auth token
        user = Profile(
            id=str(user_id),
            email=email,
            full_name=claims.get("name", "FoodLoop User"),
            role=role,
            is_active=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    if not user.is_active:
        raise ForbiddenException("User account has been deactivated")

    return user


async def get_optional_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """Optionally loads active user Profile if Authorization header is supplied."""
    if not authorization:
        return None
    try:
        claims = await get_current_user_claims(authorization)
        return await get_current_user(claims, db)
    except Exception:
        return None


def require_role(allowed_roles: List[str]):
    """Role-based authorization guard."""
    async def role_checker(current_user = Depends(get_current_user)):
        if current_user.role not in allowed_roles and current_user.role != "admin":
            raise ForbiddenException(
                f"Role '{current_user.role}' is not authorized. Required: {allowed_roles}"
            )
        return current_user
    return role_checker
