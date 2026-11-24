"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { 
  Sparkles, Upload, AlertCircle, 
  CheckCircle2, Loader2, ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";

interface DonationFormData {
  title: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  dietary_type: string;
  preparation_time: string;
  pickup_deadline: string;
  pickup_address: string;
  latitude: number;
  longitude: number;
  storage_instructions: string;
  allergens: string;
  image_url?: string;
  target_beneficiary?: "human" | "animal_feed";
  animal_feed_notes?: string;
}

export default function DonatePage() {
  const router = useRouter();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState<boolean>(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState<boolean>(false);
  const [aiAnalysisNotes, setAiAnalysisNotes] = useState<any | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [targetBeneficiary, setTargetBeneficiary] = useState<"human" | "animal_feed">("human");
  const [selectedAnimalSpecies, setSelectedAnimalSpecies] = useState<string[]>(["cows", "bulls", "buffaloes"]);
  const [feedSafetyConfirmed, setFeedSafetyConfirmed] = useState<boolean>(true);

  // Default times: prep time 1h ago, deadline 4h from now in local ISO format
  const now = new Date();
  const defaultPrep = new Date(now.getTime() - 60 * 60 * 1000).toISOString().slice(0, 16);
  const defaultDeadline = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const { register, handleSubmit, setValue, watch } = useForm<DonationFormData>({
    defaultValues: {
      category: "cooked_meals",
      unit: "kg",
      dietary_type: "veg",
      storage_instructions: "hot_holding",
      preparation_time: defaultPrep,
      pickup_deadline: defaultDeadline,
      pickup_address: "Diplomatic Enclave Banquet Loading Bay 2, Chanakyapuri, New Delhi",
      latitude: 28.5976,
      longitude: 77.1741,
    }
  });

  const watchTitle = watch("title");
  const watchCategory = watch("category");
  const watchQuantity = watch("quantity");
  const watchUnit = watch("unit");
  const watchDietary = watch("dietary_type");
  const watchStorage = watch("storage_instructions");

  // Handle image file selection & convert to base64 for AI analysis
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError("Image file size must be less than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageBase64(result);
        setValue("image_url", result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Live AI Vision Analysis with Google Gemini
  const handleAnalyzeWithGemini = async () => {
    setIsAnalyzingImage(true);
    setSubmitError(null);
    try {
      const res = await api.analyzeFoodImage({
        image_base64: imageBase64 || undefined,
        additional_context: watchTitle || "Prepared surplus banquet food batch",
      });

      setAiAnalysisNotes(res);

      // Auto-populate form fields based on AI suggestions
      if (res.suggested_title) setValue("title", res.suggested_title);
      if (res.suggested_category) setValue("category", res.suggested_category);
      if (res.suggested_description) setValue("description", res.suggested_description);
      if (res.dietary_type) setValue("dietary_type", res.dietary_type);
      if (res.recommended_storage) setValue("storage_instructions", res.recommended_storage);
      if (res.potential_allergens_detected?.length) {
        setValue("allergens", res.potential_allergens_detected.join(", "));
      }
    } catch (err: any) {
      setSubmitError(err.message || "AI vision analysis encountered a momentary error.");
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // AI Description Generator Assistant
  const handleGenerateDescription = async () => {
    if (!watchTitle) {
      setSubmitError("Please enter a food title before generating a description.");
      return;
    }
    setIsGeneratingDesc(true);
    setSubmitError(null);
    try {
      const res = await api.generateDescription({
        title: watchTitle,
        category: watchCategory,
        quantity: Number(watchQuantity) || 10,
        unit: watchUnit,
        dietary_type: watchDietary,
        storage_condition: watchStorage,
      });
      if (res?.generated_description) {
        setValue("description", res.generated_description);
      }
    } catch (err: any) {
      setSubmitError(err.message || "Failed to generate AI description.");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const onSubmit = async (data: DonationFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    // Validate deadlines
    const prepDate = new Date(data.preparation_time);
    const deadlineDate = new Date(data.pickup_deadline);
    const currentDate = new Date();

    if (deadlineDate <= currentDate) {
      setSubmitError("Pickup deadline must be in the future.");
      setIsSubmitting(false);
      return;
    }

    if (deadlineDate <= prepDate) {
      setSubmitError("Pickup deadline must be after preparation time.");
      setIsSubmitting(false);
      return;
    }

    if (Number(data.quantity) <= 0) {
      setSubmitError("Quantity must be greater than zero.");
      setIsSubmitting(false);
      return;
    }

    try {
      const allergensArray = data.allergens
        ? data.allergens.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        title: data.title,
        description: data.description,
        category: data.category,
        quantity: Number(data.quantity),
        unit: data.unit,
        dietary_type: data.dietary_type,
        preparation_time: prepDate.toISOString(),
        pickup_deadline: deadlineDate.toISOString(),
        pickup_address: data.pickup_address,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        storage_instructions: data.storage_instructions,
        allergens: allergensArray,
        image_url: imagePreview || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
        ai_analysis_metadata: aiAnalysisNotes || {},
        target_beneficiary: targetBeneficiary,
        suitable_species: targetBeneficiary === "animal_feed" ? selectedAnimalSpecies : [],
        animal_feed_safety_confirmed: targetBeneficiary === "animal_feed" ? feedSafetyConfirmed : false,
        animal_feed_notes: data.animal_feed_notes,
      };

      const res = await api.createFoodListing(payload);
      setSuccessId(res.id);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create donation listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-lime text-freshText-primary flex items-center justify-center mx-auto mb-4 shadow-floating">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-freshText-primary mb-2">Donation Listed Successfully!</h2>
        <p className="text-sm text-freshText-secondary mb-8">
          Nearby verified NGOs and community kitchens have been alerted for rapid collection.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="primary" size="md" onClick={() => router.push(`/discover/${successId}`)}>
            View Listing
          </Button>
          <Button variant="outline" size="md" onClick={() => router.push("/provider")}>
            Provider Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-freshText-primary tracking-tight">
          Create Food Donation Listing
        </h1>
        <p className="text-xs sm:text-sm text-freshText-secondary mt-1">
          List surplus edible food before its collection deadline. Automated photo recognition & verified categorization.
        </p>
      </div>

      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-3xl text-xs text-freshError flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Smart Photo Assistant Card */}
      <Card className="p-6 bg-gradient-to-br from-white to-sage-50/50 border-lime-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lime flex items-center justify-center text-freshText-primary shadow-sm">
              <Sparkles className="w-5 h-5 text-freshText-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-freshText-primary">Smart Photo Assistant</h3>
              <p className="text-xs text-freshText-secondary">Upload a photo to auto-detect dish name, category, and safe storage instructions.</p>
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleAnalyzeWithGemini}
            isLoading={isAnalyzingImage}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Auto-Detect from Photo
          </Button>
        </div>

        {/* Human Confirmation & Safety Disclaimer Box */}
        {aiAnalysisNotes && (
          <div className="p-4 rounded-2xl bg-white border border-freshBorder text-xs space-y-2 mt-4 animate-fade-in">
            <div className="flex items-center gap-1.5 text-freshWarning font-bold">
              <ShieldAlert className="w-4 h-4 text-freshWarning" />
              <span>Provider Confirmation Required</span>
            </div>
            <p className="text-freshText-secondary leading-relaxed">
              {aiAnalysisNotes.safety_disclaimer}
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-sage-100 text-freshText-primary font-medium">
                Detected: {aiAnalysisNotes.suggested_title}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sage-100 text-freshText-primary font-medium">
                Category: {aiAnalysisNotes.suggested_category}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sage-100 text-freshText-primary font-medium">
                Est. Servings: {aiAnalysisNotes.estimated_servings_range || "N/A"}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Main Listing Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Beneficiary Type Segregation */}
        <Card className="p-6 border-2 border-freshBorder">
          <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-3">
            Target Redistribution Beneficiary *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTargetBeneficiary("human")}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                targetBeneficiary === "human"
                  ? "bg-emerald-50 border-emerald-500 shadow-sm"
                  : "bg-white border-freshBorder hover:bg-gray-50"
              }`}
            >
              <span className="text-2xl mt-0.5">🍲</span>
              <div>
                <h4 className="font-bold text-sm text-freshText-primary">Human Food Relief</h4>
                <p className="text-xs text-freshText-secondary mt-0.5">
                  Route untouched banquet meals and prepared food to verified NGOs, food banks, and shelters.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTargetBeneficiary("animal_feed")}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                targetBeneficiary === "animal_feed"
                  ? "bg-amber-50 border-amber-500 shadow-sm"
                  : "bg-white border-freshBorder hover:bg-gray-50"
              }`}
            >
              <span className="text-2xl mt-0.5">🐾</span>
              <div>
                <h4 className="font-bold text-sm text-freshText-primary">Animal Feed & Sanctuaries</h4>
                <p className="text-xs text-freshText-secondary mt-0.5">
                  Route kitchen produce peels, unseasoned grains, safe breads, or feeds to Gaushalas & animal rescue shelters.
                </p>
              </div>
            </button>
          </div>

          {/* Animal Feed Specific Options */}
          {targetBeneficiary === "animal_feed" && (
            <div className="mt-5 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-950 mb-1">
                  Suitable Animal Species (Select all that apply) *
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { id: "cows", label: "Cows & Bulls", icon: "🐄" },
                    { id: "buffaloes", label: "Buffaloes", icon: "🐃" },
                    { id: "dogs", label: "Dogs & Pups", icon: "🐕" },
                    { id: "cats", label: "Cats", icon: "🐈" },
                    { id: "goats", label: "Goats & Sheep", icon: "🐐" },
                    { id: "birds", label: "Birds & Pigeons", icon: "🕊️" },
                  ].map((sp) => {
                    const isSelected = selectedAnimalSpecies.includes(sp.id);
                    return (
                      <button
                        type="button"
                        key={sp.id}
                        onClick={() => {
                          setSelectedAnimalSpecies(prev => 
                            prev.includes(sp.id) ? prev.filter(s => s !== sp.id) : [...prev, sp.id]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-amber-600 text-white shadow-xs"
                            : "bg-white border border-freshBorder text-freshText-secondary hover:border-amber-400"
                        }`}
                      >
                        <span>{sp.icon}</span>
                        <span>{sp.label}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feed Safety Checklist & Attestation */}
              <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-2">
                <p className="font-bold text-amber-950 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Mandatory Animal Feed Safety Attestation</span>
                </p>
                <ul className="text-[11px] text-amber-900 space-y-1 list-disc pl-4">
                  <li>Feed is 100% free of plastics, packaging tape, toothpicks, or metal ties.</li>
                  <li>Ruminant Feed (Cattle/Goats): strictly raw/boiled vegetarian greens & grains (NO meat, poultry, or toxic alliums).</li>
                  <li>Canine Feed (Dogs): strictly NO chocolate, onions, garlic, grapes/raisins, or cooked chicken bones.</li>
                </ul>
                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feedSafetyConfirmed}
                    onChange={(e) => setFeedSafetyConfirmed(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span className="font-semibold text-amber-950 text-[11px]">
                    I confirm this feed has been physically verified as clean and species-safe.
                  </span>
                </label>
              </div>
            </div>
          )}
        </Card>

        {/* Photo Upload Box */}
        <Card className="p-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-3">
            Food Photography / Proof of Packaging
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-full sm:w-48 h-36 rounded-3xl bg-freshBg border-2 border-dashed border-freshBorder overflow-hidden flex items-center justify-center group hover:border-lime-500 transition-colors">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <Upload className="w-6 h-6 text-sage-400 mx-auto mb-1" />
                  <span className="text-xs text-freshText-secondary font-medium">Upload photo</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <div className="text-xs text-freshText-secondary space-y-1">
              <p className="font-semibold text-freshText-primary">Capture container and hygiene seals</p>
              <p>Supported: JPG, PNG, WebP (Max 5MB).</p>
              <p className="text-[11px] text-freshText-secondary/80">Clear images assist NGOs with vehicle and temperature planning.</p>
            </div>
          </div>
        </Card>

        {/* Basic Food Information */}
        <Card className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
                Food Name / Dish Title *
              </label>
              <input
                type="text"
                {...register("title", { required: "Food title is required" })}
                placeholder="e.g. Royal Buffet Surplus: Paneer Makhani & Jeera Rice"
                className="w-full px-4 py-3 bg-freshBg border border-freshBorder rounded-2xl text-sm font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
                Food Category *
              </label>
              <select
                {...register("category", { required: true })}
                className="w-full px-4 py-3 bg-freshBg border border-freshBorder rounded-2xl text-sm font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              >
                <option value="cooked_meals">Cooked Meals</option>
                <option value="bakery">Bakery & Breads</option>
                <option value="packaged_groceries">Packaged Groceries</option>
                <option value="fresh_produce">Fresh Produce</option>
                <option value="dairy">Dairy Products</option>
                <option value="beverages">Beverages</option>
                <option value="other">Other Edibles</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
                Dietary Type *
              </label>
              <select
                {...register("dietary_type", { required: true })}
                className="w-full px-4 py-3 bg-freshBg border border-freshBorder rounded-2xl text-sm font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              >
                <option value="veg">Vegetarian (Strict Veg)</option>
                <option value="vegan">Vegan (Plant Based)</option>
                <option value="non_veg">Non-Vegetarian</option>
                <option value="contains_egg">Contains Egg</option>
              </select>
            </div>

            {/* Quantity and Unit */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
                Quantity *
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                {...register("quantity", { required: "Quantity is required", min: 0.1 })}
                placeholder="e.g. 25"
                className="w-full px-4 py-3 bg-freshBg border border-freshBorder rounded-2xl text-sm font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
                Measurement Unit *
              </label>
              <select
                {...register("unit", { required: true })}
                className="w-full px-4 py-3 bg-freshBg border border-freshBorder rounded-2xl text-sm font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="portions">Individual Portions</option>
                <option value="packets">Packets</option>
                <option value="crates">Crates</option>
                <option value="liters">Liters</option>
                <option value="boxes">Catering Boxes</option>
              </select>
            </div>
          </div>

          {/* Description with AI Assistant button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary">
                Detailed Description & Packaging State *
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGeneratingDesc}
                className="text-xs font-semibold text-lime-700 hover:text-lime-800 flex items-center gap-1"
              >
                {isGeneratingDesc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>AI Polish Description</span>
              </button>
            </div>
            <textarea
              rows={3}
              {...register("description", { required: "Description is required" })}
              placeholder="Freshly cooked midday batch packaged into hygienic food warmers..."
              className="w-full px-4 py-3 bg-freshBg border border-freshBorder rounded-2xl text-xs text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white resize-none"
            />
          </div>
        </Card>

        {/* Timelines and Safe Storage */}
        <Card className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
                Prepared At *
              </label>
              <input
                type="datetime-local"
                {...register("preparation_time", { required: true })}
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
                Pickup Deadline *
              </label>
              <input
                type="datetime-local"
                {...register("pickup_deadline", { required: true })}
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
                Storage Instructions *
              </label>
              <select
                {...register("storage_instructions", { required: true })}
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              >
                <option value="hot_holding">Hot Holding (Ready to Eat)</option>
                <option value="refrigerated">Refrigerated (2°C - 4°C)</option>
                <option value="room_temperature">Room Temperature Dry</option>
                <option value="frozen">Frozen (-18°C)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
              Declared Allergens (Comma-separated)
            </label>
            <input
              type="text"
              {...register("allergens")}
              placeholder="e.g. Dairy, Gluten, Peanuts, Soy"
              className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-medium text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
            />
          </div>
        </Card>

        {/* Pickup Location */}
        <Card className="p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-freshText-secondary">
            Collection Location Details
          </h3>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
              Pickup Address *
            </label>
            <input
              type="text"
              {...register("pickup_address", { required: "Pickup address is required" })}
              className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Latitude (GPS)
              </label>
              <input
                type="number"
                step="any"
                {...register("latitude", { required: true })}
                className="w-full px-4 py-2 bg-freshBg border border-freshBorder rounded-xl text-xs font-medium text-freshText-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Longitude (GPS)
              </label>
              <input
                type="number"
                step="any"
                {...register("longitude", { required: true })}
                className="w-full px-4 py-2 bg-freshBg border border-freshBorder rounded-xl text-xs font-medium text-freshText-primary"
              />
            </div>
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            isLoading={isSubmitting}
            className={`font-bold px-8 shadow-floating text-white ${
              targetBeneficiary === "animal_feed"
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {targetBeneficiary === "animal_feed" ? "🐾 Publish Animal Feed Donation" : "Publish Donation Listing"}
          </Button>
        </div>
      </form>
    </div>
  );
}
