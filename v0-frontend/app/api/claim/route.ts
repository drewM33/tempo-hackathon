import { NextResponse } from "next/server";
import { ValironError } from "@valiron/sdk";

import { normalizeWalletForApi } from "@/lib/dashboard-data";
import { MOCK_DEALS, computeAllocation } from "@/lib/marketplace-data";
import type { ClaimAllocation } from "@/lib/marketplace-data";
import { getValiron, isValironEnabled } from "@/lib/valiron/client";
import { walletProfileToPatch } from "@/lib/valiron/map-wallet-profile";
import type { CreditTier } from "@/lib/dashboard-data";

function generateTrialKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const segments = [8, 4, 4, 12];
  return (
    "trial_" +
    segments
      .map((len) =>
        Array.from({ length: len }, () =>
          chars[Math.floor(Math.random() * chars.length)]
        ).join("")
      )
      .join("-")
  );
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { dealId, walletAddress } = body as {
    dealId?: string;
    walletAddress?: string;
  };

  if (!dealId || !walletAddress) {
    return NextResponse.json(
      { error: 'Missing required fields: "dealId" and "walletAddress"' },
      { status: 400 }
    );
  }

  const deal = MOCK_DEALS.find((d) => d.id === dealId);
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const normalizedAddr = normalizeWalletForApi(walletAddress);
  if (!normalizedAddr) {
    return NextResponse.json(
      { error: "Invalid EVM wallet address" },
      { status: 400 }
    );
  }

  /* ── Determine agent tier ── */
  let tier: CreditTier = "UNRATED";
  let riskLevel: ClaimAllocation["riskLevel"] = "medium";

  if (deal.riskConfig.useValironScoring && isValironEnabled()) {
    try {
      const valiron = getValiron();
      const profile = await valiron.getWalletProfile(normalizedAddr);
      const patch = walletProfileToPatch(profile);
      tier = patch.tier;
      riskLevel = patch.riskLevel;
    } catch (err) {
      if (err instanceof ValironError) {
        // Fallback to UNRATED if Valiron is unavailable
        tier = "UNRATED";
        riskLevel = "medium";
      } else {
        return NextResponse.json(
          { error: "Failed to fetch risk profile" },
          { status: 502 }
        );
      }
    }
  } else if (!deal.riskConfig.useValironScoring) {
    // Provider doesn't use Valiron -- flat allocation, no risk gating
    tier = "UNRATED";
    riskLevel = "low";
  } else {
    // Valiron not enabled on this instance -- simulate a mid-tier agent
    const tiers: CreditTier[] = ["AAA", "AA", "A", "BAA", "BA", "B", "CAA"];
    const weights = [2, 3, 4, 5, 3, 2, 1];
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < tiers.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        tier = tiers[i];
        break;
      }
    }
    riskLevel =
      tier === "AAA" || tier === "AA" || tier === "A"
        ? "low"
        : tier === "BAA" || tier === "BA"
          ? "medium"
          : "high";
  }

  /* ── Compute allocation ── */
  const credits = computeAllocation(deal, tier);

  if (credits <= 0) {
    return NextResponse.json(
      {
        error: `Agent tier ${tier} is not eligible for this deal.`,
        tier,
        riskLevel,
      },
      { status: 403 }
    );
  }

  /* ── Build allocation response ── */
  const expiresAt = new Date();
  const durationMatch = deal.trial.duration.match(/(\d+)\s*(day|month|year)/i);
  if (durationMatch) {
    const n = parseInt(durationMatch[1], 10);
    const unit = durationMatch[2].toLowerCase();
    if (unit.startsWith("day")) expiresAt.setDate(expiresAt.getDate() + n);
    else if (unit.startsWith("month")) expiresAt.setMonth(expiresAt.getMonth() + n);
    else if (unit.startsWith("year")) expiresAt.setFullYear(expiresAt.getFullYear() + n);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 3);
  }

  const allocation: ClaimAllocation = {
    credits,
    tier,
    riskLevel,
    endpoint: deal.endpoint.url,
    protocol: deal.endpoint.protocol,
    expiresAt: expiresAt.toISOString(),
    apiKey: generateTrialKey(),
  };

  return NextResponse.json({ ok: true, allocation });
}
