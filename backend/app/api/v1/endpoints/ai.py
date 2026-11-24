import base64
from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, get_optional_current_user
from app.models.models import Profile
from app.schemas.ai import (
    FoodAnalysisRequest, FoodAnalysisResponse,
    DescriptionGenRequest, DescriptionGenResponse,
    MatchRecipientsRequest, MatchRecipientsResponse,
    ChatRequest, ChatResponse,
    PriorityAlgorithmRequest, PriorityAlgorithmResponse,
    ImpactAlgorithmRequest, ImpactAlgorithmResponse
)
from app.services.ai_service import ai_service
from app.services.food_service import food_service
from app.services.matching_service import matching_service
from app.services.agent_service import agent_service

router = APIRouter(prefix="/ai", tags=["AI Operations"])


@router.post("/analyze-food", response_model=FoodAnalysisResponse)
async def analyze_food_image(
    payload: FoodAnalysisRequest,
    current_user: Profile = Depends(get_current_user)
):
    image_bytes = None
    if payload.image_base64:
        # Strip data URL header if present (e.g. data:image/jpeg;base64,...)
        b64_str = payload.image_base64
        if "," in b64_str:
            b64_str = b64_str.split(",", 1)[1]
        try:
            image_bytes = base64.b64decode(b64_str)
        except Exception:
            image_bytes = None

    return await ai_service.analyze_food_image(
        image_bytes=image_bytes,
        image_url=payload.image_url,
        mime_type=payload.mime_type or "image/jpeg",
        context=payload.additional_context
    )


@router.post("/generate-description", response_model=DescriptionGenResponse)
async def generate_listing_description(
    payload: DescriptionGenRequest,
    current_user: Profile = Depends(get_current_user)
):
    return await ai_service.generate_listing_description(payload)


@router.post("/match-recipients", response_model=MatchRecipientsResponse)
async def match_recipients_for_listing(
    payload: MatchRecipientsRequest,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    listing = await food_service.get_listing_by_id(payload.listing_id, db)
    return await matching_service.match_recipients_for_listing(listing, db)


@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    payload: ChatRequest,
    current_user: Optional[Profile] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_role = current_user.role if current_user else None
    return await agent_service.run_agent(
        messages=payload.messages,
        current_location=payload.current_location,
        user_role=payload.user_role or user_role,
        db=db
    )


@router.post("/algorithm/priority", response_model=PriorityAlgorithmResponse)
async def simulate_priority_algorithm(payload: PriorityAlgorithmRequest):
    """
    Executes the real-time operational urgency decay algorithm:
    U(t) = w_time(t) + w_storage + w_category + w_quantity (bounded 0 - 100)
    """
    # 1. Time Urgency Score (0 - 50 points)
    hours = payload.hours_remaining
    if hours <= 0:
        time_score = 50.0
    elif hours <= 2.0:
        time_score = 48.0
    elif hours <= 4.0:
        time_score = 38.0
    elif hours <= 8.0:
        time_score = 25.0
    elif hours <= 16.0:
        time_score = 15.0
    else:
        time_score = 8.0

    # 2. Storage & Perishability Score (0 - 25 points)
    storage_map = {
        "hot_holding": 25.0,
        "refrigerated": 15.0,
        "room_temperature": 10.0,
        "frozen": 5.0
    }
    storage_score = storage_map.get(payload.storage_condition, 10.0)

    # 3. Category Urgency (0 - 15 points)
    cat_map = {
        "cooked_meals": 15.0,
        "dairy": 12.0,
        "bakery": 10.0,
        "fresh_produce": 8.0,
        "packaged_groceries": 3.0,
        "beverages": 4.0,
        "other": 5.0
    }
    category_score = cat_map.get(payload.category, 5.0)

    # 4. Quantity Bulk Urgency (0 - 10 points)
    qty = payload.quantity
    if qty >= 50.0:
        quantity_score = 10.0
    elif qty >= 20.0:
        quantity_score = 7.0
    elif qty >= 5.0:
        quantity_score = 4.0
    else:
        quantity_score = 2.0

    total_score = round(min(100.0, time_score + storage_score + category_score + quantity_score), 1)

    if total_score >= 80.0:
        tier = "critical"
        rec = "Critical operational urgency! Trigger automated push dispatch to nearest recipient within 3 km."
    elif total_score >= 60.0:
        tier = "urgent"
        rec = "High priority. Recommended for volunteer claim within 60 minutes."
    elif total_score >= 40.0:
        tier = "normal"
        rec = "Standard rescue batch. Standard recipient claim window active."
    else:
        tier = "low"
        rec = "Stable shelf-life. Broad recipient distribution queue."

    return PriorityAlgorithmResponse(
        priority_score=total_score,
        urgency_tier=tier,
        time_score=time_score,
        storage_score=storage_score,
        category_score=category_score,
        quantity_score=quantity_score,
        dispatch_recommendation=rec
    )


@router.post("/algorithm/impact", response_model=ImpactAlgorithmResponse)
async def simulate_impact_algorithm(payload: ImpactAlgorithmRequest):
    """
    Calculates verified environmental and nutritional offset algorithms:
    - Meals: 400g per wholesome portion (2.5 meals / kg)
    - CO2e: 2.5 kg CO2e / kg food diverted from landfill (UNEP benchmark)
    - Methane: 0.25 kg CH4 avoided per kg food
    - Water: 1,000 liters embedded agricultural water conserved per kg
    - Economic Value: ₹150 estimated meal retail equivalency per portion
    """
    kg = payload.quantity_kg
    meals = int(round(kg * 2.5))
    co2 = round(kg * 2.5, 2)
    methane = round(kg * 0.25, 2)
    water = round(kg * 1000.0, 1)
    economic_val = round(meals * 150.0, 2)

    return ImpactAlgorithmResponse(
        quantity_kg=kg,
        meals_provided=meals,
        co2_saved_kg=co2,
        methane_avoided_kg=methane,
        water_saved_liters=water,
        economic_value_inr=economic_val
    )


