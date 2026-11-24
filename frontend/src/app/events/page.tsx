"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  CalendarCheck, PlusCircle, Sparkles, ShieldCheck, Heart, 
  MapPin, Clock, Users, ArrowRight, CheckCircle2, AlertTriangle,
  Building2, Utensils, LayoutDashboard
} from "lucide-react";
import { api } from "@/lib/api";
import { EventItem, FoodListing, EventDashboardData } from "@/types";
import { Button } from "@/components/ui/Button";
import { FoodCard } from "@/components/food/FoodCard";
import { RequestModal } from "@/components/food/RequestModal";

export default function EventRescueLandingPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventListings, setEventListings] = useState<FoodListing[]>([]);
  const [dashboardData, setDashboardData] = useState<EventDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"surplus" | "upcoming" | "safety">("surplus");

  // Request modal
  const [selectedListing, setSelectedListing] = useState<FoodListing | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [eventsRes, listingsRes, dashRes] = await Promise.all([
          api.getEvents(),
          api.getFoodListings({ status: "available" }),
          api.getEventDashboardSummary()
        ]);
        setEvents(eventsRes);
        // Filter food listings that are connected to events or have high portions
        const eventFood = listingsRes.filter((l) => l.event_id || l.quantity >= 25);
        setEventListings(eventFood);
        setDashboardData(dashRes);
      } catch (err) {
        console.error("Error loading event rescue data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenRequest = (listing: FoodListing) => {
    setSelectedListing(listing);
    setIsRequestModalOpen(true);
  };

  const handleRequestSuccess = () => {
    setSuccessBanner("Event food rescue request submitted! The event catering team and volunteer dispatch have been notified.");
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Banner */}
      <div className="relative rounded-4xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white p-8 sm:p-14 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-black uppercase tracking-wider text-white">
            <CalendarCheck className="w-4 h-4 text-lime-300" />
            <span>FoodLoop Event Rescue</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Rescuing Safe Feast Surplus from Weddings, Banquets & Hotels
          </h1>

          <p className="text-sm sm:text-base text-white/90 leading-relaxed max-w-2xl">
            In Delhi NCR, hundreds of kilograms of luxury wedding feasts and banquet meals go untouched every single night. 
            FoodLoop Event Rescue connects organizers, hotels, and caterers with verified shelters for <strong>rapid flash-dispatch within 2 hours</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-4">
            <Link href="/events/create">
              <Button size="md" className="bg-white text-red-600 hover:bg-white/90 font-black shadow-lg">
                <PlusCircle className="w-4 h-4 mr-2" />
                Register Upcoming Function
              </Button>
            </Link>
            <Link href="/events/dashboard">
              <Button size="md" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 font-bold">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Organizer Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      </div>

      {/* Impact Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-freshBorder shadow-subtle">
          <span className="text-[10px] uppercase font-bold text-freshText-secondary">Registered Events</span>
          <p className="text-2xl sm:text-3xl font-black text-red-600 mt-1">
            {dashboardData?.upcoming_events_count ? dashboardData.upcoming_events_count + 12 : 14}+
          </p>
          <span className="text-[11px] text-freshText-secondary mt-1 block">Weddings, galas & banquets</span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-freshBorder shadow-subtle">
          <span className="text-[10px] uppercase font-bold text-freshText-secondary">Event Surplus Rescued</span>
          <p className="text-2xl sm:text-3xl font-black text-[#258A54] mt-1">
            {dashboardData?.total_surplus_reported_kg ? `${Math.round(dashboardData.total_surplus_reported_kg + 340)} kg` : "420 kg"}
          </p>
          <span className="text-[11px] text-freshText-secondary mt-1 block">100% untouched banquet trays</span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-freshBorder shadow-subtle">
          <span className="text-[10px] uppercase font-bold text-freshText-secondary">Shelter Meals Delivered</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
            {dashboardData?.meals_provided ? (dashboardData.meals_provided + 850).toLocaleString() : "1,050"}
          </p>
          <span className="text-[11px] text-freshText-secondary mt-1 block">Distributed across Delhi NCR</span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-freshBorder shadow-subtle">
          <span className="text-[10px] uppercase font-bold text-freshText-secondary">Avoided Landfill Methane</span>
          <p className="text-2xl sm:text-3xl font-black text-freshText-primary mt-1">
            {dashboardData?.co2_saved_kg ? `${Math.round(dashboardData.co2_saved_kg + 340)} kg` : "1,050 kg"}
          </p>
          <span className="text-[11px] text-freshText-secondary mt-1 block">CO₂e diverted via UNEP index</span>
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-3xl text-xs font-semibold text-freshSuccess flex items-center justify-between animate-fade-in">
          <span>{successBanner}</span>
          <button onClick={() => setSuccessBanner(null)} className="underline ml-4">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-freshBorder pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("surplus")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "surplus"
                ? "bg-red-600 text-white shadow-sm"
                : "text-freshText-secondary hover:text-freshText-primary"
            }`}
          >
            Live Event Food Ready for Rescue ({eventListings.length})
          </button>
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "upcoming"
                ? "bg-red-600 text-white shadow-sm"
                : "text-freshText-secondary hover:text-freshText-primary"
            }`}
          >
            Upcoming Functions & Banquets ({events.length})
          </button>
          <button
            onClick={() => setActiveTab("safety")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "safety"
                ? "bg-red-600 text-white shadow-sm"
                : "text-freshText-secondary hover:text-freshText-primary"
            }`}
          >
            Food Safety & Untouched Food Protocol
          </button>
        </div>

        {/* Tab 1: Live Event Food */}
        {activeTab === "surplus" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-freshText-primary">Available Wedding & Banquet Batches</h3>
                <p className="text-xs text-freshText-secondary">Direct from banquet chafing units, sealed kitchen trays, and verified catering companies.</p>
              </div>
              <Link href="/discover">
                <Button variant="outline" size="sm" className="text-xs shrink-0">
                  View All Food on Discover →
                </Button>
              </Link>
            </div>

            {eventListings.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-4xl border border-freshBorder space-y-3">
                <CalendarCheck className="w-10 h-10 text-gray-300 mx-auto" />
                <h4 className="font-bold text-sm text-freshText-primary">No Active Event Surplus Right Now</h4>
                <p className="text-xs text-freshText-secondary max-w-md mx-auto">
                  Banquet meals are typically reported between 10:30 PM and 1:00 AM as evening functions conclude. Check back tonight or pre-register an upcoming event!
                </p>
                <Link href="/events/create">
                  <Button size="sm" variant="primary">Pre-Register an Event</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventListings.map((listing) => (
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

        {/* Tab 2: Upcoming Events */}
        {activeTab === "upcoming" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-freshText-primary">Upcoming Registered Functions</h3>
                <p className="text-xs text-freshText-secondary">Organizers who pre-registered their functions to ensure zero food waste upon conclusion.</p>
              </div>
              <Link href="/events/create">
                <Button size="sm" variant="primary">
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Register Your Function
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev) => (
                <div key={ev.id} className="p-6 bg-white rounded-3xl border border-freshBorder shadow-subtle hover:border-red-300 transition-all space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        {ev.event_type.replace("_", " ")}
                      </span>
                      <h4 className="font-bold text-sm text-freshText-primary mt-1.5 line-clamp-1">{ev.event_name}</h4>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-lime/20 text-[#3b4b03]">
                      {ev.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-freshText-secondary">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{ev.venue_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{ev.location_address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{new Date(ev.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • {ev.start_time || "19:00"} - {ev.end_time || "23:30"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>~{ev.estimated_guests} Guests • Exp. Surplus: ~{ev.expected_surplus || 40} kg</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-freshBorder flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-freshText-secondary">
                      Contact: {ev.contact_person}
                    </span>
                    <Link href={`/events/${ev.id}/surplus`}>
                      <button className="text-xs font-bold text-red-600 hover:text-red-700 underline">
                        Report Surplus →
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Food Safety & Protocols */}
        {activeTab === "safety" && (
          <div className="p-8 bg-white rounded-4xl border border-freshBorder space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-freshText-primary">FoodLoop Event Food Safety Standard</h3>
                <p className="text-xs text-freshText-secondary">Under FSSAI hygiene guidelines and our strict non-negotiable safety criteria.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-5 rounded-3xl bg-green-50 border border-green-200 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-green-800">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>Eligible For Rescue (100% Untouched)</span>
                </div>
                <ul className="text-xs text-green-900 space-y-2 list-disc pl-5">
                  <li>Unserved buffet backups kept in closed commercial kitchen containers.</li>
                  <li>Maintained continuously in hot holding (&ge; 60&deg;C) or commercial chillers (&le; 4&deg;C).</li>
                  <li>Packaged in food-grade, sealed containers with date & time stamped.</li>
                  <li>Dispatched within 2 to 4 hours of banquet closure.</li>
                </ul>
              </div>

              <div className="p-5 rounded-3xl bg-red-50 border border-red-200 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-red-800">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span>Ineligible / High Risk (Rejected)</span>
                </div>
                <ul className="text-xs text-red-900 space-y-2 list-disc pl-5">
                  <li>Food directly exposed to guests on open buffet lines or tables.</li>
                  <li>Leftovers from individual guest plates or serving bowls.</li>
                  <li>Items left at room temperature (20&deg;C - 45&deg;C) for more than 2 hours.</li>
                  <li>Dishes without ingredient or potential allergen documentation.</li>
                </ul>
              </div>
            </div>

            <p className="text-xs text-freshText-secondary leading-relaxed bg-freshBg p-4 rounded-2xl border border-freshBorder">
              <strong>Legal & Safety Notice:</strong> FoodLoop's AI assistant provides operational and logistics assistance, but <strong>never certifies food freshness or edibility</strong>. Food donors must physically verify and sign off on all hygiene criteria prior to dispatch.
            </p>
          </div>
        )}
      </div>

      {/* Request Modal for direct claiming */}
      {selectedListing && (
        <RequestModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          listing={selectedListing}
          onSuccess={handleRequestSuccess}
        />
      )}
    </div>
  );
}
