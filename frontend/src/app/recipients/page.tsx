"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Building2, MapPin, Phone, ShieldCheck, 
  Search, ArrowRight, Heart, Sparkles, Filter,
  CheckCircle2, AlertCircle, Info, ExternalLink,
  ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";
import { RecipientOrganizationDetails, AnimalSpecies } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useLocation } from "@/hooks/useLocation";

export default function RecipientsDirectoryPage() {
  const [recipients, setRecipients] = useState<RecipientOrganizationDetails[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "animal_care" | "human">("animal_care");
  const [selectedSpecies, setSelectedSpecies] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const { currentLocation, openModal } = useLocation();

  useEffect(() => {
    setIsLoading(true);
    api.getRecipients()
      .then((data) => setRecipients(data))
      .catch((err) => console.error("Failed to load recipients:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const animalOrgTypes = [
    { id: "all", label: "All Animal Types" },
    { id: "gaushala", label: "Gaushalas" },
    { id: "animal_shelter", label: "Animal Shelters" },
    { id: "animal_rescue_centre", label: "Rescue Centres" },
    { id: "veterinary_hospital", label: "Vet Hospitals" },
    { id: "animal_welfare_ngo", label: "Animal NGOs" },
    { id: "livestock_care_centre", label: "Livestock Centres" },
  ];

  const speciesFilters: { id: string; label: string; icon: string }[] = [
    { id: "all", label: "All Species", icon: "🐾" },
    { id: "cows", label: "Cows & Bulls", icon: "🐄" },
    { id: "dogs", label: "Dogs & Pups", icon: "🐕" },
    { id: "cats", label: "Cats", icon: "🐈" },
    { id: "goats", label: "Goats & Sheep", icon: "🐐" },
    { id: "birds", label: "Birds & Pigeons", icon: "🕊️" },
  ];

  const filteredRecipients = useMemo(() => {
    return recipients.filter((r) => {
      // 1. Tab filter (animal_care vs human vs all)
      if (activeTab === "animal_care" && r.recipient_category !== "animal_care") return false;
      if (activeTab === "human" && r.recipient_category === "animal_care") return false;

      // 2. Type filter
      if (selectedType !== "all" && r.organization_type.toLowerCase() !== selectedType.toLowerCase()) {
        return false;
      }

      // 3. Species filter (only for animal care)
      if (selectedSpecies !== "all") {
        if (!r.supported_species || r.supported_species.length === 0) return false;
        const matchesSp = r.supported_species.some(s => {
          if (selectedSpecies === "cows") return ["cows", "bulls", "buffaloes"].includes(s.toLowerCase());
          if (selectedSpecies === "goats") return ["goats", "sheep"].includes(s.toLowerCase());
          return s.toLowerCase() === selectedSpecies.toLowerCase();
        });
        if (!matchesSp) return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(query);
        const matchesAddr = r.address.toLowerCase().includes(query);
        const matchesCity = r.city.toLowerCase().includes(query);
        const matchesDesc = (r.description || "").toLowerCase().includes(query);
        return matchesName || matchesAddr || matchesCity || matchesDesc;
      }

      return true;
    });
  }, [recipients, activeTab, selectedType, selectedSpecies, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-amber-700 rounded-4xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-white">
            <span className="text-amber-300">🐾</span>
            <span>Segregated Human Relief & Animal Welfare Ecosystem</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Animal Care Organizations & Recipient Sanctuaries
          </h1>

          <p className="text-sm sm:text-base text-white/90 leading-relaxed max-w-2xl">
            FoodLoop keeps human meal redistribution and animal-feed distribution strictly separate. Connect directly with registered <strong>Gaushalas, animal rescue centres, veterinary hospitals, and livestock sanctuaries</strong> to route safe, species-appropriate surplus produce and feeds.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={openModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-xs font-semibold text-white transition-all border border-white/30"
            >
              <MapPin className="w-3.5 h-3.5 text-lime-300" />
              <span>Near {currentLocation.name} ({currentLocation.area})</span>
              <span className="underline ml-1">Change</span>
            </button>
            <Link href="/(auth)/register">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md">
                + Register Animal Care Org
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative backdrop glow */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      </div>

      {/* Primary Category Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-freshBorder pb-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => { setActiveTab("animal_care"); setSelectedType("all"); }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "animal_care"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white border border-freshBorder text-freshText-secondary hover:text-freshText-primary"
            }`}
          >
            <span>🐾</span>
            <span>Animal Care & Gaushalas ({recipients.filter(r => r.recipient_category === "animal_care").length})</span>
          </button>

          <button
            onClick={() => { setActiveTab("human"); setSelectedType("all"); }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "human"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white border border-freshBorder text-freshText-secondary hover:text-freshText-primary"
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-red-400" />
            <span>Human Relief NGOs ({recipients.filter(r => r.recipient_category !== "animal_care").length})</span>
          </button>

          <button
            onClick={() => { setActiveTab("all"); setSelectedType("all"); }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "all"
                ? "bg-gray-800 text-white shadow-sm"
                : "bg-white border border-freshBorder text-freshText-secondary hover:text-freshText-primary"
            }`}
          >
            All Organizations ({recipients.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sanctuary, city, breed..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-freshBorder rounded-2xl text-xs text-freshText-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-subtle"
          />
        </div>
      </div>

      {/* Sub-Filters: Species & Facility Type (When in Animal Care or All) */}
      {activeTab !== "human" && (
        <div className="space-y-3 p-4 bg-freshBg rounded-3xl border border-freshBorder">
          {/* Species Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[11px] uppercase font-bold text-freshText-secondary mr-2 shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Species:
            </span>
            {speciesFilters.map((sp) => {
              const isSelected = selectedSpecies === sp.id;
              return (
                <button
                  key={sp.id}
                  onClick={() => setSelectedSpecies(sp.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1 ${
                    isSelected
                      ? "bg-amber-600 text-white font-bold shadow-xs"
                      : "bg-white border border-freshBorder text-freshText-secondary hover:border-amber-300"
                  }`}
                >
                  <span>{sp.icon}</span>
                  <span>{sp.label}</span>
                </button>
              );
            })}
          </div>

          {/* Facility Type Chips */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-2 border-t border-freshBorder/50">
            <span className="text-[11px] uppercase font-bold text-freshText-secondary mr-2 shrink-0">
              Facility:
            </span>
            {animalOrgTypes.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all shrink-0 ${
                    isSelected
                      ? "bg-amber-100 text-amber-900 border border-amber-300 font-bold"
                      : "bg-white border border-freshBorder text-freshText-secondary hover:text-freshText-primary"
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Feed Safety Protocol Ribbon for Animal Care */}
      {activeTab === "animal_care" && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Strict Species-Safe Feed Attestation</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Animal donations must be 100% free of plastics, packaging, and species toxins. Ruminants (Cattle/Goats) require plain greens & grains (strictly NO meat/onions). Canines require unseasoned foods (strictly NO chocolate/onions/garlic/grapes).
              </p>
            </div>
          </div>
          <Link href="/donate?beneficiary=animal_feed" className="shrink-0">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs whitespace-nowrap shadow-sm">
              Post Animal Feed →
            </Button>
          </Link>
        </div>
      )}

      {/* Recipient Cards Grid */}
      {isLoading ? (
        <div className="p-16 text-center">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-freshText-secondary">Loading verified organizations...</p>
        </div>
      ) : filteredRecipients.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-4xl border border-freshBorder space-y-3">
          <span className="text-4xl block">🐾</span>
          <h3 className="font-bold text-sm text-freshText-primary">No Matching Organizations Found</h3>
          <p className="text-xs text-freshText-secondary max-w-md mx-auto">
            Try adjusting your search criteria, selected species, or facility filter.
          </p>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => { setSelectedSpecies("all"); setSelectedType("all"); setSearchQuery(""); }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipients.map((org) => {
            const isAnimal = org.recipient_category === "animal_care";
            const defaultImage = isAnimal
              ? org.image_url || "/images/animal_care/gaushala.jpg"
              : "/images/recipients/ngo_default.jpg";

            return (
              <Card 
                key={org.id} 
                className="overflow-hidden hover:border-amber-400 hover:shadow-subtle transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Header */}
                  <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                    <img
                      src={org.image_url || defaultImage}
                      alt={`${org.name} - ${org.organization_type}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs ${
                        isAnimal
                          ? "bg-amber-600 text-white"
                          : "bg-emerald-600 text-white"
                      }`}>
                        {org.organization_type.replace(/_/g, " ")}
                      </span>
                      {isAnimal && (
                        <span className="text-[10px] bg-black/60 backdrop-blur-md text-white font-bold px-2 py-0.5 rounded-full">
                          🐾 Animal Care
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-green-700 shadow-xs">
                        <ShieldCheck className="w-3 h-3 text-green-600" />
                        <span>Verified</span>
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-extrabold text-base text-freshText-primary group-hover:text-amber-700 transition-colors line-clamp-1">
                        {org.name}
                      </h3>
                      <p className="text-xs text-freshText-secondary line-clamp-2 mt-1">
                        {org.description || `Registered ${org.organization_type} dedicated to community feeding and welfare across ${org.city}.`}
                      </p>
                    </div>

                    {/* Supported Species Badges (for Animal Care) */}
                    {isAnimal && org.supported_species && org.supported_species.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-freshBorder">
                        <span className="text-[10px] uppercase font-bold text-freshText-secondary block">
                          Supported Species:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {org.supported_species.map((sp) => (
                            <span 
                              key={sp} 
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200"
                            >
                              {sp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Address & Meta */}
                    <div className="space-y-1.5 text-xs text-freshText-secondary pt-2 border-t border-freshBorder">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{org.address}, {org.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{org.contact_phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-freshText-primary font-semibold">
                        <span>Capacity: {org.capacity_servings_per_day} {isAnimal ? "kg/day" : "servings/day"}</span>
                        {org.registration_number && (
                          <span className="text-gray-400 font-normal truncate">• Reg: {org.registration_number}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-freshBg border-t border-freshBorder flex items-center justify-between">
                  <Link 
                    href={`/donate?target=${org.id}&type=${org.organization_type}&beneficiary=${isAnimal ? 'animal_feed' : 'human'}`}
                    className="w-full"
                  >
                    <Button 
                      size="sm" 
                      className={`w-full font-bold text-xs ${
                        isAnimal 
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs" 
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      }`}
                    >
                      <span>{isAnimal ? "Donate Animal Feed" : "Donate Meals"}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
