export type CreditTier =
  | "AAA"
  | "AA"
  | "A"
  | "BAA"
  | "BA"
  | "B"
  | "CAA"
  | "CA"
  | "C"
  | "BLOCKED"
  | "UNRATED";

export interface ValironWalletMeta {
  finalRoute: string;
  decision: string;
  agentId?: string | null;
  onchainAvgScore?: number;
  lastSyncedAt?: string;
}

export interface AgentWallet {
  id: string;
  address: string;
  tier: CreditTier;
  priceMultiplier: number;
  usdPrice: number;
  requestCount: number;
  sparklineData: number[];
  gradeHistory: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  cer: number;
  cerTrend: "up" | "down" | "neutral";
  cerTrendValue: string;
  avgInfraCost: number;
  avgValuePerCall: number;
  valiron?: ValironWalletMeta;
}

/** EVM address normalizer for Valiron wallet lookups (full 40 hex digits). */
export function normalizeWalletForApi(addr: string): string | null {
  const s = addr.trim().toLowerCase();
  const m = s.match(/^(0x)([a-f0-9]{40})$/);
  if (!m) return null;
  return m[1] + m[2];
}

export function formatWalletDisplay(addr: string): string {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export interface ApiEndpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  hits: number;
  avgLatency: number;
  errorRate: number;
  topAgent: string;
  status: "healthy" | "degraded" | "down";
  sparklineData: number[];
  recentAgents: string[];
  p99Latency: number;
  rps: number;
}

export interface EventLogEntry {
  id: string;
  timestamp: string;
  type: "request" | "grade_change" | "block" | "sandbox_complete" | "directive";
  wallet: string;
  description: string;
  meta?: { from?: string; to?: string };
}

export const TIER_CONFIG: Record<
  CreditTier,
  { color: string; bg: string; multiplier: number; usd: number }
> = {
  AAA: { color: "#22c55e", bg: "#22c55e20", multiplier: 0.5, usd: 0.005 },
  AA: { color: "#4ade80", bg: "#4ade8020", multiplier: 0.65, usd: 0.0065 },
  A: { color: "#86efac", bg: "#86efac20", multiplier: 0.8, usd: 0.008 },
  BAA: { color: "#facc15", bg: "#facc1520", multiplier: 1.0, usd: 0.01 },
  BA: { color: "#fbbf24", bg: "#fbbf2420", multiplier: 1.3, usd: 0.013 },
  B: { color: "#f59e0b", bg: "#f59e0b20", multiplier: 1.6, usd: 0.016 },
  CAA: { color: "#f97316", bg: "#f9731620", multiplier: 2.0, usd: 0.02 },
  CA: { color: "#ef4444", bg: "#ef444420", multiplier: 3.0, usd: 0.03 },
  C: { color: "#dc2626", bg: "#dc262620", multiplier: 0, usd: 0 },
  BLOCKED: { color: "#7f1d1d", bg: "#7f1d1d40", multiplier: 0, usd: 0 },
  UNRATED: { color: "#6b7280", bg: "#6b728020", multiplier: 1.0, usd: 0.01 },
};

export const PRICING_TIERS = [
  { tier: "AAA" as CreditTier, label: "AAA", multiplier: 0.5, usd: "$0.005" },
  { tier: "AA" as CreditTier, label: "AA", multiplier: 0.65, usd: "$0.0065" },
  { tier: "A" as CreditTier, label: "A", multiplier: 0.8, usd: "$0.008" },
  { tier: "BAA" as CreditTier, label: "BAA", multiplier: 1.0, usd: "$0.010" },
  { tier: "BA" as CreditTier, label: "BA", multiplier: 1.3, usd: "$0.013" },
  { tier: "B" as CreditTier, label: "B", multiplier: 1.6, usd: "$0.016" },
  { tier: "CAA" as CreditTier, label: "CAA", multiplier: 2.0, usd: "$0.020" },
  { tier: "CA" as CreditTier, label: "CA", multiplier: 3.0, usd: "$0.030" },
  {
    tier: "C" as CreditTier,
    label: "C",
    multiplier: 0,
    usd: "BLOCKED",
  },
];

function randomHex(length: number): string {
  return Array.from({ length }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

function generateSparkline(): number[] {
  const base = Math.random() * 50 + 10;
  return Array.from(
    { length: 20 },
    () => base + (Math.random() - 0.5) * 30
  );
}

const TIERS: CreditTier[] = [
  "AAA",
  "AA",
  "A",
  "BAA",
  "BA",
  "B",
  "CAA",
  "CA",
  "C",
  "UNRATED",
];

function randomTier(): CreditTier {
  const weights = [3, 4, 5, 6, 5, 4, 2, 1, 1, 2];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < TIERS.length; i++) {
    r -= weights[i];
    if (r <= 0) return TIERS[i];
  }
  return "BAA";
}

function generateGradeHistory(currentTier: CreditTier): string[] {
  const history: string[] = ["UNRATED"];
  const tierIndex = TIERS.indexOf(currentTier);
  const steps = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < steps; i++) {
    const idx = Math.max(
      0,
      Math.min(TIERS.length - 1, tierIndex + Math.floor(Math.random() * 4) - 2)
    );
    if (TIERS[idx] !== "UNRATED") history.push(TIERS[idx]);
  }
  if (history[history.length - 1] !== currentTier && currentTier !== "UNRATED") {
    history.push(currentTier);
  }
  return history;
}

