"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  User, Building2, Phone, Mail, MapPin, ShieldCheck, 
  Save, RefreshCw, CheckCircle2, AlertCircle, Sparkles,
  ArrowRight, HeartHandshake, Truck, Store, Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { UserProfile, UserRole } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function ProfilePage() {
  const { user, switchDemoRole } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("hotel");
  const [recipientCat, setRecipientCat] = useState("human");
  const [supportedSpecies, setSupportedSpecies] = useState<string[]>(["cows", "bulls", "buffaloes"]);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("New Delhi");
  const [pincode, setPincode] = useState("110021");
  const [capacity, setCapacity] = useState(500);
  const [regNumber, setRegNumber] = useState("");

  const speciesOptions = [
    { id: "cows", label: "Cows & Calves" },
    { id: "bulls", label: "Bulls" },
    { id: "buffaloes", label: "Buffaloes" },
    { id: "dogs", label: "Stray Dogs" },
    { id: "cats", label: "Cats" },
    { id: "goats", label: "Goats" },
    { id: "sheep", label: "Sheep" },
    { id: "birds", label: "Birds & Pigeons" },
    { id: "other", label: "Other Animals" }
  ];

  const loadProfile = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getProfile();
      setProfile(data);
      setFullName(data.full_name || "");
      setEmail(data.email || "");
      setPhone(data.phone_number || "+919811001234");
      
      if (data.organization) {
        setOrgName(data.organization.name || "");
        setOrgType(data.organization.organization_type || "hotel");
        setRecipientCat(data.organization.recipient_category || "human");
        setSupportedSpecies(data.organization.supported_species || ["cows", "bulls"]);
        setAddress(data.organization.address || "");
        setCity(data.organization.city || "New Delhi");
        setPincode(data.organization.postal_code || "110021");
        setCapacity(data.organization.capacity_servings_per_day || 500);
        setRegNumber(data.organization.registration_number || "FSSAI-10018011000452");
      } else {
        setOrgName("Taj Palace Hotel Banquets");
        setAddress("Diplomatic Enclave, Chanakyapuri");
        setRegNumber("FSSAI-10018011000452");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load profile.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const handleToggleSpecies = (specId: string) => {
    if (supportedSpecies.includes(specId)) {
      setSupportedSpecies(supportedSpecies.filter(s => s !== specId));
    } else {
      setSupportedSpecies([...supportedSpecies, specId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setErrorMessage(null);

    try {
      const updated = await api.updateProfile({
        full_name: fullName.trim(),
        phone_number: phone.trim(),
        organization_name: orgName.trim(),
        organization_type: orgType,
        recipient_category: recipientCat,
        supported_species: supportedSpecies,
        address: address.trim(),
        city: city.trim(),
        postal_code: pincode.trim(),
        capacity_servings_per_day: Number(capacity),
        registration_number: regNumber.trim()
      });

      setProfile(updated);
      setSaveSuccess("Profile and organization details updated successfully!");
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchRole = async (role: UserRole) => {
    await switchDemoRole(role);
    await loadProfile();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-freshText-primary tracking-tight">
            Account & Organization Profile
          </h1>
          <p className="text-xs sm:text-sm text-freshText-secondary mt-1">
            Manage your FoodLoop verified credentials, contact coordinates, and food redistribution preferences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/orders">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Track Orders
            </Button>
          </Link>
          <Link href="/donate">
            <Button variant="primary" size="sm">
              Donate Food
            </Button>
          </Link>
        </div>
      </div>

      {/* Demo Persona Fast Switcher Banner */}
      <Card className="p-4 bg-sage-50/80 border-sage-200 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="text-xs font-bold text-freshText-primary">
            Quick Persona Switcher:
          </span>
          <span className="text-xs text-freshText-secondary hidden sm:inline">
            Test as different ecosystem participants in one click
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { role: "food_provider" as UserRole, label: "Taj Hotel (Provider)" },
            { role: "recipient" as UserRole, label: "Robin Hood Army (NGO)" },
            { role: "volunteer" as UserRole, label: "Arjun (Volunteer)" },
            { role: "admin" as UserRole, label: "Dr. Sunita (Admin)" },
          ].map((item) => (
            <button
              key={item.role}
              onClick={() => handleSwitchRole(item.role)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                profile?.role === item.role
                  ? "bg-freshText-primary text-white shadow-xs"
                  : "bg-white text-freshText-secondary hover:text-freshText-primary border border-freshBorder"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-xs sm:text-sm text-emerald-800 font-semibold flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-3xl text-xs sm:text-sm text-red-800 font-semibold flex items-center gap-2.5 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Identity Card */}
          <div className="space-y-6">
            <Card className="p-6 bg-white border-freshBorder rounded-3xl text-center space-y-4 shadow-card">
              <div className="w-20 h-20 rounded-3xl bg-lime/20 border-2 border-lime-500 text-freshText-primary flex items-center justify-center font-black text-2xl mx-auto shadow-inner">
                {fullName.charAt(0) || "U"}
              </div>

              <div>
                <h3 className="font-extrabold text-freshText-primary text-base">
                  {fullName || "FoodLoop Member"}
                </h3>
                <p className="text-xs text-freshText-secondary font-medium mt-0.5 truncate">
                  {email || "user@foodloop.in"}
                </p>
                <div className="mt-2.5 flex items-center justify-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-sage-100 text-freshText-primary font-black text-[10px] uppercase tracking-wide">
                    {profile?.role?.replace("_", " ") || "Member"}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-freshBorder text-left space-y-2.5 text-xs text-freshText-secondary">
                <div className="flex items-center justify-between">
                  <span>Phone</span>
                  <strong className="text-freshText-primary">{phone || "+91 9811001234"}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hub City</span>
                  <strong className="text-freshText-primary">{city}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>License / Seal</span>
                  <strong className="text-emerald-700 font-mono text-[11px]">{regNumber || "Verified FSSAI"}</strong>
                </div>
              </div>
            </Card>

            {/* Quick Action Links */}
            <Card className="p-5 bg-white border-freshBorder rounded-3xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-freshText-secondary">
                Quick Navigation
              </h4>
              <div className="space-y-2">
                <Link
                  href="/orders"
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-freshBg hover:bg-sage-100 transition-colors text-xs font-semibold text-freshText-primary"
                >
                  <span className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-700" />
                    <span>View Tracked Orders</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-freshText-secondary" />
                </Link>

                <Link
                  href="/donate"
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-freshBg hover:bg-sage-100 transition-colors text-xs font-semibold text-freshText-primary"
                >
                  <span className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-700" />
                    <span>Create Food Listing</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-freshText-secondary" />
                </Link>

                <Link
                  href="/events"
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-freshBg hover:bg-sage-100 transition-colors text-xs font-semibold text-freshText-primary"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-red-600" />
                    <span>Wedding & Event Rescue</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-freshText-secondary" />
                </Link>
              </div>
            </Card>
          </div>

          {/* Column 2 & 3: Editable Form Fields */}
          <div className="md:col-span-2 space-y-6">
            {/* Section 1: Personal Details */}
            <Card className="p-6 bg-white border-freshBorder rounded-3xl space-y-4 shadow-subtle">
              <div className="flex items-center gap-2 pb-2 border-b border-freshBorder">
                <User className="w-4 h-4 text-freshSuccess" />
                <h3 className="text-sm font-extrabold text-freshText-primary">
                  Personal & Representative Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs sm:text-sm font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs sm:text-sm font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
                  />
                </div>
              </div>
            </Card>

            {/* Section 2: Organization Details */}
            <Card className="p-6 bg-white border-freshBorder rounded-3xl space-y-4 shadow-subtle">
              <div className="flex items-center gap-2 pb-2 border-b border-freshBorder">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-extrabold text-freshText-primary">
                  Establishment & Entity Profile
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
                    Organization / Entity Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    placeholder="e.g. Taj Palace Hotel, Robin Hood Army, or Krishna Gaushala"
                    className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs sm:text-sm font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
                    Organization Category
                  </label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs sm:text-sm font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
                  >
                    <option value="hotel">Luxury Hotel & Banquets</option>
                    <option value="restaurant">Restaurant & Fine Dining</option>
                    <option value="wedding_venue">Wedding & Banquet Hall</option>
                    <option value="catering">Catering Company</option>
                    <option value="bakery">Bakery & Sweets</option>
                    <option value="grocery_store">Supermarket & Grocery</option>
                    <option value="ngo">NGO & Relief Charity</option>
                    <option value="gaushala">Gaushala (Cattle Sanctuary)</option>
                    <option value="animal_shelter">Animal Shelter & Sanctuary</option>
                    <option value="animal_welfare_ngo">Animal Welfare NGO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
                    Beneficiary Focus
                  </label>
                  <select
                    value={recipientCat}
                    onChange={(e) => setRecipientCat(e.target.value)}
                    className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs sm:text-sm font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
                  >
                    <option value="human">Human Redistribution (Hunger Relief)</option>
                    <option value="animal_care">Animal Care & Feed Redistribution</option>
                  </select>
                </div>

                {recipientCat === "animal_care" && (
                  <div className="sm:col-span-2 p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
                    <label className="block text-xs font-extrabold text-indigo-900">
                      Supported Animal Species
                    </label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {speciesOptions.map((sp) => {
                        const isSelected = supportedSpecies.includes(sp.id);
                        return (
                          <button
                            type="button"
                            key={sp.id}
                            onClick={() => handleToggleSpecies(sp.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                : "bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-50"
                            }`}
                          >
                            {isSelected && <span className="mr-1">✓</span>}
                            {sp.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
                    Street Address & Loading Dock
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="Bay Number, Gate, Area"
                    className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs sm:text-sm font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
                    City / NCR Hub
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs sm:text-sm font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs sm:text-sm font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
                    Daily Redistribution Capacity
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    required
                    className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs sm:text-sm font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
                  />
                  <span className="text-[10px] text-freshText-secondary">Servings per day / animals fed</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
                    Govt. Registration / FSSAI / AWBI Seal
                  </label>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="FSSAI-10018011000452 or AWBI-DL-2024"
                    className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs sm:text-sm font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white font-mono"
                  />
                </div>
              </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={loadProfile}
                disabled={isSaving}
              >
                Reset
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSaving}
                className="text-xs font-black shadow-md rounded-2xl"
                leftIcon={isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              >
                {isSaving ? "Saving Updates..." : "Save Profile Changes"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
