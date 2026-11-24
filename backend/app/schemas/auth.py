from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=100)
    phone_number: Optional[str] = None
    role: str = Field(..., description="food_provider, recipient, volunteer")
    organization_name: Optional[str] = None
    organization_type: Optional[str] = None
    recipient_category: Optional[str] = "human"  # human vs animal_care
    supported_species: Optional[List[str]] = []  # cows, bulls, buffaloes, dogs, cats, goats, sheep, birds, other
    description: Optional[str] = None
    image_url: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = "Delhi NCR"
    state: Optional[str] = "Delhi"
    postal_code: Optional[str] = "110001"
    latitude: Optional[float] = 28.6139
    longitude: Optional[float] = 77.2090
    registration_number: Optional[str] = None  # FSSAI / NGO Darpan / 80G / AWBI


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: str
    full_name: str
    organization_id: Optional[str] = None


class OrganizationResponse(BaseModel):
    id: str
    name: str
    organization_type: str
    recipient_category: Optional[str] = "human"
    supported_species: Optional[List[str]] = []
    description: Optional[str] = None
    image_url: Optional[str] = None
    verification_status: str
    registration_number: Optional[str] = None
    contact_email: str
    contact_phone: str
    address: str
    city: str
    state: str
    postal_code: str
    country: str
    latitude: float
    longitude: float
    capacity_servings_per_day: int
    accepted_categories: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    role: str
    avatar_url: Optional[str] = None
    organization_id: Optional[str] = None
    organization: Optional[OrganizationResponse] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    organization_name: Optional[str] = None
    organization_type: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    capacity_servings_per_day: Optional[int] = None
    supported_species: Optional[List[str]] = None
    recipient_category: Optional[str] = None
    registration_number: Optional[str] = None
