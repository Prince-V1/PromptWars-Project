"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { 
  Building, Heart, Truck, 
  AlertCircle, ShieldCheck, CheckCircle2,
  Sparkles, Info
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AnimalSpecies } from "@/types";

interface RegisterFormData {
  full_name: string;
  email: string;
  password: string;
  phone_number: string;
  role: "food_provider" | "recipient" | "volunteer";
  recipient_category?: "human" | "animal_care";
  organization_name?: string;
  organization_type?: string;
  supported_species?: AnimalSpecies[];
  description?: string;
  address?: string;
  city?: string;
  registration_number?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAuth } = useAuth();

  const [selectedRoleType, setSelectedRoleType] = useState<"food_provider" | "recipient" | "animal_care" | "volunteer">("food_provider");
  const [selectedSpecies, setSelectedSpecies] = useState<AnimalSpecies[]>(["cows", "bulls", "buffaloes"]);
  const [selectedAnimalOrgType, setSelectedAnimalOrgType] = useState<string>("gaushala");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const animalOrgTypes = [
    {
      id: "gaushala",
      title: "Gaushala",
      subtitle: "Indigenous Cattle & Bull Sanctuaries",
      image: "/images/animal_care/gaushala.jpg",
      defaultSpecies: ["cows", "bulls", "buffaloes", "goats"] as AnimalSpecies[]
    },
    {
      id: "animal_shelter",
      title: "Animal Shelter",
      subtitle: "Dog & Cat Rescue Sanctuaries",
      image: "/images/animal_care/animal_shelter.jpg",
      defaultSpecies: ["dogs", "cats", "birds"] as AnimalSpecies[]
    },
    {
      id: "animal_rescue_centre",
      title: "Animal Rescue Centre",
      subtitle: "24/7 Trauma & Wildlife Recovery",
      image: "/images/animal_care/animal_rescue_centre.jpg",
      defaultSpecies: ["dogs", "cats", "cows", "bulls", "birds"] as AnimalSpecies[]
    },
    {
      id: "veterinary_hospital",
      title: "Veterinary Hospital",
      subtitle: "Charitable Animal Clinics & Recovery",
      image: "/images/animal_care/veterinary_hospital.jpg",
      defaultSpecies: ["dogs", "cats", "goats", "birds"] as AnimalSpecies[]
    },
    {
      id: "animal_welfare_ngo",
      title: "Animal Welfare NGO",
      subtitle: "Community Street Animal Advocacy",
      image: "/images/animal_care/animal_welfare_ngo.jpg",
      defaultSpecies: ["dogs", "cats", "birds", "other"] as AnimalSpecies[]
    },
    {
      id: "livestock_care_centre",
      title: "Livestock Care Centre",
      subtitle: "Farm Livestock, Goats & Sheep Care",
      image: "/images/animal_care/livestock_care_centre.jpg",
      defaultSpecies: ["cows", "bulls", "buffaloes", "goats", "sheep"] as AnimalSpecies[]
    }
  ];

  const speciesOptions: { id: AnimalSpecies; label: string; icon: string }[] = [
    { id: "cows", label: "Cows (Desi/Dairy)", icon: "🐄" },
    { id: "bulls", label: "Bulls & Oxen", icon: "🐂" },
    { id: "buffaloes", label: "Buffaloes", icon: "🐃" },
    { id: "dogs", label: "Indie Dogs & Pups", icon: "🐕" },
    { id: "cats", label: "Cats & Kittens", icon: "🐈" },
    { id: "goats", label: "Goats", icon: "🐐" },
    { id: "sheep", label: "Sheep", icon: "🐑" },
    { id: "birds", label: "Birds & Pigeons", icon: "🕊️" },
    { id: "other", label: "Other Rescues", icon: "🐾" },
  ];

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterFormData>({
    defaultValues: {
      role: "food_provider",
      organization_type: "restaurant",
      city: "Delhi NCR",
    }
  });

  const handleRoleSelect = (roleType: "food_provider" | "recipient" | "animal_care" | "volunteer") => {
    setSelectedRoleType(roleType);
    if (roleType === "food_provider") {
      setValue("role", "food_provider");
      setValue("organization_type", "restaurant");
    } else if (roleType === "recipient") {
      setValue("role", "recipient");
      setValue("organization_type", "ngo");
    } else if (roleType === "animal_care") {
      setValue("role", "recipient");
      setValue("organization_type", selectedAnimalOrgType);
      setValue("recipient_category", "animal_care");
    } else {
      setValue("role", "volunteer");
    }
  };

  const handleAnimalTypeSelect = (typeId: string) => {
    setSelectedAnimalOrgType(typeId);
    setValue("organization_type", typeId);
    const found = animalOrgTypes.find(t => t.id === typeId);
    if (found) {
      setSelectedSpecies(found.defaultSpecies);
    }
  };

  const toggleSpecies = (speciesId: AnimalSpecies) => {
    setSelectedSpecies(prev => 
      prev.includes(speciesId) 
        ? prev.filter(s => s !== speciesId) 
        : [...prev, speciesId]
    );
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const isAnimal = selectedRoleType === "animal_care";
      const actualRole = isAnimal ? "recipient" : selectedRoleType;

      await registerAuth({
        ...data,
        role: actualRole,
        recipient_category: isAnimal ? "animal_care" : "human",
        organization_type: isAnimal ? selectedAnimalOrgType : data.organization_type,
        supported_species: isAnimal ? selectedSpecies : [],
      });

      if (isAnimal) {
        router.push("/recipients");
      } else {
        router.push("/discover");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed. Please check your information.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-white border border-freshBorder flex items-center justify-center p-2 mx-auto shadow-sm">
          <img src="/images/logo.png" alt="FoodLoop" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-freshText-primary tracking-tight">
          Join FoodLoop Ecosystem
        </h1>
        <p className="text-xs sm:text-sm text-freshText-secondary">
          Register to donate food, receive human relief, coordinate animal care sanctuaries, or volunteer.
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-freshError flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Role Selection Tabs */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-2">
            Select Organization or Account Role *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => handleRoleSelect("food_provider")}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                selectedRoleType === "food_provider"
                  ? "bg-lime/20 border-lime-500 font-bold shadow-sm"
                  : "bg-freshBg border-freshBorder hover:bg-sage-50"
              }`}
            >
              <Building className="w-5 h-5 text-freshText-primary mb-1" />
              <p className="text-xs font-bold text-freshText-primary">Food Provider</p>
              <p className="text-[10px] text-freshText-secondary mt-0.5">Hotel, Caterer, Banquet</p>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect("recipient")}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                selectedRoleType === "recipient"
                  ? "bg-lime/20 border-lime-500 font-bold shadow-sm"
                  : "bg-freshBg border-freshBorder hover:bg-sage-50"
              }`}
            >
              <Heart className="w-5 h-5 text-red-600 mb-1" />
              <p className="text-xs font-bold text-freshText-primary">Human Relief</p>
              <p className="text-[10px] text-freshText-secondary mt-0.5">NGO, Food Bank, Shelter</p>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect("animal_care")}
              className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                selectedRoleType === "animal_care"
                  ? "bg-amber-50 border-amber-500 font-bold shadow-sm"
                  : "bg-freshBg border-freshBorder hover:bg-amber-50/50"
              }`}
            >
              <span className="text-lg block mb-1">🐾</span>
              <p className="text-xs font-bold text-freshText-primary">Animal Care</p>
              <p className="text-[10px] text-freshText-secondary mt-0.5">Gaushala, Shelter, Vet</p>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect("volunteer")}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                selectedRoleType === "volunteer"
                  ? "bg-lime/20 border-lime-500 font-bold shadow-sm"
                  : "bg-freshBg border-freshBorder hover:bg-sage-50"
              }`}
            >
              <Truck className="w-5 h-5 text-freshText-primary mb-1" />
              <p className="text-xs font-bold text-freshText-primary">Volunteer</p>
              <p className="text-[10px] text-freshText-secondary mt-0.5">Pickup & Courier</p>
            </button>
          </div>
        </div>

        {/* Animal Care Specific Selection Card */}
        {selectedRoleType === "animal_care" && (
          <div className="p-5 bg-gradient-to-br from-amber-50/60 to-orange-50/40 rounded-3xl border border-amber-200/80 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
                  <span>Animal Care Organization Type *</span>
                </h3>
                <p className="text-[11px] text-amber-800">
                  Select your dedicated sanctuary, clinic, or welfare facility.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-200/60 text-amber-900">
                AWBI Recognized
              </span>
            </div>

            {/* Visual Photographic Organization Type Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {animalOrgTypes.map((type) => {
                const isSelected = selectedAnimalOrgType === type.id;
                return (
                  <button
                    type="button"
                    key={type.id}
                    onClick={() => handleAnimalTypeSelect(type.id)}
                    className={`group rounded-2xl border text-left overflow-hidden transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-amber-600 ring-2 ring-amber-500/20 shadow-md bg-white"
                        : "border-gray-200 bg-white/80 hover:border-amber-300"
                    }`}
                  >
                    <div className="relative h-24 w-full overflow-hidden bg-gray-100">
                      <img
                        src={type.image}
                        alt={type.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <h4 className="font-bold text-xs text-freshText-primary">{type.title}</h4>
                      <p className="text-[10px] text-freshText-secondary line-clamp-1">{type.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Species Supported Multi-Select */}
            <div className="space-y-2 pt-2 border-t border-amber-200/60">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-950">
                Animal Species Supported at Your Facility *
              </label>
              <p className="text-[11px] text-amber-800">
                Providers will only send compatible, species-safe vegetable peelings, breads, or feeds.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {speciesOptions.map((sp) => {
                  const isChecked = selectedSpecies.includes(sp.id);
                  return (
                    <button
                      type="button"
                      key={sp.id}
                      onClick={() => toggleSpecies(sp.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isChecked
                          ? "bg-amber-600 text-white shadow-xs"
                          : "bg-white border border-freshBorder text-freshText-secondary hover:border-amber-400"
                      }`}
                    >
                      <span>{sp.icon}</span>
                      <span>{sp.label}</span>
                      {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2 border-t border-freshBorder">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Contact Person Full Name *
              </label>
              <input
                type="text"
                required
                {...register("full_name", { required: true })}
                placeholder="Rohit Verma / Dr. Anand Kumar"
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Contact Phone / WhatsApp *
              </label>
              <input
                type="tel"
                required
                {...register("phone_number", { required: true })}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                {...register("email", { required: true })}
                placeholder="contact@organization.org.in"
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                Password (Min 8 chars) *
              </label>
              <input
                type="password"
                required
                minLength={8}
                {...register("password", { required: true, minLength: 8 })}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              />
            </div>
          </div>

          {/* Organization details for Provider, NGO & Animal Care */}
          {selectedRoleType !== "volunteer" && (
            <div className="space-y-4 pt-4 border-t border-freshBorder">
              <h4 className="text-xs font-bold uppercase tracking-wider text-freshText-primary">
                Organization Profile & Location
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedRoleType === "food_provider" && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                      Food Provider Category *
                    </label>
                    <select
                      {...register("organization_type", { required: true })}
                      className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
                    >
                      <option value="restaurant">Restaurant / Eatery</option>
                      <option value="hotel">Hotel / Luxury Hospitality</option>
                      <option value="wedding_venue">Wedding Venue / Resort</option>
                      <option value="wedding_organizer">Wedding Planner / Organizer</option>
                      <option value="catering_company">Catering Company</option>
                      <option value="event_management">Event Management Company</option>
                      <option value="bakery">Bakery / Patisserie</option>
                      <option value="grocery_store">Grocery Store / Supermarket</option>
                      <option value="banquet_hall">Banquet Hall / Party Lawn</option>
                      <option value="corporate_event_organizer">Corporate Event Organizer</option>
                      <option value="other_food_business">Other Food Business</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    {...register("organization_name", { required: true })}
                    placeholder={
                      selectedRoleType === "food_provider" 
                        ? "Taj Hotel Banquets" 
                        : selectedRoleType === "animal_care"
                        ? "Shree Krishna Gaushala Sanctuary"
                        : "Robin Hood Army Delhi"
                    }
                    className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                    {selectedRoleType === "animal_care" 
                      ? "AWBI / Society / VCI Number" 
                      : selectedRoleType === "food_provider" 
                      ? "FSSAI Registration Number" 
                      : "NGO DARPAN / 80G Number"}
                  </label>
                  <input
                    type="text"
                    {...register("registration_number")}
                    placeholder={
                      selectedRoleType === "animal_care"
                        ? "AWBI-DL-2020-00812"
                        : selectedRoleType === "food_provider"
                        ? "FSSAI-10018011000452"
                        : "DARPAN-DL-2021-00984"
                    }
                    className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
                  />
                </div>

                {selectedRoleType === "animal_care" && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                      Sanctuary / Shelter Mission & Feed Requirements
                    </label>
                    <textarea
                      rows={2}
                      {...register("description")}
                      placeholder="e.g. Caring for 450 rescued desi cows and retired cattle. We accept daily raw vegetable peels, grain mash, and unseasoned bread trimmings."
                      className="w-full px-4 py-2 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
                    Official Address (City / State) *
                  </label>
                  <input
                    type="text"
                    required
                    {...register("address", { required: true })}
                    placeholder="e.g. Sector 34 Rural Extension, Najafgarh, New Delhi 110043"
                    className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full font-bold shadow-floating mt-4"
          >
            Complete Registration
          </Button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-freshText-secondary">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-lime-700 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