function generateCer(tier: CreditTier): { cer: number; cerTrend: "up" | "down" | "neutral"; cerTrendValue: string; avgInfraCost: number; avgValuePerCall: number } {
  // Higher-rated agents have better CER (more value per infra dollar)
  const cerBase: Record<CreditTier, number> = {
    AAA: 2.4, AA: 2.1, A: 1.8, BAA: 1.4, BA: 1.1,
    B: 0.85, CAA: 0.55, CA: 0.3, C: 0, BLOCKED: 0, UNRATED: 1.0,
  };
  const base = cerBase[tier];
  const cer = parseFloat((base + (Math.random() - 0.5) * 0.4).toFixed(2));
  const trendVal = parseFloat(((Math.random() - 0.4) * 12).toFixed(1));
  const infraCost = parseFloat((Math.random() * 0.02 + 0.005).toFixed(4));
  const valuePerCall = parseFloat((infraCost * cer).toFixed(4));
  return {
    cer: Math.max(0, cer),
    cerTrend: trendVal > 0 ? "up" : trendVal < 0 ? "down" : "neutral",
    cerTrendValue: `${trendVal > 0 ? "+" : ""}${trendVal}%`,
    avgInfraCost: infraCost,
    avgValuePerCall: valuePerCall,
  };
}

export function generateAgentWallets(
  count: number = 9,
  seedAddresses?: string[] | null
): AgentWallet[] {
  return Array.from({ length: count }, (_, i) => {
    const tier = randomTier();
    const config = TIER_CONFIG[tier];
    const cerData = generateCer(tier);
    const seed = seedAddresses?.[i];
    const normalized = seed ? normalizeWalletForApi(seed) : null;
    const address = normalized ?? `0x${randomHex(40)}`;
    return {
      id: `agent-${i}`,
      address,
      tier,
      priceMultiplier: config.multiplier,
      usdPrice: config.usd,
      requestCount: Math.floor(Math.random() * 50000) + 100,
      sparklineData: generateSparkline(),
      gradeHistory: generateGradeHistory(tier),
      riskLevel: (
        tier === "AAA" || tier === "AA" || tier === "A"
          ? "low"
          : tier === "BAA" || tier === "BA"
            ? "medium"
            : tier === "B" || tier === "CAA"
              ? "high"
              : "critical"
      ) as AgentWallet["riskLevel"],
      ...cerData,
    };
  });
}

const API_ENDPOINTS_DATA: Omit<ApiEndpoint, "id" | "hits" | "avgLatency" | "errorRate" | "topAgent" | "status">[] = [
  { method: "POST", path: "/v1/completions" },
  { method: "POST", path: "/v1/chat/completions" },
  { method: "GET", path: "/v1/models" },
  { method: "POST", path: "/v1/embeddings" },
  { method: "GET", path: "/v1/agents/{id}/status" },
  { method: "POST", path: "/v1/agents/{id}/sandbox" },
  { method: "GET", path: "/v1/billing/usage" },
  { method: "DELETE", path: "/v1/agents/{id}/session" },
  { method: "PUT", path: "/v1/agents/{id}/config" },
  { method: "POST", path: "/v1/agents/{id}/evaluate" },
  { method: "GET", path: "/v1/firewall/rules" },
  { method: "PATCH", path: "/v1/firewall/rules/{id}" },
];

export function generateApiEndpoints(): ApiEndpoint[] {
  return API_ENDPOINTS_DATA.map((ep, i) => {
    const avgLat = Math.floor(Math.random() * 350) + 12;
    return {
      ...ep,
      id: `ep-${i}`,
      hits: Math.floor(Math.random() * 100000) + 500,
      avgLatency: avgLat,
      p99Latency: avgLat + Math.floor(Math.random() * 300) + 50,
      errorRate: parseFloat((Math.random() * 8).toFixed(2)),
      topAgent: `0x${randomHex(6)}...${randomHex(3)}`,
      status: (Math.random() > 0.15 ? "healthy" : Math.random() > 0.5 ? "degraded" : "down") as ApiEndpoint["status"],
      sparklineData: generateSparkline(),
      recentAgents: Array.from({ length: 3 }, () => `0x${randomHex(4)}...${randomHex(2)}`),
      rps: Math.floor(Math.random() * 500) + 10,
    };
  });
}

const EVENT_TYPES: EventLogEntry["type"][] = [
  "request",
  "request",
  "request",
  "grade_change",
  "block",
  "sandbox_complete",
];

export function generateEventLog(count: number = 20): EventLogEntry[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    const addr = `0x${randomHex(6)}...${randomHex(3)}`;
    const ts = new Date(now - i * (Math.random() * 5000 + 1000));

    let description = "";
    let meta: EventLogEntry["meta"] = undefined;

    switch (type) {
      case "request":
        description = `API request processed at ${TIERS[Math.floor(Math.random() * 5)]} rate`;
        break;
      case "grade_change": {
        const from = TIERS[Math.floor(Math.random() * 8)];
        const to = TIERS[Math.floor(Math.random() * 8)];
        description = `Credit grade updated: ${from} \u2192 ${to}`;
        meta = { from, to };
        break;
      }
      case "block":
        description = `Request blocked \u2014 agent flagged as high risk`;
        break;
      case "sandbox_complete":
        description = `Sandbox evaluation complete \u2014 agent verified`;
        break;
    }

    return {
      id: `evt-${i}`,
      timestamp: ts.toISOString(),
      type,
      wallet: addr,
      description,
      meta,
    };
  });
}
