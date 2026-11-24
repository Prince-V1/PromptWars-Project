from datetime import datetime, timezone, timedelta
import pytest


@pytest.mark.asyncio
async def test_browse_food_listings(client):
    """Test public/recipient browsing and filtering of available food listings."""
    resp = await client.get("/api/v1/food?status=available")
    assert resp.status_code == 200
    items = resp.json()
    assert isinstance(items, list)
    assert len(items) >= 2


@pytest.mark.asyncio
async def test_create_listing_validation(client):
    """Ensure invalid past deadlines are strictly rejected."""
    # Login as seeded provider
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "taj.delhi@foodloop.in",
        "password": "Provider@1234"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt past deadline
    past_time = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    prep_time = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    invalid_payload = {
        "title": "Invalid Past Food",
        "description": "Should fail because deadline is in the past.",
        "category": "cooked_meals",
        "quantity": 10.0,
        "unit": "kg",
        "dietary_type": "veg",
        "preparation_time": prep_time,
        "pickup_deadline": past_time,
        "pickup_address": "Chanakyapuri, New Delhi",
        "latitude": 28.59,
        "longitude": 77.17,
        "storage_instructions": "hot_holding"
    }
    resp = await client.post("/api/v1/food", json=invalid_payload, headers=headers)
    assert resp.status_code == 400
    assert "Pickup deadline must be in the future" in resp.json()["error"]["message"]


@pytest.mark.asyncio
async def test_atomic_donation_request_and_oversubscription(client):
    """Recipients cannot oversubscribe beyond remaining quantity."""
    # 1. Login as Recipient
    recip_login = await client.post("/api/v1/auth/login", json={
        "email": "robinhood.delhi@foodloop.in",
        "password": "Recipient@1234"
    })
    recip_token = recip_login.json()["access_token"]
    recip_headers = {"Authorization": f"Bearer {recip_token}"}

    # 2. Get available listing
    listings = (await client.get("/api/v1/food?status=available")).json()
    target_listing = listings[0]
    listing_id = target_listing["id"]
    available_qty = target_listing["remaining_quantity"]

    # 3. Request exceeding quantity must fail
    excessive_qty = available_qty + 500.0
    fail_resp = await client.post("/api/v1/requests", json={
        "listing_id": listing_id,
        "requested_quantity": excessive_qty,
        "delivery_mode": "self_pickup"
    }, headers=recip_headers)
    assert fail_resp.status_code in [400, 409]

    # 4. Valid request
    valid_qty = min(5.0, available_qty)
    req_resp = await client.post("/api/v1/requests", json={
        "listing_id": listing_id,
        "requested_quantity": valid_qty,
        "notes": "Urgent redistribution for children shelter",
        "delivery_mode": "self_pickup"
    }, headers=recip_headers)
    assert req_resp.status_code == 201
    req_data = req_resp.json()
    assert req_data["status"] == "requested"
    assert req_data["requested_quantity"] == valid_qty


@pytest.mark.asyncio
async def test_full_request_lifecycle_and_impact(client):
    """Test full cycle: Request -> Accept -> Delivery -> Impact Record."""
    # 1. Login as Provider
    prov_login = await client.post("/api/v1/auth/login", json={
        "email": "taj.delhi@foodloop.in",
        "password": "Provider@1234"
    })
    prov_token = prov_login.json()["access_token"]
    prov_headers = {"Authorization": f"Bearer {prov_token}"}

    # 2. Create fresh listing
    now = datetime.now(timezone.utc)
    create_payload = {
        "title": "Fresh Dal & Rice Batch",
        "description": "Midday batch packaged in food-grade insulated containers.",
        "category": "cooked_meals",
        "quantity": 20.0,
        "unit": "kg",
        "dietary_type": "veg",
        "preparation_time": (now - timedelta(minutes=30)).isoformat(),
        "pickup_deadline": (now + timedelta(hours=4)).isoformat(),
        "pickup_address": "Taj Banquet Gate 2, Delhi",
        "latitude": 28.59,
        "longitude": 77.17,
        "storage_instructions": "hot_holding"
    }
    listing_resp = await client.post("/api/v1/food", json=create_payload, headers=prov_headers)
    assert listing_resp.status_code == 201
    listing_id = listing_resp.json()["id"]

    # 3. Recipient requests 20 kg
    recip_login = await client.post("/api/v1/auth/login", json={
        "email": "robinhood.delhi@foodloop.in",
        "password": "Recipient@1234"
    })
    recip_token = recip_login.json()["access_token"]
    recip_headers = {"Authorization": f"Bearer {recip_token}"}

    req_resp = await client.post("/api/v1/requests", json={
        "listing_id": listing_id,
        "requested_quantity": 20.0,
        "delivery_mode": "self_pickup"
    }, headers=recip_headers)
    assert req_resp.status_code == 201
    req_id = req_resp.json()["id"]

    # 4. Provider accepts
    accept_resp = await client.post(f"/api/v1/requests/{req_id}/accept", headers=prov_headers)
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "accepted"

    # 5. Confirm delivery
    complete_resp = await client.post(f"/api/v1/requests/{req_id}/complete", headers=prov_headers)
    assert complete_resp.status_code == 200
    assert complete_resp.json()["status"] == "delivered"

    # 6. Verify impact dashboard reflects the 20 kg (= 50 meals)
    impact_resp = await client.get("/api/v1/dashboard/impact")
    assert impact_resp.status_code == 200
    impact_data = impact_resp.json()
    assert impact_data["total_estimated_meals"] >= 50
    assert impact_data["total_kg_redistributed"] >= 20.0
