import { NextResponse } from "next/server";

import { getSeedWallets, isValironEnabled } from "@/lib/valiron/client";

export async function GET() {
  const refreshMsRaw = process.env.VALIRON_REFRESH_MS?.trim();
  const refreshMs = refreshMsRaw
    ? parseInt(refreshMsRaw, 10)
    : 90_000;

  return NextResponse.json({
    valironEnabled: isValironEnabled(),
    seedAddresses: getSeedWallets(),
    refreshMs: Number.isFinite(refreshMs) ? refreshMs : 90_000,
    chain: process.env.VALIRON_CHAIN?.trim() || "ethereum",
  });
}
