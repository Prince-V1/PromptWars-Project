"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Clock, MapPin, Sparkles,
  ShieldCheck, Building, Loader2
} from "lucide-react";
import { api } from "@/lib/api";
import { FoodListing, MatchRecommendation } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { RequestModal } from "@/components/food/RequestModal";

export default function ListingDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [listing, setListing] = useState<FoodListing | null>(null);
  const [matchRecommendations, setMatchRecommendations] = useState<MatchRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [requestSuccess, setRequestSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api.getFoodListingById(id)
      .then((data) => {
        setListing(data);
        // Load intelligent NGO matches for this listing if authorized
        api.matchRecipients(data.id)
          .then((matchRes) => {
            if (matchRes?.recommendations) {
              setMatchRecommendations(matchRes.recommendations);
            }
          })
          .catch((err) => {
            // Non-critical: unauthenticated guests or network hiccups
            console.log("Match recommendations note:", err.message);
          });
      })
      .catch((err) => setErrorMsg(err.message || "Failed to load listing."))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-lime-600" />
        <p className="text-xs text-freshText-secondary">Loading food listing details...</p>
      </div>
    );
  }

  if (errorMsg || !listing) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="p-4 bg-red-50 border border-red-200 rounded-3xl text-sm text-freshError mb-6">
          {errorMsg || "Food listing not found"}
        </div>
        <Link href="/discover">
          <Button variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Explore Food
          </Button>
        </Link>
      </div>
    );
  }

  const deadline = new Date(listing.pickup_deadline);
  const prepTime = new Date(listing.preparation_time);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top back nav */}
      <Link href="/discover" className="inline-flex items-center gap-2 text-xs font-semibold text-freshText-secondary hover:text-freshText-primary transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Food Discovery</span>
      </Link>

      {requestSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-3xl text-xs font-semibold text-freshSuccess flex items-center justify-between">
          <span>Your request has been placed! The food provider has been notified.</span>
          <Link href="/recipient" className="underline font-bold ml-4">View in Dashboard</Link>
        </div>
      )}

      {/* Main Listing Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Media & Core Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative h-80 sm:h-96 w-full rounded-4xl overflow-hidden border border-freshBorder shadow-card">
            <img
              src={listing.image_url || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1200&q=80"}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="lime" size="md">
                {listing.category.replace("_", " ")}
              </Badge>
              <Badge variant={listing.dietary_type === "veg" ? "success" : "neutral"} size="md">
                {listing.dietary_type.toUpperCase()}
              </Badge>
            </div>
            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-xs font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-lime" />
              <span>Deadline: {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div className="bg-white rounded-4xl border border-freshBorder p-8 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-freshText-primary tracking-tight mb-2">
                {listing.title}
              </h1>
              <p className="text-xs text-freshText-secondary flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sage-400" />
                <span>{listing.pickup_address}</span>
              </p>
            </div>

            <div className="pt-4 border-t border-freshBorder">
              <h3 className="text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-2">
                Description & Instructions
              </h3>
              <p className="text-sm text-freshText-primary leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Preparation and Storage */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-freshBorder">
              <div className="p-3 bg-freshBg rounded-2xl border border-freshBorder">
                <p className="text-[10px] font-bold uppercase tracking-wider text-freshText-secondary">Prepared At</p>
                <p className="text-xs font-bold text-freshText-primary mt-0.5">
                  {prepTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="p-3 bg-freshBg rounded-2xl border border-freshBorder">
                <p className="text-[10px] font-bold uppercase tracking-wider text-freshText-secondary">Storage Condition</p>
                <p className="text-xs font-bold text-freshText-primary mt-0.5 capitalize">
                  {listing.storage_instructions.replace("_", " ")}
                </p>
              </div>

              <div className="p-3 bg-freshBg rounded-2xl border border-freshBorder col-span-2 sm:col-span-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-freshText-secondary">Urgency Score</p>
                <p className="text-xs font-bold text-freshText-primary mt-0.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-lime-600" />
                  {listing.priority_score} / 100
                </p>
              </div>
            </div>

            {/* Allergens */}
            <div className="pt-4 border-t border-freshBorder">
              <h3 className="text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-2">
                Declared Allergens
              </h3>
              {listing.allergens && listing.allergens.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {listing.allergens.map((allergen, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full bg-red-50 border border-red-200 text-xs font-semibold text-freshError">
                      {allergen}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-freshText-secondary">No allergens declared by provider.</p>
              )}
            </div>
          </div>

          {/* AI Matching Recommendations */}
          <div className="bg-white rounded-4xl border border-freshBorder p-8 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-lime-700" />
              <h3 className="text-base font-bold text-freshText-primary">
                Smart NGO Match Recommendations
              </h3>
            </div>
            <p className="text-xs text-freshText-secondary">
              Deterministic matching engine analyzed recipient distance, category fit, and daily distribution capacity.
            </p>

            <div className="space-y-3 pt-2">
              {matchRecommendations.map((rec) => (
                <div key={rec.organization_id} className="p-4 rounded-3xl bg-freshBg border border-freshBorder flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-freshText-primary">{rec.organization_name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime text-freshText-primary">
                        {rec.match_score}% Match
                      </span>
                    </div>
                    <p className="text-[11px] text-freshText-secondary mt-1">{rec.explanation}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-bold text-freshText-primary">{rec.distance_km} km away</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Donor Card & Request Action */}
        <div className="space-y-6">
          <Card className="p-6 space-y-6 sticky top-28">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">Surplus Available</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-freshText-primary">{listing.remaining_quantity}</span>
                <span className="text-base font-bold text-freshText-secondary">{listing.unit}</span>
              </div>
            </div>

            {listing.organization_id ? (
              <Link
                href={`/donors/${listing.organization_id}`}
                className="block p-4 rounded-2xl bg-freshBg border border-freshBorder hover:border-red-300 hover:bg-red-50/30 transition-all space-y-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {(listing.organization_name || "F").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-freshText-primary group-hover:text-red-600 transition-colors truncate">
                      {listing.organization_name || "Food Donor Partner"}
                    </h4>
                    <p className="text-[11px] text-freshText-secondary truncate">
                      {listing.provider_name || "Verified Partner"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-freshBorder">
                  <div className="flex items-center gap-1.5 text-freshSuccess font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-freshSuccess" />
                    <span>Verified FSSAI</span>
                  </div>
                  <span className="text-red-600 font-bold group-hover:underline">
                    View Shop & All Food →
                  </span>
                </div>
              </Link>
            ) : (
              <div className="p-4 rounded-2xl bg-freshBg border border-freshBorder space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sage-200 flex items-center justify-center font-bold text-xs text-freshText-primary">
                    <Building className="w-5 h-5 text-sage-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-freshText-primary">{listing.organization_name || "Food Donor Partner"}</h4>
                    <p className="text-[11px] text-freshText-secondary">{listing.provider_name || "Verified Partner"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-freshSuccess font-medium pt-2 border-t border-freshBorder">
                  <ShieldCheck className="w-4 h-4 text-freshSuccess" />
                  <span>Verified Food Business</span>
                </div>
              </div>
            )}

            {listing.status === "available" ? (
              <Button
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-floating"
                onClick={() => setIsRequestModalOpen(true)}
              >
                Request This Food
              </Button>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center text-xs font-semibold text-freshWarning">
                Listing is currently {listing.status}
              </div>
            )}

            <p className="text-[11px] text-freshText-secondary text-center leading-relaxed">
              Surplus food redistribution is governed by standard food hygiene inspections and FSSAI safe donation practices.
            </p>
          </Card>
        </div>
      </div>

      {/* Request Modal */}
      <RequestModal
        listing={listing}
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={() => {
          setRequestSuccess(true);
          api.getFoodListingById(id).then(setListing);
        }}
      />
    </div>
  );
}
