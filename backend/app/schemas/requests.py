from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.food import FoodListingResponse


class DonationRequestCreate(BaseModel):
    listing_id: str
    requested_quantity: float = Field(..., gt=0)
    notes: Optional[str] = None
    delivery_mode: str = Field(default="self_pickup", description="self_pickup, volunteer_courier, provider_delivery")


class DonationStatusUpdate(BaseModel):
    reason: Optional[str] = None


class DonationRequestResponse(BaseModel):
    id: str
    listing_id: str
    recipient_id: str
    organization_id: Optional[str] = None
    requested_quantity: float
    status: str
    notes: Optional[str] = None
    delivery_mode: str
    rejection_reason: Optional[str] = None
    cancellation_reason: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_organization: Optional[str] = None
    listing: Optional[FoodListingResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
