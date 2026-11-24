from typing import List, Dict, Any
from pydantic import BaseModel
from app.schemas.food import FoodListingResponse
from app.schemas.requests import DonationRequestResponse


class ProviderDashboardResponse(BaseModel):
    active_listings_count: int
    pending_requests_count: int
    completed_donations_count: int
    total_kg_donated: float
    total_meals_provided: int
    total_co2_saved_kg: float
    recent_listings: List[FoodListingResponse]
    recent_requests: List[DonationRequestResponse]


class RecipientDashboardResponse(BaseModel):
    active_requests_count: int
    delivered_donations_count: int
    total_kg_received: float
    total_meals_received: int
    nearby_available_listings_count: int
    recent_requests: List[DonationRequestResponse]


class ImpactMetricsResponse(BaseModel):
    total_donations_listed: int
    total_completed_pickups: int
    total_kg_redistributed: float
    total_estimated_meals: int
    total_co2_saved_kg: float
    active_providers_count: int
    active_recipients_count: int
    verified_impact_count: int
    meal_calculation_formula: str = "Standard 400g per meal portion (2.5 meals per kg equivalent)"
    co2_calculation_formula: str = "UNEP standard 2.5 kg CO2e emissions prevented per kg edible food rescued"
