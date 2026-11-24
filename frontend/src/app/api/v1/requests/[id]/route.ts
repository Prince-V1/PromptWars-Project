import { NextRequest, NextResponse } from "next/server";
import { INITIAL_HAUZ_KHAS_ORDERS } from "@/lib/mockData";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const match = INITIAL_HAUZ_KHAS_ORDERS.find((r) => r.id === id) || INITIAL_HAUZ_KHAS_ORDERS[0];
  return NextResponse.json(match, { status: 200 });
}
