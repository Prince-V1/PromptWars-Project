import math
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import FoodListing, Organization
from app.schemas.ai import MatchRecommendation, MatchRecipientsResponse
from app.core.config import settings

logger = logging.getLogger("foodloop.matching_service")


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two coordinates in kilometers."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


class MatchingService:
    @staticmethod
    async def match_recipients_for_listing(
        listing: FoodListing,
        db: AsyncSession,
        max_distance_km: float = 30.0
    ) -> MatchRecipientsResponse:
        """
        Deterministic matching engine scored 0-100:
        - Distance Factor (35%): Closer NGOs score higher.
        - Category Factor (25%): Does NGO accept this food category?
        - Capacity Factor (20%): Can NGO absorb this quantity?
        - Urgency Factor (10%): Tighter deadline prioritizes rapid pickup capability.
        - Verification Factor (10%): Verified organizations get trust priority.
        """
        # Fetch candidate recipient organizations, keeping human and animal-care cleanly segregated
        is_animal_feed = getattr(listing, "target_beneficiary", "human") == "animal_feed"
        animal_care_types = [
            "gaushala", "animal_shelter", "animal_rescue_centre",
            "veterinary_hospital", "animal_welfare_ngo", "livestock_care_centre"
        ]
        human_types = ["ngo", "food_bank", "community_kitchen", "shelter", "other"]

        if is_animal_feed:
            stmt = select(Organization).where(
                or_(
                    Organization.organization_type.in_(animal_care_types),
                    Organization.recipient_category == "animal_care"
                )
            )
        else:
            stmt = select(Organization).where(
                and_(
                    Organization.organization_type.in_(human_types),
                    Organization.recipient_category != "animal_care"
                )
            )

        result = await db.execute(stmt)
        candidates = result.scalars().all()

        now = datetime.now(timezone.utc)
        deadline = listing.pickup_deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        hours_remaining = max(0.1, (deadline - now).total_seconds() / 3600.0)

        recommendations: List[MatchRecommendation] = []

        for org in candidates:
            # 1. Distance check
            dist_km = calculate_haversine_distance(
                listing.latitude, listing.longitude,
                org.latitude, org.longitude
            )
            if dist_km > max_distance_km:
                continue

            # Distance Score (0-35 points)
            # Under 3km: 35 pts, linearly scaling down to 0 at 30km
            dist_score = max(0.0, 35.0 * (1.0 - (dist_km / max_distance_km)))

            # 2. Category / Species Compatibility Score (0-25 points)
            if is_animal_feed:
                org_species = [s.lower() for s in (org.supported_species or [])]
                feed_species = [s.lower() for s in (getattr(listing, "suitable_species", []) or [])]
                species_match = any(s in org_species for s in feed_species) if feed_species else True
                cat_score = 25.0 if species_match else 5.0
            else:
                accepted_cats = org.accepted_categories or []
                cat_match = listing.category in accepted_cats
                cat_score = 25.0 if cat_match else 5.0

            # 3. Capacity Score (0-20 points)
            # Compare requested portions vs org capacity
            # 1 kg approx 2.5 portions
            portions_needed = listing.remaining_quantity * 2.5 if listing.unit == "kg" else listing.remaining_quantity
            org_capacity = org.capacity_servings_per_day or 100
            cap_ratio = min(1.0, portions_needed / max(1.0, float(org_capacity)))
            # If org can absorb without exceeding 100% capacity:
            if portions_needed <= org_capacity:
                cap_score = 20.0
            else:
                cap_score = max(5.0, 20.0 * (org_capacity / portions_needed))

            # 4. Urgency Factor (0-10 points)
            # If food expires within 3 hours, NGOs with closer proximity get max urgency score
            if hours_remaining <= 3.0:
                urgency_score = 10.0 if dist_km <= 5.0 else 5.0
            elif hours_remaining <= 6.0:
                urgency_score = 8.0
            else:
                urgency_score = 5.0

            # 5. Verification Factor (0-10 points)
            veri_score = 10.0 if org.verification_status == "verified" else 3.0

            total_score = round(dist_score + cat_score + cap_score + urgency_score + veri_score, 1)

            # Generate natural explanation
            factors = {
                "distance_km": dist_km,
                "distance_score": round(dist_score, 1),
                "category_compatible": cat_match,
                "category_score": round(cat_score, 1),
                "org_daily_capacity": org_capacity,
                "listing_portions": round(portions_needed, 1),
                "capacity_score": round(cap_score, 1),
                "hours_remaining": round(hours_remaining, 1),
                "urgency_score": round(urgency_score, 1),
                "verification_status": org.verification_status,
                "verification_score": round(veri_score, 1)
            }

            explanation = (
                f"{org.name} is located {dist_km:.1f} km away. "
                f"{'They specifically accept ' + listing.category.replace('_', ' ') + '.' if cat_match else 'Accepts general food donations.'} "
                f"With a daily capacity of {org_capacity} servings, they can readily distribute this {listing.quantity:.1f} {listing.unit} donation "
                f"within the remaining {hours_remaining:.1f} hour window."
            )

            recommendations.append(MatchRecommendation(
                organization_id=org.id,
                organization_name=org.name,
                organization_type=org.organization_type,
                contact_email=org.contact_email,
                contact_phone=org.contact_phone,
                address=org.address,
                distance_km=dist_km,
                match_score=min(100.0, total_score),
                explanation=explanation,
                matching_factors=factors
            ))

        # Sort recommendations by match_score descending
        recommendations.sort(key=lambda r: r.match_score, reverse=True)

        return MatchRecipientsResponse(
            listing_id=listing.id,
            listing_title=listing.title,
            total_candidates_analyzed=len(candidates),
            recommendations=recommendations[:10]  # top 10
        )


matching_service = MatchingService()
