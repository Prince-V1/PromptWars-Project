from typing import Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.models import (
    FoodListing, DonationRequest, ImpactRecord, Organization, Profile
)
from app.schemas.dashboard import ImpactMetricsResponse
from app.core.config import settings


class ImpactService:
    @staticmethod
    def calculate_kg_equivalent(quantity: float, unit: str) -> float:
        """Converts diverse measurement units to verified standard kg equivalent."""
        unit_multipliers = {
            "kg": 1.0,
            "portions": 0.40,  # 400 grams per cooked portion
            "packets": 0.50,   # average 500g packaged item
            "crates": 15.0,    # average produce crate
            "liters": 1.0,     # liquid density approx 1 kg/L
            "boxes": 2.0       # standard catering box
        }
        multiplier = unit_multipliers.get(unit.lower(), 1.0)
        return round(quantity * multiplier, 2)

    @staticmethod
    def calculate_meals_and_co2(quantity_kg: float) -> Tuple[int, float]:
        """Calculates estimated meals and avoided carbon dioxide equivalent (CO2e)."""
        estimated_meals = int(round(quantity_kg * settings.MEAL_KG_FACTOR))
        co2_saved_kg = round(quantity_kg * settings.CO2_KG_FACTOR, 2)
        return estimated_meals, co2_saved_kg

    @staticmethod
    async def get_global_impact_metrics(db: AsyncSession) -> ImpactMetricsResponse:
        """Aggregates verified impact numbers across the FoodLoop platform."""
        # 1. Total listings
        listings_count_res = await db.execute(select(func.count(FoodListing.id)))
        total_listings = listings_count_res.scalar() or 0

        # 2. Completed requests
        completed_reqs_res = await db.execute(
            select(func.count(DonationRequest.id)).where(DonationRequest.status == "delivered")
        )
        total_completed = completed_reqs_res.scalar() or 0

        # 3. Sum of kg, meals, and co2 from verified impact records
        impact_totals_res = await db.execute(
            select(
                func.sum(ImpactRecord.quantity_kg_equivalent),
                func.sum(ImpactRecord.estimated_meals),
                func.sum(ImpactRecord.co2_saved_kg),
                func.count(ImpactRecord.id)
            )
        )
        row = impact_totals_res.first()
        total_kg = float(row[0] or 0.0) if row else 0.0
        total_meals = int(row[1] or 0) if row else 0
        total_co2 = float(row[2] or 0.0) if row else 0.0
        verified_count = int(row[3] or 0) if row else 0

        # 4. Count active providers & recipients
        providers_count_res = await db.execute(
            select(func.count(Profile.id)).where(and_(Profile.role == "food_provider", Profile.is_active == True))
        )
        active_providers = providers_count_res.scalar() or 0

        recipients_count_res = await db.execute(
            select(func.count(Profile.id)).where(and_(Profile.role == "recipient", Profile.is_active == True))
        )
        active_recipients = recipients_count_res.scalar() or 0

        return ImpactMetricsResponse(
            total_donations_listed=total_listings,
            total_completed_pickups=total_completed,
            total_kg_redistributed=round(total_kg, 2),
            total_estimated_meals=total_meals,
            total_co2_saved_kg=round(total_co2, 2),
            active_providers_count=active_providers,
            active_recipients_count=active_recipients,
            verified_impact_count=verified_count,
            meal_calculation_formula="Standard 400g per meal portion (2.5 meals per kg equivalent)",
            co2_calculation_formula="UNEP standard 2.5 kg CO2e emissions prevented per kg edible food rescued"
        )


impact_service = ImpactService()
