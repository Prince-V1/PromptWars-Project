from datetime import datetime, timezone
import logging

logger = logging.getLogger("foodloop.priority_service")


class PriorityService:
    @staticmethod
    def calculate_priority_score(
        pickup_deadline: datetime,
        category: str,
        quantity: float,
        unit: str,
        storage_instructions: str
    ) -> float:
        """
        Calculates operational urgency priority score (0.0 to 100.0):
        NOTE: Priority is an operational urgency score to prevent food waste, NOT a food safety score.
        """
        now = datetime.now(timezone.utc)
        if pickup_deadline.tzinfo is None:
            pickup_deadline = pickup_deadline.replace(tzinfo=timezone.utc)
        
        hours_left = (pickup_deadline - now).total_seconds() / 3600.0
        
        # 1. Time Urgency Score (0 - 50 points)
        if hours_left <= 0:
            time_score = 50.0  # Expired or due immediately
        elif hours_left <= 2.0:
            time_score = 48.0
        elif hours_left <= 4.0:
            time_score = 38.0
        elif hours_left <= 8.0:
            time_score = 25.0
        elif hours_left <= 16.0:
            time_score = 15.0
        else:
            time_score = 8.0

        # 2. Storage & Perishability Score (0 - 25 points)
        storage_map = {
            "hot_holding": 25.0,     # Must be consumed rapidly
            "refrigerated": 15.0,    # Perishable
            "room_temperature": 10.0,
            "frozen": 5.0            # High stability
        }
        storage_score = storage_map.get(storage_instructions, 10.0)

        # 3. Category Urgency (0 - 15 points)
        cat_map = {
            "cooked_meals": 15.0,
            "dairy": 12.0,
            "bakery": 10.0,
            "fresh_produce": 8.0,
            "packaged_groceries": 3.0,
            "beverages": 4.0,
            "other": 5.0
        }
        cat_score = cat_map.get(category, 5.0)

        # 4. Volume / Quantity Factor (0 - 10 points)
        # Larger quantities require coordinated rescue and earlier notice
        kg_approx = quantity if unit == "kg" else (quantity * 0.4 if unit == "portions" else quantity)
        if kg_approx >= 50.0:
            vol_score = 10.0
        elif kg_approx >= 20.0:
            vol_score = 7.0
        elif kg_approx >= 5.0:
            vol_score = 4.0
        else:
            vol_score = 2.0

        total = time_score + storage_score + cat_score + vol_score
        return round(min(100.0, max(0.0, total)), 1)


priority_service = PriorityService()
