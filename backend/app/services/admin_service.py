from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.models.models import (
    OrganizationVerification, Organization, Profile, FoodListing, DonationRequest, ImpactRecord, AuditLog
)
from app.schemas.admin import VerificationResponse, VerificationReviewRequest, AdminMetricsResponse
from app.core.exceptions import NotFoundException, ForbiddenException, FoodLoopException


class AdminService:
    @staticmethod
    async def list_pending_verifications(db: AsyncSession) -> List[VerificationResponse]:
        stmt = (
            select(OrganizationVerification)
            .options(
                selectinload(OrganizationVerification.organization),
            )
            .order_by(OrganizationVerification.created_at.asc())
        )
        result = await db.execute(stmt)
        records = result.scalars().all()

        responses = []
        for r in records:
            responses.append(VerificationResponse(
                id=r.id,
                organization_id=r.organization_id,
                organization_name=r.organization.name if r.organization else "Unknown Org",
                submitted_by=r.submitted_by,
                status=r.status,
                document_url=r.document_url,
                document_type=r.document_type,
                document_number=r.document_number,
                rejection_reason=r.rejection_reason,
                reviewed_at=r.reviewed_at,
                created_at=r.created_at,
                updated_at=r.updated_at
            ))
        return responses

    @staticmethod
    async def review_verification(
        verification_id: str,
        review: VerificationReviewRequest,
        admin_user: Profile,
        db: AsyncSession
    ) -> VerificationResponse:
        stmt = (
            select(OrganizationVerification)
            .options(selectinload(OrganizationVerification.organization))
            .where(OrganizationVerification.id == verification_id)
        )
        result = await db.execute(stmt)
        veri = result.scalars().first()
        if not veri:
            raise NotFoundException("Verification application not found")

        decision = review.decision.lower()
        if decision not in ["approved", "rejected"]:
            raise FoodLoopException("Decision must be either 'approved' or 'rejected'")

        now = datetime.now(timezone.utc)
        veri.status = decision
        veri.reviewed_by = admin_user.id
        veri.reviewed_at = now
        if decision == "rejected":
            veri.rejection_reason = review.rejection_reason or "Document verification requirements not met"

        # Update organization status
        if veri.organization:
            veri.organization.verification_status = "verified" if decision == "approved" else "rejected"

        audit = AuditLog(
            actor_id=admin_user.id,
            action=f"VERIFICATION_{decision.upper()}",
            entity_type="organization_verifications",
            entity_id=veri.id,
            metadata_json={"organization_id": veri.organization_id, "reason": veri.rejection_reason}
        )
        db.add(audit)
        await db.commit()
        await db.refresh(veri)

        return VerificationResponse(
            id=veri.id,
            organization_id=veri.organization_id,
            organization_name=veri.organization.name if veri.organization else None,
            submitted_by=veri.submitted_by,
            status=veri.status,
            document_url=veri.document_url,
            document_type=veri.document_type,
            document_number=veri.document_number,
            rejection_reason=veri.rejection_reason,
            reviewed_at=veri.reviewed_at,
            created_at=veri.created_at,
            updated_at=veri.updated_at
        )

    @staticmethod
    async def get_admin_metrics(db: AsyncSession) -> AdminMetricsResponse:
        total_users = (await db.execute(select(func.count(Profile.id)))).scalar() or 0
        total_orgs = (await db.execute(select(func.count(Organization.id)))).scalar() or 0
        pending_veris = (await db.execute(
            select(func.count(OrganizationVerification.id)).where(OrganizationVerification.status == "pending")
        )).scalar() or 0
        active_listings = (await db.execute(
            select(func.count(FoodListing.id)).where(FoodListing.status == "available")
        )).scalar() or 0
        completed_reqs = (await db.execute(
            select(func.count(DonationRequest.id)).where(DonationRequest.status == "delivered")
        )).scalar() or 0
        total_co2 = (await db.execute(select(func.sum(ImpactRecord.co2_saved_kg)))).scalar() or 0.0

        return AdminMetricsResponse(
            total_users=total_users,
            total_organizations=total_orgs,
            pending_verifications_count=pending_veris,
            active_listings_count=active_listings,
            completed_requests_count=completed_reqs,
            total_co2_saved_kg=round(float(total_co2), 2)
        )


admin_service = AdminService()
