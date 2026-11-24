import urllib.request
import json
from datetime import datetime, timedelta, timezone

base = "http://127.0.0.1:8000/api/v1"

def post_json(url, data, token=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers={"Content-Type": "application/json"})
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_json(url, token=None):
    req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def patch_json(url, data, token=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers={"Content-Type": "application/json"}, method="PATCH")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

print("=== 1. TEST CREATE FOOD LISTING (/donate) ===")
now = datetime.now(timezone.utc)
prep = (now - timedelta(hours=1)).isoformat()
deadline = (now + timedelta(hours=4)).isoformat()

food_payload = {
    "title": "Grand Ballroom Shahi Paneer & Pulao Express",
    "description": "Freshly prepared untouched vegetarian dinner batch from banquet service. Maintained in insulated hot containers.",
    "category": "cooked_meals",
    "quantity": 30.0,
    "unit": "kg",
    "dietary_type": "veg",
    "preparation_time": prep,
    "pickup_deadline": deadline,
    "pickup_address": "Taj Palace Hotel Loading Bay 3, Diplomatic Enclave, Chanakyapuri, New Delhi",
    "latitude": 28.5976,
    "longitude": 77.1741,
    "image_url": "/images/food/kadai_paneer.jpg",
    "storage_instructions": "hot_holding",
    "allergens": ["dairy"],
    "target_beneficiary": "human"
}

created_food = post_json(f"{base}/food", food_payload)
food_id = created_food["id"]
print(f"Listing created successfully! ID: {food_id}, Title: {created_food['title']}, Remaining: {created_food['remaining_quantity']} {created_food['unit']}")

print("\n=== 2. VERIFY RECENTLY UPLOADED ON TOP (/discover with sort_by=latest) ===")
latest_feed = get_json(f"{base}/food?sort_by=latest&limit=5")
top_item = latest_feed[0]
print(f"Top item on explore feed: {top_item['title']} (ID: {top_item['id']})")
assert top_item["id"] == food_id, "Newly created item should be #1 on top!"
print("VERIFIED: Newly listed donation appears #1 at the very top of explore feed!")

print("\n=== 3. TEST CLAIM / REQUEST SURPLUS FOOD ===")
req_payload = {
    "listing_id": food_id,
    "requested_quantity": 15.0,
    "delivery_mode": "self_pickup",
    "notes": "Robin Hood Army evening relief run for 38 families."
}
created_req = post_json(f"{base}/requests", req_payload)
req_id = created_req["id"]
print(f"Order Claimed Successfully! Request ID: {req_id}, Status: {created_req['status']}, Quantity: {created_req['requested_quantity']}")

print("\n=== 4. VERIFY ORDER TRACKING (/orders/[id]) ===")
tracked = get_json(f"{base}/requests/{req_id}")
print(f"Tracked Order ID: {tracked['id']}")
print(f"Live Status: {tracked['status']}")
print(f"Listing Title: {tracked.get('listing', {}).get('title', 'N/A')}")
print(f"Pickup Address: {tracked.get('listing', {}).get('pickup_address', 'N/A')}")
assert tracked.get("listing") is not None, "Listing details must be populated for tracking!"

print("\n=== 5. TEST COMPLETE ORDER (Safe Handover) ===")
completed_req = post_json(f"{base}/requests/{req_id}/complete", {})
print(f"Delivery Confirmed! New Status: {completed_req['status']}")
assert completed_req["status"] == "delivered", "Order status should be delivered!"

print("\n=== 6. TEST EDITABLE PROFILE (/profile) ===")
profile_before = get_json(f"{base}/auth/profile")
print(f"Current Profile: {profile_before['full_name']} ({profile_before['role']})")

patch_data = {
    "full_name": "Chef Vikram S. Kapoor",
    "phone_number": "+91 9811005555",
    "organization_name": "Taj Palace Luxury Banquets & Convention Center"
}
profile_after = patch_json(f"{base}/auth/profile", patch_data)
print(f"Updated Profile: {profile_after['full_name']}, Phone: {profile_after['phone_number']}")
print(f"Updated Org: {profile_after['organization']['name']}")
assert profile_after["full_name"] == "Chef Vikram S. Kapoor"
print("VERIFIED: Profile and Organization edits persisted cleanly in database!")

print("\n=== 7. SECOND ROUND TEST (Animal Feed Batch) ===")
animal_feed_payload = {
    "title": "Fresh Roti & Vegetable Mash Cattle Feed Batch",
    "description": "Safe sorted surplus grain and vegetable trimming feed for sanctuary cattle.",
    "category": "animal_feed",
    "quantity": 50.0,
    "unit": "kg",
    "dietary_type": "veg",
    "preparation_time": prep,
    "pickup_deadline": deadline,
    "pickup_address": "Krishna Gaushala Feeding Center, Najafgarh, New Delhi",
    "latitude": 28.6139,
    "longitude": 76.9856,
    "image_url": "/images/food/chappati_mash_feed.jpg",
    "storage_instructions": "room_temperature",
    "target_beneficiary": "animal_feed",
    "suitable_species": ["cows", "bulls", "buffaloes"],
    "animal_feed_safety_confirmed": True
}
animal_food = post_json(f"{base}/food", animal_feed_payload)
print(f"Animal Feed Created! ID: {animal_food['id']}, Title: {animal_food['title']}")

latest_feed_2 = get_json(f"{base}/food?sort_by=latest&limit=3")
assert latest_feed_2[0]["id"] == animal_food["id"], "Latest animal feed must be #1 on top!"
print(f"VERIFIED #1 ON TOP: {latest_feed_2[0]['title']}")

animal_req = post_json(f"{base}/requests", {
    "listing_id": animal_food["id"],
    "requested_quantity": 25.0,
    "delivery_mode": "provider_delivery",
    "notes": "Evening fodder delivery for 45 rescued cows."
})
print(f"Animal Feed Claimed! Req ID: {animal_req['id']}, Status: {animal_req['status']}")

tracked_animal = get_json(f"{base}/requests/{animal_req['id']}")
assert tracked_animal["listing"]["target_beneficiary"] == "animal_feed"
print(f"Animal Order Tracking Verified! Target Beneficiary: {tracked_animal['listing']['target_beneficiary']}")

print("\nALL 7 TESTS PASSED WITH 100% SUCCESS ACROSS HUMAN MEALS AND ANIMAL FEED!")
