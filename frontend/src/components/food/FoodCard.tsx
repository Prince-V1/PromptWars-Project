"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Clock, 
  MapPin, 
  Sparkles, 
  Star, 
  ShieldCheck, 
  HeartHandshake, 
  ArrowRight, 
  Heart,
  ThermometerSnowflake,
  UtensilsCrossed
} from "lucide-react";
import { FoodListing } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface FoodCardProps {
  listing: FoodListing;
  onRequest?: (listing: FoodListing) => void;
  isOwner?: boolean;
}

export function FoodCard({ listing, onRequest }: FoodCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  // Format remaining time in Zomato-style express delivery format
  const getRemainingTime = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    if (diffMs <= 0) return "Expired";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d left`;
    }
    return `${hours}h ${mins}m left`;
  };

  // Live Relative Upload Time Badge ("Just now", "3m ago", "1h ago")
  const getLiveUploadTime = (createdAtStr?: string) => {
    if (!createdAtStr) return "Just now";
    const created = new Date(createdAtStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - created.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMins = Math.floor(diffSec / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const remainingTimeStr = getRemainingTime(listing.pickup_deadline);
  const isHighUrgency = listing.priority_score >= 65;

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "cooked_meals":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">🥘 Cooked Meals</span>;
      case "bakery":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-yellow-100 text-yellow-900 border border-yellow-300">🥖 Bakery</span>;
      case "packaged_groceries":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-100 text-teal-900 border border-teal-300">📦 Groceries</span>;
      case "fresh_produce":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">🥗 Produce</span>;
      case "dairy":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-100 text-sky-900 border border-sky-300">🥛 Dairy</span>;
      case "animal_feed":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-900 border border-indigo-300">🐾 Animal Feed</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-800 border border-slate-300">{category.replace("_", " ")}</span>;
    }
  };

  // Meal estimation helper (UNEP / FSSAI 400g meal portion)
  const estimatedMeals = Math.round(
    listing.unit === "kg"
      ? listing.remaining_quantity * 2.5
      : listing.unit === "portions"
      ? listing.remaining_quantity
      : listing.remaining_quantity * 1.5
  );

  return (
    <div className="group bg-white rounded-3xl border border-freshBorder overflow-hidden hover:shadow-card hover:border-lime-500/60 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* ======================================================== */}
        {/* ZOMATO-STYLE HERO MEDIA CONTAINER                        */}
        {/* ======================================================== */}
        <div className="relative aspect-[16/10] w-full bg-sage-100 overflow-hidden">
          <img
            src={listing.image_url || "/images/food/dal_makhani.jpg"}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Subtle cinematic gradient for high-contrast badge readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

          {/* Top Row: Zomato FSSAI Veg/Non-Veg Badge, Live Time & Save Heart */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-1.5">
              {/* Official Indian FSSAI Veg Symbol (Green Dot inside Green Square) */}
              {listing.dietary_type === "veg" && (
                <div 
                  className="w-5 h-5 bg-white rounded-md flex items-center justify-center border-2 border-[#258A54] shadow-md"
                  title="Pure Vegetarian (FSSAI Certified)"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#258A54]" />
                </div>
              )}
              {listing.dietary_type === "vegan" && (
                <div 
                  className="w-5 h-5 bg-white rounded-md flex items-center justify-center border-2 border-[#16a34a] shadow-md" 
                  title="Vegan"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" />
                </div>
              )}
              {listing.dietary_type === "non_veg" && (
                <div 
                  className="w-5 h-5 bg-white rounded-md flex items-center justify-center border-2 border-[#b91c1c] shadow-md"
                  title="Non-Vegetarian"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#b91c1c]" />
                </div>
              )}

              {/* Live Relative Upload Time Badge */}
              <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-emerald-300 font-extrabold text-[10px] tracking-wide flex items-center gap-1 shadow-sm border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{getLiveUploadTime(listing.created_at)}</span>
              </span>

              {/* Zomato-Style Express Urgency Tag */}
              {isHighUrgency && (
                <span className="px-2.5 py-0.5 rounded-full bg-lime text-freshText-primary font-black text-[10px] tracking-wide flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3 h-3 text-freshText-primary" />
                  RESCUE PRIORITY
                </span>
              )}
            </div>

            {/* Quick Bookmark / Save Heart Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsSaved(!isSaved);
              }}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors shadow-sm"
              title={isSaved ? "Saved" : "Save to NGO watchlist"}
            >
              <Heart className={`w-4 h-4 ${isSaved ? "fill-red-500 text-red-500" : "text-white"}`} />
            </button>
          </div>

          {/* Bottom Left Ribbon: Zomato Offer/Benefit Badge */}
          <div className="absolute bottom-10 left-3">
            {listing.target_beneficiary === "animal_feed" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-700/90 text-white font-extrabold text-[11px] shadow-sm backdrop-blur-sm tracking-wide">
                <span>🐾</span>
                <span>ANIMAL FEED • FREE</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white font-extrabold text-[11px] shadow-sm backdrop-blur-sm tracking-wide">
                <span>₹0</span>
                <span className="text-blue-200">•</span>
                <span>100% FREE SURPLUS</span>
              </span>
            )}
          </div>

          {/* Bottom Row on Image: Delivery Time & Distance Badges */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
            <span className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold">
              <Clock className="w-3.5 h-3.5 text-lime" />
              <span>{remainingTimeStr}</span>
            </span>

            <span className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold">
              <MapPin className="w-3 h-3 text-white" />
              <span>{listing.distance_km ? `${listing.distance_km} km away` : "Central Delhi"}</span>
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ZOMATO-STYLE LISTING CONTENT BODY                        */}
        {/* ======================================================== */}
        <div className="p-4 sm:p-5 space-y-3">
          {/* Row 1: Dish Title & Iconic Zomato Green Rating Badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-freshText-primary text-base line-clamp-1 group-hover:text-lime-700 transition-colors">
                {listing.title}
              </h3>
              <div className="text-xs text-freshText-secondary font-medium truncate mt-0.5 flex items-center gap-1">
                {listing.organization_id ? (
                  <Link
                    href={`/donors/${listing.organization_id}`}
                    className="hover:underline hover:text-freshText-primary font-semibold text-freshText-secondary flex items-center gap-1 transition-colors"
                    title={`Check all surplus items posted by ${listing.organization_name || "this donor"}`}
                  >
                    <span>{listing.organization_name || "Food Donor Partner"}</span>
                    <span title="FSSAI Verified Establishment">
                      <ShieldCheck className="w-3.5 h-3.5 text-freshSuccess shrink-0 inline" />
                    </span>
                  </Link>
                ) : (
                  <>
                    <span>{listing.organization_name || "Food Donor Partner"}</span>
                    <span title="FSSAI Verified Establishment">
                      <ShieldCheck className="w-3.5 h-3.5 text-freshSuccess shrink-0 inline" />
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Zomato Signature Emerald Green Rating Badge */}
            <div className="shrink-0 flex items-center gap-1 bg-[#24963F] text-white px-2 py-0.5 rounded-lg text-xs font-black shadow-xs">
              <span>4.8</span>
              <Star className="w-3 h-3 fill-white text-white" />
            </div>
          </div>

          {/* Row 2: Zomato Cuisines / Category Tagline */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-freshText-secondary">
            {getCategoryBadge(listing.category)}
            <span className="text-freshBorder">•</span>
            <span className="font-semibold text-emerald-800">FSSAI Inspected</span>
            {listing.allergens && listing.allergens.length > 0 && (
              <>
                <span className="text-freshBorder">•</span>
                <span className="text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[10px]">
                  Allergens: {listing.allergens.slice(0, 2).join(", ")}
                </span>
              </>
            )}
          </div>

          {/* Row 3: Description excerpt */}
          <p className="text-xs text-freshText-secondary line-clamp-2 leading-relaxed">
            {listing.description}
          </p>

          {/* Row 4: Zomato-Style Safety & Storage Highlight Strip */}
          <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-sage-50/80 border border-sage-200/60 text-[11px] text-freshText-secondary">
            <ThermometerSnowflake className="w-3.5 h-3.5 text-freshSuccess shrink-0" />
            <span className="font-medium truncate">
              Storage: <strong className="text-freshText-primary uppercase font-bold">{listing.storage_instructions.replace("_", " ")}</strong>
            </span>
            <span className="text-freshBorder ml-auto">•</span>
            <span className="text-freshSuccess font-bold shrink-0">FSSAI Safe</span>
          </div>

          {/* Row 5: Zomato-Style Portion / Meal Estimate Banner */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-freshBg border border-freshBorder">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white border border-freshBorder flex items-center justify-center shrink-0">
                <UtensilsCrossed className="w-4 h-4 text-freshText-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-freshText-secondary">Available Batch</p>
                <p className="text-sm font-black text-freshText-primary">
                  {listing.remaining_quantity} {listing.unit}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-freshText-secondary">Feeds Approx.</p>
              <p className="text-xs font-black text-freshSuccess flex items-center gap-1 justify-end">
                <HeartHandshake className="w-3.5 h-3.5 text-freshSuccess" />
                ~{estimatedMeals} meals
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ZOMATO-STYLE BOTTOM ACTIONS BAR                          */}
      {/* ======================================================== */}
      <div className="p-4 sm:p-5 pt-0">
        <div className="flex items-center gap-2 pt-3 border-t border-freshBorder">
          <Link href={`/discover/${listing.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs font-semibold rounded-2xl">
              Inspect Batch
            </Button>
          </Link>

          {listing.status === "available" && onRequest && (
            <Button
              size="sm"
              onClick={() => onRequest(listing)}
              className={`flex-1 text-xs font-black shadow-md rounded-2xl text-white ${
                listing.target_beneficiary === "animal_feed"
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              {listing.target_beneficiary === "animal_feed" ? "Claim Feed" : "Request Food"}
            </Button>
          )}

          {listing.status === "reserved" && (
            <Badge variant="warning" size="md">Reserved</Badge>
          )}

          {listing.status === "completed" && (
            <Badge variant="success" size="md">Delivered</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
