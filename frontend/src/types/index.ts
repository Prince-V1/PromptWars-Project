export type UserRole = "food_provider" | "recipient" | "volunteer" | "admin";

export type FoodCategory = 
  | "cooked_meals" 
  | "bakery" 
  | "packaged_groceries" 
  | "fresh_produce" 
  | "dairy" 
  | "beverages" 
  | "other";

export type FoodUnit = "kg" | "portions" | "packets" | "crates" | "liters" | "boxes";

export type DietaryType = "veg" | "non_veg" | "vegan" | "contains_egg";

export type StorageCondition = "room_temperature" | "refrigerated" | "frozen" | "hot_holding";

export type ListingStatus = "available" | "reserved" | "completed" | "cancelled" | "expired";

export type RequestStatus = "requested" | "accepted" | "rejected" | "picked_up" | "delivered" | "cancelled" | "expired";

export type PickupStatus = "pending" | "assigned" | "in_transit" | "picked_up" | "delivered" | "failed" | "cancelled";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  avatar_url?: string;
  organization_id?: string;
  organization?: Organization;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  organization_type: string;
  recipient_category?: "human" | "animal_care";
  supported_species?: AnimalSpecies[];
  description?: string;
  image_url?: string;
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  registration_number?: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: number;
  longitude: number;
  capacity_servings_per_day: number;
  accepted_categories: string[];
}

export type AnimalSpecies = 
  | "cows" 
  | "bulls" 
  | "buffaloes" 
  | "dogs" 
  | "cats" 
  | "goats" 
  | "sheep" 
  | "birds" 
  | "other";

export type AnimalCareType = 
  | "gaushala"
  | "animal_shelter"
  | "animal_rescue_centre"
  | "veterinary_hospital"
  | "animal_welfare_ngo"
  | "livestock_care_centre";

export interface RecipientOrganizationDetails {
  id: string;
  name: string;
  organization_type: string;
  recipient_category: "human" | "animal_care";
  supported_species: AnimalSpecies[];
  description?: string;
  image_url?: string;
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  registration_number?: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: number;
  longitude: number;
  capacity_servings_per_day: number;
  accepted_categories: string[];
  total_received_kg?: number;
  active_requests_count?: number;
}

export interface DonorProfile {
  organization: Organization;
  total_active_listings: number;
  total_completed_donations: number;
  total_kg_donated: number;
  total_meals_provided: number;
  total_co2_saved_kg: number;
  active_listings: FoodListing[];
  past_listings: FoodListing[];
}

export type ProviderCategory = 
  | "restaurant" 
  | "hotel" 
  | "wedding_venue" 
  | "wedding_organizer" 
  | "catering_company" 
  | "event_management" 
  | "bakery" 
  | "grocery_store" 
  | "banquet_hall" 
  | "corporate_event_organizer" 
  | "other_food_business"
  | "ngo"
  | "food_bank";

export type EventType = 
  | "wedding" 
  | "reception" 
  | "birthday" 
  | "corporate_event" 
  | "festival" 
  | "community_gathering" 
  | "conference" 
  | "other";

export interface EventItem {
  id: string;
  organizer_id: string;
  organization_id?: string;
  event_name: string;
  event_type: EventType;
  event_date: string;
  start_time?: string;
  end_time?: string;
  venue_name: string;
  location_address: string;
  city: string;
  latitude: number;
  longitude: number;
  estimated_guests: number;
  contact_person: string;
  contact_phone: string;
  expected_food_categories: string[];
  estimated_food_quantity: number;
  estimated_food_unit: string;
  expected_surplus: number;
  status: "upcoming" | "in_progress" | "completed" | "cancelled";
  notes?: string;
  created_at: string;
  updated_at: string;
  surplus_listings_count?: number;
}

export interface EventCreateInput {
  event_name: string;
  event_type: EventType;
  event_date: string;
  start_time?: string;
  end_time?: string;
  venue_name: string;
  location_address: string;
  city?: string;
  latitude: number;
  longitude: number;
  estimated_guests: number;
  contact_person: string;
  contact_phone: string;
  expected_food_categories: string[];
  estimated_food_quantity?: number;
  estimated_food_unit?: string;
  expected_surplus?: number;
  notes?: string;
}

