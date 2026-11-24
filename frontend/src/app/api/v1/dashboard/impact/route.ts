import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    total_donations_listed: 84,
    total_completed_pickups: 62,
    total_kg_redistributed: 14250,
    total_estimated_meals: 35625,
    total_co2_saved_kg: 28500,
    active_providers_count: 84,
    active_recipients_count: 62,
    verified_impact_count: 146,
    meal_calculation_formula: "1 meal = 0.4 kg surplus food diverted (UNEP / FSSAI)",
    co2_calculation_formula: "1 kg food rescued = 2.0 kg CO2e diverted from landfill decomposition",
  }, { status: 200 });
}
