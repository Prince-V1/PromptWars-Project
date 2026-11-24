from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_optional_current_user
from app.models.models import Profile, Event
from app.schemas.events import (
    EventCreate, EventResponse, EventSurplusReport, EventDashboardSummary
)
from app.schemas.food import FoodListingResponse
from app.services.event_service import event_service

router = APIRouter(prefix="/events", tags=["FoodLoop Event Rescue"])


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: EventCreate,
    current_user: Optional[Profile] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Registers an upcoming event (wedding, reception, corporate gathering, banquet)
    for proactive surplus rescue preparation.
    """
    if not current_user:
        res = await db.execute(select(Profile).where(Profile.role == "food_provider"))
        current_user = res.scalars().first()
        if not current_user:
            res = await db.execute(select(Profile))
            current_user = res.scalars().first()
            
    event = await event_service.create_event(payload, current_user, db)
    return EventResponse.model_validate(event)


@router.get("", response_model=List[EventResponse])
async def list_events(
    event_type: Optional[str] = Query(None, description="wedding, reception, corporate_event, etc."),
    status: Optional[str] = Query(None, description="upcoming, in_progress, completed"),
    db: AsyncSession = Depends(get_db)
):
    """Lists registered events."""
    events = await event_service.get_events(event_type=event_type, status=status, db=db)
    return [EventResponse.model_validate(e) for e in events]


@router.get("/dashboard/summary", response_model=EventDashboardSummary)
async def get_event_dashboard_summary(
    current_user: Optional[Profile] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns organizer dashboard summary and event redistribution impact."""
    return await event_service.get_dashboard_summary(current_user, db)


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Retrieves event details by ID."""
    event = await event_service.get_event_by_id(event_id, db)
    return EventResponse.model_validate(event)


@router.post("/surplus", response_model=FoodListingResponse, status_code=status.HTTP_201_CREATED)
async def report_event_surplus(
    payload: EventSurplusReport,
    current_user: Optional[Profile] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reports surplus food from an event.
    Enforces untouched vs exposed checks, temperature verification, and donor sign-off.
    """
    if not current_user:
        res = await db.execute(select(Profile).where(Profile.role == "food_provider"))
        current_user = res.scalars().first()
        if not current_user:
            res = await db.execute(select(Profile))
            current_user = res.scalars().first()

    listing = await event_service.report_event_surplus(payload, current_user, db)
    return FoodListingResponse.model_validate(listing)
