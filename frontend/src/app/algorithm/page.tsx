"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Cpu, Sparkles, ShieldCheck, 
  ArrowRight, Flame, Scale, Clock, MapPin, 
  Leaf, Heart, DollarSign, CheckCircle2, ChevronRight, BarChart2
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AlgorithmLabPage() {
  // --- Algorithm 1: Multi-Factor Matching Engine State ---
  const [distanceKm, setDistanceKm] = useState<number>(3.5);
  const [isCategoryMatch, setIsCategoryMatch] = useState<boolean>(true);
  const [portionCount, setPortionCount] = useState<number>(100);
  const [ngoCapacity, setNgoCapacity] = useState<number>(200);
  const [hoursLeft, setHoursLeft] = useState<number>(2.5);
  const [isVerified, setIsVerified] = useState<boolean>(true);

  // Multi-factor calculation
  const maxDist = 30.0;
  const distScore = Math.max(0, 35.0 * (1.0 - distanceKm / maxDist));
  const catScore = isCategoryMatch ? 25.0 : 5.0;
  const capScore = portionCount <= ngoCapacity ? 20.0 : Math.max(5.0, 20.0 * (ngoCapacity / portionCount));
  const urgencyScore = hoursLeft <= 3.0 ? (distanceKm <= 5.0 ? 10.0 : 5.0) : (hoursLeft <= 6.0 ? 8.0 : 5.0);
  const trustScore = isVerified ? 10.0 : 3.0;
  const totalMatchScore = Math.min(100, Math.round(distScore + catScore + capScore + urgencyScore + trustScore));

  // --- Algorithm 2: Priority & Urgency Decay State ---
  const [decayHours, setDecayHours] = useState<number>(2.0);
  const [storageType, setStorageType] = useState<string>("hot_holding");
  const [foodCategory, setFoodCategory] = useState<string>("cooked_meals");
  const [batchQuantity, setBatchQuantity] = useState<number>(60);

  // Calculate Urgency Score
  const timeWeight = decayHours <= 0 ? 50 : decayHours <= 2 ? 48 : decayHours <= 4 ? 38 : decayHours <= 8 ? 25 : 12;
  const storageMap: Record<string, number> = { hot_holding: 25, refrigerated: 15, room_temperature: 10, frozen: 5 };
  const storageWeight = storageMap[storageType] || 10;
  const catMap: Record<string, number> = { cooked_meals: 15, dairy: 12, bakery: 10, fresh_produce: 8, packaged_groceries: 3 };
  const catWeight = catMap[foodCategory] || 5;
  const qtyWeight = batchQuantity >= 50 ? 10 : batchQuantity >= 20 ? 7 : 4;
  const totalUrgencyScore = Math.min(100, Math.round(timeWeight + storageWeight + catWeight + qtyWeight));

  const getUrgencyTier = (score: number) => {
    if (score >= 80) return { label: "CRITICAL", color: "text-red-600 bg-red-100 border-red-300", rec: "Immediate flash-dispatch to closest shelter within 3km" };
    if (score >= 60) return { label: "HIGH URGENCY", color: "text-amber-700 bg-amber-100 border-amber-300", rec: "Priority claim window active for volunteer couriers" };
    if (score >= 40) return { label: "STANDARD", color: "text-blue-700 bg-blue-100 border-blue-300", rec: "Standard distribution batch open to all verified NGOs" };
    return { label: "LOW DECAY", color: "text-green-700 bg-green-100 border-green-300", rec: "Extended shelf-life batch with open distribution schedule" };
  };
  const tier = getUrgencyTier(totalUrgencyScore);

  // --- Algorithm 3: UNEP Verified Impact Simulation ---
  const [simKg, setSimKg] = useState<number>(120);
  const mealsEquivalent = Math.round(simKg * 2.5);
  const co2AvoidedKg = Math.round(simKg * 2.5 * 10) / 10;
  const methaneAvoidedKg = Math.round(simKg * 0.25 * 10) / 10;
  const waterSavedLiters = Math.round(simKg * 1000);
  const economicValueInr = Math.round(mealsEquivalent * 150);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 rounded-4xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-white">
            <Cpu className="w-4 h-4 text-lime-300" />
            <span>Deterministic Machine Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            FoodLoop Algorithm Lab
          </h1>
          <p className="text-sm sm:text-base text-white/90 leading-relaxed">
            Interact directly with the live mathematical formulas powering Foodloop: deterministic multi-factor NGO matching, operational urgency decay curves, and UNEP verified greenhouse gas diversion metrics.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/discover">
              <Button variant="secondary" size="sm" className="font-bold">
                Explore Live Surplus Food
              </Button>
            </Link>
            <Link href="/donate">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20 font-bold">
                List Surplus as Provider
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of Algorithms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ================= ALGORITHM 1: MULTI-FACTOR MATCHING ================= */}
        <Card className="p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-freshText-primary">1. Multi-Factor Matching Engine</h3>
                  <p className="text-[11px] text-freshText-secondary">Deterministic NGO dispatch scoring (0 – 100)</p>
                </div>
              </div>
              <Badge variant="lime" size="sm">Algorithm 1</Badge>
            </div>

            {/* Formula Block */}
            <div className="p-3.5 bg-freshBg rounded-2xl border border-freshBorder font-mono text-[11px] text-freshText-primary leading-relaxed overflow-x-auto">
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Mathematical Formula</p>
              <code>S_match = 0.35·S_dist + 0.25·S_cat + 0.20·S_cap + 0.10·S_urgency + 0.10·S_trust</code>
            </div>

            {/* Interactive Inputs */}
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Distance to NGO (Haversine):</span>
                  <span className="font-bold text-red-600">{distanceKm} km</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="30"
                  step="0.5"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
                  className="w-full accent-red-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Hours Remaining Before Deadline:</span>
                  <span className="font-bold text-red-600">{hoursLeft} hrs</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={hoursLeft}
                  onChange={(e) => setHoursLeft(parseFloat(e.target.value))}
                  className="w-full accent-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsCategoryMatch(!isCategoryMatch)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    isCategoryMatch ? "bg-red-50 border-red-300 text-red-700" : "bg-gray-50 border-gray-200 text-gray-500"
                  }`}
                >
                  Category Match: {isCategoryMatch ? "Exact (25 pts)" : "Mismatch (5 pts)"}
                </button>

                <button
                  onClick={() => setIsVerified(!isVerified)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    isVerified ? "bg-green-50 border-green-300 text-green-700" : "bg-gray-50 border-gray-200 text-gray-500"
                  }`}
                >
                  NGO Status: {isVerified ? "Verified (10 pts)" : "Unverified (3 pts)"}
                </button>
              </div>
            </div>
          </div>

          {/* Result Output Card */}
          <div className="p-5 bg-gradient-to-br from-freshBg to-red-50/40 rounded-3xl border border-red-100 space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-freshText-secondary">Computed Match Score</span>
              <span className="text-2xl font-black text-red-600">{totalMatchScore}%</span>
            </div>

            {/* Score Progress Bar */}
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-red-600 rounded-full transition-all duration-300"
                style={{ width: `${totalMatchScore}%` }}
              />
            </div>

            <div className="grid grid-cols-5 gap-1 text-center text-[10px] text-freshText-secondary pt-1">
              <div>Dist: {distScore.toFixed(0)}</div>
              <div>Cat: {catScore}</div>
              <div>Cap: {capScore.toFixed(0)}</div>
              <div>Urg: {urgencyScore}</div>
              <div>Trust: {trustScore}</div>
            </div>
          </div>
        </Card>

        {/* ================= ALGORITHM 2: OPERATIONAL URGENCY DECAY ================= */}
        <Card className="p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-freshText-primary">2. Operational Urgency Decay</h3>
                  <p className="text-[11px] text-freshText-secondary">Perishability priority algorithm (0 – 100)</p>
                </div>
              </div>
              <Badge variant="warning" size="sm">Algorithm 2</Badge>
            </div>

            {/* Formula Block */}
            <div className="p-3.5 bg-freshBg rounded-2xl border border-freshBorder font-mono text-[11px] text-freshText-primary leading-relaxed overflow-x-auto">
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Mathematical Formula</p>
              <code>U(t) = w_time(t) + w_storage + w_category + w_quantity (bounded 100)</code>
            </div>

            {/* Interactive Inputs */}
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Hours Until Expired:</span>
                  <span className="font-bold text-amber-700">{decayHours} hours</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  step="0.5"
                  value={decayHours}
                  onChange={(e) => setDecayHours(parseFloat(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Storage Condition</label>
                  <select
                    value={storageType}
                    onChange={(e) => setStorageType(e.target.value)}
                    className="w-full p-2 bg-freshBg border border-freshBorder rounded-xl font-medium text-xs focus:outline-none"
                  >
                    <option value="hot_holding">Hot-Holding (25 pts)</option>
                    <option value="refrigerated">Refrigerated (15 pts)</option>
                    <option value="room_temperature">Room Temp (10 pts)</option>
                    <option value="frozen">Frozen (5 pts)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Food Category</label>
                  <select
                    value={foodCategory}
                    onChange={(e) => setFoodCategory(e.target.value)}
                    className="w-full p-2 bg-freshBg border border-freshBorder rounded-xl font-medium text-xs focus:outline-none"
                  >
                    <option value="cooked_meals">Cooked Meals (15 pts)</option>
                    <option value="dairy">Dairy (12 pts)</option>
                    <option value="bakery">Bakery (10 pts)</option>
                    <option value="fresh_produce">Produce (8 pts)</option>
                    <option value="packaged_groceries">Packaged (3 pts)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Result Output Card */}
          <div className="p-5 bg-gradient-to-br from-freshBg to-amber-50/40 rounded-3xl border border-amber-200 space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-freshText-secondary block">Computed Priority Score</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border mt-1 inline-block ${tier.color}`}>
                  {tier.label}
                </span>
              </div>
              <span className="text-2xl font-black text-amber-700">{totalUrgencyScore} / 100</span>
            </div>

            <p className="text-[11px] text-freshText-secondary leading-relaxed border-t border-amber-100 pt-2">
              <strong>Recommendation:</strong> {tier.rec}
            </p>
          </div>
        </Card>
      </div>

      {/* ================= ALGORITHM 3: UNEP VERIFIED ENVIRONMENTAL IMPACT ================= */}
      <Card className="p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center font-bold">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-freshText-primary">3. Verified UNEP Impact & Carbon Offset Engine</h3>
              <p className="text-xs text-freshText-secondary">Global standard conversion: 400g/portion & 2.5 kg CO₂e avoided per kg food</p>
            </div>
          </div>
          <Badge variant="success" size="md">Environmental Science</Badge>
        </div>

        {/* Quantity Slider */}
        <div className="p-6 bg-freshBg rounded-3xl border border-freshBorder space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-freshText-primary">Simulate Rescued Food Volume:</span>
            <span className="text-xl font-black text-green-600">{simKg} kg</span>
          </div>
          <input
            type="range"
            min="10"
            max="1000"
            step="10"
            value={simKg}
            onChange={(e) => setSimKg(parseFloat(e.target.value))}
            className="w-full accent-green-600"
          />
        </div>

        {/* 4 Output Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-freshBorder shadow-subtle text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Nutritional Portions</p>
            <p className="text-2xl font-black text-freshText-primary mt-1">{mealsEquivalent.toLocaleString()}</p>
            <p className="text-[10px] text-freshText-secondary mt-0.5">Wholesome 400g meals</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-freshBorder shadow-subtle text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">CO₂e Emissions Prevented</p>
            <p className="text-2xl font-black text-green-600 mt-1">{co2AvoidedKg.toLocaleString()} kg</p>
            <p className="text-[10px] text-green-700 mt-0.5">Landfill emissions averted</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-freshBorder shadow-subtle text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Methane (CH₄) Diverted</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{methaneAvoidedKg.toLocaleString()} kg</p>
            <p className="text-[10px] text-amber-700 mt-0.5">Potent greenhouse gas</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-freshBorder shadow-subtle text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Economic Meal Value</p>
            <p className="text-2xl font-black text-red-600 mt-1">₹{economicValueInr.toLocaleString()}</p>
            <p className="text-[10px] text-red-700 mt-0.5">Nutritional community aid</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
