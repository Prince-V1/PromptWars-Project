import { NextRequest, NextResponse } from "next/server";
import { INITIAL_HAUZ_KHAS_EVENTS } from "@/lib/mockData";

export async function GET() {
  return NextResponse.json(INITIAL_HAUZ_KHAS_EVENTS, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newEvent = {
      id: `ev-${Date.now()}`,
      organizer_id: "org-social-hk",
      event_name: body.event_name,
      event_type: body.event_type,
      event_date: body.event_date,
      start_time: body.start_time,
      end_time: body.end_time,
      venue_name: body.venue_name,
      location_address: body.location_address,
      city: body.city || "New Delhi",
      latitude: body.latitude || 28.5494,
      longitude: body.longitude || 77.2001,
      estimated_guests: body.estimated_guests,
      contact_person: body.contact_person,
      contact_phone: body.contact_phone,
      expected_food_categories: body.expected_food_categories || ["cooked_meals"],
      estimated_food_quantity: body.estimated_food_quantity || 150,
      estimated_food_unit: body.estimated_food_unit || "kg",
      expected_surplus: body.expected_surplus || 30,
      status: "upcoming",
      notes: body.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      surplus_listings_count: 0,
    };
    return NextResponse.json(newEvent, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 400 });
  }
}
