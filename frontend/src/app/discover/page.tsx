"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FoodListing } from "@/types";
import { api } from "@/lib/api";
import { FoodCard } from "@/components/food/FoodCard";
import { FoodFilters } from "@/components/food/FoodFilters";
import { FoodMap } from "@/components/food/FoodMap";
import { RequestModal } from "@/components/food/RequestModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Map, LayoutGrid, AlertCircle, Loader2, MapPin } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";

export default function DiscoverPage() {
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [dietary, setDietary] = useState<string>("");
  const [maxDistance, setMaxDistance] = useState<number>(30);
  const [statusFilter, setStatusFilter] = useState<string>("available");
  const [urgentOnly, setUrgentOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("priority");

  // View state: grid or map
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  // Request modal state
  const [selectedListingForRequest, setSelectedListingForRequest] = useState<FoodListing | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [requestSuccessBanner, setRequestSuccessBanner] = useState<string | null>(null);

  const { currentLocation, openModal } = useLocation();

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getFoodListings({
        category: category || undefined,
        dietary_type: dietary || undefined,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        // Dynamic coordinates from selected location hub or GPS
        latitude: currentLocation?.latitude ?? 28.6328,
        longitude: currentLocation?.longitude ?? 77.2197,
        max_distance_km: maxDistance || undefined,
      });
      setListings(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load food listings.");
    } finally {
      setIsLoading(false);
    }
  }, [category, dietary, statusFilter, maxDistance, search, currentLocation?.latitude, currentLocation?.longitude]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Client-side filtering & sorting for instant responsiveness
  const processedListings = useMemo(() => {
    let result = [...listings];

    if (urgentOnly) {
      result = result.filter((l) => l.priority_score >= 65);
    }

    if (sortBy === "distance") {
      result.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
    } else if (sortBy === "quantity") {
      result.sort((a, b) => b.remaining_quantity - a.remaining_quantity);
    } else {
      // Default: priority / urgency
      result.sort((a, b) => b.priority_score - a.priority_score);
    }

    return result;
  }, [listings, urgentOnly, sortBy]);

  const handleOpenRequest = (listing: FoodListing) => {
    setSelectedListingForRequest(listing);
    setIsRequestModalOpen(true);
  };

  const handleRequestSuccess = () => {
    setRequestSuccessBanner("Donation request submitted successfully! The food provider will review it shortly.");
    fetchListings();
    setTimeout(() => setRequestSuccessBanner(null), 6000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-freshText-primary tracking-tight">
            Explore Surplus Food
          </h1>
          <p className="text-xs sm:text-sm text-freshText-secondary mt-1">
            Browse edible surplus meals and groceries ready for immediate rescue in Delhi NCR.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-freshBorder shadow-subtle self-start sm:self-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              viewMode === "grid"
                ? "bg-lime text-freshText-primary"
                : "text-freshText-secondary hover:text-freshText-primary"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              viewMode === "map"
                ? "bg-lime text-freshText-primary"
                : "text-freshText-secondary hover:text-freshText-primary"
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {requestSuccessBanner && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-3xl text-xs font-semibold text-freshSuccess flex items-center justify-between animate-fade-in">
          <span>{requestSuccessBanner}</span>
          <button onClick={() => setRequestSuccessBanner(null)} className="underline ml-4">Dismiss</button>
        </div>
      )}

      {/* Location Filter Pill Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-red-50 to-amber-50/50 rounded-2xl border border-red-100">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-freshText-primary">Showing food near {currentLocation?.name ?? "Delhi NCR"}</span>
            <span className="text-freshText-secondary ml-1.5 hidden sm:inline">({currentLocation?.area ?? "Central Delhi"}) • Distances dynamically calculated</span>
          </div>
        </div>

        <button
          onClick={openModal}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 border border-red-200 text-xs font-bold text-red-600 transition-all shadow-subtle shrink-0"
        >
          Change Location ▾
        </button>
      </div>

      {/* Filters Component */}
      <FoodFilters
        search={search}
        onSearchChange={setSearch}
        selectedCategory={category}
        onCategoryChange={setCategory}
        selectedDietary={dietary}
        onDietaryChange={setDietary}
        maxDistance={maxDistance}
        onDistanceChange={setMaxDistance}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        urgentOnly={urgentOnly}
        onUrgentToggle={setUrgentOnly}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-3xl text-xs text-freshError flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
          <Button variant="ghost" size="sm" onClick={fetchListings} className="ml-auto">
            Retry
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-lime-600" />
          <p className="text-xs text-freshText-secondary font-medium">Loading surplus food listings...</p>
        </div>
      ) : viewMode === "map" ? (
        /* Map View */
        <FoodMap
          listings={processedListings}
          onSelectListing={(l) => handleOpenRequest(l)}
        />
      ) : processedListings.length === 0 ? (
        /* Empty State */
        <EmptyState
          title="No food listings found"
          description="Try broadening your distance radius, clearing Pure Veg, or selecting a different food category."
          actionLabel="Clear Filters"
          onAction={() => {
            setCategory("");
            setDietary("");
            setSearch("");
            setUrgentOnly(false);
            setMaxDistance(50);
          }}
        />
      ) : (
        /* Grid View with Zomato Arrangement */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedListings.map((listing) => (
            <FoodCard
              key={listing.id}
              listing={listing}
              onRequest={handleOpenRequest}
            />
          ))}
        </div>
      )}

      {/* Request Food Modal */}
      <RequestModal
        listing={selectedListingForRequest}
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={handleRequestSuccess}
      />
    </div>
  );
}
