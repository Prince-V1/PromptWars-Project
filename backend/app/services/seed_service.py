import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import (
    Profile, Organization, FoodListing, DonationRequest,
    Pickup, ImpactRecord, OrganizationVerification
)
from app.core.security import hash_password
from app.services.priority_service import priority_service

logger = logging.getLogger("foodloop.seed_service")


async def seed_initial_data(db: AsyncSession):
    # Check if admin already exists
    admin_check = await db.execute(select(Profile).where(Profile.email == "admin@foodloop.in"))
    if admin_check.scalars().first():
        logger.info("Database already seeded. Skipping initial seeding.")
        return

    logger.info("Seeding realistic hackathon and production demo dataset...")

    now = datetime.now(timezone.utc)

    # 1. Organizations
    org_taj = Organization(
        name="Taj Palace Hotel & Banquets",
        organization_type="hotel",
        verification_status="verified",
        registration_number="FSSAI-10018011000452",
        contact_email="banquets@tajpalace.demo",
        contact_phone="+919811001234",
        address="Diplomatic Enclave, Chanakyapuri",
        city="New Delhi",
        state="Delhi",
        postal_code="110021",
        country="India",
        latitude=28.5976,
        longitude=77.1741,
        capacity_servings_per_day=500,
        accepted_categories=["cooked_meals", "bakery", "dairy"]
    )

    org_haldirams = Organization(
        name="Haldiram's Sweets & Bakery CP",
        organization_type="bakery",
        verification_status="verified",
        registration_number="FSSAI-10019011008891",
        contact_email="manager.cp@haldirams.demo",
        contact_phone="+919811009876",
        address="Connaught Place, Radial Road 3",
        city="New Delhi",
        state="Delhi",
        postal_code="110001",
        country="India",
        latitude=28.6328,
        longitude=77.2197,
        capacity_servings_per_day=300,
        accepted_categories=["bakery", "packaged_groceries"]
    )

    org_robinhood = Organization(
        name="Robin Hood Army - Central Delhi Chapter",
        organization_type="ngo",
        verification_status="verified",
        registration_number="DARPAN-DL-2021-00984",
        contact_email="robinhood.delhi@foodloop.in",
        contact_phone="+919876543210",
        address="Paharganj Community Center",
        city="New Delhi",
        state="Delhi",
        postal_code="110055",
        country="India",
        latitude=28.6432,
        longitude=77.2148,
        capacity_servings_per_day=450,
        accepted_categories=["cooked_meals", "bakery", "fresh_produce", "packaged_groceries", "dairy"]
    )

    org_feeding_india = Organization(
        name="Feeding India Youth Initiative",
        organization_type="food_bank",
        verification_status="verified",
        registration_number="DARPAN-DL-2022-01823",
        contact_email="contact@feedingindia.demo",
        contact_phone="+919876511223",
        address="Hauz Khas Social Center",
        city="New Delhi",
        state="Delhi",
        postal_code="110016",
        country="India",
        latitude=28.5494,
        longitude=77.2001,
        capacity_servings_per_day=600,
        accepted_categories=["cooked_meals", "fresh_produce", "packaged_groceries"]
    )

    org_fresh_mart = Organization(
        name="GreenField Organic Supermarket",
        organization_type="grocery_store",
        verification_status="pending",
        registration_number="FSSAI-10023011009911",
        contact_email="greenfield@delhimart.demo",
        contact_phone="+919811998877",
        address="Khan Market Sector 4",
        city="New Delhi",
        state="Delhi",
        postal_code="110003",
        country="India",
        latitude=28.5998,
        longitude=77.2270,
        capacity_servings_per_day=200,
        accepted_categories=["fresh_produce", "dairy", "packaged_groceries"]
    )

    db.add_all([org_taj, org_haldirams, org_robinhood, org_feeding_india, org_fresh_mart])
    await db.flush()

    # 2. Profiles
    admin_user = Profile(
        email="admin@foodloop.in",
        full_name="Dr. Sunita Sharma (Admin)",
        phone_number="+919810011223",
        role="admin",
        password_hash=hash_password("Admin@FoodLoop2026"),
        is_active=True
    )

    provider_user = Profile(
        email="taj.delhi@foodloop.in",
        full_name="Chef Vikram Kapoor",
        phone_number="+919811001234",
        role="food_provider",
        organization_id=org_taj.id,
        password_hash=hash_password("Provider@1234"),
        is_active=True
    )

    recipient_user = Profile(
        email="robinhood.delhi@foodloop.in",
        full_name="Aarav Mehra (NGO Coordinator)",
        phone_number="+919876543210",
        role="recipient",
        organization_id=org_robinhood.id,
        password_hash=hash_password("Recipient@1234"),
        is_active=True
    )

    volunteer_user = Profile(
        email="arjun.volunteer@foodloop.in",
        full_name="Arjun Verma (Rescue Volunteer)",
        phone_number="+919988776655",
        role="volunteer",
        password_hash=hash_password("Volunteer@1234"),
        is_active=True
    )

    db.add_all([admin_user, provider_user, recipient_user, volunteer_user])
    await db.flush()

    # 3. Organization Verification for Admin review
    pending_veri = OrganizationVerification(
        organization_id=org_fresh_mart.id,
        submitted_by=provider_user.id,
        status="pending",
        document_type="fssai_license",
        document_number="FSSAI-10023011009911"
    )
    db.add(pending_veri)

    # 4. Realistic Active Food Listings (with White-Background Studio Food Photography)
    dl1 = now + timedelta(hours=3, minutes=30)
    score1 = priority_service.calculate_priority_score(dl1, "cooked_meals", 25.0, "kg", "hot_holding")
    listing1 = FoodListing(
        provider_id=provider_user.id,
        organization_id=org_taj.id,
        title="Royal Buffet Surplus: Paneer Makhani & Jeera Rice",
        description="Freshly prepared premium vegetarian buffet batch from luncheon banquet. Packed hygienically in food-grade insulated aluminum containers.",
        category="cooked_meals",
        quantity=25.0,
        remaining_quantity=25.0,
        unit="kg",
        dietary_type="veg",
        status="available",
        preparation_time=now - timedelta(hours=1, minutes=30),
        pickup_deadline=dl1,
        pickup_address="Diplomatic Enclave Banquet Loading Bay 2, Chanakyapuri, New Delhi",
        latitude=28.5976,
        longitude=77.1741,
        image_url="/images/food/paneer_butter_masala.jpg",
        storage_instructions="hot_holding",
        allergens=["Dairy"],
        ai_analysis_metadata={
            "suggested_title": "Paneer Makhani & Jeera Rice Trays",
            "suggested_category": "cooked_meals",
            "visible_condition_observations": ["Insulated commercial food pans", "Steam and warmth intact"],
            "requires_human_verification": True
        },
        priority_score=score1
    )

    dl2 = now + timedelta(hours=5)
    score2 = priority_service.calculate_priority_score(dl2, "bakery", 40.0, "packets", "room_temperature")
    listing2 = FoodListing(
        provider_id=provider_user.id,
        organization_id=org_taj.id,
        title="Fresh French Baguettes & Sourdough Loaves",
        description="Daily artisan bakery surplus baked this morning. Crisp crust, sealed in clean bakery kraft paper bags.",
        category="bakery",
        quantity=40.0,
        remaining_quantity=40.0,
        unit="packets",
        dietary_type="vegan",
        status="available",
        preparation_time=now - timedelta(hours=3),
        pickup_deadline=dl2,
        pickup_address="Taj Pastry Kitchen Door 4, Chanakyapuri, New Delhi",
        latitude=28.5980,
        longitude=77.1745,
        image_url="/images/food/artisan_bread.jpg",
        storage_instructions="room_temperature",
        allergens=["Gluten"],
        priority_score=score2
    )

    dl3 = now + timedelta(hours=2)
    score3 = priority_service.calculate_priority_score(dl3, "cooked_meals", 60.0, "portions", "hot_holding")
    listing3 = FoodListing(
        provider_id=provider_user.id,
        organization_id=org_haldirams.id,
        title="Nutritious Vegetable Khichdi & Dal Tadka",
        description="Freshly cooked midday batch packaged into 60 individual single-portion meal boxes. High protein and nutritious.",
        category="cooked_meals",
        quantity=60.0,
        remaining_quantity=60.0,
        unit="portions",
        dietary_type="veg",
        status="available",
        preparation_time=now - timedelta(hours=2),
        pickup_deadline=dl3,
        pickup_address="Haldiram's Express Dispatch, Inner Circle CP, New Delhi",
        latitude=28.6328,
        longitude=77.2197,
        image_url="/images/food/vegetable_khichdi.jpg",
        storage_instructions="hot_holding",
        allergens=["Dairy"],
        priority_score=score3
    )

    # Listing 4: Vegetable Dum Biryani
    dl4 = now + timedelta(hours=4)
    score4 = priority_service.calculate_priority_score(dl4, "cooked_meals", 35.0, "kg", "hot_holding")
    listing4 = FoodListing(
        provider_id=provider_user.id,
        organization_id=org_taj.id,
        title="Hyderabadi Vegetable Dum Biryani Handi",
        description="Aromatic slow-cooked basmati rice layered with garden veggies, saffron, and fried onions in sealed earthenware.",
        category="cooked_meals",
        quantity=35.0,
        remaining_quantity=35.0,
        unit="kg",
        dietary_type="veg",
        status="available",
        preparation_time=now - timedelta(hours=2),
        pickup_deadline=dl4,
        pickup_address="Taj Hotel Banquets Gate 2, Chanakyapuri, New Delhi",
        latitude=28.5976,
        longitude=77.1741,
        image_url="/images/food/vegetable_biryani.jpg",
        storage_instructions="hot_holding",
        allergens=["Dairy"],
        priority_score=score4
    )

    # Listing 5: Chole Bhature
    dl5 = now + timedelta(hours=3)
    score5 = priority_service.calculate_priority_score(dl5, "cooked_meals", 45.0, "portions", "hot_holding")
    listing5 = FoodListing(
        provider_id=provider_user.id,
        organization_id=org_haldirams.id,
        title="Amritsari Pindi Chole & Fluffy Bhature",
        description="Rich dark chickpea gravy with freshly fried bhature meal packs, sealed for emergency redistribution.",
        category="cooked_meals",
        quantity=45.0,
        remaining_quantity=45.0,
        unit="portions",
        dietary_type="veg",
        status="available",
        preparation_time=now - timedelta(hours=1),
        pickup_deadline=dl5,
        pickup_address="Haldiram's CP Outlet, Inner Circle, New Delhi",
        latitude=28.6328,
        longitude=77.2197,
        image_url="/images/food/chole_bhature.jpg",
        storage_instructions="hot_holding",
        allergens=["Gluten"],
        priority_score=score5
    )

    # Listing 6: Samosas
    dl6 = now + timedelta(hours=6)
    score6 = priority_service.calculate_priority_score(dl6, "cooked_meals", 80.0, "portions", "room_temperature")
    listing6 = FoodListing(
        provider_id=provider_user.id,
        organization_id=org_haldirams.id,
        title="Crispy Triangle Vegetable Samosas",
        description="Freshly fried potato-and-pea stuffed samosas with mint and tamarind dipping chutneys.",
        category="cooked_meals",
        quantity=80.0,
        remaining_quantity=80.0,
        unit="portions",
        dietary_type="veg",
        status="available",
        preparation_time=now - timedelta(hours=2),
        pickup_deadline=dl6,
        pickup_address="Haldiram's CP Outlet, Inner Circle, New Delhi",
        latitude=28.6328,
        longitude=77.2197,
        image_url="/images/food/samosas.jpg",
        storage_instructions="room_temperature",
        allergens=["Gluten"],
        priority_score=score6
    )

    # Listing 7: Masala Dosa
    dl7 = now + timedelta(hours=2, minutes=30)
    score7 = priority_service.calculate_priority_score(dl7, "cooked_meals", 50.0, "portions", "hot_holding")
    listing7 = FoodListing(
        provider_id=provider_user.id,
        organization_id=org_haldirams.id,
        title="Crisp South Indian Masala Dosa with Sambar",
        description="Golden rolled rice-lentil crepes filled with spiced potato masala, paired with fresh coconut chutney.",
        category="cooked_meals",
        quantity=50.0,
        remaining_quantity=50.0,
        unit="portions",
        dietary_type="veg",
        status="available",
        preparation_time=now - timedelta(hours=1),
        pickup_deadline=dl7,
        pickup_address="Haldiram's CP South Wing, New Delhi",
        latitude=28.6328,
        longitude=77.2197,
        image_url="/images/food/masala_dosa.jpg",
        storage_instructions="hot_holding",
        allergens=["Mustard"],
        priority_score=score7
    )

    # Listing 8: Fresh Organic Produce Basket
    dl8 = now + timedelta(hours=18)
    score8 = priority_service.calculate_priority_score(dl8, "fresh_produce", 50.0, "kg", "refrigerated")
    listing8 = FoodListing(
        provider_id=provider_user.id,
        organization_id=org_fresh_mart.id,
        title="Organic Farm Fresh Produce Crate",
        description="Crisp red bell peppers, vine-ripened tomatoes, sweet carrots, cucumbers, and leafy greens from morning intake.",
        category="fresh_produce",
        quantity=50.0,
        remaining_quantity=50.0,
        unit="kg",
        dietary_type="vegan",
        status="available",
        preparation_time=now - timedelta(hours=4),
        pickup_deadline=dl8,
        pickup_address="Khan Market Sector 4 Loading Dock, New Delhi",
        latitude=28.5998,
        longitude=77.2270,
        image_url="/images/food/fresh_produce_basket.jpg",
        storage_instructions="refrigerated",
        allergens=[],
        priority_score=score8
    )

    # Listing 9: Rajma Chawal
    dl9 = now + timedelta(hours=4)
    score9 = priority_service.calculate_priority_score(dl9, "cooked_meals", 30.0, "kg", "hot_holding")
    listing9 = FoodListing(
        provider_id=provider_user.id,
        organization_id=org_taj.id,
        title="Kashmiri Rajma & Steamed Basmati Rice",
        description="Slow-cooked kidney beans in rich tomato-onion masala gravy beside fragrant steamed rice.",
        category="cooked_meals",
        quantity=30.0,
        remaining_quantity=30.0,
        unit="kg",
        dietary_type="veg",
        status="available",
        preparation_time=now - timedelta(hours=2),
        pickup_deadline=dl9,
        pickup_address="Diplomatic Enclave Gate 3, Chanakyapuri, New Delhi",
        latitude=28.5976,
        longitude=77.1741,
        image_url="/images/food/rajma_chawal.jpg",
        storage_instructions="hot_holding",
        allergens=[],
        priority_score=score9
    )

    # Listing 10: Pav Bhaji
    dl10 = now + timedelta(hours=3)
    score10 = priority_service.calculate_priority_score(dl10, "cooked_meals", 40.0, "portions", "hot_holding")
    listing10 = FoodListing(
        provider_id=provider_user.id,
        organization_id=org_haldirams.id,
        title="Mumbai Chowpatty Butter Pav Bhaji",
        description="Rich mashed vegetable bhaji with melting butter dollop, served with toasted buttery pav buns.",
        category="cooked_meals",
        quantity=40.0,
        remaining_quantity=40.0,
        unit="portions",
        dietary_type="veg",
        status="available",
        preparation_time=now - timedelta(hours=1),
        pickup_deadline=dl10,
        pickup_address="Haldiram's Inner Circle, Connaught Place, New Delhi",
        latitude=28.6328,
        longitude=77.2197,
        image_url="/images/food/pav_bhaji.jpg",
        storage_instructions="hot_holding",
        allergens=["Dairy", "Gluten"],
        priority_score=score10
    )

    # Listing 11: Palak Paneer
    dl11 = now + timedelta(hours=4, minutes=30)
    score11 = priority_service.calculate_priority_score(dl11, "cooked_meals", 20.0, "kg", "hot_holding")
    listing11 = FoodListing(
        provider_id=provider_user.id,
        organization_id=org_taj.id,
        title="Velvety Palak Paneer with Tandoori Roti",
        description="Vibrant spinach puree with tender cottage cheese cubes and fresh cream, paired with soft whole-wheat rotis.",
        category="cooked_meals",
        quantity=20.0,
        remaining_quantity=20.0,
        unit="kg",
        dietary_type="veg",
        status="available",
        preparation_time=now - timedelta(hours=2),
        pickup_deadline=dl11,
        pickup_address="Taj Hotel Main Kitchen, Chanakyapuri, New Delhi",
        latitude=28.5976,
        longitude=77.1741,
        image_url="/images/food/palak_paneer.jpg",
        storage_instructions="hot_holding",
        allergens=["Dairy", "Gluten"],
        priority_score=score11
    )

    # Listing 12: Gulab Jamun
    dl12 = now + timedelta(hours=24)
    score12 = priority_service.calculate_priority_score(dl12, "bakery", 60.0, "portions", "room_temperature")
    listing12 = FoodListing(
        provider_id=provider_user.id,
        organization_id=org_haldirams.id,
        title="Shahi Gulab Jamun Banquet Trays",
        description="Golden milk dumplings soaked in cardamom-rose sugar syrup, garnished with slivered pistachios.",
        category="bakery",
        quantity=60.0,
        remaining_quantity=60.0,
        unit="portions",
        dietary_type="veg",
        status="available",
        preparation_time=now - timedelta(hours=3),
        pickup_deadline=dl12,
        pickup_address="Haldiram's Confectionery CP, New Delhi",
        latitude=28.6328,
        longitude=77.2197,
        image_url="/images/food/gulab_jamun.jpg",
        storage_instructions="room_temperature",
        allergens=["Dairy", "Nuts"],
        priority_score=score12
    )

    # Listing 13: Dal Tadka
    dl13 = now + timedelta(hours=3)
    score13 = priority_service.calculate_priority_score(dl13, "cooked_meals", 25.0, "kg", "hot_holding")
    listing13 = FoodListing(
        provider_id=provider_user.id,
        organization_id=org_haldirams.id,
        title="Homestyle Yellow Dal Tadka with Desi Ghee",
        description="Aromatic yellow toor dal with garlic, cumin, and dried red chili tempering, high-protein community batch.",
        category="cooked_meals",
        quantity=25.0,
        remaining_quantity=25.0,
        unit="kg",
        dietary_type="veg",
        status="available",
        preparation_time=now - timedelta(hours=1),
        pickup_deadline=dl13,
        pickup_address="Haldiram's CP Loading Bay, New Delhi",
        latitude=28.6328,
        longitude=77.2197,
        image_url="/images/food/dal_tadka.jpg",
        storage_instructions="hot_holding",
        allergens=["Dairy"],
        priority_score=score13
    )

    db.add_all([
        listing1, listing2, listing3, listing4, listing5,
        listing6, listing7, listing8, listing9, listing10,
        listing11, listing12, listing13
    ])
    await db.flush()

    # 5. Realistic Completed Past Donation with Verified Impact Record
    past_listing = FoodListing(
        provider_id=provider_user.id,
        organization_id=org_taj.id,
        title="Surplus Dinner Catering: Dal Makhani & Roti",
        description="Completed dinner redistribution from previous night.",
        category="cooked_meals",
        quantity=40.0,
        remaining_quantity=0.0,
        unit="kg",
        dietary_type="veg",
        status="completed",
        preparation_time=now - timedelta(days=1, hours=10),
        pickup_deadline=now - timedelta(days=1, hours=2),
        pickup_address="Diplomatic Enclave Banquet Loading Bay 2, Chanakyapuri, New Delhi",
        latitude=28.5976,
        longitude=77.1741,
        image_url="/images/food/dal_makhani.jpg",
        storage_instructions="refrigerated",
        allergens=["Dairy", "Gluten"],
        priority_score=10.0
    )
    db.add(past_listing)
    await db.flush()

    past_req = DonationRequest(
        listing_id=past_listing.id,
        recipient_id=recipient_user.id,
        organization_id=org_robinhood.id,
        requested_quantity=40.0,
        status="delivered",
        delivery_mode="volunteer_courier",
        notes="Urgent dinner distribution for night shelter near New Delhi Railway Station."
    )
    db.add(past_req)
    await db.flush()

    past_pickup = Pickup(
        request_id=past_req.id,
        volunteer_id=volunteer_user.id,
        status="delivered",
        assigned_at=now - timedelta(days=1, hours=8),
        picked_up_at=now - timedelta(days=1, hours=7),
        delivered_at=now - timedelta(days=1, hours=6),
        pickup_notes="Verified temperature: 68°C. Food seals intact.",
        delivery_notes="Delivered 100 hot meal portions to night shelter residents."
    )
    db.add(past_pickup)

    # Verified impact record: 40 kg * 2.5 meals/kg = 100 meals, 100 kg CO2 saved
    past_impact = ImpactRecord(
        listing_id=past_listing.id,
        request_id=past_req.id,
        provider_id=provider_user.id,
        recipient_id=recipient_user.id,
        quantity=40.0,
        unit="kg",
        quantity_kg_equivalent=40.0,
        estimated_meals=100,
        co2_saved_kg=100.0,
        verified_at=now - timedelta(days=1, hours=6)
    )
    db.add(past_impact)

    await db.commit()
    logger.info("FoodLoop database initialized and seeded successfully.")


