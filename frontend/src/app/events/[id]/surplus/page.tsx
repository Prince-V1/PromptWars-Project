"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { 
  Utensils, CalendarCheck, ShieldCheck, AlertTriangle, 
  CheckCircle2, Clock, MapPin, Building2, Thermometer,
  ArrowLeft, Info, AlertCircle, FileCheck
} from "lucide-react";
import { api } from "@/lib/api";
import { EventItem, EventSurplusInput, FoodCategory, FoodUnit, DietaryType, StorageCondition } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface SurplusFormValues {
  food_name: string;
  category: FoodCategory;
  quantity: number;
  unit: FoodUnit;
  dietary_type: DietaryType;
  description?: string;
  preparation_time: string;
  pickup_deadline: string;
  pickup_address: string;
  storage_instructions: StorageCondition;
  storage_temperature?: number;
  food_safety_status: "untouched" | "exposed_to_guests";
  ingredients_text: string;
  safety_declaration_confirmed: boolean;
  notes?: string;
}

export default function ReportEventSurplusPage() {
  const params = useParams();
  const eventId = params?.id as string;
  const router = useRouter();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(["dairy"]);

  const commonAllergens = [
    { id: "dairy", label: "Milk / Dairy (Paneer, Ghee, Butter)" },
    { id: "nuts", label: "Tree Nuts & Peanuts" },
    { id: "gluten", label: "Wheat / Gluten (Maida, Atta)" },
    { id: "soy", label: "Soy / Soy Sauce" },
    { id: "mustard", label: "Mustard (Sarson)" },
    { id: "none", label: "No Known Major Allergens" },
  ];

  const now = new Date();
  const defaultPrep = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const defaultDeadline = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SurplusFormValues>({
    defaultValues: {
      category: "cooked_meals",
      unit: "kg",
      dietary_type: "veg",
      preparation_time: defaultPrep,
      pickup_deadline: defaultDeadline,
      storage_instructions: "hot_holding",
      storage_temperature: 65,
      food_safety_status: "untouched",
      ingredients_text: "Basmati Rice, Paneer, Whole Spices, Ghee, Green Peas",
      safety_declaration_confirmed: true,
    }
  });

  const safetyStatus = watch("food_safety_status");
  const storageInstructions = watch("storage_instructions");

  useEffect(() => {
    if (!eventId) return;
    setIsLoadingEvent(true);
    api.getEvent(eventId)
      .then((ev) => {
        setEvent(ev);
        setValue("pickup_address", ev.location_address || "");
        if (ev.expected_surplus) {
          setValue("quantity", ev.expected_surplus);
        }
      })
      .catch((err) => {
        console.error("Failed to load event:", err);
        setErrorMsg("Failed to load event details. Please verify the event ID.");
      })
      .finally(() => setIsLoadingEvent(false));
  }, [eventId, setValue]);

  const toggleAllergen = (item: string) => {
    if (item === "none") {
      setSelectedAllergens(["none"]);
      return;
    }
    const clean = selectedAllergens.filter(a => a !== "none");
    if (clean.includes(item)) {
      setSelectedAllergens(clean.filter(a => a !== item));
    } else {
      setSelectedAllergens([...clean, item]);
    }
  };

  const onSubmit = async (values: SurplusFormValues) => {
    if (!values.safety_declaration_confirmed) {
      setErrorMsg("You must verify and confirm the food safety declaration before dispatch.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const ingredients = values.ingredients_text
        ? values.ingredients_text.split(",").map(i => i.trim()).filter(Boolean)
        : [];

      const payload: EventSurplusInput = {
        event_id: eventId,
        food_name: values.food_name,
        category: values.category,
        quantity: Number(values.quantity),
        unit: values.unit,
        dietary_type: values.dietary_type,
        description: values.description,
        preparation_time: new Date(values.preparation_time).toISOString(),
        pickup_deadline: new Date(values.pickup_deadline).toISOString(),
        pickup_address: values.pickup_address,
        latitude: event?.latitude || 28.5355,
        longitude: event?.longitude || 77.1990,
        storage_instructions: values.storage_instructions,
        storage_temperature: values.storage_temperature ? Number(values.storage_temperature) : undefined,
        storage_temperature_unit: "C",
        food_safety_status: values.food_safety_status,
        allergens: selectedAllergens.includes("none") ? [] : selectedAllergens,
        ingredients: ingredients,
        safety_declaration_confirmed: values.safety_declaration_confirmed,
        notes: values.notes,
      };

      const res = await api.reportEventSurplus(payload);
      
      if (values.food_safety_status === "exposed_to_guests") {
        alert("Notice: Food marked as 'exposed to guests' cannot be safely redistributed under FoodLoop standards and has been safely cancelled.");
      }
      
      router.push("/events/dashboard");
    } catch (err: any) {
      console.error("Failed to report surplus:", err);
      setErrorMsg(err.message || "Failed to submit surplus food report. Please review your entries.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation breadcrumb */}
      <div>
        <Link 
          href="/events/dashboard" 
          className="inline-flex items-center text-xs font-bold text-freshText-secondary hover:text-freshText-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Event Dashboard
        </Link>
      </div>

      {/* Event Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 rounded-4xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-white">
            <Utensils className="w-4 h-4 text-lime-300" />
            <span>Post-Event Surplus Redistribution</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Report Surplus Feast Food
          </h1>
          {event && (
            <p className="text-sm sm:text-base text-white/95 font-medium">
              Event: <strong>{event.event_name}</strong> at {event.venue_name}
            </p>
          )}
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Record untouched banquet trays and sealed kitchen surplus. Upon submission, nearby partner shelters and rapid-transit couriers are alerted instantly.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-3xl text-xs text-freshError flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Food Safety Integrity Check (Mandatory First) */}
        <Card className="p-6 sm:p-8 space-y-6 border-2 border-red-200 bg-red-50/20">
          <div className="flex items-center gap-3 pb-4 border-b border-red-200">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-red-900">Food Safety & Eligibility Criteria</h2>
              <p className="text-xs text-red-700">Strict hygiene verification required before donation can proceed.</p>
            </div>
          </div>

          {/* Untouched vs Exposed Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-red-900 mb-2">
              Food Condition & Guest Exposure *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label 
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  safetyStatus === "untouched"
                    ? "bg-green-50 border-green-500 shadow-sm"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-5 h-5 ${safetyStatus === "untouched" ? "text-green-600" : "text-gray-400"}`} />
                    <span className="font-bold text-xs text-green-950">100% Untouched Kitchen Surplus</span>
                  </div>
                  <input
                    type="radio"
                    value="untouched"
                    {...register("food_safety_status")}
                    className="mt-1"
                  />
                </div>
                <p className="text-[11px] text-green-800 mt-2">
                  Unserved back-of-house trays, sealed chafing dishes, or kitchen stock never displayed to guests or open air. <strong>Eligible for rescue.</strong>
                </p>
              </label>

              <label 
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  safetyStatus === "exposed_to_guests"
                    ? "bg-red-100/50 border-red-500 shadow-sm"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-5 h-5 ${safetyStatus === "exposed_to_guests" ? "text-red-600" : "text-gray-400"}`} />
                    <span className="font-bold text-xs text-red-950">Exposed to Guests / Open Tables</span>
                  </div>
                  <input
                    type="radio"
                    value="exposed_to_guests"
                    {...register("food_safety_status")}
                    className="mt-1"
                  />
                </div>
                <p className="text-[11px] text-red-800 mt-2">
                  Food placed on self-serve guest buffet counters or open tables. <strong>Ineligible under FoodLoop safety policy.</strong>
                </p>
              </label>
            </div>
          </div>

          {safetyStatus === "exposed_to_guests" && (
            <div className="p-4 bg-red-100 border border-red-300 rounded-2xl text-xs text-red-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Notice:</strong> FoodLoop strictly rejects any food exposed to guest interaction to prevent cross-contamination. This listing will be automatically marked ineligible.
              </span>
            </div>
          )}

          {/* Temperature & Storage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Current Storage Condition *
              </label>
              <select
                {...register("storage_instructions", { required: true })}
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              >
                <option value="hot_holding">Hot Holding (Chafing unit &ge; 60°C)</option>
                <option value="refrigerated">Refrigerated (Cold room &le; 5°C)</option>
                <option value="room_temperature">Room Temperature (Immediate Pickup)</option>
                <option value="frozen">Deep Frozen (&le; -18°C)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Measured Storage Temperature (°C)
              </label>
              <div className="relative">
                <Thermometer className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="0.5"
                  {...register("storage_temperature")}
                  placeholder="e.g. 68"
                  className="w-full pl-10 pr-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Food Batch Details */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-freshBorder">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-freshText-primary">Surplus Food Specifics</h2>
              <p className="text-xs text-freshText-secondary">Describe the dish, portion volume, and category.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Food Name / Feast Title *
              </label>
              <input
                type="text"
                required
                {...register("food_name", { required: true })}
                placeholder="e.g. Shahi Paneer, Dal Makhani & Awadhi Dum Biryani Trays"
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Category *
              </label>
              <select
                {...register("category", { required: true })}
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              >
                <option value="cooked_meals">Cooked Banquet Meals</option>
                <option value="bakery">Bakery / Breads & Rotis</option>
                <option value="dairy">Dairy / Sweets & Desserts</option>
                <option value="fresh_produce">Salads & Fruit Platters</option>
                <option value="beverages">Beverages</option>
                <option value="other">Other Food Items</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Dietary Preference *
              </label>
              <select
                {...register("dietary_type", { required: true })}
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              >
                <option value="veg">Vegetarian (100% Pure Veg)</option>
                <option value="non_veg">Non-Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="contains_egg">Contains Egg</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Available Quantity *
              </label>
              <input
                type="number"
                step="0.5"
                required
                min={1}
                {...register("quantity", { required: true, min: 1 })}
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Unit *
              </label>
              <select
                {...register("unit", { required: true })}
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="portions">Servings / Portions</option>
                <option value="boxes">Commercial Food Boxes</option>
                <option value="crates">Crates / Trays</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Key Ingredients Known
              </label>
              <input
                type="text"
                {...register("ingredients_text")}
                placeholder="e.g. Basmati Rice, Paneer, Cashews, Cream, Ghee, Black Lentils"
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-2">
                Allergen Disclosures
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {commonAllergens.map((alg) => {
                  const isChecked = selectedAllergens.includes(alg.id);
                  return (
                    <button
                      type="button"
                      key={alg.id}
                      onClick={() => toggleAllergen(alg.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                        isChecked
                          ? "bg-amber-50 border-amber-400 text-amber-900"
                          : "bg-freshBg border-freshBorder text-freshText-secondary"
                      }`}
                    >
                      <span>{alg.label}</span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Timings & Pickup Dock */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-freshBorder">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-freshText-primary">Pickup Timeline & Bay</h2>
              <p className="text-xs text-freshText-secondary">Set a strict window for courier arrival.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Preparation Time *
              </label>
              <input
                type="datetime-local"
                required
                {...register("preparation_time", { required: true })}
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Pickup Deadline (Must be collected by) *
              </label>
              <input
                type="datetime-local"
                required
                {...register("pickup_deadline", { required: true })}
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Pickup Bay Address *
              </label>
              <input
                type="text"
                required
                {...register("pickup_address", { required: true })}
                placeholder="e.g. Royal Orchid Lawn Kitchen Gate 2, Chattarpur, New Delhi"
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white"
              />
            </div>
          </div>
        </Card>

        {/* Section 4: Donor Legal & Safety Confirmation */}
        <div className="p-5 bg-white border border-freshBorder rounded-3xl space-y-4 shadow-subtle">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              {...register("safety_declaration_confirmed", { required: true })}
              className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-red-500"
            />
            <div className="text-xs text-freshText-primary space-y-1">
              <p className="font-bold">
                Mandatory Food Safety & Hygiene Certification *
              </p>
              <p className="text-freshText-secondary leading-relaxed text-[11px]">
                I solemnly certify as the designated event coordinator/caterer that this food was prepared in a licensed commercial kitchen, has remained untouched by guests, packaged in sanitized food-grade containers, and stored in compliance with temperature norms.
              </p>
            </div>
          </label>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link href="/events/dashboard">
            <Button type="button" variant="outline" size="md">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="font-bold shadow-lg bg-red-600 hover:bg-red-700 text-white"
          >
            <Utensils className="w-4 h-4 mr-2" />
            Dispatch Surplus Food Rescue
          </Button>
        </div>
      </form>
    </div>
  );
}
