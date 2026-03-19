import type { AgentStore } from './agentStore.js';
import type { AgentState } from './types.js';
import { broadcast, incrementTotalRequests } from './wsEventBus.js';
import { trackRequest } from './endpointTracker.js';

const ENDPOINTS = [
  { method: 'GET' as const, path: '/api/data', latencyBase: 50 },
  { method: 'GET' as const, path: '/api/premium', latencyBase: 200 },
  { method: 'GET' as const, path: '/api/search', latencyBase: 150 },
  { method: 'POST' as const, path: '/api/analyze', latencyBase: 500 },
  { method: 'PUT' as const, path: '/api/update', latencyBase: 60 },
  { method: 'DELETE' as const, path: '/api/remove/1', latencyBase: 50 },
];

function jitter(base: number, spread: number): number {
  return base + (Math.random() - 0.5) * 2 * spread;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function simulateOneRequest(agent: AgentState, store: AgentStore): void {
  const ep = pickRandom(ENDPOINTS);
  const latency = Math.max(10, jitter(ep.latencyBase, ep.latencyBase * 0.4));
  const statusCode = Math.random() > 0.94 ? (Math.random() > 0.5 ? 429 : 500) : 200;

  agent.requestCount++;
  agent.lastRequestAt = Date.now();

  const sparkVal = Math.round(5 + Math.random() * 30);
  agent.sparkline.push(sparkVal);
  if (agent.sparkline.length > 20) agent.sparkline.shift();

  agent.recentStatuses.push(statusCode);
  if (agent.recentStatuses.length > 20) agent.recentStatuses.shift();
  agent.recentLatencies.push(Math.round(latency));
  if (agent.recentLatencies.length > 20) agent.recentLatencies.shift();

  incrementTotalRequests();
  trackRequest(ep.method, ep.path, Math.round(latency), statusCode, agent.wallet);

  const multiplier = isFinite(agent.multiplier) ? agent.multiplier : 0;

  broadcast({
    type: 'request',
    wallet: agent.wallet,
    tier: agent.tier,
    multiplier,
    priceCharged: parseFloat((0.05 * multiplier).toFixed(4)),
    statusCode,
    endpoint: `${ep.method} ${ep.path}`,
    timestamp: new Date().toISOString(),
  });
}

export function startDemoSimulator(store: AgentStore): ReturnType<typeof setInterval> {
  let tick = 0;

  return setInterval(() => {
    const agents = store.getAllAgents();
    const active = agents.filter((a) => !a.blocked && a.tier !== 'UNRATED');
    if (active.length === 0) return;

    const count = Math.random() > 0.5 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      simulateOneRequest(pickRandom(active), store);
    }

    tick++;

    if (tick % 6 === 0 && active.length > 0) {
      const target = pickRandom(active);
      broadcast({
        type: 'probe_result',
        wallet: target.wallet,
        latencyMs: Math.round(200 + Math.random() * 1800),
        status: Math.random() > 0.15 ? 'success' : 'error',
        timestamp: new Date().toISOString(),
      });
    }
  }, 2500);
}
