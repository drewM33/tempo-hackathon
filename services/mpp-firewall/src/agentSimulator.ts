const FIREWALL_URL = process.env.FIREWALL_URL || 'http://localhost:3010';

interface Endpoint {
  method: string;
  path: string;
  body?: Record<string, unknown>;
}

const ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/api/data' },
  { method: 'GET', path: '/api/premium' },
  { method: 'GET', path: '/api/search?q=test' },
  { method: 'POST', path: '/api/analyze', body: { data: 'sample', depth: 3 } },
  { method: 'PUT', path: '/api/update', body: { field: 'value' } },
  { method: 'DELETE', path: '/api/remove/1' },
];

export interface SimulationResult {
  wallet: string;
  totalRequests: number;
  totalPaid: number;
  finalTier: string;
  tierHistory: string[];
  blockedCount: number;
  endpointsHit: Record<string, number>;
}

interface RequestResult {
  status: number;
  tier?: string;
  priceCharged?: number;
  blocked: boolean;
  endpoint: string;
}

async function makeRequest(
  wallet: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<RequestResult> {
  const endpoint = `${method} ${path}`;
  try {
    const init: RequestInit = {
      method,
      headers: {
        'x-agent-wallet': wallet,
        'content-type': 'application/json',
      },
    };
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      init.body = JSON.stringify(body);
    }

    const res = await fetch(`${FIREWALL_URL}${path}`, init);
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const firewall = data._firewall as Record<string, unknown> | undefined;

    return {
      status: res.status,
      tier: (res.headers.get('x-tempo-trust-tier') ?? firewall?.tier ?? '') as string,
      priceCharged: firewall?.priceCharged as number | undefined,
      blocked: res.status === 403,
      endpoint,
    };
  } catch {
    return { status: 0, blocked: false, endpoint };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function randomEndpoint() {
  return ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)]!;
}

function buildResult(
  wallet: string,
  results: RequestResult[],
): SimulationResult {
  const endpointsHit: Record<string, number> = {};
  let totalPaid = 0;

  for (const r of results) {
    endpointsHit[r.endpoint] = (endpointsHit[r.endpoint] || 0) + 1;
    if (r.priceCharged) totalPaid += r.priceCharged;
  }

  const tiers = results.map((r) => r.tier).filter(Boolean) as string[];
  return {
    wallet,
    totalRequests: results.length,
    totalPaid: parseFloat(totalPaid.toFixed(4)),
    finalTier: tiers[tiers.length - 1] || 'UNRATED',
    tierHistory: [...new Set(tiers)],
    blockedCount: results.filter((r) => r.blocked).length,
    endpointsHit,
  };
}

