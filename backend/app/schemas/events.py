from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    event_name: str = Field(..., min_length=2, max_length=255)
    event_type: str = Field(..., description="wedding, reception, birthday, corporate_event, festival, community_gathering, conference, other")
    event_date: datetime
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    venue_name: str = Field(..., min_length=2, max_length=255)
    location_address: str = Field(..., min_length=3)
    city: str = "Delhi NCR"
    latitude: float = 28.6139
    longitude: float = 77.2090
    estimated_guests: int = Field(default=100, ge=1)
    contact_person: str = Field(..., min_length=2)
    contact_phone: str = Field(..., min_length=5)
    expected_food_categories: List[str] = []
    estimated_food_quantity: float = 0.0
    estimated_food_unit: str = "kg"
    expected_surplus: float = 0.0
    notes: Optional[str] = None


class EventUpdate(BaseModel):
    event_name: Optional[str] = None
    event_type: Optional[str] = None
    event_date: Optional[datetime] = None
    venue_name: Optional[str] = None
    location_address: Optional[str] = None
    estimated_guests: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class EventResponse(BaseModel):
    id: str
    organizer_id: str
    organization_id: Optional[str] = None
    event_name: str
    event_type: str
    event_date: datetime
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    venue_name: str
    location_address: str
    city: str
    latitude: float
    longitude: float
    estimated_guests: int
    contact_person: str
    contact_phone: str
    expected_food_categories: List[str] = []
    estimated_food_quantity: float
    estimated_food_unit: str
    expected_surplus: float
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    surplus_listings_count: Optional[int] = 0

    class Config:
        from_attributes = True


class EventSurplusReport(BaseModel):
    event_id: str
    food_name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    category: str = "cooked_meals"
    quantity: float = Field(..., gt=0)
    unit: str = "kg"
    dietary_type: str = "veg"
    preparation_time: datetime
    pickup_deadline: datetime
    pickup_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    ingredients: List[str] = []
    allergens: List[str] = []
    storage_instructions: str = "hot_holding"
    storage_temperature: Optional[float] = None
    storage_temperature_unit: str = "C"
    food_safety_status: str = Field("untouched", description="untouched vs exposed_to_guests")
    safety_declaration_confirmed: bool = Field(True, description="Human donor certifies safety information")
    notes: Optional[str] = None


class EventDashboardSummary(BaseModel):
    upcoming_events_count: int
    completed_events_count: int
    total_surplus_reported_kg: float
    pending_requests_count: int
    completed_redistributions_count: int
    meals_provided: int
    co2_saved_kg: float
    upcoming_events: List[EventResponse]
    active_event_surplus: List[Any]
