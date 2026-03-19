import { NextResponse } from "next/server";

import { ValironError } from "@valiron/sdk";

import { normalizeWalletForApi } from "@/lib/dashboard-data";
import { getValiron, isValironEnabled } from "@/lib/valiron/client";
import { walletProfileToPatch } from "@/lib/valiron/map-wallet-profile";
import type { ValironTrustPatch } from "@/lib/valiron-trust";

type TrustRow =
  | {
      address: string;
      ok: true;
      patch: ValironTrustPatch;
    }
  | {
      address: string;
      ok: false;
      error: string;
      code?: string;
    };

export async function POST(req: Request) {
  if (!isValironEnabled()) {
    return NextResponse.json({ enabled: false, results: [] as TrustRow[] });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const addresses = (body as { addresses?: unknown })?.addresses;
  if (!Array.isArray(addresses)) {
    return NextResponse.json(
      { error: "Expected { addresses: string[] }" },
      { status: 400 }
    );
  }

  const valiron = getValiron();
  const results: TrustRow[] = [];

  for (const raw of addresses) {
    if (typeof raw !== "string") {
      continue;
    }
    const addr = normalizeWalletForApi(raw);
    if (!addr) {
      results.push({
        address: raw,
        ok: false,
        error: "invalid_wallet",
      });
      continue;
    }

    try {
      const profile = await valiron.getWalletProfile(addr);
      const patch = walletProfileToPatch(profile);
      results.push({ address: addr, ok: true, patch });
    } catch (err) {
      const message =
        err instanceof ValironError ? err.message : "profile_fetch_failed";
      const code = err instanceof ValironError ? err.code : "UNKNOWN";
      results.push({
        address: addr,
        ok: false,
        error: message,
        code,
      });
    }
  }

  return NextResponse.json({ enabled: true, results });
}
