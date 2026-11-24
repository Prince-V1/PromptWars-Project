from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class VerificationReviewRequest(BaseModel):
    decision: str = Field(..., description="'approved' or 'rejected'")
    rejection_reason: Optional[str] = None


class VerificationResponse(BaseModel):
    id: str
    organization_id: str
    organization_name: Optional[str] = None
    submitted_by: str
    submitted_by_name: Optional[str] = None
    status: str
    document_url: Optional[str] = None
    document_type: str
    document_number: str
    rejection_reason: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminMetricsResponse(BaseModel):
    total_users: int
    total_organizations: int
    pending_verifications_count: int
    active_listings_count: int
    completed_requests_count: int
    total_co2_saved_kg: float
