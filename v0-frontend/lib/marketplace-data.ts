import type { CreditTier } from "./dashboard-data";

/* ── Categories ── */
export const DEAL_CATEGORIES = [
  "All Deals",
  "AI & ML",
  "Data",
  "Communication",
  "Infrastructure",
  "Developer Tools",
  "Analytics",
  "Finance",
  "Security",
  "Storage",
] as const;

export type DealCategory = (typeof DEAL_CATEGORIES)[number];

/* ── Protocol types ── */
export type ProtocolType = "x402" | "MPP";

/* ── Risk-adaptive allocation tiers ── */
export type TierAllocation = Partial<Record<CreditTier, number>>;

/* ── Deal model ── */
export interface Deal {
  id: string;
  provider: {
    name: string;
    slug: string;
    logoUrl: string | null;
    description: string;
  };
  category: DealCategory;
  trial: {
    creditAmount: number;
    creditDisplay: string;
    duration: string;
    maxSavings: number;
  };
  endpoint: {
    url: string;
    protocol: ProtocolType;
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
  };
  riskConfig: {
    useValironScoring: boolean;
    tierAllocation?: TierAllocation;
    flatCredit?: number;
    blockLowTier: boolean;
  };
  stats: {
    totalClaims: number;
    totalAgents: number;
    avgRiskScore: number;
  };
  featured: boolean;
  createdAt: string;
  tags: string[];
}

/* ── Claim result ── */
export interface ClaimAllocation {
  credits: number;
  tier: CreditTier;
  riskLevel: "low" | "medium" | "high" | "critical";
  endpoint: string;
  protocol: ProtocolType;
  expiresAt: string;
  apiKey: string;
}

/* ── Default tier allocation for risk-adaptive providers ── */
export const DEFAULT_TIER_ALLOCATION: TierAllocation = {
  AAA: 1.0,
  AA: 0.9,
  A: 0.8,
  BAA: 0.65,
  BA: 0.5,
  B: 0.35,
  CAA: 0.2,
  CA: 0.1,
  C: 0,
  BLOCKED: 0,
  UNRATED: 0.3,
};

