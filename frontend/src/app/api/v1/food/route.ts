import { NextRequest, NextResponse } from "next/server";
import { INITIAL_HAUZ_KHAS_LISTINGS } from "@/lib/mockData";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const dietary_type = searchParams.get("dietary_type");
  const search = searchParams.get("search");
  const status = searchParams.get("status");

  let listings = [...INITIAL_HAUZ_KHAS_LISTINGS];

  if (category) {
    listings = listings.filter((l) => l.category === category);
  }
  if (dietary_type) {
    listings = listings.filter((l) => l.dietary_type === dietary_type);
  }
  if (status) {
    listings = listings.filter((l) => l.status === status);
  }
  if (search) {
    const s = search.toLowerCase();
    listings = listings.filter(
      (l) =>
        l.title.toLowerCase().includes(s) ||
        l.description.toLowerCase().includes(s) ||
        l.pickup_address.toLowerCase().includes(s)
    );
  }

  return NextResponse.json(listings, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newListing = {
      id: `fl-hk-${Date.now()}`,
      provider_id: "prov-taj-hk",
      organization_id: "org-taj-hk",
      title: body.title || "Surplus Food Batch",
      description: body.description || "Fresh surplus batch listed on FoodLoop.",
      category: body.category || "cooked_meals",
      quantity: Number(body.quantity) || 10,
      remaining_quantity: Number(body.remaining_quantity ?? body.quantity) || 10,
      unit: body.unit || "kg",
      dietary_type: body.dietary_type || "veg",
      status: "available",
      preparation_time: body.preparation_time || new Date().toISOString(),
      pickup_deadline: body.pickup_deadline || new Date(Date.now() + 3600000 * 5).toISOString(),
      pickup_address: body.pickup_address || "Hauz Khas Village Entrance, New Delhi - 110016",
      latitude: body.latitude || 28.5494,
      longitude: body.longitude || 77.2001,
      image_url: body.image_url || "/images/food/dal_makhani.jpg",
      storage_instructions: body.storage_instructions || "hot_holding",
      allergens: body.allergens || ["Dairy"],
      priority_score: body.priority_score || 85,
      food_safety_status: body.food_safety_status || "untouched",
      target_beneficiary: body.target_beneficiary || "human",
      suitable_species: body.suitable_species || [],
      animal_feed_safety_confirmed: body.animal_feed_safety_confirmed || false,
      provider_name: body.provider_name || "Executive Chef Vikram Kapoor",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return NextResponse.json(newListing, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 400 });
  }
}
