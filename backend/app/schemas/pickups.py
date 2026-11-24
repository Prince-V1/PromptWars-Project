from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.requests import DonationRequestResponse


class PickupAssignRequest(BaseModel):
    notes: Optional[str] = None


class PickupCompleteRequest(BaseModel):
    proof_image_url: Optional[str] = None
    delivery_notes: Optional[str] = None


class PickupResponse(BaseModel):
    id: str
    request_id: str
    volunteer_id: Optional[str] = None
    status: str
    assigned_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    pickup_notes: Optional[str] = None
    proof_image_url: Optional[str] = None
    delivery_notes: Optional[str] = None
    volunteer_name: Optional[str] = None
    request: Optional[DonationRequestResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