/* ── Mock deals ── */
export const MOCK_DEALS: Deal[] = [
  {
    id: "deal-elevenlabs",
    provider: { name: "ElevenLabs", slug: "elevenlabs", logoUrl: "https://logo.clearbit.com/elevenlabs.io", description: "AI voice generation and text-to-speech API" },
    category: "AI & ML",
    trial: { creditAmount: 4000, creditDisplay: "12 months free (33M characters)", duration: "12 months", maxSavings: 4000 },
    endpoint: { url: "https://api.elevenlabs.io/v1/text-to-speech", protocol: "x402", method: "POST", path: "/v1/text-to-speech" },
    riskConfig: { useValironScoring: true, tierAllocation: DEFAULT_TIER_ALLOCATION, blockLowTier: true },
    stats: { totalClaims: 2847, totalAgents: 1923, avgRiskScore: 0.72 },
    featured: true, createdAt: "2026-04-15T00:00:00Z", tags: ["voice", "tts", "audio"],
  },
  {
    id: "deal-anthropic",
    provider: { name: "Anthropic", slug: "anthropic", logoUrl: "https://logo.clearbit.com/anthropic.com", description: "Claude API for reasoning, analysis, and code generation" },
    category: "AI & ML",
    trial: { creditAmount: 5000, creditDisplay: "$5,000 in API credits", duration: "6 months", maxSavings: 5000 },
    endpoint: { url: "https://api.anthropic.com/v1/messages", protocol: "x402", method: "POST", path: "/v1/messages" },
    riskConfig: { useValironScoring: true, tierAllocation: { ...DEFAULT_TIER_ALLOCATION, AAA: 1.0, AA: 0.85, A: 0.7 }, blockLowTier: true },
    stats: { totalClaims: 5123, totalAgents: 3841, avgRiskScore: 0.78 },
    featured: true, createdAt: "2026-03-20T00:00:00Z", tags: ["llm", "reasoning", "code"],
  },
  {
    id: "deal-deepgram",
    provider: { name: "Deepgram", slug: "deepgram", logoUrl: "https://logo.clearbit.com/deepgram.com", description: "AI speech-to-text and audio intelligence API" },
    category: "AI & ML",
    trial: { creditAmount: 2500, creditDisplay: "$2,500 in transcription credits", duration: "6 months", maxSavings: 2500 },
    endpoint: { url: "https://api.deepgram.com/v1/listen", protocol: "MPP", method: "POST", path: "/v1/listen" },
    riskConfig: { useValironScoring: true, tierAllocation: DEFAULT_TIER_ALLOCATION, blockLowTier: false },
    stats: { totalClaims: 1432, totalAgents: 1087, avgRiskScore: 0.65 },
    featured: true, createdAt: "2026-04-01T00:00:00Z", tags: ["stt", "transcription", "audio"],
  },
  {
    id: "deal-realapi",
    provider: { name: "RealAPI", slug: "realapi", logoUrl: "https://logo.clearbit.com/realapi.io", description: "Real-time market data and financial intelligence API" },
    category: "Finance",
    trial: { creditAmount: 1000, creditDisplay: "1M free API calls", duration: "3 months", maxSavings: 1000 },
    endpoint: { url: "https://api.realapi.io/v2/market/quote", protocol: "x402", method: "GET", path: "/v2/market/quote" },
    riskConfig: { useValironScoring: false, flatCredit: 1000, blockLowTier: false },
    stats: { totalClaims: 876, totalAgents: 654, avgRiskScore: 0.58 },
    featured: false, createdAt: "2026-05-01T00:00:00Z", tags: ["finance", "market-data", "real-time"],
  },
  {
    id: "deal-apify",
    provider: { name: "Apify", slug: "apify", logoUrl: "https://logo.clearbit.com/apify.com", description: "Web scraping, data extraction, and automation platform" },
    category: "Data",
    trial: { creditAmount: 500, creditDisplay: "$500 in platform credits", duration: "30 days", maxSavings: 500 },
    endpoint: { url: "https://api.apify.com/v2/acts", protocol: "MPP", method: "POST", path: "/v2/acts" },
    riskConfig: { useValironScoring: true, tierAllocation: DEFAULT_TIER_ALLOCATION, blockLowTier: true },
    stats: { totalClaims: 2103, totalAgents: 1567, avgRiskScore: 0.61 },
    featured: true, createdAt: "2026-04-10T00:00:00Z", tags: ["scraping", "automation", "data"],
  },
  {
    id: "deal-twilio",
    provider: { name: "Twilio", slug: "twilio", logoUrl: "https://logo.clearbit.com/twilio.com", description: "Communication APIs for SMS, voice, and video" },
    category: "Communication",
    trial: { creditAmount: 1500, creditDisplay: "$1,500 in messaging credits", duration: "90 days", maxSavings: 1500 },
    endpoint: { url: "https://api.twilio.com/2010-04-01/Messages", protocol: "x402", method: "POST", path: "/2010-04-01/Messages" },
    riskConfig: { useValironScoring: true, tierAllocation: DEFAULT_TIER_ALLOCATION, blockLowTier: true },
    stats: { totalClaims: 3214, totalAgents: 2456, avgRiskScore: 0.74 },
    featured: true, createdAt: "2026-03-15T00:00:00Z", tags: ["sms", "voice", "messaging"],
  },
  {
    id: "deal-cloudflare-ai",
    provider: { name: "Cloudflare Workers AI", slug: "cloudflare-ai", logoUrl: "https://logo.clearbit.com/cloudflare.com", description: "Serverless AI inference at the edge" },
    category: "Infrastructure",
    trial: { creditAmount: 3000, creditDisplay: "10M inference tokens free", duration: "6 months", maxSavings: 3000 },
    endpoint: { url: "https://api.cloudflare.com/client/v4/ai/run", protocol: "x402", method: "POST", path: "/client/v4/ai/run" },
    riskConfig: { useValironScoring: false, flatCredit: 3000, blockLowTier: false },
    stats: { totalClaims: 1876, totalAgents: 1432, avgRiskScore: 0.69 },
    featured: false, createdAt: "2026-04-20T00:00:00Z", tags: ["inference", "edge", "serverless"],
  },
  {
    id: "deal-resend",
    provider: { name: "Resend", slug: "resend", logoUrl: "https://logo.clearbit.com/resend.com", description: "Email API for developers with React templates" },
    category: "Communication",
    trial: { creditAmount: 200, creditDisplay: "10,000 free emails/month", duration: "6 months", maxSavings: 200 },
    endpoint: { url: "https://api.resend.com/emails", protocol: "MPP", method: "POST", path: "/emails" },
    riskConfig: { useValironScoring: false, flatCredit: 200, blockLowTier: false },
    stats: { totalClaims: 4521, totalAgents: 3876, avgRiskScore: 0.55 },
    featured: false, createdAt: "2026-05-05T00:00:00Z", tags: ["email", "transactional", "templates"],
  },
  {
    id: "deal-neon",
    provider: { name: "Neon", slug: "neon", logoUrl: "https://logo.clearbit.com/neon.tech", description: "Serverless Postgres with branching and auto-scaling" },
    category: "Storage",
    trial: { creditAmount: 800, creditDisplay: "$800 in compute credits", duration: "3 months", maxSavings: 800 },
    endpoint: { url: "https://console.neon.tech/api/v2/projects", protocol: "x402", method: "POST", path: "/api/v2/projects" },
    riskConfig: { useValironScoring: true, tierAllocation: DEFAULT_TIER_ALLOCATION, blockLowTier: false },
    stats: { totalClaims: 1234, totalAgents: 987, avgRiskScore: 0.62 },
    featured: false, createdAt: "2026-04-25T00:00:00Z", tags: ["postgres", "database", "serverless"],
  },
  {
    id: "deal-posthog",
    provider: { name: "PostHog", slug: "posthog", logoUrl: "https://logo.clearbit.com/posthog.com", description: "Product analytics, session replay, and feature flags" },
    category: "Analytics",
    trial: { creditAmount: 1200, creditDisplay: "1M free events/month", duration: "12 months", maxSavings: 1200 },
    endpoint: { url: "https://app.posthog.com/api/event", protocol: "MPP", method: "POST", path: "/api/event" },
    riskConfig: { useValironScoring: false, flatCredit: 1200, blockLowTier: false },
    stats: { totalClaims: 2345, totalAgents: 1876, avgRiskScore: 0.58 },
    featured: false, createdAt: "2026-04-18T00:00:00Z", tags: ["analytics", "product", "events"],
  },
  {
    id: "deal-mistral",
    provider: { name: "Mistral AI", slug: "mistral", logoUrl: "https://logo.clearbit.com/mistral.ai", description: "Open-weight LLMs with best-in-class efficiency" },
    category: "AI & ML",
    trial: { creditAmount: 2000, creditDisplay: "$2,000 in inference credits", duration: "3 months", maxSavings: 2000 },
    endpoint: { url: "https://api.mistral.ai/v1/chat/completions", protocol: "x402", method: "POST", path: "/v1/chat/completions" },
    riskConfig: { useValironScoring: true, tierAllocation: { ...DEFAULT_TIER_ALLOCATION, CAA: 0.15, CA: 0.05 }, blockLowTier: true },
    stats: { totalClaims: 3456, totalAgents: 2654, avgRiskScore: 0.71 },
    featured: true, createdAt: "2026-03-28T00:00:00Z", tags: ["llm", "open-source", "efficient"],
  },
  {
    id: "deal-upstash",
    provider: { name: "Upstash", slug: "upstash", logoUrl: "https://logo.clearbit.com/upstash.com", description: "Serverless Redis and Kafka for modern applications" },
    category: "Infrastructure",
    trial: { creditAmount: 600, creditDisplay: "10K commands/day free", duration: "6 months", maxSavings: 600 },
    endpoint: { url: "https://api.upstash.com/v2/redis", protocol: "MPP", method: "POST", path: "/v2/redis" },
    riskConfig: { useValironScoring: false, flatCredit: 600, blockLowTier: false },
    stats: { totalClaims: 1567, totalAgents: 1234, avgRiskScore: 0.54 },
    featured: false, createdAt: "2026-05-10T00:00:00Z", tags: ["redis", "kafka", "serverless"],
  },
  {
    id: "deal-serper",
    provider: { name: "Serper", slug: "serper", logoUrl: "https://logo.clearbit.com/serper.dev", description: "Google Search API for AI agents and applications" },
    category: "Data",
    trial: { creditAmount: 300, creditDisplay: "2,500 free searches", duration: "30 days", maxSavings: 300 },
    endpoint: { url: "https://google.serper.dev/search", protocol: "x402", method: "POST", path: "/search" },
    riskConfig: { useValironScoring: true, tierAllocation: DEFAULT_TIER_ALLOCATION, blockLowTier: false },
    stats: { totalClaims: 5678, totalAgents: 4321, avgRiskScore: 0.63 },
    featured: false, createdAt: "2026-05-08T00:00:00Z", tags: ["search", "google", "serp"],
  },
  {
    id: "deal-replicate",
    provider: { name: "Replicate", slug: "replicate", logoUrl: "https://logo.clearbit.com/replicate.com", description: "Run open-source ML models in the cloud" },
    category: "AI & ML",
    trial: { creditAmount: 1500, creditDisplay: "$1,500 in GPU credits", duration: "3 months", maxSavings: 1500 },
    endpoint: { url: "https://api.replicate.com/v1/predictions", protocol: "x402", method: "POST", path: "/v1/predictions" },
    riskConfig: { useValironScoring: true, tierAllocation: DEFAULT_TIER_ALLOCATION, blockLowTier: true },
    stats: { totalClaims: 2876, totalAgents: 2134, avgRiskScore: 0.67 },
    featured: true, createdAt: "2026-04-05T00:00:00Z", tags: ["ml", "gpu", "models"],
  },
  {
    id: "deal-browserbase",
    provider: { name: "Browserbase", slug: "browserbase", logoUrl: "https://logo.clearbit.com/browserbase.com", description: "Headless browser infrastructure for AI agents" },
    category: "Developer Tools",
    trial: { creditAmount: 750, creditDisplay: "1,000 browser sessions free", duration: "60 days", maxSavings: 750 },
    endpoint: { url: "https://api.browserbase.com/v1/sessions", protocol: "MPP", method: "POST", path: "/v1/sessions" },
    riskConfig: { useValironScoring: true, tierAllocation: DEFAULT_TIER_ALLOCATION, blockLowTier: true },
    stats: { totalClaims: 987, totalAgents: 765, avgRiskScore: 0.70 },
    featured: false, createdAt: "2026-05-12T00:00:00Z", tags: ["browser", "headless", "automation"],
  },
  {
    id: "deal-e2b",
    provider: { name: "E2B", slug: "e2b", logoUrl: "https://logo.clearbit.com/e2b.dev", description: "Sandboxed code execution environments for AI" },
    category: "Developer Tools",
    trial: { creditAmount: 400, creditDisplay: "100 sandbox hours free", duration: "30 days", maxSavings: 400 },
    endpoint: { url: "https://api.e2b.dev/v1/sandboxes", protocol: "x402", method: "POST", path: "/v1/sandboxes" },
    riskConfig: { useValironScoring: true, tierAllocation: DEFAULT_TIER_ALLOCATION, blockLowTier: true },
    stats: { totalClaims: 1654, totalAgents: 1243, avgRiskScore: 0.73 },
    featured: false, createdAt: "2026-04-28T00:00:00Z", tags: ["sandbox", "code-execution", "agents"],
  },
  {
    id: "deal-firecrawl",
    provider: { name: "Firecrawl", slug: "firecrawl", logoUrl: "https://logo.clearbit.com/firecrawl.dev", description: "Web scraping API that returns clean markdown" },
    category: "Data",
    trial: { creditAmount: 350, creditDisplay: "5,000 free page crawls", duration: "30 days", maxSavings: 350 },
    endpoint: { url: "https://api.firecrawl.dev/v1/scrape", protocol: "MPP", method: "POST", path: "/v1/scrape" },
    riskConfig: { useValironScoring: false, flatCredit: 350, blockLowTier: false },
    stats: { totalClaims: 3210, totalAgents: 2567, avgRiskScore: 0.56 },
    featured: false, createdAt: "2026-05-15T00:00:00Z", tags: ["scraping", "markdown", "crawl"],
  },
  {
    id: "deal-sentry",
    provider: { name: "Sentry", slug: "sentry", logoUrl: "https://logo.clearbit.com/sentry.io", description: "Application monitoring and error tracking" },
    category: "Developer Tools",
    trial: { creditAmount: 900, creditDisplay: "500K events/month free", duration: "6 months", maxSavings: 900 },
    endpoint: { url: "https://sentry.io/api/0/projects", protocol: "MPP", method: "POST", path: "/api/0/projects" },
    riskConfig: { useValironScoring: false, flatCredit: 900, blockLowTier: false },
    stats: { totalClaims: 4567, totalAgents: 3890, avgRiskScore: 0.52 },
    featured: false, createdAt: "2026-04-22T00:00:00Z", tags: ["monitoring", "errors", "debugging"],
  },
  {
    id: "deal-pinecone",
    provider: { name: "Pinecone", slug: "pinecone", logoUrl: "https://logo.clearbit.com/pinecone.io", description: "Vector database for similarity search and RAG" },
    category: "Storage",
    trial: { creditAmount: 1100, creditDisplay: "5M vectors free storage", duration: "3 months", maxSavings: 1100 },
    endpoint: { url: "https://api.pinecone.io/vectors/upsert", protocol: "x402", method: "POST", path: "/vectors/upsert" },
    riskConfig: { useValironScoring: true, tierAllocation: DEFAULT_TIER_ALLOCATION, blockLowTier: false },
    stats: { totalClaims: 2134, totalAgents: 1765, avgRiskScore: 0.66 },
    featured: false, createdAt: "2026-04-12T00:00:00Z", tags: ["vector", "embeddings", "rag"],
  },
  {
    id: "deal-cohere",
    provider: { name: "Cohere", slug: "cohere", logoUrl: "https://logo.clearbit.com/cohere.com", description: "Enterprise LLMs for search, summarization, and RAG" },
    category: "AI & ML",
    trial: { creditAmount: 1800, creditDisplay: "$1,800 in API credits", duration: "3 months", maxSavings: 1800 },
    endpoint: { url: "https://api.cohere.ai/v1/chat", protocol: "x402", method: "POST", path: "/v1/chat" },
    riskConfig: { useValironScoring: true, tierAllocation: DEFAULT_TIER_ALLOCATION, blockLowTier: true },
    stats: { totalClaims: 1987, totalAgents: 1543, avgRiskScore: 0.69 },
    featured: false, createdAt: "2026-04-08T00:00:00Z", tags: ["llm", "enterprise", "rag"],
  },
];

