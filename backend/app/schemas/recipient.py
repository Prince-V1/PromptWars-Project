from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class RecipientOrganizationDetails(BaseModel):
    id: str
    name: str
    organization_type: str
    recipient_category: str = "human"  # "human" vs "animal_care"
    supported_species: List[str] = []   # cows, bulls, buffaloes, dogs, cats, goats, sheep, birds, other
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
    total_received_kg: Optional[float] = 0.0
    active_requests_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class RecipientProfileResponse(BaseModel):
    organization: RecipientOrganizationDetails
    total_received_kg: float = 0.0
    total_meals_received: int = 0
    active_requests_count: int = 0
    completed_donations_count: int = 0
    supported_species: List[str] = []
    feed_safety_guidelines: List[str] = []

    model_config = ConfigDict(from_attributes=True)
