"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Building2, MapPin, Phone, ShieldCheck, 
  Search, ArrowRight, Utensils, Store, Hotel, Cake, Loader2,
  CalendarCheck, Sparkles
} from "lucide-react";
import { api } from "@/lib/api";
import { Organization } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { useLocation } from "@/hooks/useLocation";

export default function DonorsDirectoryPage() {
  const [donors, setDonors] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const { currentLocation, openModal } = useLocation();

  useEffect(() => {
    setIsLoading(true);
    api.getDonors()
      .then((data) => setDonors(data))
      .catch((err) => console.error("Failed to load donors:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const donorTypes = [
    { id: "all", label: "All Donors", icon: Store },
    { id: "banquet_hall", label: "Banquet Halls", icon: Building2 },
    { id: "catering_company", label: "Caterers", icon: Utensils },
    { id: "wedding_venue", label: "Wedding Venues", icon: CalendarCheck },
    { id: "hotel", label: "Hotels", icon: Hotel },
    { id: "restaurant", label: "Restaurants", icon: Utensils },
    { id: "bakery", label: "Bakeries", icon: Cake },
    { id: "grocery_store", label: "Grocery & Marts", icon: Store },
    { id: "wedding_organizer", label: "Wedding Organizers", icon: CalendarCheck },
    { id: "event_management", label: "Event Companies", icon: Sparkles },
    { id: "corporate_event_organizer", label: "Corporate Galas", icon: Building2 },
  ];

  const filteredDonors = useMemo(() => {
    return donors.filter((d) => {
      const matchesSearch = 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.city.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = 
        selectedType === "all" || 
        d.organization_type.toLowerCase() === selectedType.toLowerCase() ||
        (selectedType === "grocery_store" && d.organization_type.toLowerCase() === "supermarket");

      return matchesSearch && matchesType;
    });
  }, [donors, searchQuery, selectedType]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 rounded-4xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-white">
            <ShieldCheck className="w-4 h-4 text-lime-300" />
            <span>100% FSSAI & Govt Verified Partners</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Partner Food Donors & Shops
          </h1>
          <p className="text-sm sm:text-base text-white/90 leading-relaxed">
            Discover verified restaurants, hotels, bakeries, and markets donating surplus quality meals across Delhi NCR. Inspect donor profiles, rescue histories, and live available batches.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={openModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-xs font-semibold text-white transition-all border border-white/30"
            >
              <MapPin className="w-3.5 h-3.5 text-lime-300" />
              <span>Near {currentLocation.name} ({currentLocation.area})</span>
              <span className="underline ml-1">Change</span>
            </button>
            <span className="text-xs text-white/80">
              • {donors.length} active registered establishments
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by restaurant or shop name, area..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-freshBorder text-xs text-freshText-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-subtle"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {donorTypes.map((t) => {
            const Icon = t.icon;
            const isSelected = selectedType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-red-600 text-white border-red-600 shadow-md"
                    : "bg-white text-freshText-secondary border-freshBorder hover:border-gray-300 hover:text-freshText-primary"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Donors Grid */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          <p className="text-xs text-freshText-secondary font-medium">Loading verified food donors...</p>
        </div>
      ) : filteredDonors.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-freshBorder">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-freshText-primary">No donor shops found</h3>
          <p className="text-xs text-freshText-secondary mt-1">
            Try adjusting your search query or selecting &quot;All Donors&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonors.map((donor) => (
            <div
              key={donor.id}
              className="bg-white rounded-3xl border border-freshBorder shadow-card hover:shadow-hover transition-all duration-300 flex flex-col overflow-hidden group"
            >
              {/* Top Accent Strip & Header */}
              <div className="h-3 bg-gradient-to-r from-red-500 to-amber-500" />
              
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 font-extrabold text-base shrink-0 group-hover:scale-105 transition-transform">
                      {donor.name.charAt(0)}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="success" size="sm">
                        <ShieldCheck className="w-3 h-3 mr-1 inline" />
                        Verified
                      </Badge>
                      <span className="text-[10px] uppercase font-bold text-freshText-secondary tracking-wider">
                        {donor.organization_type.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-freshText-primary group-hover:text-red-600 transition-colors">
                      {donor.name}
                    </h3>
                    <p className="text-xs text-freshText-secondary mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="line-clamp-1">{donor.address}, {donor.city}</span>
                    </p>
                  </div>

                  {/* Details Pill grid */}
                  <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-freshText-secondary">
                    <div className="p-2 bg-freshBg rounded-xl border border-freshBorder">
                      <span className="block text-[10px] uppercase font-bold text-gray-400">Daily Capacity</span>
                      <span className="font-bold text-freshText-primary">{donor.capacity_servings_per_day} servings</span>
                    </div>
                    <div className="p-2 bg-freshBg rounded-xl border border-freshBorder">
                      <span className="block text-[10px] uppercase font-bold text-gray-400">Reg / FSSAI</span>
                      <span className="font-bold text-freshText-primary truncate block" title={donor.registration_number || "Active"}>
                        {donor.registration_number ? donor.registration_number.slice(0, 10) + "..." : "Verified"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-freshBorder flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-freshText-secondary">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{donor.contact_phone}</span>
                  </div>

                  <Link
                    href={`/donors/${donor.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                  >
                    <span>View Shop</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