export interface EventSurplusInput {
  event_id: string;
  food_name: string;
  description?: string;
  category: FoodCategory;
  quantity: number;
  unit: FoodUnit;
  dietary_type: DietaryType;
  preparation_time: string;
  pickup_deadline: string;
  pickup_address?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  ingredients: string[];
  allergens: string[];
  storage_instructions: StorageCondition;
  storage_temperature?: number;
  storage_temperature_unit?: string;
  food_safety_status: "untouched" | "exposed_to_guests";
  safety_declaration_confirmed: boolean;
  notes?: string;
}

export interface EventDashboardData {
  upcoming_events_count: number;
  completed_events_count: number;
  total_surplus_reported_kg: number;
  pending_requests_count: number;
  completed_redistributions_count: number;
  meals_provided: number;
  co2_saved_kg: number;
  upcoming_events: EventItem[];
  active_event_surplus: FoodListing[];
}

export interface FoodListing {
  id: string;
  provider_id: string;
  organization_id?: string;
  event_id?: string;
  title: string;
  description: string;
  category: FoodCategory;
  quantity: number;
  remaining_quantity: number;
  unit: FoodUnit;
  dietary_type: DietaryType;
  status: ListingStatus;
  preparation_time: string;
  pickup_deadline: string;
  pickup_address: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  storage_instructions: StorageCondition;
  allergens: string[];
  priority_score: number;
  food_safety_status?: "untouched" | "exposed_to_guests";
  storage_temperature?: number;
  ingredients?: string[];
  safety_declaration_confirmed?: boolean;
  verification_flag?: "approved" | "flagged_review" | "ineligible_unsafe";
  flagged_reason?: string;
  target_beneficiary?: "human" | "animal_feed" | "both";
  suitable_species?: AnimalSpecies[];
  animal_feed_safety_confirmed?: boolean;
  animal_feed_notes?: string;
  distance_km?: number;
  provider_name?: string;
  organization_name?: string;
  created_at: string;
  updated_at: string;
}

export interface DonationRequest {
  id: string;
  listing_id: string;
  recipient_id: string;
  organization_id?: string;
  requested_quantity: number;
  status: RequestStatus;
  notes?: string;
  delivery_mode: "self_pickup" | "volunteer_courier" | "provider_delivery";
  rejection_reason?: string;
  cancellation_reason?: string;
  recipient_name?: string;
  recipient_organization?: string;
  listing?: FoodListing;
  created_at: string;
  updated_at: string;
}

export interface PickupTask {
  id: string;
  request_id: string;
  volunteer_id?: string;
  status: PickupStatus;
  assigned_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  pickup_notes?: string;
  proof_image_url?: string;
  delivery_notes?: string;
  volunteer_name?: string;
  request?: DonationRequest;
  created_at: string;
  updated_at: string;
}

export interface AIAnalysisResult {
  suggested_title: string;
  suggested_category: FoodCategory;
  suggested_description: string;
  dietary_type: DietaryType;
  visible_condition_observations: string[];
  potential_allergens_detected: string[];
  estimated_servings_range?: string;
  recommended_storage: StorageCondition;
  requires_human_verification: boolean;
  safety_disclaimer: string;
}

export interface MatchRecommendation {
  organization_id: string;
  organization_name: string;
  organization_type: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  distance_km: number;
  match_score: number;
  explanation: string;
  matching_factors: Record<string, any>;
}

export interface ImpactMetrics {
  total_donations_listed: number;
  total_completed_pickups: number;
  total_kg_redistributed: number;
  total_estimated_meals: number;
  total_co2_saved_kg: number;
  active_providers_count: number;
  active_recipients_count: number;
  verified_impact_count: number;
  meal_calculation_formula: string;
  co2_calculation_formula: string;
}

export interface ProviderDashboard {
  active_listings_count: number;
  pending_requests_count: number;
  completed_donations_count: number;
  total_kg_donated: number;
  total_meals_provided: number;
  total_co2_saved_kg: number;
  recent_listings: FoodListing[];
  recent_requests: DonationRequest[];
}

export interface RecipientDashboard {
  active_requests_count: number;
  delivered_donations_count: number;
  total_kg_received: number;
  total_meals_received: number;
  nearby_available_listings_count: number;
  recent_requests: DonationRequest[];
}

export interface AgentToolExecution {
  tool_name: string;
  arguments: Record<string, any>;
  result_summary: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  tools_executed?: AgentToolExecution[];
}

export interface ChatResponse {
  reply: string;
  suggested_actions?: string[];
  model_used?: string;
  tools_executed?: AgentToolExecution[];
}

