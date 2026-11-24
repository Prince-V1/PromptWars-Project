from typing import Optional, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.agent_service import agent_service
from app.schemas.ai import ChatRequest, ChatResponse

router = APIRouter(prefix="/agent", tags=["ChatGPT AI Agent Integration"])


@router.get("/openapi.json")
async def get_chatgpt_actions_openapi_schema():
    """
    Returns the official OpenAPI 3.1.0 specification ready to be pasted directly
    into ChatGPT Custom GPT Builder (chatgpt.com/gpts/editor) under 'Configure -> Actions'.
    """
    return {
        "openapi": "3.1.0",
        "info": {
            "title": "Foodloop AI Agent Platform Actions",
            "description": "API Actions allowing ChatGPT to interact directly with the live Foodloop Surplus Food Redistribution platform in India.",
            "version": "1.0.0"
        },
        "servers": [
            {
                "url": "http://127.0.0.1:8000/api/v1",
                "description": "Foodloop Local Backend Server"
            }
        ],
        "paths": {
            "/agent/food": {
                "get": {
                    "summary": "Search Live Surplus Food",
                    "operationId": "searchFoodloopInventory",
                    "description": "Retrieves real-time surplus edible food batches available for rescue in Delhi NCR.",
                    "parameters": [
                        {
                            "name": "query",
                            "in": "query",
                            "required": False,
                            "schema": {"type": "string"},
                            "description": "Keyword e.g. biryani, paneer, rajma, bread, samosas"
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "List of available food listings.",
                            "content": {"application/json": {"schema": {"type": "object"}}}
                        }
                    }
                }
            },
            "/agent/donors": {
                "get": {
                    "summary": "Get Verified Food Donors",
                    "operationId": "getFoodloopDonors",
                    "description": "Retrieves verified restaurants, hotels, bakeries, and grocery stores donating food on Foodloop.",
                    "responses": {
                        "200": {
                            "description": "List of registered partner establishments.",
                            "content": {"application/json": {"schema": {"type": "object"}}}
                        }
                    }
                }
            },
            "/agent/impact": {
                "post": {
                    "summary": "Calculate Environmental Offset",
                    "operationId": "calculateFoodloopImpact",
                    "description": "Calculates meals created and CO2e greenhouse gas emissions avoided for a given food weight.",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "quantity_kg": {"type": "number", "description": "Weight of food in kilograms"}
                                    },
                                    "required": ["quantity_kg"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Calculated impact metrics.",
                            "content": {"application/json": {"schema": {"type": "object"}}}
                        }
                    }
                }
            }
        }
    }


@router.get("/food")
async def chatgpt_get_food(query: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """Live Food Listing search for ChatGPT."""
    return await agent_service.execute_tool("search_live_food_inventory", {"query": query or ""}, db)


@router.get("/donors")
async def chatgpt_get_donors(shop_name: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """Verified Donor search for ChatGPT."""
    return await agent_service.execute_tool("get_donor_shop_directory", {"shop_name": shop_name or ""}, db)


@router.post("/impact")
async def chatgpt_calculate_impact(payload: dict, db: AsyncSession = Depends(get_db)):
    """Impact calculation for ChatGPT."""
    kg = payload.get("quantity_kg", 50.0)
    return await agent_service.execute_tool("calculate_environmental_offset", {"quantity_kg": kg}, db)