export class AgentSimulator {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || FIREWALL_URL;
  }

  /**
   * Well-behaved agent: steady 2 req/s, respects 429, clean payloads, completes all requests.
   */
  async simulateGoodAgent(wallet: string, n: number): Promise<SimulationResult> {
    const results: RequestResult[] = [];

    for (let i = 0; i < n; i++) {
      const ep = randomEndpoint();
      const result = await makeRequest(wallet, ep.method, ep.path, ep.body);
      results.push(result);

      if (result.status === 429) {
        await sleep(2000);
      } else {
        await sleep(500);
      }

      if (result.blocked) break;
    }

    return buildResult(wallet, results);
  }

  /**
   * Bad actor: 10+ req/s bursts, ignores 429, oversized payloads, early disconnects.
   */
  async simulateBadAgent(wallet: string, n: number): Promise<SimulationResult> {
    const results: RequestResult[] = [];
    const oversizedPayload = { data: 'x'.repeat(50000), depth: 99, nested: { a: 'x'.repeat(10000) } };

    for (let i = 0; i < n; i++) {
      const ep = randomEndpoint();
      const body = Math.random() < 0.4 ? oversizedPayload : ep.body;

      const controller = new AbortController();
      // Simulate early disconnects ~30% of the time
      if (Math.random() < 0.3) {
        setTimeout(() => controller.abort(), 20);
      }

      try {
        const init: RequestInit = {
          method: ep.method,
          headers: {
            'x-agent-wallet': wallet,
            'content-type': 'application/json',
          },
          signal: controller.signal,
        };
        if (body && ['POST', 'PUT', 'PATCH'].includes(ep.method)) {
          init.body = JSON.stringify(body);
        }

        const res = await fetch(`${this.baseUrl}${ep.path}`, init);
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        const firewall = data._firewall as Record<string, unknown> | undefined;

        results.push({
          status: res.status,
          tier: (res.headers.get('x-tempo-trust-tier') ?? '') as string,
          priceCharged: firewall?.priceCharged as number | undefined,
          blocked: res.status === 403,
          endpoint: `${ep.method} ${ep.path}`,
        });
      } catch {
        results.push({
          status: 0,
          blocked: false,
          endpoint: `${ep.method} ${ep.path}`,
        });
      }

      // Burst: ~100ms between requests (10 req/s), ignore 429
      await sleep(50 + Math.random() * 100);
    }

    return buildResult(wallet, results);
  }

  /**
   * New agent: starts slow (1 req/5s), speeds up as it learns, occasional mistakes.
   */
  async simulateNewAgent(wallet: string, n: number): Promise<SimulationResult> {
    const results: RequestResult[] = [];

    for (let i = 0; i < n; i++) {
      const ep = randomEndpoint();
      const mistakeChance = Math.max(0.02, 0.2 - (i / n) * 0.18);
      const isMistake = Math.random() < mistakeChance;

      let body: Record<string, unknown> | undefined = ep.body;
      if (isMistake && ep.method === 'POST') {
        body = { invalid: true };
      }

      const result = await makeRequest(wallet, ep.method, ep.path, body);
      results.push(result);

      if (result.status === 429) {
        await sleep(5000);
      }

      // Start slow, speed up: 5s → 500ms
      const delayMs = Math.max(500, 5000 - (i / n) * 4500);
      await sleep(delayMs);

      if (result.blocked) break;
    }

    return buildResult(wallet, results);
  }

  /**
   * Cost attacker: targets expensive endpoints, sends complex payloads to maximize infra cost.
   */
  async simulateCostAttacker(wallet: string, n: number): Promise<SimulationResult> {
    const results: RequestResult[] = [];
    const expensiveEndpoints = [
      { method: 'POST', path: '/api/analyze', body: { data: 'a'.repeat(5000), depth: 50, nested: { layers: 10 } } },
      { method: 'GET', path: '/api/search?q=' + 'complex+query+'.repeat(20) },
      { method: 'GET', path: '/api/premium' },
    ];

    for (let i = 0; i < n; i++) {
      const ep = expensiveEndpoints[i % expensiveEndpoints.length]!;
      const result = await makeRequest(wallet, ep.method, ep.path, ep.body);
      results.push(result);

      // Moderate pace — not obviously bursting
      await sleep(300 + Math.random() * 200);

      if (result.blocked) break;
    }

    return buildResult(wallet, results);
  }

  /**
   * Power player: high volume across all endpoints, good behavior, but diminishing returns.
   */
  async simulatePowerPlayer(wallet: string, n: number): Promise<SimulationResult> {
    const results: RequestResult[] = [];

    for (let i = 0; i < n; i++) {
      // Cycle through all endpoints evenly
      const ep = ENDPOINTS[i % ENDPOINTS.length]!;
      const result = await makeRequest(wallet, ep.method, ep.path, ep.body);
      results.push(result);

      if (result.status === 429) {
        await sleep(1500);
      } else {
        // Steady high throughput — 4 req/s
        await sleep(250);
      }

      if (result.blocked) break;
    }

    return buildResult(wallet, results);
  }
}

// CLI runner
if (process.argv[1]?.endsWith('agentSimulator.ts') || process.argv[1]?.endsWith('agentSimulator.js')) {
  const sim = new AgentSimulator();
  const type = process.argv[2] || 'good';
  const wallet = process.argv[3] || `0x${'A'.repeat(4)}${'0'.repeat(36)}`;
  const count = parseInt(process.argv[4] || '20', 10);

  console.log(`\n  🤖 Running ${type} agent simulation: ${count} requests\n`);

  const methods: Record<string, (w: string, n: number) => Promise<SimulationResult>> = {
    good: (w, n) => sim.simulateGoodAgent(w, n),
    bad: (w, n) => sim.simulateBadAgent(w, n),
    new: (w, n) => sim.simulateNewAgent(w, n),
    cost: (w, n) => sim.simulateCostAttacker(w, n),
    power: (w, n) => sim.simulatePowerPlayer(w, n),
  };

  const method = methods[type];
  if (!method) {
    console.error(`  Unknown type: ${type}. Use: good, bad, new, cost, power`);
    process.exit(1);
  }

  method(wallet, count).then((result) => {
    console.log('\n  📊 Simulation Result:');
    console.log(`  Wallet:        ${result.wallet}`);
    console.log(`  Total Requests: ${result.totalRequests}`);
    console.log(`  Total Paid:    $${result.totalPaid}`);
    console.log(`  Final Tier:    ${result.finalTier}`);
    console.log(`  Tier History:  ${result.tierHistory.join(' → ')}`);
    console.log(`  Blocked:       ${result.blockedCount}`);
    console.log(`  Endpoints:     ${JSON.stringify(result.endpointsHit, null, 2)}`);
    console.log('');
  }).catch(console.error);
}
