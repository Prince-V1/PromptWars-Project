"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  MapPin, Phone, Mail, ShieldCheck, 
  ArrowLeft, Utensils,
  CheckCircle2, History, Loader2
} from "lucide-react";
import { api } from "@/lib/api";
import { DonorProfile, FoodListing } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FoodCard } from "@/components/food/FoodCard";
import { RequestModal } from "@/components/food/RequestModal";
import { useLocation } from "@/hooks/useLocation";

export default function DonorDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");

  // Request modal state
  const [selectedListingForRequest, setSelectedListingForRequest] = useState<FoodListing | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [requestSuccessBanner, setRequestSuccessBanner] = useState<string | null>(null);

  const { currentLocation } = useLocation();

  const loadProfile = useCallback(() => {
    if (!id) return;
    setIsLoading(true);
    api.getDonorProfile(id)
      .then((data) => setProfile(data))
      .catch((err) => setErrorMsg(err.message || "Failed to load donor profile."))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleOpenRequest = (listing: FoodListing) => {
    setSelectedListingForRequest(listing);
    setIsRequestModalOpen(true);
  };

  const handleRequestSuccess = () => {
    setRequestSuccessBanner("Donation request submitted successfully! The food provider will review it shortly.");
    loadProfile();
    setTimeout(() => setRequestSuccessBanner(null), 6000);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-xs text-freshText-secondary">Loading donor shop profile...</p>
      </div>
    );
  }

  if (errorMsg || !profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="p-4 bg-red-50 border border-red-200 rounded-3xl text-sm text-freshError mb-6">
          {errorMsg || "Donor profile not found."}
        </div>
        <Link href="/donors">
          <Button variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Donor Directory
          </Button>
        </Link>
      </div>
    );
  }

  const org = profile.organization;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb Nav */}
      <div className="flex items-center justify-between">
        <Link 
          href="/donors" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-freshText-secondary hover:text-freshText-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Donor Shops</span>
        </Link>

        <Link
          href="/discover"
          className="text-xs font-semibold text-red-600 hover:text-red-700 underline"
        >
          Explore All Surplus Food
        </Link>
      </div>

      {/* Success Notification */}
      {requestSuccessBanner && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-3xl text-xs font-semibold text-freshSuccess flex items-center justify-between animate-fade-in">
          <span>{requestSuccessBanner}</span>
          <button onClick={() => setRequestSuccessBanner(null)} className="underline ml-4">Dismiss</button>
        </div>
      )}

      {/* Donor Banner & Profile Header */}
      <div className="bg-white rounded-4xl border border-freshBorder shadow-card overflow-hidden">
        {/* Decorative Top Gradient */}
        <div className="h-32 sm:h-44 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 p-6 flex items-end justify-between relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[11px] font-bold text-white border border-white/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-lime-400" />
              FSSAI Verified Food Business
            </span>
          </div>
        </div>

        {/* Profile Details Header */}
        <div className="px-6 sm:px-10 pb-8 pt-0 relative">
          {/* Avatar Icon */}
          <div className="-mt-14 sm:-mt-16 mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white border-4 border-white shadow-xl flex items-center justify-center font-black text-3xl sm:text-4xl text-red-600 bg-red-50">
                {org.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-freshText-primary tracking-tight">
                    {org.name}
                  </h1>
                  <Badge variant="lime" size="sm">
                    {org.organization_type.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-freshText-secondary flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{org.address}, {org.city}, {org.state}</span>
                </p>
              </div>
            </div>

            {/* Contact quick links */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <a
                href={`tel:${org.contact_phone}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-freshBg border border-freshBorder hover:bg-gray-100 text-xs font-bold text-freshText-primary transition-all shadow-subtle"
              >
                <Phone className="w-3.5 h-3.5 text-gray-500" />
                <span>Call Shop</span>
              </a>
              <a
                href={`mailto:${org.contact_email}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-freshBg border border-freshBorder hover:bg-gray-100 text-xs font-bold text-freshText-primary transition-all shadow-subtle"
              >
                <Mail className="w-3.5 h-3.5 text-gray-500" />
                <span>Email</span>
              </a>
            </div>
          </div>

          {/* Impact Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-freshBorder">
            <div className="p-4 bg-freshBg rounded-2xl border border-freshBorder">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-freshText-secondary">
                Active Listings
              </p>
              <p className="text-xl sm:text-2xl font-black text-red-600 mt-1">
                {profile.total_active_listings}
              </p>
              <p className="text-[10px] text-freshText-secondary mt-0.5">Ready for pickup now</p>
            </div>

            <div className="p-4 bg-freshBg rounded-2xl border border-freshBorder">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-freshText-secondary">
                Meals Provided
              </p>
              <p className="text-xl sm:text-2xl font-black text-freshText-primary mt-1">
                {profile.total_meals_provided.toLocaleString()}
              </p>
              <p className="text-[10px] text-freshText-secondary mt-0.5">To local communities</p>
            </div>

            <div className="p-4 bg-freshBg rounded-2xl border border-freshBorder">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-freshText-secondary">
                Food Rescued
              </p>
              <p className="text-xl sm:text-2xl font-black text-freshText-primary mt-1">
                {profile.total_kg_donated.toFixed(1)} <span className="text-xs font-normal">kg</span>
              </p>
              <p className="text-[10px] text-freshText-secondary mt-0.5">{profile.total_completed_donations} completed pickups</p>
            </div>

            <div className="p-4 bg-freshBg rounded-2xl border border-freshBorder">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-freshText-secondary">
                CO₂ Diverted
              </p>
              <p className="text-xl sm:text-2xl font-black text-green-600 mt-1">
                {profile.total_co2_saved_kg.toFixed(1)} <span className="text-xs font-normal">kg</span>
              </p>
              <p className="text-[10px] text-green-700 mt-0.5">Greenhouse emissions avoided</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation: Active Listings vs Past Rescues */}
      <div className="flex items-center justify-between border-b border-freshBorder pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex items-center gap-2 pb-2 text-sm sm:text-base font-bold transition-all relative ${
              activeTab === "active"
                ? "text-red-600"
                : "text-freshText-secondary hover:text-freshText-primary"
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Currently Available Food ({profile.active_listings.length})</span>
            {activeTab === "active" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("past")}
            className={`flex items-center gap-2 pb-2 text-sm sm:text-base font-bold transition-all relative ${
              activeTab === "past"
                ? "text-red-600"
                : "text-freshText-secondary hover:text-freshText-primary"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Past Donations & Rescues ({profile.past_listings.length})</span>
            {activeTab === "past" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
            )}
          </button>
        </div>

        <div className="text-xs text-freshText-secondary hidden sm:block">
          📍 Distance relative to {currentLocation.name}
        </div>
      </div>

      {/* Tab Content 1: Active Listings */}
      {activeTab === "active" && (
        <div className="space-y-6">
          {profile.active_listings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-4xl border border-freshBorder space-y-3">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <h3 className="text-base font-bold text-freshText-primary">
                All surplus food has been rescued!
              </h3>
              <p className="text-xs text-freshText-secondary max-w-md mx-auto">
                {org.name} currently has no pending surplus food batches. New listings are posted daily right after dining hours and prep shifts.
              </p>
              <Link href="/discover">
                <Button variant="outline" size="sm" className="mt-3">
                  Explore other nearby restaurants
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.active_listings.map((listing) => (
                <FoodCard
                  key={listing.id}
                  listing={listing}
                  onRequest={handleOpenRequest}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Past Listings & Rescues */}
      {activeTab === "past" && (
        <div className="space-y-4">
          {profile.past_listings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-4xl border border-freshBorder space-y-2">
              <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-freshText-primary">No completed past batches yet</h3>
              <p className="text-xs text-freshText-secondary">
                Completed food pickups and distributions will appear here for full audit transparency.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-4xl border border-freshBorder overflow-hidden divide-y divide-freshBorder">
              {profile.past_listings.map((past) => {
                const isClaimed = past.status === "completed" || past.status === "reserved";
                return (
                  <div key={past.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-freshBg/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <img
                        src={past.image_url || "/images/food/dal_tadka.jpg"}
                        alt={past.title}
                        className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-freshBorder"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-freshText-primary">{past.title}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isClaimed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          }`}>
                            {past.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-freshText-secondary line-clamp-1">
                          {past.description}
                        </p>
                        <p className="text-[11px] text-freshText-secondary">
                          Category: <span className="font-semibold capitalize">{past.category.replace("_", " ")}</span> • Quantity: <span className="font-semibold">{past.quantity} {past.unit}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-green-600 block">
                        ✓ Rescued for Community
                      </span>
                      <span className="text-[11px] text-freshText-secondary">
                        {new Date(past.pickup_deadline).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Safety & Compliance Card */}
      <div className="bg-white rounded-3xl border border-freshBorder p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-green-700">
            <ShieldCheck className="w-4 h-4" />
            <span>FSSAI Certified Safe Donation Protocols</span>
          </div>
          <h3 className="text-base font-extrabold text-freshText-primary">
            Safe Handover Guaranteed by FoodLoop
          </h3>
          <p className="text-xs text-freshText-secondary leading-relaxed">
            All surplus edible items from {org.name} follow strict thermal packaging standards, allergen disclosure declarations, and timestamped pickup custody.
          </p>
        </div>

        <div className="shrink-0 flex flex-col gap-2">
          <div className="p-3 bg-freshBg rounded-2xl border border-freshBorder text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-freshText-secondary block">Registration Number</span>
            <span className="text-xs font-mono font-bold text-freshText-primary">{org.registration_number || "FSSAI-DELHI-2026"}</span>
          </div>
        </div>
      </div>

      {/* Request Modal */}
      <RequestModal
        listing={selectedListingForRequest}
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={handleRequestSuccess}
      />
    </div>
  );
}
