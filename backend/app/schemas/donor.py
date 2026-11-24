from typing import List, Optional
from pydantic import BaseModel
from app.schemas.food import FoodListingResponse


class DonorOrganizationDetails(BaseModel):
    id: str
    name: str
    organization_type: str
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


class DonorProfileResponse(BaseModel):
    organization: DonorOrganizationDetails
    total_active_listings: int
    total_completed_donations: int
    total_kg_donated: float
    total_meals_provided: int
    total_co2_saved_kg: float
    active_listings: List[FoodListingResponse]
    past_listings: List[FoodListingResponse]
