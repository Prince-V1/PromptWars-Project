from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, food, requests, pickups, ai, dashboard, admin, donors, agent, events, recipients
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(food.router)
api_router.include_router(requests.router)
api_router.include_router(pickups.router)
api_router.include_router(ai.router)
api_router.include_router(dashboard.router)
api_router.include_router(admin.router)
api_router.include_router(donors.router)
api_router.include_router(recipients.router)
api_router.include_router(agent.router)
api_router.include_router(events.router)
