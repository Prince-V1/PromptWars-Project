import pytest


@pytest.mark.asyncio
async def test_ai_food_analysis_safety_disclaimer(client):
    """Rule 17 & Section 8A: AI must never certify food safety independently and must include disclaimer."""
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "taj.delhi@foodloop.in",
        "password": "Provider@1234"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "additional_context": "Freshly cooked vegetable biryani in 5kg food warmers",
        "mime_type": "image/jpeg"
    }
    resp = await client.post("/api/v1/ai/analyze-food", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "suggested_title" in data
    assert data["requires_human_verification"] is True
    assert "NEVER certifies food safety" in data["safety_disclaimer"]


@pytest.mark.asyncio
async def test_ai_generate_description(client):
    """Test AI listing assistant with provider facts."""
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "taj.delhi@foodloop.in",
        "password": "Provider@1234"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "title": "Fresh Paneer Lababdar",
        "category": "cooked_meals",
        "quantity": 15.0,
        "unit": "kg",
        "dietary_type": "veg",
        "storage_condition": "hot_holding",
        "preparation_notes": "Prepared at 11 AM under ISO kitchen standards",
        "known_allergens": ["Dairy"]
    }
    resp = await client.post("/api/v1/ai/generate-description", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "generated_description" in data
    assert "Paneer" in data["generated_description"]


@pytest.mark.asyncio
async def test_ai_smart_ngo_matching(client):
    """Test intelligent deterministic NGO matching engine."""
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "taj.delhi@foodloop.in",
        "password": "Provider@1234"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get a listing id
    listings = (await client.get("/api/v1/food")).json()
    listing_id = listings[0]["id"]

    resp = await client.post("/api/v1/ai/match-recipients", json={"listing_id": listing_id}, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) > 0
    top = data["recommendations"][0]
    assert "match_score" in top
    assert top["match_score"] > 0
    assert "matching_factors" in top
    assert "distance_km" in top["matching_factors"]


@pytest.mark.asyncio
async def test_admin_verification_workflow(client):
    """Test admin verification approval flow."""
    # 1. Login as Admin
    admin_login = await client.post("/api/v1/auth/login", json={
        "email": "admin@foodloop.in",
        "password": "Admin@FoodLoop2026"
    })
    token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. List verifications
    veris_resp = await client.get("/api/v1/admin/verifications", headers=headers)
    assert veris_resp.status_code == 200
    veris = veris_resp.json()
    assert len(veris) > 0
    pending_id = veris[0]["id"]

    # 3. Approve verification
    approve_resp = await client.post(f"/api/v1/admin/verifications/{pending_id}/approve", headers=headers)
    assert approve_resp.status_code == 200
    assert approve_resp.json()["status"] == "approved"
