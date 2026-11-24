import { NextRequest, NextResponse } from "next/server";
import { INITIAL_HAUZ_KHAS_RECIPIENTS } from "@/lib/mockData";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const organization_type = searchParams.get("organization_type");

  let list = [...INITIAL_HAUZ_KHAS_RECIPIENTS];
  if (category) {
    list = list.filter((r) => r.recipient_category === category);
  }
  if (organization_type) {
    list = list.filter((r) => r.organization_type === organization_type);
  }

  return NextResponse.json(list, { status: 200 });
}