async def seed_event_rescue_data(db: AsyncSession):
    """Seeds realistic event rescue functions, caterers, and wedding surplus."""
    from app.models.models import Event
    event_check = await db.execute(select(Event))
    if event_check.scalars().first():
        return

    logger.info("Seeding realistic Event Rescue wedding & banquet data...")
    now = datetime.now(timezone.utc)

    # Find existing provider user
    provider_res = await db.execute(select(Profile).where(Profile.email == "provider@tajpalace.demo"))
    provider = provider_res.scalars().first()
    if not provider:
        return

    # Create Banquet & Wedding Organization
    banquet_org = Organization(
        name="Royal Orchid Banquet & Wedding Lawn",
        organization_type="banquet_hall",
        verification_status="verified",
        registration_number="FSSAI-10022011003451",
        contact_email="events@royalorchid.demo",
        contact_phone="+919811223344",
        address="Main Chattarpur Road, South Delhi",
        city="New Delhi",
        state="Delhi",
        postal_code="110074",
        country="India",
        latitude=28.5020,
        longitude=77.1812,
        capacity_servings_per_day=800,
        accepted_categories=["cooked_meals", "bakery", "dairy"]
    )
    db.add(banquet_org)

    caterer_org = Organization(
        name="Grand Feast Wedding Catering Co.",
        organization_type="catering_company",
        verification_status="verified",
        registration_number="FSSAI-10021011009876",
        contact_email="chef@grandfeastcaterers.demo",
        contact_phone="+919877665544",
        address="Block C, Greater Kailash 1",
        city="New Delhi",
        state="Delhi",
        postal_code="110048",
        country="India",
        latitude=28.5482,
        longitude=77.2345,
        capacity_servings_per_day=600,
        accepted_categories=["cooked_meals", "bakery"]
    )
    db.add(caterer_org)
    await db.flush()

    # Event 1: Upcoming Wedding
    event1 = Event(
        organizer_id=provider.id,
        organization_id=banquet_org.id,
        event_name="Grand Royal Wedding: Sharma & Verma",
        event_type="wedding",
        event_date=now + timedelta(days=2, hours=4),
        start_time="19:00",
        end_time="23:30",
        venue_name="Royal Orchid Lawn A, Chattarpur",
        location_address="Main Chattarpur Road, South Delhi",
        city="New Delhi",
        latitude=28.5020,
        longitude=77.1812,
        estimated_guests=550,
        contact_person="Rajesh Sharma (Wedding Planner)",
        contact_phone="+919811223344",
        expected_food_categories=["cooked_meals", "bakery", "dairy"],
        estimated_food_quantity=180.0,
        estimated_food_unit="kg",
        expected_surplus=65.0,
        status="upcoming",
        notes="5-star buffet with sealed chafing dishes. Dedicated kitchen team ready for surplus packaging."
    )
    db.add(event1)

    # Event 2: Corporate Conclave
    event2 = Event(
        organizer_id=provider.id,
        organization_id=caterer_org.id,
        event_name="Delhi Tech Leaders Annual Gala",
        event_type="corporate_event",
        event_date=now + timedelta(days=1, hours=2),
        start_time="18:30",
        end_time="22:00",
        venue_name="Durbar Banquet Hall, Chanakyapuri",
        location_address="Diplomatic Enclave, Chanakyapuri",
        city="New Delhi",
        latitude=28.5976,
        longitude=77.1741,
        estimated_guests=320,
        contact_person="Pooja Sen (Event Director)",
        contact_phone="+919877665544",
        expected_food_categories=["cooked_meals", "bakery"],
        estimated_food_quantity=120.0,
        estimated_food_unit="kg",
        expected_surplus=40.0,
        status="upcoming",
        notes="High-end live counters and banquet trays."
    )
    db.add(event2)

    # Event 3: Completed Reception with active surplus listing
    event3 = Event(
        organizer_id=provider.id,
        organization_id=banquet_org.id,
        event_name="Mehta Family Golden Jubilee Sangeet & Reception",
        event_type="reception",
        event_date=now - timedelta(hours=3),
        start_time="19:00",
        end_time="23:00",
        venue_name="Royal Orchid Crystal Ballroom",
        location_address="Main Chattarpur Road, South Delhi",
        city="New Delhi",
        latitude=28.5020,
        longitude=77.1812,
        estimated_guests=450,
        contact_person="Vikram Mehta",
        contact_phone="+919811223344",
        expected_food_categories=["cooked_meals", "dairy"],
        estimated_food_quantity=200.0,
        estimated_food_unit="kg",
        expected_surplus=55.0,
        status="completed",
        notes="Function concluded. Safe untouched food immediately cooled and packed."
    )
    db.add(event3)
    await db.flush()

    # Surplus Listing for Event 3
    wedding_surplus = FoodListing(
        provider_id=provider.id,
        organization_id=banquet_org.id,
        event_id=event3.id,
        title="[Event Rescue] Awadhi Dum Biryani & Dal Makhani Banquet Trays",
        description="Fresh, untouched luxury wedding feast surplus from Mehta Family Golden Jubilee Reception. Maintained in commercial hot-holding units at 68°C. Packed in food-grade sealed stainless containers.",
        category="cooked_meals",
        quantity=55.0,
        remaining_quantity=55.0,
        unit="kg",
        dietary_type="veg",
        status="available",
        preparation_time=now - timedelta(hours=3),
        pickup_deadline=now + timedelta(hours=5),
        pickup_address="Royal Orchid Crystal Ballroom Loading Bay 1, Chattarpur",
        latitude=28.5020,
        longitude=77.1812,
        image_url="/images/food/dal_makhani.jpg",
        storage_instructions="hot_holding",
        allergens=["dairy"],
        priority_score=92.0,
        food_safety_status="untouched",
        storage_temperature=68.0,
        storage_temperature_unit="C",
        ingredients=["Basmati Rice", "Whole Spices", "Black Lentils", "Butter", "Cream", "Saffron"],
        safety_declaration_confirmed=True,
        verification_flag="approved",
        flagged_reason=None
    )
    db.add(wedding_surplus)

    await db.commit()
    logger.info("Event Rescue seed data successfully created.")


