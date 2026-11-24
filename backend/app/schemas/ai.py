from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class FoodAnalysisRequest(BaseModel):
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    mime_type: Optional[str] = "image/jpeg"
    additional_context: Optional[str] = None


class FoodAnalysisResponse(BaseModel):
    suggested_title: str
    suggested_category: str
    suggested_description: str
    dietary_type: str = "veg"
    visible_condition_observations: List[str] = []
    potential_allergens_detected: List[str] = []
    estimated_servings_range: Optional[str] = None
    recommended_storage: str = "room_temperature"
    requires_human_verification: bool = True
    safety_disclaimer: str = (
        "AI visual analysis is an operational aid and NEVER certifies food safety, freshness, "
        "edibility, or allergen absence. The food donor must verify all details before listing."
    )


class DescriptionGenRequest(BaseModel):
    title: str = Field(..., min_length=2)
    category: str
    quantity: float
    unit: str
    dietary_type: str = "veg"
    storage_condition: str = "room_temperature"
    preparation_notes: Optional[str] = None
    known_allergens: List[str] = []


class DescriptionGenResponse(BaseModel):
    generated_description: str
    storage_recommendation: str
    safety_reminder: str


class MatchRecipientsRequest(BaseModel):
    listing_id: str


class MatchRecommendation(BaseModel):
    organization_id: str
    organization_name: str
    organization_type: str
    contact_email: str
    contact_phone: str
    address: str
    distance_km: float
    match_score: float = Field(..., ge=0, le=100)
    explanation: str
    matching_factors: Dict[str, Any]


class MatchRecipientsResponse(BaseModel):
    listing_id: str
    listing_title: str
    total_candidates_analyzed: int
    recommendations: List[MatchRecommendation]


class AgentToolExecution(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = {}
    result_summary: str


class ChatMessage(BaseModel):
    role: str
    content: str
    tools_executed: Optional[List[AgentToolExecution]] = None


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    current_location: Optional[str] = None
    user_role: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    suggested_actions: Optional[List[str]] = []
    model_used: Optional[str] = "Foodloop AI Agent"
    tools_executed: Optional[List[AgentToolExecution]] = []



class PriorityAlgorithmRequest(BaseModel):
    hours_remaining: float = Field(..., ge=0, le=72)
    category: str
    quantity: float = Field(..., gt=0)
    unit: str = "servings"
    storage_condition: str = "room_temperature"


class PriorityAlgorithmResponse(BaseModel):
    priority_score: float
    urgency_tier: str
    time_score: float
    storage_score: float
    category_score: float
    quantity_score: float
    dispatch_recommendation: str


class ImpactAlgorithmRequest(BaseModel):
    quantity_kg: float = Field(..., gt=0)


class ImpactAlgorithmResponse(BaseModel):
    quantity_kg: float
    meals_provided: int
    co2_saved_kg: float
    methane_avoided_kg: float
    water_saved_liters: float
    economic_value_inr: float


