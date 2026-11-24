"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  CalendarCheck, PlusCircle, LayoutDashboard, Utensils, 
  MapPin, Clock, Users, ArrowRight, ShieldCheck, Heart, 
  CheckCircle2, AlertTriangle, ArrowUpRight, Sparkles, Building2
} from "lucide-react";
import { api } from "@/lib/api";
import { EventItem, FoodListing, EventDashboardData } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function EventDashboardPage() {
  const [data, setData] = useState<EventDashboardData | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [dashRes, eventsRes] = await Promise.all([
          api.getEventDashboardSummary(),
          api.getEvents()
        ]);
        setData(dashRes);
        setEvents(eventsRes);
      } catch (err) {
        console.error("Failed to load event dashboard summary:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-black uppercase tracking-wider mb-2">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Event Organizer Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-freshText-primary tracking-tight">
            Banquet & Function Rescue Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-freshText-secondary">
            Manage your registered wedding banquets, monitor active surplus listings, and track shelter meal distributions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/events/create">
            <Button size="md" className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-md">
              <PlusCircle className="w-4 h-4 mr-2" />
              Register New Function
            </Button>
          </Link>
          <Link href="/events">
            <Button size="md" variant="outline" className="font-bold">
              Public Portal →
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 border-freshBorder space-y-1">
          <span className="text-[10px] uppercase font-bold text-freshText-secondary">Upcoming Functions</span>
          <p className="text-2xl sm:text-3xl font-black text-red-600">
            {data?.upcoming_events_count ?? 0}
          </p>
          <span className="text-[11px] text-freshText-secondary block">Pre-registered for rescue</span>
        </Card>

        <Card className="p-5 border-freshBorder space-y-1">
          <span className="text-[10px] uppercase font-bold text-freshText-secondary">Surplus Food Rescued</span>
          <p className="text-2xl sm:text-3xl font-black text-[#258A54]">
            {data?.total_surplus_reported_kg ? `${Math.round(data.total_surplus_reported_kg)} kg` : "0 kg"}
          </p>
          <span className="text-[11px] text-freshText-secondary block">100% safe & untouched</span>
        </Card>

        <Card className="p-5 border-freshBorder space-y-1">
          <span className="text-[10px] uppercase font-bold text-freshText-secondary">Shelter Meals Provided</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-600">
            {data?.meals_provided?.toLocaleString() ?? "0"}
          </p>
          <span className="text-[11px] text-freshText-secondary block">Served at local Delhi shelters</span>
        </Card>

        <Card className="p-5 border-freshBorder space-y-1">
          <span className="text-[10px] uppercase font-bold text-freshText-secondary">Landfill CO₂e Diverted</span>
          <p className="text-2xl sm:text-3xl font-black text-freshText-primary">
            {data?.co2_saved_kg ? `${Math.round(data.co2_saved_kg)} kg` : "0 kg"}
          </p>
          <span className="text-[11px] text-freshText-secondary block">UNEP Food Waste Index calculation</span>
        </Card>
      </div>

      {/* Main Grid: Events List & Active Surplus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Registered Events */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-freshText-primary flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-red-600" />
              <span>Registered Functions ({events.length})</span>
            </h2>
            <Link href="/events/create" className="text-xs font-bold text-red-600 hover:underline">
              + Add Event
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-freshBorder space-y-3">
              <CalendarCheck className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-freshText-primary">No Registered Functions Yet</p>
              <p className="text-xs text-freshText-secondary">Register upcoming weddings or corporate functions to notify couriers in advance.</p>
              <Link href="/events/create">
                <Button size="sm" variant="primary" className="bg-red-600 hover:bg-red-700 text-white">Register Function</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((ev) => (
                <Card key={ev.id} className="p-5 hover:border-red-300 transition-all space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          {ev.event_type.replace("_", " ")}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ev.status === "completed" 
                            ? "bg-gray-100 text-gray-700"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {ev.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-freshText-primary mt-1">{ev.event_name}</h3>
                    </div>

                    <Link href={`/events/${ev.id}/surplus`}>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs shrink-0">
                        <Utensils className="w-3.5 h-3.5 mr-1.5" />
                        Report Surplus Food
                      </Button>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-freshText-secondary pt-2 border-t border-freshBorder">
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
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Active Surplus Listings from Events */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-freshText-primary flex items-center gap-2">
            <Utensils className="w-5 h-5 text-red-600" />
            <span>Event Surplus Batches</span>
          </h2>

          <div className="space-y-4">
            {(!data?.active_event_surplus || data.active_event_surplus.length === 0) ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-freshBorder space-y-2">
                <p className="text-xs font-bold text-freshText-primary">No Event Surplus Reported Yet</p>
                <p className="text-[11px] text-freshText-secondary">
                  When a banquet wraps up, click &quot;Report Surplus Food&quot; on any function card to post batches for rapid courier pickup.
                </p>
              </div>
            ) : (
              data.active_event_surplus.map((item) => (
                <div 
                  key={item.id}
                  className="p-4 bg-white rounded-2xl border border-freshBorder space-y-3 shadow-subtle hover:border-red-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-lime/20 text-[#3b4b03]">
                        {item.food_safety_status === "untouched" ? "100% Untouched" : "Inspected"}
                      </span>
                      <h4 className="font-bold text-xs text-freshText-primary mt-1 line-clamp-1">{item.title}</h4>
                    </div>
                    <span className="text-xs font-black text-red-600 shrink-0">
                      {item.quantity} {item.unit}
                    </span>
                  </div>

                  <div className="text-[11px] text-freshText-secondary space-y-1">
                    <p className="line-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-2 pt-1 font-semibold text-freshText-primary">
                      <span>Status: {item.status.toUpperCase()}</span>
                      {item.storage_temperature && (
                        <span>• Temp: {item.storage_temperature}°C</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-freshBorder flex items-center justify-between text-[11px]">
                    <span className="text-freshText-secondary">Priority: {item.priority_score ? Math.round(item.priority_score) : 90}/100</span>
                    <Link href={`/food/${item.id}`} className="text-red-600 font-bold hover:underline">
                      View Listing →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Safety & Protocol Card */}
          <div className="p-5 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-3xl space-y-2.5">
            <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-red-600" />
              <span>FSSAI Hygiene Standard Enforced</span>
            </div>
            <p className="text-[11px] text-red-900 leading-relaxed">
              FoodLoop guarantees recipient shelters that all redistributed feast items originate from untouched kitchen chafing batches. Food displayed to buffet guests is strictly excluded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