async def seed_animal_care_data(db: AsyncSession):
    """Seeds Animal Care Organizations and realistic animal-feed listings."""
    # Check if animal care orgs already seeded
    check = await db.execute(select(Organization).where(Organization.organization_type == "gaushala"))
    if check.scalars().first():
        logger.info("Animal Care organizations already seeded. Skipping.")
        return

    logger.info("Seeding realistic Animal Care Organizations and animal-feed listings...")

    # Fetch provider for listing association
    provider_res = await db.execute(select(Profile).where(Profile.email == "chef.vikram@tajpalace.demo"))
    provider = provider_res.scalars().first()
    if not provider:
        provider_res = await db.execute(select(Profile).where(Profile.role == "food_provider"))
        provider = provider_res.scalars().first()

    now = datetime.now(timezone.utc)

    # 1. Gaushala
    gaushala = Organization(
        name="Shree Krishna Gaushala & Desi Cow Sanctuary",
        organization_type="gaushala",
        recipient_category="animal_care",
        supported_species=["cows", "bulls", "buffaloes", "goats"],
        description="Sprawling sanctuary dedicated to caring for over 650 rescued indigenous cows, retired oxen, and abandoned calves. Dedicated daily feeding of fresh vegetable trimmings, grain mash, and clean green fodder.",
        image_url="/images/animal_care/gaushala.jpg",
        verification_status="verified",
        registration_number="AWBI-DL-2018-00412",
        contact_email="care@krishnagaushala.org.in",
        contact_phone="+919811224466",
        address="Sector 34 Rural Extension, Najafgarh Road",
        city="New Delhi",
        state="Delhi",
        postal_code="110043",
        country="India",
        latitude=28.5912,
        longitude=76.9924,
        capacity_servings_per_day=800,
        accepted_categories=["fresh_produce", "bakery", "packaged_groceries"]
    )
    db.add(gaushala)

    # 2. Animal Shelter
    shelter = Organization(
        name="Friendicoes SECA Shelter & Rescue",
        organization_type="animal_shelter",
        recipient_category="animal_care",
        supported_species=["dogs", "cats", "birds"],
        description="Premier compassionate sanctuary housing 300+ rescued indie dogs, injured puppies, kittens, and recovering strays. In constant need of plain boiled rice, unseasoned meat broths, eggs, and pet food.",
        image_url="/images/animal_care/animal_shelter.jpg",
        verification_status="verified",
        registration_number="AWBI-DL-1979-00021",
        contact_email="rescue@friendicoes.org.in",
        contact_phone="+919871001122",
        address="271 & 273 Defence Colony Flyover Market, Jungpura",
        city="New Delhi",
        state="Delhi",
        postal_code="110024",
        country="India",
        latitude=28.5744,
        longitude=77.2341,
        capacity_servings_per_day=400,
        accepted_categories=["cooked_meals", "packaged_groceries"]
    )
    db.add(shelter)

    # 3. Animal Rescue Centre
    rescue_centre = Organization(
        name="Sanjay Gandhi Animal Rescue & Trauma Centre",
        organization_type="animal_rescue_centre",
        recipient_category="animal_care",
        supported_species=["dogs", "cats", "cows", "bulls", "birds"],
        description="Round-the-clock emergency hospital and trauma recovery center for street animals, equines, and injured avian wildlife. Provides clinical treatment and daily community recovery meals.",
        image_url="/images/animal_care/animal_rescue_centre.jpg",
        verification_status="verified",
        registration_number="AWBI-DL-1983-00089",
        contact_email="emergency@sgacdelhi.org.in",
        contact_phone="+919810113355",
        address="Near Shivaji College, Ring Road, Raja Garden",
        city="New Delhi",
        state="Delhi",
        postal_code="110027",
        country="India",
        latitude=28.6534,
        longitude=77.1245,
        capacity_servings_per_day=600,
        accepted_categories=["cooked_meals", "fresh_produce", "bakery"]
    )
    db.add(rescue_centre)

    # 4. Veterinary Hospital
    vet_hospital = Organization(
        name="Delhi Charitable Veterinary Hospital & Animal Care",
        organization_type="veterinary_hospital",
        recipient_category="animal_care",
        supported_species=["dogs", "cats", "goats", "birds"],
        description="Charitable veterinary hospital providing post-operative recovery, nutrition feeding, and medical foster care for injured community animals and working equines.",
        image_url="/images/animal_care/veterinary_hospital.jpg",
        verification_status="verified",
        registration_number="VCI-DL-2016-09823",
        contact_email="admin@delhivethospital.org.in",
        contact_phone="+919811557799",
        address="Malka Ganj Road, Tis Hazari, Civil Lines",
        city="New Delhi",
        state="Delhi",
        postal_code="110054",
        country="India",
        latitude=28.6672,
        longitude=77.2185,
        capacity_servings_per_day=250,
        accepted_categories=["cooked_meals", "packaged_groceries"]
    )
    db.add(vet_hospital)

    # 5. Animal Welfare NGO
    welfare_ngo = Organization(
        name="Paws & Wings Welfare Foundation",
        organization_type="animal_welfare_ngo",
        recipient_category="animal_care",
        supported_species=["dogs", "cats", "birds", "other"],
        description="Grassroots animal advocacy NGO coordinating daily community feeding for 1,200+ street community animals, urban birds, and birds in South Delhi parks.",
        image_url="/images/animal_care/animal_welfare_ngo.jpg",
        verification_status="verified",
        registration_number="DARPAN-DL-2021-00441",
        contact_email="contact@pawsandwings.org.in",
        contact_phone="+919899112233",
        address="A-14 Hauz Khas Social Enclave, Sri Aurobindo Marg",
        city="New Delhi",
        state="Delhi",
        postal_code="110016",
        country="India",
        latitude=28.5494,
        longitude=77.2001,
        capacity_servings_per_day=350,
        accepted_categories=["cooked_meals", "bakery", "packaged_groceries"]
    )
    db.add(welfare_ngo)

    # 6. Livestock Care Centre
    livestock_centre = Organization(
        name="Asha Kiran Rural Livestock & Cattle Sanctuary",
        organization_type="livestock_care_centre",
        recipient_category="animal_care",
        supported_species=["cows", "bulls", "buffaloes", "goats", "sheep"],
        description="Specialized rehabilitation farm for rescued dairy livestock, working draught animals, rescued goats, and sheep. Requires fresh market produce trimmings and green fodder.",
        image_url="/images/animal_care/livestock_care_centre.jpg",
        verification_status="verified",
        registration_number="AWBI-DL-2020-00812",
        contact_email="livestock@ashakiranfarms.org.in",
        contact_phone="+919818884422",
        address="Bhati Mines Road, Chhatarpur Extended Farms",
        city="New Delhi",
        state="Delhi",
        postal_code="110074",
        country="India",
        latitude=28.4891,
        longitude=77.1856,
        capacity_servings_per_day=750,
        accepted_categories=["fresh_produce", "bakery"]
    )
    db.add(livestock_centre)
    await db.flush()

    # Animal Feed Listings
    if provider:
        feed1 = FoodListing(
            provider_id=provider.id,
            organization_id=provider.organization_id,
            title="[Animal Feed] Fresh Cabbage Leaves, Carrot Trimmings & Squash Peels",
            description="100% clean, fresh vegetable trimmings and raw produce peelings directly from hotel kitchen salad prep. Free of plastic, onions, spices, and non-veg. Safe feed for cows, bulls, buffaloes, and goats.",
            category="fresh_produce",
            quantity=85.0,
            remaining_quantity=85.0,
            unit="kg",
            dietary_type="vegan",
            status="available",
            preparation_time=now - timedelta(hours=2),
            pickup_deadline=now + timedelta(hours=8),
            pickup_address="Taj Palace Service Kitchen Dock 2, Diplomatic Enclave, Chanakyapuri",
            latitude=28.5976,
            longitude=77.1741,
            image_url="/images/food/vegetable_peels_fodder.jpg",
            storage_instructions="room_temperature",
            allergens=[],
            priority_score=88.0,
            food_safety_status="untouched",
            target_beneficiary="animal_feed",
            suitable_species=["cows", "bulls", "buffaloes", "goats", "sheep"],
            animal_feed_safety_confirmed=True,
            animal_feed_notes="Raw unseasoned peelings. Checked strictly for absence of plastic wrap, onion, and garlic."
        )
        db.add(feed1)

        feed2 = FoodListing(
            provider_id=provider.id,
            organization_id=provider.organization_id,
            title="[Animal Feed] Plain Steamed Rice, Boiled Lentils & Chappati Mash",
            description="Unseasoned, mild boiled rice and whole wheat chappatis from banquet lunch service. Clean, cooled, and packed in food-grade bins. Excellent energy feed for cattle and shelter dogs.",
            category="cooked_meals",
            quantity=60.0,
            remaining_quantity=60.0,
            unit="kg",
            dietary_type="veg",
            status="available",
            preparation_time=now - timedelta(hours=3),
            pickup_deadline=now + timedelta(hours=6),
            pickup_address="Royal Orchid Banquet Lawn Loading Bay 1, Chattarpur",
            latitude=28.5020,
            longitude=77.1812,
            image_url="/images/food/chappati_mash_feed.jpg",
            storage_instructions="room_temperature",
            allergens=[],
            priority_score=90.0,
            food_safety_status="untouched",
            target_beneficiary="animal_feed",
            suitable_species=["cows", "bulls", "dogs", "birds"],
            animal_feed_safety_confirmed=True,
            animal_feed_notes="No oil, salt or chili added. Cooked plain in bulk commercial vessels."
        )
        db.add(feed2)

        feed3 = FoodListing(
            provider_id=provider.id,
            organization_id=provider.organization_id,
            title="[Animal Feed] Clean Day-Old Bread Crusts, Rolled Grains & Millets",
            description="Dry bakery bread trimmings, cracked wheat, and clean millets from morning baking batches. Stored dry in sanitized burlap sacks. Ideal nutrition for birds, pigeons, cows, and goats.",
            category="bakery",
            quantity=45.0,
            remaining_quantity=45.0,
            unit="kg",
            dietary_type="vegan",
            status="available",
            preparation_time=now - timedelta(hours=4),
            pickup_deadline=now + timedelta(hours=14),
            pickup_address="Haldiram's Sweets & Bakery CP Dispatch Area, Connaught Place",
            latitude=28.6328,
            longitude=77.2197,
            image_url="/images/food/artisan_bread.jpg",
            storage_instructions="room_temperature",
            allergens=[],
            priority_score=78.0,
            food_safety_status="untouched",
            target_beneficiary="animal_feed",
            suitable_species=["birds", "cows", "goats"],
            animal_feed_safety_confirmed=True,
            animal_feed_notes="Dry and crisp, zero moisture contamination, no chocolate or artificial sweeteners."
        )
        db.add(feed3)

    await db.commit()
    logger.info("Animal Care seed data successfully created.")


