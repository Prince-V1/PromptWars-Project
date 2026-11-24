import pytest


@pytest.mark.asyncio
async def test_public_cannot_register_as_admin(client):
    """Rule 6 & Section 6: A user must never be able to grant themselves admin role."""
    payload = {
        "email": "hacker@test.com",
        "password": "Password123!",
        "full_name": "Bad Actor",
        "role": "admin"  # Forbidden role for public registration
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 400
    data = resp.json()
    assert "Invalid role" in data["error"]["message"]


@pytest.mark.asyncio
async def test_valid_provider_registration_and_login(client):
    """Test standard food provider registration, token issuance, and login."""
    reg_payload = {
        "email": "chef.rohit@bakerydelhi.com",
        "password": "SecurePassword123!",
        "full_name": "Rohit Kumar",
        "phone_number": "+919876543219",
        "role": "food_provider",
        "organization_name": "Rohit Artisanal Bakery",
        "organization_type": "bakery",
        "address": "Defence Colony, New Delhi",
        "registration_number": "FSSAI-12345678901234"
    }
    resp = await client.post("/api/v1/auth/register", json=reg_payload)
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["role"] == "food_provider"
    assert data["email"] == "chef.rohit@bakerydelhi.com"

    # Login
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "chef.rohit@bakerydelhi.com",
        "password": "SecurePassword123!"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "access_token" in login_data


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected(client):
    """Unauthenticated requests to protected endpoints must be rejected with 401."""
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401
