"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { 
  CalendarCheck, Building2, MapPin, Users, Utensils, 
  Clock, Phone, User, CheckCircle2, AlertCircle, ArrowLeft,
  Sparkles, ShieldCheck
} from "lucide-react";
import { api } from "@/lib/api";
import { EventCreateInput, EventType } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface CreateEventFormValues {
  event_name: string;
  event_type: EventType;
  event_date: string;
  start_time: string;
  end_time: string;
  venue_name: string;
  location_address: string;
  city: string;
  estimated_guests: number;
  contact_person: string;
  contact_phone: string;
  expected_surplus: number;
  estimated_food_quantity: number;
  notes?: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "cooked_meals",
    "bakery",
  ]);

  const availableCategories = [
    { id: "cooked_meals", label: "Cooked Main Courses (Biryani, Dal, Gravies)" },
    { id: "bakery", label: "Bakery, Naan, Rotis & Breads" },
    { id: "dairy", label: "Paneer, Curd & Sweets / Desserts" },
    { id: "fresh_produce", label: "Salads & Cut Fruits" },
    { id: "beverages", label: "Beverages & Mocktails" },
  ];

  const { register, handleSubmit, formState: { errors } } = useForm<CreateEventFormValues>({
    defaultValues: {
      event_type: "wedding",
      event_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      start_time: "19:00",
      end_time: "23:30",
      city: "Delhi NCR",
      estimated_guests: 350,
      expected_surplus: 45,
      estimated_food_quantity: 150,
    }
  });

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev => 
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const onSubmit = async (values: CreateEventFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const payload: EventCreateInput = {
        event_name: values.event_name,
        event_type: values.event_type,
        event_date: new Date(values.event_date).toISOString(),
        start_time: values.start_time,
        end_time: values.end_time,
        venue_name: values.venue_name,
        location_address: values.location_address,
        city: values.city || "Delhi NCR",
        latitude: 28.5355,
        longitude: 77.1990,
        estimated_guests: Number(values.estimated_guests) || 100,
        contact_person: values.contact_person,
        contact_phone: values.contact_phone,
        expected_food_categories: selectedCategories,
        estimated_food_quantity: Number(values.estimated_food_quantity) || 100,
        estimated_food_unit: "kg",
        expected_surplus: Number(values.expected_surplus) || 30,
        notes: values.notes,
      };

      await api.createEvent(payload);
      router.push("/events/dashboard");
    } catch (err: any) {
      console.error("Failed to create event:", err);
      setErrorMsg(err.message || "Failed to register event. Please verify all fields.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link 
          href="/events" 
          className="inline-flex items-center text-xs font-bold text-freshText-secondary hover:text-freshText-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Event Rescue Portal
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 rounded-4xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-white">
            <CalendarCheck className="w-4 h-4 text-lime-300" />
            <span>Pre-Event Rescue Coordination</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Register Upcoming Function or Banquet
          </h1>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
            By registering in advance, FoodLoop alerts nearby partner NGOs and volunteer fleets to be on standby. When your event concludes tonight, rescue dispatch is triggered within 30 minutes.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-3xl text-xs text-freshError flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Event Identity */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-freshBorder">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-freshText-primary">Event Information</h2>
              <p className="text-xs text-freshText-secondary">Specify the celebration name, date, and function type.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Event or Function Name *
              </label>
              <input
                type="text"
                required
                {...register("event_name", { required: true })}
                placeholder="e.g. Sharma & Kapoor Grand Wedding Reception"
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Event Type *
              </label>
              <select
                {...register("event_type", { required: true })}
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              >
                <option value="wedding">Wedding Ceremony & Feast</option>
                <option value="reception">Reception / Sangeet</option>
                <option value="birthday">Birthday Celebration</option>
                <option value="corporate_event">Corporate Gala / Conclave</option>
                <option value="festival">Festival / Cultural Mela</option>
                <option value="community_gathering">Community Gathering</option>
                <option value="conference">Conference / Seminar</option>
                <option value="other">Other Banquet Celebration</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Event Date *
              </label>
              <input
                type="date"
                required
                {...register("event_date", { required: true })}
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Start Time
              </label>
              <input
                type="time"
                {...register("start_time")}
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Expected End / Pack-up Time *
              </label>
              <input
                type="time"
                required
                {...register("end_time", { required: true })}
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Venue & Location */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-freshBorder">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-freshText-primary">Venue & Pickup Location</h2>
              <p className="text-xs text-freshText-secondary">Where the kitchen and banquet loading docks are located.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Banquet / Venue Name *
              </label>
              <input
                type="text"
                required
                {...register("venue_name", { required: true })}
                placeholder="e.g. Royal Orchid Lawn, Chattarpur"
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                City / Region *
              </label>
              <input
                type="text"
                required
                {...register("city", { required: true })}
                placeholder="Delhi NCR / Gurgaon / Noida"
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Detailed Venue Address / Loading Bay *
              </label>
              <input
                type="text"
                required
                {...register("location_address", { required: true })}
                placeholder="e.g. Gate 3 Kitchen Loading Dock, Main Chattarpur Mandir Road, South Delhi"
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Guest Count & Food Estimates */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-freshBorder">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-freshText-primary">Guest Count & Surplus Estimates</h2>
              <p className="text-xs text-freshText-secondary">Helps our volunteer transport team allocate suitable vehicle capacities.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Estimated Guests *
              </label>
              <input
                type="number"
                required
                min={20}
                {...register("estimated_guests", { required: true, min: 20 })}
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Estimated Total Food (kg)
              </label>
              <input
                type="number"
                min={10}
                {...register("estimated_food_quantity")}
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Expected Surplus (kg) *
              </label>
              <input
                type="number"
                required
                min={5}
                {...register("expected_surplus", { required: true, min: 5 })}
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Expected Food Categories */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-2">
              Expected Feast Categories (Select all that apply)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableCategories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-red-50 border-red-400 text-red-900 shadow-sm"
                        : "bg-freshBg border-freshBorder text-freshText-secondary hover:bg-white"
                    }`}
                  >
                    <span>{cat.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Section 4: Contact & Coordination */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-freshBorder">
            <div className="w-9 h-9 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-freshText-primary">On-Site Coordinator</h2>
              <p className="text-xs text-freshText-secondary">Who should our pickup courier contact upon arrival?</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Contact Person Name *
              </label>
              <input
                type="text"
                required
                {...register("contact_person", { required: true })}
                placeholder="e.g. Chef Rajesh / Event Director Anand"
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Contact Phone / WhatsApp *
              </label>
              <input
                type="tel"
                required
                {...register("contact_phone", { required: true })}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Special Instructions or Packaging Availability
              </label>
              <textarea
                rows={2}
                {...register("notes")}
                placeholder="e.g. We have commercial food-grade aluminum foil containers on site. Kitchen staff will help load trays."
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>
          </div>
        </Card>

        {/* Safety Callout */}
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed">
            <strong>Food Safety Requirement:</strong> Only safe, untouched food stored in clean kitchen containers or held in hot chafers (&ge; 60&deg;C) will be eligible for redistribution when reporting surplus tonight. Food exposed directly to guests cannot be accepted.
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link href="/events">
            <Button type="button" variant="outline" size="md">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="font-bold shadow-lg bg-red-600 hover:bg-red-700 text-white"
          >
            <CalendarCheck className="w-4 h-4 mr-2" />
            Complete Event Registration
          </Button>
        </div>
      </form>
    </div>
  );
}
