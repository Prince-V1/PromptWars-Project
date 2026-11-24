import { NextRequest, NextResponse } from "next/server";
import { INITIAL_HAUZ_KHAS_LISTINGS } from "@/lib/mockData";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const match = INITIAL_HAUZ_KHAS_LISTINGS.find((l) => l.id === id) || INITIAL_HAUZ_KHAS_LISTINGS[0];
  return NextResponse.json(match, { status: 200 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const match = INITIAL_HAUZ_KHAS_LISTINGS.find((l) => l.id === id) || INITIAL_HAUZ_KHAS_LISTINGS[0];
  const updated = { ...match, ...body, updated_at: new Date().toISOString() };
  return NextResponse.json(updated, { status: 200 });
}
