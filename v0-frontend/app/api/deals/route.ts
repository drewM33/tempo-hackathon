import { NextResponse } from "next/server";
import { MOCK_DEALS, filterDeals } from "@/lib/marketplace-data";
import type { ProtocolType } from "@/lib/marketplace-data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const sort = (searchParams.get("sort") as "popular" | "recent" | "value") ?? "popular";
  const protocol = (searchParams.get("protocol") as ProtocolType) ?? undefined;

  const deals = filterDeals(MOCK_DEALS, { category, search, sort, protocol });

  return NextResponse.json({
    deals,
    total: deals.length,
    totalAll: MOCK_DEALS.length,
  });
}
