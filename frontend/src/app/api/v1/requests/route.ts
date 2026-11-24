import { NextRequest, NextResponse } from "next/server";
import { INITIAL_HAUZ_KHAS_ORDERS, INITIAL_HAUZ_KHAS_LISTINGS } from "@/lib/mockData";

export async function GET() {
  return NextResponse.json(INITIAL_HAUZ_KHAS_ORDERS, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const listing = INITIAL_HAUZ_KHAS_LISTINGS.find((l) => l.id === body.listing_id) || INITIAL_HAUZ_KHAS_LISTINGS[0];
    const newRequest = {
      id: `req-${Date.now().toString(36)}`,
      listing_id: body.listing_id,
      recipient_id: "rec-rha-delhi",
      organization_id: listing.organization_id || "org-taj-hk",
      requested_quantity: body.requested_quantity || 10,
      status: "accepted",
      delivery_mode: body.delivery_mode || "volunteer_courier",
      notes: body.notes || "Surplus food claim initiated on FoodLoop.",
      recipient_name: "Robin Hood Army South Delhi",
      recipient_organization: "Robin Hood Army Feeding Hub",
      listing: listing,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return NextResponse.json(newRequest, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 400 });
  }
}
