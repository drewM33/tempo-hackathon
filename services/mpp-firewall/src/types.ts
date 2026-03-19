import type { MoodysRating } from '@valiron/sdk';

export type TrustTier = MoodysRating | 'UNRATED';

export interface AgentDirective {
  id: string;
  wallet: string;
  type: 'recommendation' | 'warning' | 'mandate';
  message: string;
  issuedBy: string;
  issuedAt: string;
  acknowledged: boolean;
}

export interface TrustDecision {
  wallet: string;
  allow: boolean;
  tier: TrustTier;
  score: number | null;
  riskLevel: string;
  route: string;
  reasons: string[];
  multiplier: number;
  blocked: boolean;
  source: 'sdk';
  directives: AgentDirective[];
  gradeHistory: string[];
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

export interface ProbeResult {
  wallet: string;
  latencyMs: number;
  status: 'success' | 'error' | 'timeout';
  responseCode: number;
  timestamp: string;
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

// WebSocket event types
export type WSEvent =
  | RequestEvent
  | GradeChangeEvent
  | BlockedEvent
  | FleetTickEvent
  | ProbeResultEvent
  | DirectiveIssuedEvent
  | DirectiveAcknowledgedEvent
  | EndpointUpdateEvent;

export interface RequestEvent {
  type: 'request';
  wallet: string;
  tier: TrustTier;
  multiplier: number;
  priceCharged: number;
  statusCode: number;
  endpoint: string;
  timestamp: string;
}

export interface GradeChangeEvent {
  type: 'grade_change';
  wallet: string;
  oldTier: TrustTier;
  newTier: TrustTier;
  oldScore: number;
  newScore: number;
  multiplier: number;
  gradeHistory: string[];
  timestamp: string;
}

export interface BlockedEvent {
  type: 'blocked';
  wallet: string;
  tier: TrustTier;
  score: number;
  reason: string;
  timestamp: string;
}

export interface FleetTickEvent {
  type: 'fleet_tick';
  totalRequests: number;
  activeAgents: number;
  blockedAttempts: number;
  revenueProtected: number;
  timestamp: string;
}

export interface ProbeResultEvent {
  type: 'probe_result';
  wallet: string;
  latencyMs: number;
  status: 'success' | 'error' | 'timeout';
  timestamp: string;
}

export interface DirectiveIssuedEvent {
  type: 'directive_issued';
  wallet: string;
  directive: AgentDirective;
  timestamp: string;
}

export interface DirectiveAcknowledgedEvent {
  type: 'directive_acknowledged';
  wallet: string;
  directiveId: string;
  timestamp: string;
}

export interface EndpointUpdateEvent {
  type: 'endpoint_update';
  endpoints: EndpointStats[];
  timestamp: string;
}
