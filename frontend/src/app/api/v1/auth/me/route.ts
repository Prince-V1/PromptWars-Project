import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    id: "usr-demo-01",
    email: "chef.vikram@socialbanquets.in",
    full_name: "Executive Chef Vikram Kapoor",
    phone: "+91 98101 44552",
    role: "food_provider",
    is_verified: true,
    fssai_license: "10018011000452",
    organization_name: "Taj Palace Banquets & Social Kitchen",
    organization_type: "banquet_hall",
    address: "Hauz Khas Village Entrance, New Delhi",
    city: "New Delhi",
    latitude: 28.5494,
    longitude: 77.2001,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date().toISOString(),
  }, { status: 200 });
}