async def seed_multilocation_food_data(db: AsyncSession):
    """
    Seeds comprehensive multi-location food listings across all 8 Delhi NCR hubs:
    1. Connaught Place (cp)
    2. Chanakyapuri (chanakyapuri)
    3. Khan Market (khan_market)
    4. Hauz Khas (hauz_khas)
    5. Paharganj (paharganj)
    6. Civil Lines (civil_lines)
    7. DLF Cyber City (gurugram)
    8. Sector 18 (noida)

    Ensures at least 3-4 items in EVERY location, and at least 2-3 items in EVERY category:
    - cooked_meals (Dal Makhani, Paneer, Biryani, Chole Bhature, Dosa, etc.)
    - bakery (Tandoori Roti/Naan, Samosas, Artisan Bread)
    - fresh_produce (Vegetable Crates, Fruit Platters)
    - packaged_groceries (Rice, Atta, Lentils)
    - dairy (Gulab Jamun, Paneer, Dahi)
    - animal_feed (Clean Vegetable Peels Fodder, Rice & Chapati Mash, Grains)
    All listings use authentic locally generated photographs in /images/food/.
    """
    check_exist = await db.execute(select(FoodListing).where(FoodListing.title.like("%Royal Lucknowi Vegetable Biryani Deg%")))
    if check_exist.scalars().first():
        logger.info("Multi-location food listings already seeded. Skipping.")
        return

    logger.info("Seeding 32 multi-location food listings across 8 NCR hubs and 6 categories...")
    now = datetime.now(timezone.utc)

    # 1. Fetch or create provider profile
    provider_res = await db.execute(select(Profile).where(Profile.email == "taj.delhi@foodloop.in"))
    provider = provider_res.scalars().first()
    if not provider:
        provider_res = await db.execute(select(Profile).where(Profile.role == "food_provider"))
        provider = provider_res.scalars().first()
    if not provider:
        provider_res = await db.execute(select(Profile).where(Profile.role == "admin"))
        provider = provider_res.scalars().first()

    # 2. Fetch or create partner organizations for each hub
    async def get_or_create_org(name, org_type, address, city, lat, lon):
        res = await db.execute(select(Organization).where(Organization.name == name))
        org = res.scalars().first()
        if not org:
            org = Organization(
                name=name,
                organization_type=org_type,
                verification_status="verified",
                registration_number=f"FSSAI-{abs(hash(name)) % 10000000000}",
                contact_email=f"contact@{name.lower().replace(' ', '')[:12]}.demo",
                contact_phone="+919811002244",
                address=address,
                city=city,
                state="Delhi NCR",
                postal_code="110001",
                country="India",
                latitude=lat,
                longitude=lon,
                capacity_servings_per_day=500,
                accepted_categories=["cooked_meals", "bakery", "fresh_produce", "packaged_groceries", "dairy"]
            )
            db.add(org)
            await db.flush()
        return org

    org_cp = await get_or_create_org("Haldiram's Sweets & Bakery CP", "bakery", "Connaught Place, Inner Circle", "New Delhi", 28.6328, 77.2197)
    org_chanakya = await get_or_create_org("Taj Palace Hotel & Banquets", "hotel", "Diplomatic Enclave, Chanakyapuri", "New Delhi", 28.5976, 77.1741)
    org_khan = await get_or_create_org("GreenField Organic Supermarket", "grocery_store", "Khan Market Sector 4", "New Delhi", 28.5998, 77.2270)
    org_hauz = await get_or_create_org("Social Bistro & Banquets Hauz Khas", "restaurant", "Hauz Khas Village Road", "New Delhi", 28.5494, 77.2001)
    org_pahar = await get_or_create_org("Sita Ram Diwan Chand & Caterers Paharganj", "catering_company", "Main Bazar, Paharganj", "New Delhi", 28.6432, 77.2148)
    org_civil = await get_or_create_org("Maidens Heritage Hotel & Banquets Civil Lines", "hotel", "Sham Nath Marg, Civil Lines", "New Delhi", 28.6811, 77.2228)
    org_gurugram = await get_or_create_org("CyberHub Corporate Dining & Banquets", "corporate_organizer", "DLF Cyber City, Sector 24", "Gurugram", 28.4907, 77.0894)
    org_noida = await get_or_create_org("Radisson Blu Banquets & Kitchens Noida", "hotel", "Sector 18 Market Area", "Noida", 28.5708, 77.3271)

    # 3. Define 32 comprehensive listings (4 in each of 8 locations)
    # Covering cooked_meals, bakery, fresh_produce, packaged_groceries, dairy, animal_feed
    listings_data = [
        # --- HUB 1: Connaught Place (cp) ---
        {
            "org": org_cp,
            "title": "Amritsari Pindi Chole & Fluffy Bhature",
            "desc": "Spiced chickpea curry prepared with authentic anardana and whole spices, served with fresh puffed bhature.",
            "category": "cooked_meals",
            "qty": 45.0,
            "unit": "portions",
            "diet": "veg",
            "dl_hours": 3.0,
            "addr": "Haldiram's Dispatch Bay, Inner Circle, Connaught Place",
            "lat": 28.6328,
            "lon": 77.2197,
            "img": "/images/food/chole_bhature.jpg",
            "storage": "hot_holding",
            "allergens": ["Gluten"],
            "beneficiary": "human"
        },
        {
            "org": org_cp,
            "title": "Crispy Triangle Vegetable Samosas & Mint Chutney",
            "desc": "Freshly fried golden pastry triangles filled with spiced potatoes and green peas, crisp and hot.",
            "category": "bakery",
            "qty": 80.0,
            "unit": "portions",
            "diet": "veg",
            "dl_hours": 5.0,
            "addr": "Haldiram's Bakery Wing, Connaught Place",
            "lat": 28.6330,
            "lon": 77.2200,
            "img": "/images/food/samosas.jpg",
            "storage": "room_temperature",
            "allergens": ["Gluten"],
            "beneficiary": "human"
        },
        {
            "org": org_cp,
            "title": "Shahi Gulab Jamun Banquet Trays",
            "desc": "Soft milk-solid dumplings soaked in aromatic rose and cardamom sugar syrup, garnished with pistachios.",
            "category": "dairy",
            "qty": 60.0,
            "unit": "portions",
            "diet": "veg",
            "dl_hours": 12.0,
            "addr": "Haldiram's Confectionery, Connaught Place",
            "lat": 28.6325,
            "lon": 77.2195,
            "img": "/images/food/gulab_jamun.jpg",
            "storage": "room_temperature",
            "allergens": ["Dairy", "Nuts"],
            "beneficiary": "human"
        },
        {
            "org": org_cp,
            "title": "Nutritious Homestyle Moong Dal Khichdi",
            "desc": "Light, wholesome yellow moong lentils and rice porridge tempered with cumin and desi ghee.",
            "category": "cooked_meals",
            "qty": 50.0,
            "unit": "portions",
            "diet": "veg",
            "dl_hours": 2.5,
            "addr": "Haldiram's Central Kitchen Door 2, CP",
            "lat": 28.6322,
            "lon": 77.2190,
            "img": "/images/food/vegetable_khichdi.jpg",
            "storage": "hot_holding",
            "allergens": ["Dairy"],
            "beneficiary": "human"
        },

        # --- HUB 2: Chanakyapuri (chanakyapuri) ---
        {
            "org": org_chanakya,
            "title": "Royal Dum Dal Makhani & Saffron Butter Naan",
            "desc": "Slow-simmered black urad lentils infused with rich cream and butter, paired with tandoori naans.",
            "category": "cooked_meals",
            "qty": 35.0,
            "unit": "kg",
            "diet": "veg",
            "dl_hours": 4.0,
            "addr": "Taj Palace Banquets Gate 2, Diplomatic Enclave, Chanakyapuri",
            "lat": 28.5976,
            "lon": 77.1741,
            "img": "/images/food/dal_makhani.jpg",
            "storage": "hot_holding",
            "allergens": ["Dairy", "Gluten"],
            "beneficiary": "human"
        },
        {
            "org": org_chanakya,
            "title": "Handcrafted Tandoori Roti & Garlic Naan Basket",
            "desc": "Freshly pulled clay-oven whole wheat rotis and charred garlic naans, packed in thermal baskets.",
            "category": "bakery",
            "qty": 50.0,
            "unit": "portions",
            "diet": "veg",
            "dl_hours": 4.5,
            "addr": "Taj Pastry & Tandoor Kitchen Door 3, Chanakyapuri",
            "lat": 28.5980,
            "lon": 77.1745,
            "img": "/images/food/tandoori_roti_naan.jpg",
            "storage": "room_temperature",
            "allergens": ["Gluten"],
            "beneficiary": "human"
        },
        {
            "org": org_chanakya,
            "title": "Royal Paneer Butter Masala & Jeera Rice",
            "desc": "Tender cottage cheese cubes in silky velvet tomato cashew gravy, alongside cumin-scented basmati rice.",
            "category": "cooked_meals",
            "qty": 30.0,
            "unit": "kg",
            "diet": "veg",
            "dl_hours": 3.5,
            "addr": "Taj Palace Loading Bay 1, Chanakyapuri",
            "lat": 28.5972,
            "lon": 77.1738,
            "img": "/images/food/paneer_butter_masala.jpg",
            "storage": "hot_holding",
            "allergens": ["Dairy", "Nuts"],
            "beneficiary": "human"
        },
        {
            "org": org_chanakya,
            "title": "Artisan French Baguettes & Sourdough Loaves",
            "desc": "Crusty European artisanal loaves baked fresh with natural wild yeast starter. Ideal for breakfast relief.",
            "category": "bakery",
            "qty": 40.0,
            "unit": "packets",
            "diet": "vegan",
            "dl_hours": 10.0,
            "addr": "Taj Bakery Section Gate 4, Chanakyapuri",
            "lat": 28.5978,
            "lon": 77.1748,
            "img": "/images/food/artisan_bread.jpg",
            "storage": "room_temperature",
            "allergens": ["Gluten"],
            "beneficiary": "human"
        },

        # --- HUB 3: Khan Market (khan_market) ---
        {
            "org": org_khan,
            "title": "Farm Fresh Organic Vegetable Crate",
            "desc": "Crisp red bell peppers, vine tomatoes, english cucumbers, and hydroponic greens from morning farm harvest.",
            "category": "fresh_produce",
            "qty": 60.0,
            "unit": "kg",
            "diet": "vegan",
            "dl_hours": 16.0,
            "addr": "GreenField Loading Dock, Khan Market Sector 4",
            "lat": 28.5998,
            "lon": 77.2270,
            "img": "/images/food/fresh_produce_basket.jpg",
            "storage": "refrigerated",
            "allergens": [],
            "beneficiary": "human"
        },
        {
            "org": org_khan,
            "title": "Chilled Seasonal Tropical Fruit Platter",
            "desc": "Freshly sliced sweet papaya, pineapple chunks, muskmelon, and watermelon on catering ice trays.",
            "category": "fresh_produce",
            "qty": 40.0,
            "unit": "kg",
            "diet": "vegan",
            "dl_hours": 5.0,
            "addr": "GreenField Gourmet Fresh Kitchen, Khan Market",
            "lat": 28.6002,
            "lon": 77.2275,
            "img": "/images/food/fruit_platter.jpg",
            "storage": "refrigerated",
            "allergens": [],
            "beneficiary": "human"
        },
        {
            "org": org_khan,
            "title": "Unpolished Brown Basmati Rice & Moong Lentils",
            "desc": "Surplus pantry crates of premium long-grain rice and whole washed moong pulses, vacuum sealed.",
            "category": "packaged_groceries",
            "qty": 75.0,
            "unit": "kg",
            "diet": "vegan",
            "dl_hours": 24.0,
            "addr": "GreenField Storage Annex, Khan Market",
            "lat": 28.5995,
            "lon": 77.2265,
            "img": "/images/food/artisan_bread.jpg",
            "storage": "room_temperature",
            "allergens": [],
            "beneficiary": "human"
        },
        {
            "org": org_khan,
            "title": "Rich Kadai Paneer with Roasted Bell Peppers",
            "desc": "Fresh paneer cubes tossed in crushed coriander and dry red chili kadai masala with crunchy peppers.",
            "category": "cooked_meals",
            "qty": 25.0,
            "unit": "kg",
            "diet": "veg",
            "dl_hours": 3.0,
            "addr": "Khan Market Gourmet Delivery Point, New Delhi",
            "lat": 28.6000,
            "lon": 77.2280,
            "img": "/images/food/kadai_paneer.jpg",
            "storage": "hot_holding",
            "allergens": ["Dairy"],
            "beneficiary": "human"
        },

        # --- HUB 4: Hauz Khas (hauz_khas) ---
        {
            "org": org_hauz,
            "title": "Hyderabadi Subz Dum Biryani Handi",
            "desc": "Fragrant basmati rice cooked on dum with caramelized onions, fresh garden vegetables, mint, and saffron.",
            "category": "cooked_meals",
            "qty": 45.0,
            "unit": "kg",
            "diet": "veg",
            "dl_hours": 4.0,
            "addr": "Social Banquets Dispatch, Hauz Khas Village Entrance",
            "lat": 28.5494,
            "lon": 77.2001,
            "img": "/images/food/vegetable_biryani.jpg",
            "storage": "hot_holding",
            "allergens": ["Dairy"],
            "beneficiary": "human"
        },
        {
            "org": org_hauz,
            "title": "[Animal Feed] Steamed Rice & Chapati Mash for Shelters",
            "desc": "Plain boiled white rice and crumbled whole wheat chapatis without oil, spices, or salt. Species-safe for dogs & birds.",
            "category": "cooked_meals",
            "qty": 55.0,
            "unit": "kg",
            "diet": "veg",
            "dl_hours": 6.0,
            "addr": "Social Rear Kitchen Exit, Sri Aurobindo Marg, Hauz Khas",
            "lat": 28.5490,
            "lon": 77.1995,
            "img": "/images/food/chappati_mash_feed.jpg",
            "storage": "room_temperature",
            "allergens": [],
            "beneficiary": "animal_feed",
            "suitable_species": ["dogs", "cats", "birds"]
        },
        {
            "org": org_hauz,
            "title": "Mumbai Chowpatty Butter Pav Bhaji",
            "desc": "Mashed spiced potato-cauliflower bhaji topped with fresh coriander and lime, served with buttery toasted pavs.",
            "category": "cooked_meals",
            "qty": 40.0,
            "unit": "portions",
            "diet": "veg",
            "dl_hours": 3.0,
            "addr": "Hauz Khas Social Center Dock, New Delhi",
            "lat": 28.5500,
            "lon": 77.2005,
            "img": "/images/food/pav_bhaji.jpg",
            "storage": "hot_holding",
            "allergens": ["Dairy", "Gluten"],
            "beneficiary": "human"
        },
        {
            "org": org_hauz,
            "title": "Fresh Malai Paneer & Sweetened Dahi Curd",
            "desc": "Vacuum-sealed farm milk paneer blocks and fresh sweetened probiotic curd containers from dairy banquet.",
            "category": "dairy",
            "qty": 30.0,
            "unit": "kg",
            "diet": "veg",
            "dl_hours": 8.0,
            "addr": "Green Park Dairy Depot near Hauz Khas, New Delhi",
            "lat": 28.5488,
            "lon": 77.2010,
            "img": "/images/food/gulab_jamun.jpg",
            "storage": "refrigerated",
            "allergens": ["Dairy"],
            "beneficiary": "human"
        },

        # --- HUB 5: Paharganj (paharganj) ---
        {
            "org": org_pahar,
            "title": "Kashmiri Rajma & Steamed Basmati Rice Bowls",
            "desc": "Slow-braised red kidney beans in thick ginger-garlic-tomato gravy served over steaming long-grain rice.",
            "category": "cooked_meals",
            "qty": 50.0,
            "unit": "portions",
            "diet": "veg",
            "dl_hours": 3.5,
            "addr": "Sita Ram Kitchen Gate, Main Bazar, Paharganj",
            "lat": 28.6432,
            "lon": 77.2148,
            "img": "/images/food/rajma_chawal.jpg",
            "storage": "hot_holding",
            "allergens": [],
            "beneficiary": "human"
        },
        {
            "org": org_pahar,
            "title": "Yellow Toor Dal Tadka with Desi Ghee",
            "desc": "Wholesome yellow split pigeon pea lentils tempered with cumin seeds, garlic, and dried red chilies.",
            "category": "cooked_meals",
            "qty": 35.0,
            "unit": "kg",
            "diet": "veg",
            "dl_hours": 3.0,
            "addr": "Paharganj Community Dining Hub, New Delhi",
            "lat": 28.6435,
            "lon": 77.2152,
            "img": "/images/food/dal_tadka.jpg",
            "storage": "hot_holding",
            "allergens": ["Dairy"],
            "beneficiary": "human"
        },
        {
            "org": org_pahar,
            "title": "[Animal Feed] Clean Raw Cabbage Leaves & Carrot Peelings",
            "desc": "Fresh raw kitchen vegetable cuttings from morning prep. Free of packaging, onions, and oil. For Gaushalas and goats.",
            "category": "fresh_produce",
            "qty": 70.0,
            "unit": "kg",
            "diet": "vegan",
            "dl_hours": 10.0,
            "addr": "Paharganj Wholesale Market Kitchen Gate, New Delhi",
            "lat": 28.6428,
            "lon": 77.2140,
            "img": "/images/food/vegetable_peels_fodder.jpg",
            "storage": "room_temperature",
            "allergens": [],
            "beneficiary": "animal_feed",
            "suitable_species": ["cows", "bulls", "goats"]
        },
        {
            "org": org_pahar,
            "title": "Fresh Baked Whole Wheat Pav & Dinner Buns",
            "desc": "Soft, golden brown bread rolls and dinner pavs baked in morning batch. Sealed in clean kraft crates.",
            "category": "bakery",
            "qty": 60.0,
            "unit": "packets",
            "diet": "veg",
            "dl_hours": 8.0,
            "addr": "Station Road Bakery Counter, Paharganj",
            "lat": 28.6440,
            "lon": 77.2155,
            "img": "/images/food/artisan_bread.jpg",
            "storage": "room_temperature",
            "allergens": ["Gluten"],
            "beneficiary": "human"
        },

        # --- HUB 6: Civil Lines (civil_lines) ---
        {
            "org": org_civil,
            "title": "Velvety Palak Paneer with Tandoori Rotis",
            "desc": "Creamed spinach gravy infused with kasuri methi and tender paneer, paired with wholesome tandoor rotis.",
            "category": "cooked_meals",
            "qty": 30.0,
            "unit": "kg",
            "diet": "veg",
            "dl_hours": 3.5,
            "addr": "Maidens Hotel Banquet Kitchen 2, Sham Nath Marg, Civil Lines",
            "lat": 28.6811,
            "lon": 77.2228,
            "img": "/images/food/palak_paneer.jpg",
            "storage": "hot_holding",
            "allergens": ["Dairy", "Gluten"],
            "beneficiary": "human"
        },
        {
            "org": org_civil,
            "title": "Crispy South Indian Masala Dosa with Sambar",
            "desc": "Golden fermented rice-lentil dosas filled with turmeric spiced potatoes, accompanied by hot vegetable sambar.",
            "category": "cooked_meals",
            "qty": 45.0,
            "unit": "portions",
            "diet": "veg",
            "dl_hours": 2.0,
            "addr": "Civil Lines North Campus Food Hub, New Delhi",
            "lat": 28.6815,
            "lon": 77.2232,
            "img": "/images/food/masala_dosa.jpg",
            "storage": "hot_holding",
            "allergens": ["Mustard"],
            "beneficiary": "human"
        },
        {
            "org": org_civil,
            "title": "Steamed Soft Idlis with Hot Vegetable Sambhar",
            "desc": "Fluffy steamed rice-urad dal cakes served with freshly ground coconut chutney and piping hot lentil stew.",
            "category": "cooked_meals",
            "qty": 60.0,
            "unit": "portions",
            "diet": "veg",
            "dl_hours": 2.5,
            "addr": "Civil Lines Heritage Kitchen Dock, New Delhi",
            "lat": 28.6808,
            "lon": 77.2220,
            "img": "/images/food/idli_sambhar.jpg",
            "storage": "hot_holding",
            "allergens": ["Mustard"],
            "beneficiary": "human"
        },
        {
            "org": org_civil,
            "title": "Farm Assorted Greens & Salad Basket",
            "desc": "Crisp romaine lettuce, iceberg leaves, shredded carrots, and cherry tomatoes in sanitized catering tubs.",
            "category": "fresh_produce",
            "qty": 35.0,
            "unit": "kg",
            "diet": "vegan",
            "dl_hours": 14.0,
            "addr": "North Delhi Organic Pantry, Civil Lines",
            "lat": 28.6820,
            "lon": 77.2235,
            "img": "/images/food/fresh_produce_basket.jpg",
            "storage": "refrigerated",
            "allergens": [],
            "beneficiary": "human"
        },

        # --- HUB 7: DLF Cyber City / Gurugram (gurugram) ---
        {
            "org": org_gurugram,
            "title": "Corporate Feast: Kadai Paneer & Butter Naan",
            "desc": "Spicy tomato-bell pepper curry with fresh cottage cheese cubes, served with warm layered butter naans.",
            "category": "cooked_meals",
            "qty": 40.0,
            "unit": "kg",
            "diet": "veg",
            "dl_hours": 3.0,
            "addr": "CyberHub Food Pavilion Loading Bay 3, DLF Phase 2, Gurugram",
            "lat": 28.4907,
            "lon": 77.0894,
            "img": "/images/food/kadai_paneer.jpg",
            "storage": "hot_holding",
            "allergens": ["Dairy", "Gluten"],
            "beneficiary": "human"
        },
        {
            "org": org_gurugram,
            "title": "Executive Luncheon: Dal Makhani & Jeera Rice",
            "desc": "Velvety slow-cooked black dal makhani with cumin-scented basmati rice, prepared for corporate event lunch.",
            "category": "cooked_meals",
            "qty": 35.0,
            "unit": "kg",
            "diet": "veg",
            "dl_hours": 4.0,
            "addr": "DLF Cyber City Building 10 Kitchen, Gurugram",
            "lat": 28.4912,
            "lon": 77.0900,
            "img": "/images/food/dal_makhani.jpg",
            "storage": "hot_holding",
            "allergens": ["Dairy"],
            "beneficiary": "human"
        },
        {
            "org": org_gurugram,
            "title": "Breakfast Surplus: Steamed Idli & Medu Vada Combo",
            "desc": "South Indian steamed idlis and golden crisp lentil vadas with tangy sambar and fresh coconut dip.",
            "category": "cooked_meals",
            "qty": 55.0,
            "unit": "portions",
            "diet": "veg",
            "dl_hours": 2.5,
            "addr": "Cyber City Metro Food Walk Hub, Gurugram",
            "lat": 28.4902,
            "lon": 77.0888,
            "img": "/images/food/idli_sambhar.jpg",
            "storage": "hot_holding",
            "allergens": ["Mustard"],
            "beneficiary": "human"
        },
        {
            "org": org_gurugram,
            "title": "Whole Grain Atta Flour & Lentil Packets",
            "desc": "Sealed commercial sacks of whole wheat flour (atta), chana dal, and masoor lentils from corporate pantry audit.",
            "category": "packaged_groceries",
            "qty": 80.0,
            "unit": "kg",
            "diet": "vegan",
            "dl_hours": 24.0,
            "addr": "DLF Phase 2 Grocery Distribution Bay, Gurugram",
            "lat": 28.4918,
            "lon": 77.0905,
            "img": "/images/food/artisan_bread.jpg",
            "storage": "room_temperature",
            "allergens": ["Gluten"],
            "beneficiary": "human"
        },

        # --- HUB 8: Sector 18 / Noida (noida) ---
        {
            "org": org_noida,
            "title": "Royal Lucknowi Vegetable Biryani Deg",
            "desc": "Aromatic basmati rice cooked with saffron milk, royal spices, and golden vegetables in sealed brass handis.",
            "category": "cooked_meals",
            "qty": 45.0,
            "unit": "kg",
            "diet": "veg",
            "dl_hours": 3.5,
            "addr": "Radisson Blu Banquets Dispatch, Sector 18, Noida",
            "lat": 28.5708,
            "lon": 77.3271,
            "img": "/images/food/vegetable_biryani.jpg",
            "storage": "hot_holding",
            "allergens": ["Dairy"],
            "beneficiary": "human"
        },
        {
            "org": org_noida,
            "title": "Delhi Street Style Pav Bhaji Tray",
            "desc": "Rich, buttery mixed vegetable bhaji with golden grilled pav buns, freshly packed for immediate community distribution.",
            "category": "cooked_meals",
            "qty": 50.0,
            "unit": "portions",
            "diet": "veg",
            "dl_hours": 3.0,
            "addr": "Sector 18 Commercial Center Gate 2, Noida",
            "lat": 28.5714,
            "lon": 77.3278,
            "img": "/images/food/pav_bhaji.jpg",
            "storage": "hot_holding",
            "allergens": ["Dairy", "Gluten"],
            "beneficiary": "human"
        },
        {
            "org": org_noida,
            "title": "Fresh Cut Fruit Medley Salad Banquet Tray",
            "desc": "Crisp seasonal Indian fruits (papaya, pineapple, watermelon, melon) chilled and prepped hygienically.",
            "category": "fresh_produce",
            "qty": 35.0,
            "unit": "kg",
            "diet": "vegan",
            "dl_hours": 4.5,
            "addr": "Radisson Kitchen Service Dock, Noida Sector 18",
            "lat": 28.5702,
            "lon": 77.3265,
            "img": "/images/food/fruit_platter.jpg",
            "storage": "refrigerated",
            "allergens": [],
            "beneficiary": "human"
        },
        {
            "org": org_noida,
            "title": "[Animal Feed] Gaushala Cattle Feed: Raw Vegetable Peelings & Squash Greens",
            "desc": "100% clean, raw, unseasoned vegetable trimmings, pumpkin peels, and cauliflower greens. Free of plastic, onion, and spices.",
            "category": "animal_feed",
            "qty": 80.0,
            "unit": "kg",
            "diet": "vegan",
            "dl_hours": 8.0,
            "addr": "Noida Sector 18 Loading Gate 4, Noida",
            "lat": 28.5695,
            "lon": 77.3260,
            "img": "/images/food/vegetable_peels_fodder.jpg",
            "storage": "room_temperature",
            "allergens": [],
            "beneficiary": "animal_feed",
            "suitable_species": ["cows", "bulls", "buffaloes", "goats"]
        }
    ]

    for item in listings_data:
        dl = now + timedelta(hours=item["dl_hours"])
        score = priority_service.calculate_priority_score(
            dl, item["category"], float(item["qty"]), item["unit"], item["storage"]
        )
        listing = FoodListing(
            provider_id=provider.id,
            organization_id=item["org"].id,
            title=item["title"],
            description=item["desc"],
            category=item["category"],
            quantity=float(item["qty"]),
            remaining_quantity=float(item["qty"]),
            unit=item["unit"],
            dietary_type=item["diet"],
            status="available",
            preparation_time=now - timedelta(hours=1, minutes=30),
            pickup_deadline=dl,
            pickup_address=item["addr"],
            latitude=item["lat"],
            longitude=item["lon"],
            image_url=item["img"],
            storage_instructions=item["storage"],
            allergens=item["allergens"],
            priority_score=score,
            food_safety_status="untouched",
            target_beneficiary=item.get("beneficiary", "human"),
            suitable_species=item.get("suitable_species", []),
            animal_feed_safety_confirmed=True if item.get("beneficiary") == "animal_feed" else False,
            animal_feed_notes="Clean, species-appropriate feed verified by provider." if item.get("beneficiary") == "animal_feed" else None
        )
        db.add(listing)

    await db.commit()
    logger.info("Successfully seeded 32 multi-location food listings across 8 Delhi NCR hubs!")
