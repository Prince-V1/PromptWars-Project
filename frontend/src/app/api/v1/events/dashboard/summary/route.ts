import { NextResponse } from "next/server";
import { INITIAL_HAUZ_KHAS_SUMMARY } from "@/lib/mockData";

export async function GET() {
  return NextResponse.json(INITIAL_HAUZ_KHAS_SUMMARY, { status: 200 });
}
