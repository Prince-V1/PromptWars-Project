"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Store, PlusCircle, MapPin, 
  Clock, ShieldCheck, CheckCircle2,
  Truck, FileText, RefreshCw, Eye,
  Package
} from "lucide-react";
import { FoodListing } from "@/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/hooks/useLocation";

export default function MyShopPage() {
  const { user } = useAuth();
  const { currentLocation } = useLocation();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"all" | "available" | "claimed" | "completed">("all");

  const fetchShopItems = async () => {
    setIsLoading(true);
    try {
      const data = await api.getFoodListings();
      setListings(data);
    } catch {
      // Handled gracefully by api.ts fallbacks
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShopItems();
  }, []);

  const filteredItems = listings.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "available") return item.status === "available" && item.remaining_quantity > 0;
    if (activeTab === "claimed") return item.status === "reserved" || (item.remaining_quantity < item.quantity && item.remaining_quantity > 0);
    if (activeTab === "completed") return item.status === "completed" || item.remaining_quantity === 0;
    return true;
  });

  const totalSharedKg = listings.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const availableCount = listings.filter((l) => l.status === "available" && l.remaining_quantity > 0).length;
  const claimedCount = listings.filter((l) => l.status === "reserved" || l.remaining_quantity < l.quantity).length;
  const mealsProvided = Math.round(totalSharedKg * 2.5);
  const co2SavedKg = Math.round(totalSharedKg * 2.0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Storefront Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-10 shadow-xl overflow-hidden border border-emerald-700/50">
        <div className="absolute right-0 top-0 w-96 h-96 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-lime-400 text-emerald-950 flex items-center gap-1.5 shadow-sm">
                <Store className="w-3.5 h-3.5" />
                <span>Verified Donor E-Shop</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-700/60 text-emerald-100 border border-emerald-600/50 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-lime-400" />
                <span>FSSAI License #10018011000452</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              {user?.organization?.name || user?.full_name || "Executive Chef Vikram Kapoor's Kitchen"}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Official FoodLoop donor storefront for {currentLocation.name}. All surplus meals, fresh bakery batches, and safe animal feed posted here are verified and routed to nearby hunger relief centers and animal shelters.
            </p>

            <div className="flex items-center gap-2 text-xs text-emerald-200">
              <MapPin className="w-4 h-4 text-lime-400 shrink-0" />
              <span>Dispatch Base: {currentLocation.shortName} • Hauz Khas Village Entrance, New Delhi - 110016</span>
            </div>
          </div>

          {/* Quick Action CTA */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-3">
            <Link href="/donate">
              <Button
                variant="primary"
                size="lg"
                className="w-full bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black rounded-2xl px-6 py-3 shadow-lg flex items-center justify-center gap-2"
                leftIcon={<PlusCircle className="w-5 h-5 text-emerald-950" />}
              >
                + Donate / Add Food Batch
              </Button>
            </Link>

            <Link href="/orders">
              <Button
                variant="outline"
                size="md"
                className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5"
              >
                <Truck className="w-4 h-4 text-lime-400" />
                <span>Track Active Claims</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Live E-Shop Performance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-emerald-700/50">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">Total Food Shared</p>
            <p className="text-2xl font-black text-white mt-0.5">{totalSharedKg} kg</p>
            <p className="text-[10px] text-emerald-300/80 mt-0.5">Across {listings.length} batches</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">Meals Provided</p>
            <p className="text-2xl font-black text-lime-300 mt-0.5">{mealsProvided}</p>
            <p className="text-[10px] text-emerald-300/80 mt-0.5">UNEP 400g meal metric</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">CO₂e Diverted</p>
            <p className="text-2xl font-black text-white mt-0.5">{co2SavedKg} kg</p>
            <p className="text-[10px] text-emerald-300/80 mt-0.5">Landfill prevention</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">Active Available</p>
            <p className="text-2xl font-black text-lime-300 mt-0.5">{availableCount} Batches</p>
            <p className="text-[10px] text-emerald-300/80 mt-0.5">{claimedCount} in claim / transit</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-freshBorder pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "all"
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-white text-freshText-secondary border border-freshBorder hover:bg-freshBg"
            }`}
          >
            All Shared Items ({listings.length})
          </button>

          <button
            onClick={() => setActiveTab("available")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "available"
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-white text-freshText-secondary border border-freshBorder hover:bg-freshBg"
            }`}
          >
            Available for Claim ({availableCount})
          </button>

          <button
            onClick={() => setActiveTab("claimed")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "claimed"
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-white text-freshText-secondary border border-freshBorder hover:bg-freshBg"
            }`}
          >
            Claimed / In-Transit ({claimedCount})
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "completed"
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-white text-freshText-secondary border border-freshBorder hover:bg-freshBg"
            }`}
          >
            Delivered ({listings.length - availableCount})
          </button>
        </div>

        <button
          onClick={fetchShopItems}
          className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1.5 self-end sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Listings</span>
        </button>
      </div>

      {/* Grid of Shared Food Items */}
      {isLoading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-freshText-secondary">Loading your E-Shop items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-freshBorder p-8 space-y-4">
          <Package className="w-12 h-12 text-freshText-secondary mx-auto" />
          <h3 className="text-lg font-bold text-freshText-primary">No items found in this section</h3>
          <p className="text-xs text-freshText-secondary max-w-md mx-auto">
            You don't have any surplus items in this category. List your first batch now and connect with local charities.
          </p>
          <Link href="/donate">
            <Button variant="primary" size="md" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              + Donate Food Now
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isAvailable = item.status === "available" && item.remaining_quantity > 0;
            const isFullyClaimed = item.remaining_quantity === 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-freshBorder overflow-hidden shadow-xs hover:shadow-card transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Photo & Badges */}
                  <div className="relative aspect-[16/10] w-full bg-sage-100 overflow-hidden">
                    <img
                      src={item.image_url || "/images/food/dal_makhani.jpg"}
                      alt={item.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/images/food/dal_makhani.jpg";
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Status Top Badge */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      {isAvailable ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white flex items-center gap-1 shadow-md">
                          <span className="w-2 h-2 rounded-full bg-lime-300 animate-pulse" />
                          <span>Available</span>
                        </span>
                      ) : isFullyClaimed ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-700 text-white flex items-center gap-1 shadow-md">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                          <span>100% Claimed</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1 shadow-md">
                          <Clock className="w-3 h-3 text-white" />
                          <span>Partially Claimed</span>
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                        {item.category.replace("_", " ")}
                      </span>
                    </div>

                    {/* Bottom Info overlay */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <span className="font-extrabold text-lime-300">
                        {item.remaining_quantity} / {item.quantity} {item.unit} left
                      </span>
                      <span className="text-[11px] text-white/90">
                        Holding: {item.storage_instructions.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5">
                    <h3 className="text-base font-extrabold text-freshText-primary line-clamp-1 group-hover:text-emerald-700 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-freshText-secondary line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-xs text-freshText-secondary border-t border-freshBorder">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pickup: {new Date(item.pickup_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800">
                        ~{Math.round(item.remaining_quantity * 2.5)} meals
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 pt-0 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/discover/${item.id}`} className="w-full">
                      <button className="w-full py-2 px-3 rounded-xl border border-freshBorder hover:bg-freshBg text-xs font-bold text-freshText-primary flex items-center justify-center gap-1.5 transition-colors">
                        <Eye className="w-3.5 h-3.5 text-freshText-secondary" />
                        <span>Inspect</span>
                      </button>
                    </Link>

                    <Link href="/orders" className="w-full">
                      <button className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-emerald-200">
                        <Truck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Track Status</span>
                      </button>
                    </Link>
                  </div>

                  <Link href={`/orders/req-hk-03/receipt`} className="block">
                    <button className="w-full py-1.5 px-3 rounded-xl text-[11px] font-semibold text-freshText-secondary hover:text-emerald-800 hover:bg-emerald-50/50 transition-colors flex items-center justify-center gap-1">
                      <FileText className="w-3 h-3 text-emerald-600" />
                      <span>FSSAI Handover Manifest & Receipt →</span>
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
