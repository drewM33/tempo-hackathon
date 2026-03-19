import "server-only";

import type { WalletProfile } from "@valiron/sdk";
import type { CreditTier, AgentWallet } from "../dashboard-data";
import { TIER_CONFIG } from "../dashboard-data";
import type { ValironTrustPatch } from "../valiron-trust";

const MOODYS = new Set<string>([
  "AAA",
  "AA",
  "A",
  "BAA",
  "BA",
  "B",
  "CAA",
  "CA",
  "C",
]);

function deriveTier(profile: WalletProfile): CreditTier {
  const route = profile.routing.finalRoute;
  const t = profile.localReputation?.tier;
  if (typeof t === "string" && MOODYS.has(t)) return t as CreditTier;

  if (route === "sandbox_only") return "BLOCKED";
  if (route === "sandbox") return "CAA";
  if (route === "prod_throttled") return "BA";
  if (route === "prod") return "UNRATED";
  return "UNRATED";
}

function sdkRiskToUi(
  r: string | undefined,
  tier: CreditTier
): AgentWallet["riskLevel"] {
  const fromTier = (): AgentWallet["riskLevel"] => {
    if (tier === "AAA" || tier === "AA" || tier === "A") return "low";
    if (tier === "BAA" || tier === "BA") return "medium";
    if (tier === "B" || tier === "CAA") return "high";
    return "critical";
  };

  switch (r) {
    case "GREEN":
      return "low";
    case "YELLOW":
      return "medium";
    case "RED":
      return tier === "BLOCKED" || tier === "C" ? "critical" : "high";
    default:
      return fromTier();
  }
}

export function walletProfileToPatch(profile: WalletProfile): ValironTrustPatch {
  const tier = deriveTier(profile);
  const configKey: CreditTier =
    tier === "UNRATED" ? "UNRATED" : tier === "BLOCKED" ? "BLOCKED" : tier;
  const config = TIER_CONFIG[configKey] ?? TIER_CONFIG.UNRATED;
  const riskLevel = sdkRiskToUi(
    profile.localReputation?.riskLevel as string | undefined,
    tier
  );

  return {
    tier,
    riskLevel,
    priceMultiplier: config.multiplier,
    usdPrice: config.usd,
    valiron: {
      finalRoute: profile.routing.finalRoute,
      decision: profile.routing.decision,
      agentId: profile.agentId,
      onchainAvgScore: profile.onchainReputation?.averageScore,
      lastSyncedAt: profile.timestamp,
    },
  };
}
