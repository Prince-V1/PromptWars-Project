from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role
from app.models.models import Profile
from app.schemas.admin import (
    VerificationResponse, VerificationReviewRequest, AdminMetricsResponse
)
from app.services.admin_service import admin_service

router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/verifications", response_model=List[VerificationResponse])
async def list_organization_verifications(
    current_user: Profile = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    return await admin_service.list_pending_verifications(db)


@router.post("/verifications/{id}/approve", response_model=VerificationResponse)
async def approve_organization_verification(
    id: str,
    current_user: Profile = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    review = VerificationReviewRequest(decision="approved")
    return await admin_service.review_verification(id, review, current_user, db)


@router.post("/verifications/{id}/reject", response_model=VerificationResponse)
async def reject_organization_verification(
    id: str,
    payload: VerificationReviewRequest,
    current_user: Profile = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    review = VerificationReviewRequest(decision="rejected", rejection_reason=payload.rejection_reason)
    return await admin_service.review_verification(id, review, current_user, db)


@router.get("/metrics", response_model=AdminMetricsResponse)
async def get_admin_system_metrics(
    current_user: Profile = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    return await admin_service.get_admin_metrics(db)
