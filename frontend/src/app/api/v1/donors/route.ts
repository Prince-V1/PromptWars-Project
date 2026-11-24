import { NextRequest, NextResponse } from "next/server";
import { INITIAL_HAUZ_KHAS_DONORS } from "@/lib/mockData";

export async function GET() {
  return NextResponse.json(INITIAL_HAUZ_KHAS_DONORS, { status: 200 });
}
