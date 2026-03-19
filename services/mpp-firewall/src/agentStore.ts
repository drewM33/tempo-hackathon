import type { AgentState, TrustTier } from './types.js';
import { getMultiplier } from './pricingEngine.js';
import { broadcast } from './wsEventBus.js';

const TIER_ORDER: TrustTier[] = ['AAA', 'AA', 'A', 'BAA', 'BA', 'B', 'CAA', 'CA', 'C', 'UNRATED'];

function tierIndex(tier: TrustTier): number {
  const idx = TIER_ORDER.indexOf(tier);
  return idx === -1 ? TIER_ORDER.length - 1 : idx;
}

export class AgentStore {
  private agents = new Map<string, AgentState>();

  getOrCreateAgent(wallet: string): AgentState {
    let agent = this.agents.get(wallet);
    if (!agent) {
      agent = {
        wallet,
        tier: 'UNRATED',
        score: null,
        allow: true,
        riskLevel: 'unknown',
        route: 'sdk',
        reasons: [],
        multiplier: getMultiplier('UNRATED'),
        blocked: false,
        directives: [],
        gradeHistory: [],
        requestCount: 0,
        lastRequestAt: 0,
        recentLatencies: [],
        recentStatuses: [],
        sparkline: [],
      };
      this.agents.set(wallet, agent);
    }
    return agent;
  }

  getAgent(wallet: string): AgentState | undefined {
    return this.agents.get(wallet);
  }

  getAllAgents(): AgentState[] {
    return Array.from(this.agents.values());
  }

  seedAgent(wallet: string, overrides: Partial<AgentState>): AgentState {
    const agent = this.getOrCreateAgent(wallet);
    Object.assign(agent, overrides);
    this.agents.set(wallet, agent);
    return agent;
  }

  recordRequest(wallet: string, statusCode: number, latencyMs: number): void {
    const agent = this.getOrCreateAgent(wallet);
    agent.requestCount++;
    agent.lastRequestAt = Date.now();
    agent.recentStatuses.push(statusCode);
    if (agent.recentStatuses.length > 20) agent.recentStatuses.shift();
    agent.recentLatencies.push(latencyMs);
    if (agent.recentLatencies.length > 20) agent.recentLatencies.shift();
    agent.sparkline.push(latencyMs + (statusCode >= 400 ? 100 : 0));
    if (agent.sparkline.length > 20) agent.sparkline.shift();
  }

  setAgentTier(wallet: string, tier: TrustTier): AgentState | null {
    const agent = this.agents.get(wallet);
    if (!agent) return null;
    const oldTier = agent.tier;
    agent.tier = tier;
    agent.multiplier = getMultiplier(tier);
    agent.blocked = tier === 'C';
    agent.allow = !agent.blocked;
    agent.gradeHistory.push(tier);
    if (agent.gradeHistory.length > 8) agent.gradeHistory.shift();

    broadcast({
      type: 'grade_change',
      wallet,
      oldTier,
      newTier: tier,
      oldScore: agent.score ?? 0,
      newScore: agent.score ?? 0,
      multiplier: agent.multiplier,
      gradeHistory: agent.gradeHistory,
      timestamp: new Date().toISOString(),
    });

    return agent;
  }

  stepTierUp(wallet: string): { oldTier: TrustTier; newTier: TrustTier } | null {
    const agent = this.agents.get(wallet);
    if (!agent) return null;
    const idx = tierIndex(agent.tier);
    if (idx <= 0) return null;
    const oldTier = agent.tier;
    const newTier = TIER_ORDER[idx - 1]!;
    this.setAgentTier(wallet, newTier);
    return { oldTier, newTier };
  }

  stepTierDown(wallet: string): { oldTier: TrustTier; newTier: TrustTier } | null {
    const agent = this.agents.get(wallet);
    if (!agent) return null;
    const idx = tierIndex(agent.tier);
    if (idx >= TIER_ORDER.length - 1) return null;
    const oldTier = agent.tier;
    const newTier = TIER_ORDER[idx + 1]!;
    this.setAgentTier(wallet, newTier);
    return { oldTier, newTier };
  }
}
