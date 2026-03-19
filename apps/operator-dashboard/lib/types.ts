export type TrustTier = 'AAA' | 'AA' | 'A' | 'BAA' | 'BA' | 'B' | 'CAA' | 'CA' | 'C' | 'UNRATED';

export interface AgentDirective {
  id: string;
  wallet: string;
  type: 'recommendation' | 'warning' | 'mandate';
  message: string;
  issuedBy: string;
  issuedAt: string;
  acknowledged: boolean;
}

export interface AgentState {
  wallet: string;
  tier: TrustTier;
  score: number | null;
  allow: boolean;
  riskLevel: string;
  route: string;
  reasons: string[];
  multiplier: number;
  blocked: boolean;
  directives: AgentDirective[];
  gradeHistory: string[];
  requestCount: number;
  lastRequestAt: number;
  recentLatencies: number[];
  recentStatuses: number[];
  sparkline: number[];
}

export interface EndpointStats {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  hitCount: number;
  avgLatencyMs: number;
  p99LatencyMs: number;
  errorRate: number;
  reqPerSec: number;
  recentAgents: string[];
  health: 'healthy' | 'degraded' | 'down';
}

export interface FleetTick {
  totalRequests: number;
  activeAgents: number;
  blockedAttempts: number;
  revenueProtected: number;
}

export interface ProbeResult {
  wallet: string;
  latencyMs: number;
  status: 'success' | 'error' | 'timeout';
  responseCode: number;
  timestamp: string;
}

export interface ChatCommandResponse {
  type: 'query' | 'action';
  response: string;
  badge?: 'ACTION';
  affectedWallet?: string;
  mutation?: {
    field: 'tier' | 'directive';
    oldValue: string;
    newValue: string;
  };
}

export interface EventLogEntry {
  id: string;
  type: string;
  wallet?: string;
  description: string;
  timestamp: string;
  raw: Record<string, unknown>;
}

export type WSEvent =
  | { type: 'request'; wallet: string; tier: TrustTier; multiplier: number; priceCharged: number; statusCode: number; endpoint: string; timestamp: string }
  | { type: 'grade_change'; wallet: string; oldTier: TrustTier; newTier: TrustTier; oldScore: number; newScore: number; multiplier: number; gradeHistory: string[]; timestamp: string }
  | { type: 'blocked'; wallet: string; tier: TrustTier; score: number; reason: string; timestamp: string }
  | { type: 'fleet_tick'; totalRequests: number; activeAgents: number; blockedAttempts: number; revenueProtected: number; timestamp: string }
  | { type: 'probe_result'; wallet: string; latencyMs: number; status: string; timestamp: string }
  | { type: 'directive_issued'; wallet: string; directive: AgentDirective; timestamp: string }
  | { type: 'directive_acknowledged'; wallet: string; directiveId: string; timestamp: string }
  | { type: 'endpoint_update'; endpoints: EndpointStats[]; timestamp: string };
