"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useLocation, POPULAR_LOCATIONS } from "@/hooks/useLocation";
import { MapPin, Navigation, Check, Search, Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LocationModal() {
  const { 
    currentLocation, 
    setLocation, 
    isModalOpen, 
    closeModal, 
    detectGPSLocation, 
    isDetectingGPS,
    gpsError 
  } = useLocation();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredLocations = POPULAR_LOCATIONS.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.area.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title="Choose Your Rescue Location"
      maxWidth="md"
    >
      <div className="space-y-4">
        <p className="text-xs text-freshText-secondary">
          FoodLoop shows available surplus food sorted by proximity to your selected hub or live GPS position.
        </p>

        {/* Live GPS Detection Button */}
        <button
          onClick={detectGPSLocation}
          disabled={isDetectingGPS}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-lime/20 border border-lime-400 hover:bg-lime/30 transition-colors text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime flex items-center justify-center text-freshText-primary shadow-xs">
              <Navigation className={`w-4 h-4 ${isDetectingGPS ? "animate-spin text-freshText-primary" : "text-freshText-primary"}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-freshText-primary flex items-center gap-1.5">
                <span>Use Current Device Location</span>
                {currentLocation.id === "gps" && (
                  <span className="text-[10px] bg-[#258A54] text-white px-2 py-0.2 rounded-full font-bold">Active</span>
                )}
              </p>
              <p className="text-[11px] text-freshText-secondary">
                {isDetectingGPS ? "Detecting high-precision GPS coordinates..." : "Detect exact latitude & longitude via browser"}
              </p>
            </div>
          </div>
          <Compass className="w-4 h-4 text-freshText-secondary group-hover:text-freshText-primary" />
        </button>

        {gpsError && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{gpsError}</span>
          </div>
        )}

        {/* Search input for locations */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-freshText-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Delhi NCR neighborhoods (e.g. Connaught Place, Chanakyapuri)..."
            className="w-full pl-10 pr-4 py-2.5 bg-freshBg border border-freshBorder rounded-xl text-xs text-freshText-primary placeholder:text-freshText-secondary focus:outline-none focus:ring-1 focus:ring-lime-500 font-medium"
          />
        </div>

        {/* Popular Delhi NCR Location Hubs List */}
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-freshText-secondary px-1">
            Popular Rescue Hubs
          </p>

          {filteredLocations.map((loc) => {
            const isSelected = currentLocation.id === loc.id;
            return (
              <button
                key={loc.id}
                onClick={() => setLocation(loc)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                  isSelected
                    ? "bg-white border-[#258A54] shadow-xs"
                    : "bg-white border-freshBorder hover:bg-freshBg"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-[#258A54] text-white" : "bg-freshBg text-freshText-secondary"
                  }`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-freshText-primary truncate">
                      {loc.name}
                    </p>
                    <p className="text-[11px] text-freshText-secondary truncate">
                      {loc.area} • ({loc.latitude}, {loc.longitude})
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#258A54] flex items-center justify-center text-white shrink-0 ml-2">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-freshBorder flex items-center justify-between">
          <p className="text-[11px] text-freshText-secondary">
            Current: <strong className="text-freshText-primary">{currentLocation.shortName}</strong>
          </p>
          <Button variant="ghost" size="sm" onClick={closeModal} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
