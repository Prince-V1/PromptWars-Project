from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict


class FoodListingCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    category: str = Field(..., description="cooked_meals, bakery, packaged_groceries, fresh_produce, dairy, beverages, other")
    quantity: float = Field(..., gt=0)
    unit: str = Field(..., description="kg, portions, packets, crates, liters, boxes")
    dietary_type: str = Field(default="veg", description="veg, non_veg, vegan, contains_egg")
    preparation_time: datetime
    pickup_deadline: datetime
    pickup_address: str = Field(..., min_length=5)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    image_url: Optional[str] = None
    storage_instructions: str = Field(default="room_temperature", description="room_temperature, refrigerated, frozen, hot_holding")
    allergens: List[str] = Field(default_factory=list)
    ai_analysis_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    # Event Rescue & Food Safety Fields
    event_id: Optional[str] = None
    food_safety_status: str = Field(default="untouched", description="untouched vs exposed_to_guests")
    storage_temperature: Optional[float] = None
    storage_temperature_unit: str = "C"
    ingredients: List[str] = Field(default_factory=list)
    safety_declaration_confirmed: bool = Field(default=False)
    verification_flag: str = Field(default="approved", description="approved, flagged_review, ineligible_unsafe")
    flagged_reason: Optional[str] = None

    # Animal Feed & Beneficiary Segregation
    target_beneficiary: str = Field(default="human", description="human, animal_feed, both")
    suitable_species: List[str] = Field(default_factory=list)
    animal_feed_safety_confirmed: bool = Field(default=False)
    animal_feed_notes: Optional[str] = None

    @field_validator("pickup_deadline")
    @classmethod
    def validate_deadline_future(cls, v, info):
        # We also validate in business logic against preparation_time
        return v


class FoodListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    remaining_quantity: Optional[float] = None
    pickup_deadline: Optional[datetime] = None
    storage_instructions: Optional[str] = None
    allergens: Optional[List[str]] = None
    status: Optional[str] = None


class FoodListingResponse(BaseModel):
    id: str
    provider_id: str
    organization_id: Optional[str] = None
    title: str
    description: str
    category: str
    quantity: float
    remaining_quantity: float
    unit: str
    dietary_type: str
    status: str
    preparation_time: datetime
    pickup_deadline: datetime
    pickup_address: str
    latitude: float
    longitude: float
    image_url: Optional[str] = None
    storage_instructions: str
    allergens: List[str] = []
    priority_score: float = 0.0
    distance_km: Optional[float] = None
    provider_name: Optional[str] = None
    organization_name: Optional[str] = None
    event_id: Optional[str] = None
    food_safety_status: Optional[str] = "untouched"
    storage_temperature: Optional[float] = None
    storage_temperature_unit: Optional[str] = "C"
    ingredients: Optional[List[str]] = []
    safety_declaration_confirmed: Optional[bool] = False
    verification_flag: Optional[str] = "approved"
    flagged_reason: Optional[str] = None
    target_beneficiary: Optional[str] = "human"
    suitable_species: Optional[List[str]] = []
    animal_feed_safety_confirmed: Optional[bool] = False
    animal_feed_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FoodFilterParams(BaseModel):
    category: Optional[str] = None
    dietary_type: Optional[str] = None
    status: Optional[str] = "available"
    target_beneficiary: Optional[str] = None
    suitable_species: Optional[str] = None
    search: Optional[str] = None
    max_distance_km: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
