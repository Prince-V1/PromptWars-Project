"use client";

import React, { useEffect, useRef } from "react";
import { FoodListing } from "@/types";

interface FoodMapProps {
  listings: FoodListing[];
  selectedListingId?: string;
  onSelectListing?: (listing: FoodListing) => void;
  center?: [number, number];
  zoom?: number;
}

export function FoodMap({
  listings,
  onSelectListing,
  center = [28.6139, 77.2090], // Default Delhi NCR
  zoom = 12,
}: FoodMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Fix default marker icon assets
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current).setView(center, zoom);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Clear existing markers
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];

      // Custom marker icon style
      const createCustomIcon = (isUrgent: boolean) =>
        L.divIcon({
          className: "custom-leaflet-marker",
          html: `<div style="background-color: ${
            isUrgent ? "#D5F34A" : "#258A54"
          }; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; font-size: 14px;">🍲</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

      listings.forEach((listing) => {
        if (!listing.latitude || !listing.longitude) return;

        const isUrgent = listing.priority_score >= 60;
        const marker = L.marker([listing.latitude, listing.longitude], {
          icon: createCustomIcon(isUrgent),
        }).addTo(map);

        const popupContent = document.createElement("div");
        popupContent.style.padding = "4px";
        popupContent.innerHTML = `
          <div style="font-family: inherit; max-width: 200px;">
            <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #73776D; margin: 0;">${listing.category.replace("_", " ")}</p>
            <h4 style="font-size: 13px; font-weight: bold; color: #171916; margin: 2px 0 6px 0;">${listing.title}</h4>
            <p style="font-size: 12px; font-weight: 600; color: #258A54; margin: 0 0 6px 0;">${listing.remaining_quantity} ${listing.unit} available</p>
            <p style="font-size: 11px; color: #73776D; margin: 0;">${listing.pickup_address}</p>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on("click", () => {
          if (onSelectListing) onSelectListing(listing);
        });

        markersRef.current.push(marker);
      });
    });

    return () => {
      isMounted = false;
    };
  }, [listings, center, zoom, onSelectListing]);

  return (
    <div className="relative w-full h-[450px] rounded-3xl border border-freshBorder overflow-hidden shadow-card">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-freshBorder shadow-subtle text-xs font-semibold text-freshText-primary z-10 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-lime border border-black/20" />
        <span>Live Food Rescue Map ({listings.length} active listings)</span>
      </div>
    </div>
  );
}
