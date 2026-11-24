import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Boolean, Float, Integer, Numeric, DateTime,
    ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(50), nullable=True)
    role = Column(String(50), nullable=False, default="recipient")  # food_provider, recipient, volunteer, admin
    avatar_url = Column(Text, nullable=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    password_hash = Column(String(255), nullable=True)  # For standalone auth / testing
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    organization = relationship("Organization", back_populates="members", foreign_keys=[organization_id])
    listings = relationship("FoodListing", back_populates="provider", foreign_keys="FoodListing.provider_id")
    requests = relationship("DonationRequest", back_populates="recipient", foreign_keys="DonationRequest.recipient_id")
    pickups = relationship("Pickup", back_populates="volunteer", foreign_keys="Pickup.volunteer_id")
    events = relationship("Event", back_populates="organizer", foreign_keys="Event.organizer_id")


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    organization_type = Column(String(50), nullable=False)  # restaurant, hotel, bakery, grocery_store, ngo, food_bank, etc.
    verification_status = Column(String(50), default="unverified", nullable=False)  # unverified, pending, verified, rejected
    registration_number = Column(String(100), nullable=True)  # FSSAI / NGO Darpan / 80G
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), default="Delhi NCR", nullable=False)
    state = Column(String(100), default="Delhi", nullable=False)
    postal_code = Column(String(20), nullable=False)
    country = Column(String(100), default="India", nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity_servings_per_day = Column(Integer, default=100)
    accepted_categories = Column(JSON, default=list)
    recipient_category = Column(String(50), default="human", nullable=False)  # human vs animal_care
    supported_species = Column(JSON, default=list)  # cows, bulls, buffaloes, dogs, cats, goats, sheep, birds, other
    description = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    members = relationship("Profile", back_populates="organization", foreign_keys="Profile.organization_id")
    listings = relationship("FoodListing", back_populates="organization")
    verifications = relationship("OrganizationVerification", back_populates="organization")
    events = relationship("Event", back_populates="organization", foreign_keys="Event.organization_id")


class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organizer_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    event_name = Column(String(255), nullable=False)
    event_type = Column(String(50), nullable=False)  # wedding, reception, birthday, corporate_event, festival, community_gathering, conference, other
    event_date = Column(DateTime(timezone=True), nullable=False, index=True)
    start_time = Column(String(50), nullable=True)
    end_time = Column(String(50), nullable=True)
    venue_name = Column(String(255), nullable=False)
    location_address = Column(Text, nullable=False)
    city = Column(String(100), default="Delhi NCR", nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    estimated_guests = Column(Integer, default=100, nullable=False)
    contact_person = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    expected_food_categories = Column(JSON, default=list)  # list of categories expected
    estimated_food_quantity = Column(Float, default=0.0)
    estimated_food_unit = Column(String(50), default="kg")
    expected_surplus = Column(Float, default=0.0)
    status = Column(String(50), default="upcoming", nullable=False, index=True)  # upcoming, in_progress, completed, cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    organizer = relationship("Profile", back_populates="events", foreign_keys=[organizer_id])
    organization = relationship("Organization", back_populates="events", foreign_keys=[organization_id])
    surplus_listings = relationship("FoodListing", back_populates="event", cascade="all, delete-orphan")


class FoodListing(Base):
    __tablename__ = "food_listings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    provider_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True)  # cooked_meals, bakery, packaged_groceries, fresh_produce, dairy, etc.
    quantity = Column(Float, nullable=False)
    remaining_quantity = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)  # kg, portions, packets, crates, liters, boxes
    dietary_type = Column(String(50), default="veg", nullable=False)  # veg, non_veg, vegan, contains_egg
    status = Column(String(50), default="available", nullable=False, index=True)  # available, reserved, completed, cancelled, expired
    preparation_time = Column(DateTime(timezone=True), nullable=False)
    pickup_deadline = Column(DateTime(timezone=True), nullable=False, index=True)
    pickup_address = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    image_url = Column(Text, nullable=True)
    storage_instructions = Column(String(50), default="room_temperature", nullable=False)  # room_temperature, refrigerated, frozen, hot_holding
    allergens = Column(JSON, default=list)  # list of strings
    ai_analysis_metadata = Column(JSON, default=dict)
    priority_score = Column(Float, default=0.0)

    # Food Safety & Verification Requirements
    food_safety_status = Column(String(50), default="untouched", nullable=False)  # untouched vs exposed_to_guests
    storage_temperature = Column(Float, nullable=True)  # in Celsius
    storage_temperature_unit = Column(String(10), default="C", nullable=False)
    ingredients = Column(JSON, default=list)  # list of ingredient strings
    safety_declaration_confirmed = Column(Boolean, default=False, nullable=False)
    verification_flag = Column(String(50), default="approved", nullable=False)  # approved, flagged_review, ineligible_unsafe
    flagged_reason = Column(Text, nullable=True)

    # Animal Feed & Target Beneficiary Segregation
    target_beneficiary = Column(String(50), default="human", nullable=False)  # human, animal_feed, both
    suitable_species = Column(JSON, default=list)  # cows, bulls, buffaloes, dogs, cats, goats, sheep, birds, other
    animal_feed_safety_confirmed = Column(Boolean, default=False, nullable=False)
    animal_feed_notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    provider = relationship("Profile", back_populates="listings", foreign_keys=[provider_id])
    organization = relationship("Organization", back_populates="listings", foreign_keys=[organization_id])
    event = relationship("Event", back_populates="surplus_listings", foreign_keys=[event_id])
    requests = relationship("DonationRequest", back_populates="listing", cascade="all, delete-orphan")


class DonationRequest(Base):
    __tablename__ = "donation_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id = Column(String(36), ForeignKey("food_listings.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    requested_quantity = Column(Float, nullable=False)
    status = Column(String(50), default="requested", nullable=False, index=True)  # requested, accepted, rejected, picked_up, delivered, cancelled, expired
    notes = Column(Text, nullable=True)
    delivery_mode = Column(String(50), default="self_pickup", nullable=False)  # self_pickup, volunteer_courier, provider_delivery
    rejection_reason = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    listing = relationship("FoodListing", back_populates="requests", foreign_keys=[listing_id])
    recipient = relationship("Profile", back_populates="requests", foreign_keys=[recipient_id])
    pickup = relationship("Pickup", back_populates="request", uselist=False)


class Pickup(Base):
    __tablename__ = "pickups"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = Column(String(36), ForeignKey("donation_requests.id", ondelete="CASCADE"), unique=True, nullable=False)
    volunteer_id = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(50), default="pending", nullable=False, index=True)  # pending, assigned, in_transit, picked_up, delivered, failed, cancelled
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    picked_up_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    pickup_notes = Column(Text, nullable=True)
    proof_image_url = Column(Text, nullable=True)
    delivery_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    request = relationship("DonationRequest", back_populates="pickup", foreign_keys=[request_id])
    volunteer = relationship("Profile", back_populates="pickups", foreign_keys=[volunteer_id])


class ImpactRecord(Base):
    __tablename__ = "impact_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id = Column(String(36), ForeignKey("food_listings.id", ondelete="SET NULL"), nullable=True)
    request_id = Column(String(36), ForeignKey("donation_requests.id", ondelete="SET NULL"), unique=True, nullable=True)
    provider_id = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    recipient_id = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    quantity_kg_equivalent = Column(Float, nullable=False)
    estimated_meals = Column(Integer, nullable=False)
    co2_saved_kg = Column(Float, nullable=False)
    verified_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class OrganizationVerification(Base):
    __tablename__ = "organization_verifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    submitted_by = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    reviewed_by = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="pending", nullable=False, index=True)  # pending, approved, rejected
    document_url = Column(Text, nullable=True)
    document_type = Column(String(50), nullable=False)  # fssai_license, ngo_darpan, 80g_certificate, pan_card, other
    document_number = Column(String(100), nullable=False)
    rejection_reason = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    organization = relationship("Organization", back_populates="verifications", foreign_keys=[organization_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=False)
    metadata_json = Column(JSON, default=dict)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
