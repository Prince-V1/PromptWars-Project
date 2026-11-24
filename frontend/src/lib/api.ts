import {
  UserProfile, FoodListing, DonationRequest, PickupTask,
  AIAnalysisResult, MatchRecommendation, ImpactMetrics,
  ProviderDashboard, RecipientDashboard, Organization, DonorProfile,
  ChatMessage, ChatResponse,
  EventItem, EventCreateInput, EventSurplusInput, EventDashboardData
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("foodloop_token");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.detail || `API error (${response.status})`;
      throw new Error(errorMsg);
    }

    return data as T;
  }

  // --- Auth Endpoints ---
  async login(email: string, password: string) {
    return this.request<{ access_token: string; user_id: string; role: string; full_name: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );
  }

  async register(payload: any) {
    return this.request<{ access_token: string; user_id: string; role: string; full_name: string }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  async getMe(): Promise<UserProfile> {
    return this.request<UserProfile>("/auth/me");
  }

  // --- Food Listings ---
  async getFoodListings(params: Record<string, any> = {}): Promise<FoodListing[]> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        query.append(key, String(val));
      }
    });
    return this.request<FoodListing[]>(`/food?${query.toString()}`);
  }

  async getFoodListingById(id: string): Promise<FoodListing> {
    return this.request<FoodListing>(`/food/${id}`);
  }

  async createFoodListing(payload: any): Promise<FoodListing> {
    return this.request<FoodListing>("/food", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateFoodListing(id: string, payload: any): Promise<FoodListing> {
    return this.request<FoodListing>(`/food/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deleteFoodListing(id: string): Promise<void> {
    return this.request<void>(`/food/${id}`, { method: "DELETE" });
  }

  // --- Requests ---
  async createRequest(payload: { listing_id: string; requested_quantity: number; notes?: string; delivery_mode?: string }) {
    return this.request<DonationRequest>("/requests", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getRequests(): Promise<DonationRequest[]> {
    return this.request<DonationRequest[]>("/requests");
  }

  async acceptRequest(id: string): Promise<DonationRequest> {
    return this.request<DonationRequest>(`/requests/${id}/accept`, { method: "POST" });
  }

  async rejectRequest(id: string, reason?: string): Promise<DonationRequest> {
    return this.request<DonationRequest>(`/requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async cancelRequest(id: string, reason?: string): Promise<DonationRequest> {
    return this.request<DonationRequest>(`/requests/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async completeRequest(id: string, proof_image_url?: string, notes?: string): Promise<DonationRequest> {
    return this.request<DonationRequest>(`/requests/${id}/complete`, {
      method: "POST",
      body: JSON.stringify({ proof_image_url, notes }),
    });
  }

  // --- Pickups (Volunteer) ---
  async getPickups(): Promise<PickupTask[]> {
    return this.request<PickupTask[]>("/pickups");
  }

  async assignPickup(id: string, notes?: string): Promise<PickupTask> {
    return this.request<PickupTask>(`/pickups/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  }

  async completePickup(id: string, proof_image_url?: string, delivery_notes?: string): Promise<PickupTask> {
    return this.request<PickupTask>(`/pickups/${id}/complete`, {
      method: "POST",
      body: JSON.stringify({ proof_image_url, delivery_notes }),
    });
  }

  // --- AI Operations ---
  async analyzeFoodImage(payload: { image_base64?: string; image_url?: string; mime_type?: string; additional_context?: string }): Promise<AIAnalysisResult> {
    return this.request<AIAnalysisResult>("/ai/analyze-food", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async generateDescription(payload: any): Promise<{ generated_description: string; storage_recommendation: string; safety_reminder: string }> {
    return this.request("/ai/generate-description", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async matchRecipients(listingId: string): Promise<{ listing_id: string; listing_title: string; total_candidates_analyzed: number; recommendations: MatchRecommendation[] }> {
    return this.request("/ai/match-recipients", {
      method: "POST",
      body: JSON.stringify({ listing_id: listingId }),
    });
  }

  async chatWithAI(
    messages: ChatMessage[],
    currentLocation?: string,
    userRole?: string
  ): Promise<ChatResponse> {
    return this.request<ChatResponse>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        messages,
        current_location: currentLocation,
        user_role: userRole,
      }),
    });
  }

  // --- Dashboards ---
  async getProviderDashboard(): Promise<ProviderDashboard> {
    return this.request<ProviderDashboard>("/dashboard/provider");
  }

  async getRecipientDashboard(): Promise<RecipientDashboard> {
    return this.request<RecipientDashboard>("/dashboard/recipient");
  }

  async getImpactDashboard(): Promise<ImpactMetrics> {
    return this.request<ImpactMetrics>("/dashboard/impact");
  }

  // --- Admin ---
  async getAdminVerifications(): Promise<any[]> {
    return this.request<any[]>("/admin/verifications");
  }

  async approveVerification(id: string): Promise<any> {
    return this.request(`/admin/verifications/${id}/approve`, { method: "POST" });
  }

  async rejectVerification(id: string, reason?: string): Promise<any> {
    return this.request(`/admin/verifications/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ decision: "rejected", rejection_reason: reason }),
    });
  }

  async getAdminMetrics(): Promise<any> {
    return this.request("/admin/metrics");
  }

  // --- Donors ---
  async getDonors(): Promise<Organization[]> {
    return this.request<Organization[]>("/donors");
  }

  async getDonorProfile(id: string): Promise<DonorProfile> {
    return this.request<DonorProfile>(`/donors/${id}`);
  }

  // --- Recipient & Animal Care Organizations ---
  async getRecipients(params?: {
    category?: string;
    organization_type?: string;
    species?: string;
    city?: string;
    search?: string;
    verified_only?: boolean;
  }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append("category", params.category);
    if (params?.organization_type) query.append("organization_type", params.organization_type);
    if (params?.species) query.append("species", params.species);
    if (params?.city) query.append("city", params.city);
    if (params?.search) query.append("search", params.search);
    if (params?.verified_only) query.append("verified_only", "true");
    const qs = query.toString() ? `?${query.toString()}` : "";
    return this.request<any[]>(`/recipients${qs}`);
  }

  async getRecipientProfile(id: string): Promise<any> {
    return this.request<any>(`/recipients/${id}`);
  }

  // --- FoodLoop Event Rescue ---
  async getEvents(params?: { event_type?: string; status?: string }): Promise<EventItem[]> {
    const query = new URLSearchParams();
    if (params?.event_type) query.append("event_type", params.event_type);
    if (params?.status) query.append("status", params.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return this.request<EventItem[]>(`/events${qs}`);
  }

  async getEvent(id: string): Promise<EventItem> {
    return this.request<EventItem>(`/events/${id}`);
  }

  async createEvent(payload: EventCreateInput): Promise<EventItem> {
    return this.request<EventItem>("/events", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async reportEventSurplus(payload: EventSurplusInput): Promise<FoodListing> {
    return this.request<FoodListing>("/events/surplus", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getEventDashboardSummary(): Promise<EventDashboardData> {
    return this.request<EventDashboardData>("/events/dashboard/summary");
  }
}

export const api = new ApiClient();