/* ── Helper: filter & sort ── */
export function filterDeals(
  deals: Deal[],
  options: {
    category?: string;
    search?: string;
    sort?: "popular" | "recent" | "value";
    protocol?: ProtocolType;
  }
): Deal[] {
  let filtered = [...deals];

  if (options.category && options.category !== "All Deals") {
    filtered = filtered.filter((d) => d.category === options.category);
  }

  if (options.protocol) {
    filtered = filtered.filter((d) => d.endpoint.protocol === options.protocol);
  }

  if (options.search) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter(
      (d) =>
        d.provider.name.toLowerCase().includes(q) ||
        d.provider.description.toLowerCase().includes(q) ||
        d.tags.some((t) => t.includes(q))
    );
  }

  switch (options.sort) {
    case "recent":
      filtered.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case "value":
      filtered.sort((a, b) => b.trial.maxSavings - a.trial.maxSavings);
      break;
    case "popular":
    default:
      filtered.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.stats.totalClaims - a.stats.totalClaims;
      });
  }

  return filtered;
}

/* ── Compute credit allocation for an agent ── */
export function computeAllocation(
  deal: Deal,
  tier: CreditTier
): number {
  if (deal.riskConfig.blockLowTier && (tier === "C" || tier === "BLOCKED")) {
    return 0;
  }

  if (!deal.riskConfig.useValironScoring) {
    return deal.riskConfig.flatCredit ?? deal.trial.creditAmount;
  }

  const alloc = deal.riskConfig.tierAllocation ?? DEFAULT_TIER_ALLOCATION;
  const multiplier = alloc[tier] ?? 0.3;
  return Math.round(deal.trial.creditAmount * multiplier);
}
