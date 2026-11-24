"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BarChart3, ShieldCheck, Leaf, Utensils, Users, Loader2
} from "lucide-react";
import { api } from "@/lib/api";
import { ImpactMetrics } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ImpactPage() {
  const [metrics, setMetrics] = useState<ImpactMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getImpactDashboard()
      .then(setMetrics)
      .catch((err) => console.log("Failed to load impact metrics:", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-lime-600" />
        <p className="text-xs text-freshText-secondary font-medium">Loading verified impact metrics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="lime" size="md">Environmental & Social Accountability</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-freshText-primary tracking-tight">
          Verified Rescue Impact
        </h1>
        <p className="text-sm sm:text-base text-freshText-secondary leading-relaxed">
          Measuring meals restored and greenhouse gas emissions diverted from landfills across India.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-8 text-center bg-gradient-to-br from-white to-lime/10 border-lime-300">
          <div className="w-12 h-12 rounded-2xl bg-lime flex items-center justify-center text-freshText-primary mx-auto mb-4 shadow-sm">
            <Utensils className="w-6 h-6" />
          </div>
          <p className="text-4xl font-black text-freshText-primary tracking-tight">
            {metrics?.total_estimated_meals || 0}
          </p>
          <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary mt-1">
            Meals Distributed
          </p>
          <p className="text-[11px] text-freshText-secondary/80 mt-2">
            Based on verified 400g nutrition portion standard
          </p>
        </Card>

        <Card className="p-8 text-center bg-gradient-to-br from-white to-sage-50 border-sage-300">
          <div className="w-12 h-12 rounded-2xl bg-sage-200 flex items-center justify-center text-freshText-primary mx-auto mb-4 shadow-sm">
            <Leaf className="w-6 h-6 text-freshSuccess" />
          </div>
          <p className="text-4xl font-black text-freshSuccess tracking-tight">
            {metrics?.total_co2_saved_kg || 0} <span className="text-lg">kg</span>
          </p>
          <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary mt-1">
            CO₂e Emissions Prevented
          </p>
          <p className="text-[11px] text-freshText-secondary/80 mt-2">
            2.5 kg CO2e / kg diverted food waste
          </p>
        </Card>

        <Card className="p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-freshBg flex items-center justify-center text-freshText-primary mx-auto mb-4 border border-freshBorder">
            <BarChart3 className="w-6 h-6 text-lime-700" />
          </div>
          <p className="text-4xl font-black text-freshText-primary tracking-tight">
            {metrics?.total_kg_redistributed || 0} <span className="text-lg">kg</span>
          </p>
          <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary mt-1">
            Total Food Rescued
          </p>
          <p className="text-[11px] text-freshText-secondary/80 mt-2">
            Verified weight handover at collection
          </p>
        </Card>

        <Card className="p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-freshBg flex items-center justify-center text-freshText-primary mx-auto mb-4 border border-freshBorder">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-4xl font-black text-freshText-primary tracking-tight">
            {(metrics?.active_providers_count || 0) + (metrics?.active_recipients_count || 0)}
          </p>
          <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary mt-1">
            Active Partner Network
          </p>
          <p className="text-[11px] text-freshText-secondary/80 mt-2">
            Restaurants, bakeries, and verified NGOs
          </p>
        </Card>
      </div>

      {/* Methodology and Anti-Greenwashing Transparency Declaration */}
      <Card className="p-8 sm:p-10 space-y-6 bg-white">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-freshSuccess" />
          <h2 className="text-xl font-bold text-freshText-primary">Impact Calculation Standard & Audit Rules</h2>
        </div>

        <p className="text-xs sm:text-sm text-freshText-secondary leading-relaxed">
          To maintain credibility and avoid double-counting or fabricated statistics, FoodLoop relies on rigorous server-side atomic verification functions:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="p-5 rounded-2xl bg-freshBg border border-freshBorder space-y-2">
            <h4 className="text-xs font-bold text-freshText-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-freshSuccess" />
              Meal Portions Formula
            </h4>
            <p className="text-xs text-freshText-secondary leading-relaxed">
              <strong>Formula:</strong> 1 Portion = 400 grams edible cooked meal equivalent (2.5 portions per 1.0 kg). Bulk crate produce and bakery loaves are converted through standard density lookup multipliers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-freshBg border border-freshBorder space-y-2">
            <h4 className="text-xs font-bold text-freshText-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-freshSuccess" />
              Avoided Greenhouse Gas Emissions
            </h4>
            <p className="text-xs text-freshText-secondary leading-relaxed">
              <strong>Formula:</strong> 2.5 kg CO₂ equivalent avoided per 1.0 kg of food rescued from decomposition in municipal landfills (UNEP Food Waste Index & WRAP benchmark).
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-freshBorder flex items-center justify-between text-xs text-freshText-secondary">
          <span>All timestamps stored in UTC and presented in Asia/Kolkata (IST).</span>
          <span className="font-semibold text-freshText-primary">Zero fabricated claims</span>
        </div>
      </Card>

      {/* Bottom CTA */}
      <div className="text-center pt-8">
        <Link href="/discover">
          <Button variant="primary" size="lg" className="font-bold shadow-floating">
            Browse Live Donations in Your City
          </Button>
        </Link>
      </div>
    </div>
  );
}
