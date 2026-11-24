import logging
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.models.models import Event, FoodListing, Profile, DonationRequest
from app.schemas.events import EventCreate, EventSurplusReport, EventResponse, EventDashboardSummary
from app.core.exceptions import NotFoundException, BadRequestException

logger = logging.getLogger("foodloop.event_service")


class EventService:
    async def create_event(
        self,
        payload: EventCreate,
        current_user: Profile,
        db: AsyncSession
    ) -> Event:
        """Registers an upcoming event (wedding, banquet, corporate gathering)."""
        event = Event(
            organizer_id=current_user.id,
            organization_id=current_user.organization_id,
            event_name=payload.event_name,
            event_type=payload.event_type,
            event_date=payload.event_date,
            start_time=payload.start_time,
            end_time=payload.end_time,
            venue_name=payload.venue_name,
            location_address=payload.location_address,
            city=payload.city or "Delhi NCR",
            latitude=payload.latitude,
            longitude=payload.longitude,
            estimated_guests=payload.estimated_guests,
            contact_person=payload.contact_person,
            contact_phone=payload.contact_phone,
            expected_food_categories=payload.expected_food_categories,
            estimated_food_quantity=payload.estimated_food_quantity,
            estimated_food_unit=payload.estimated_food_unit,
            expected_surplus=payload.expected_surplus,
            status="upcoming",
            notes=payload.notes
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)
        return event

    async def get_events(
        self,
        event_type: Optional[str] = None,
        status: Optional[str] = None,
        organizer_id: Optional[str] = None,
        db: AsyncSession = None
    ) -> List[Event]:
        """Lists events with optional filters."""
        query = select(Event).order_by(desc(Event.event_date))
        if event_type:
            query = query.where(Event.event_type == event_type)
        if status:
            query = query.where(Event.status == status)
        if organizer_id:
            query = query.where(Event.organizer_id == organizer_id)
        
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_event_by_id(self, event_id: str, db: AsyncSession) -> Event:
        """Retrieves a single event by ID."""
        result = await db.execute(select(Event).where(Event.id == event_id))
        event = result.scalars().first()
        if not event:
            raise NotFoundException(f"Event with ID '{event_id}' not found")
        return event

    async def report_event_surplus(
        self,
        payload: EventSurplusReport,
        current_user: Profile,
        db: AsyncSession
    ) -> FoodListing:
        """
        Creates a surplus food donation listing resulting from an event.
        Enforces strict food safety eligibility checks.
        """
        event = await self.get_event_by_id(payload.event_id, db)

        # 1. Food Safety & Verification Logic
        verification_flag = "approved"
        flagged_reason = None
        listing_status = "available"

        # Check A: Distinguish untouched food vs food exposed to guests
        if payload.food_safety_status == "exposed_to_guests":
            verification_flag = "ineligible_unsafe"
            listing_status = "cancelled"
            flagged_reason = "Food was exposed to guests / open buffet; ineligible for safe redistribution under safety guidelines."
        
        # Check B: Storage temperature compliance
        if payload.storage_instructions == "hot_holding" and payload.storage_temperature is not None:
            if payload.storage_temperature < 60.0:
                verification_flag = "flagged_review"
                flagged_reason = f"Hot holding temperature ({payload.storage_temperature}°C) is below the FSSAI safety threshold (60°C)."
        elif payload.storage_instructions == "refrigerated" and payload.storage_temperature is not None:
            if payload.storage_temperature > 5.0:
                verification_flag = "flagged_review"
                flagged_reason = f"Refrigerated temperature ({payload.storage_temperature}°C) exceeds the FSSAI safety threshold (5°C)."

        # Priority calculation
        now = datetime.now(timezone.utc)
        time_diff = (payload.pickup_deadline - now).total_seconds() / 3600.0
        time_score = 48.0 if time_diff <= 2.0 else 35.0 if time_diff <= 4.0 else 20.0
        storage_score = 25.0 if payload.storage_instructions == "hot_holding" else 15.0
        qty_score = 15.0 if payload.quantity >= 50.0 else 8.0
        priority = min(100.0, time_score + storage_score + qty_score)

        listing = FoodListing(
            provider_id=current_user.id,
            organization_id=current_user.organization_id or event.organization_id,
            event_id=event.id,
            title=f"[{event.event_name}] {payload.food_name}",
            description=payload.description or f"Surplus {payload.food_name} rescued from {event.event_name} at {event.venue_name}. {payload.notes or ''}",
            category=payload.category,
            quantity=payload.quantity,
            remaining_quantity=payload.quantity,
            unit=payload.unit,
            dietary_type=payload.dietary_type,
            status=listing_status,
            preparation_time=payload.preparation_time,
            pickup_deadline=payload.pickup_deadline,
            pickup_address=payload.pickup_address or event.location_address,
            latitude=payload.latitude if payload.latitude is not None else event.latitude,
            longitude=payload.longitude if payload.longitude is not None else event.longitude,
            image_url=payload.image_url or "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
            storage_instructions=payload.storage_instructions,
            allergens=payload.allergens,
            priority_score=priority,
            food_safety_status=payload.food_safety_status,
            storage_temperature=payload.storage_temperature,
            storage_temperature_unit=payload.storage_temperature_unit or "C",
            ingredients=payload.ingredients,
            safety_declaration_confirmed=payload.safety_declaration_confirmed,
            verification_flag=verification_flag,
            flagged_reason=flagged_reason
        )

        db.add(listing)
        # Update event status to completed or update surplus
        event.status = "completed"
        event.expected_surplus = (event.expected_surplus or 0.0) + payload.quantity
        await db.commit()
        await db.refresh(listing)
        return listing

    async def get_dashboard_summary(
        self,
        current_user: Optional[Profile],
        db: AsyncSession
    ) -> EventDashboardSummary:
        """Calculates operational dashboard metrics for Event Rescue."""
        organizer_filter = current_user.id if (current_user and current_user.role != "admin") else None

        # Events
        all_events = await self.get_events(organizer_id=organizer_filter, db=db)
        upcoming = [e for e in all_events if e.status == "upcoming"]
        completed = [e for e in all_events if e.status == "completed"]

        # Surplus listings connected to events
        query = select(FoodListing).where(FoodListing.event_id.isnot(None))
        if organizer_filter:
            query = query.where(FoodListing.provider_id == organizer_filter)
        res = await db.execute(query)
        event_listings = list(res.scalars().all())

        total_surplus_kg = sum(l.quantity for l in event_listings if l.unit == "kg")
        meals = int(round(total_surplus_kg * 2.5))
        co2 = round(total_surplus_kg * 2.5, 2)

        # Requests on event surplus
        event_listing_ids = [l.id for l in event_listings]
        pending_requests = 0
        completed_redistributions = 0
        if event_listing_ids:
            req_query = select(DonationRequest).where(DonationRequest.listing_id.in_(event_listing_ids))
            req_res = await db.execute(req_query)
            reqs = list(req_res.scalars().all())
            pending_requests = sum(1 for r in reqs if r.status in ["requested", "accepted"])
            completed_redistributions = sum(1 for r in reqs if r.status in ["delivered", "picked_up"])

        upcoming_responses = [EventResponse.model_validate(e) for e in upcoming[:10]]

        return EventDashboardSummary(
            upcoming_events_count=len(upcoming),
            completed_events_count=len(completed),
            total_surplus_reported_kg=total_surplus_kg,
            pending_requests_count=pending_requests,
            completed_redistributions_count=completed_redistributions,
            meals_provided=meals,
            co2_saved_kg=co2,
            upcoming_events=upcoming_responses,
            active_event_surplus=event_listings[:10]
        )


event_service = EventService()
