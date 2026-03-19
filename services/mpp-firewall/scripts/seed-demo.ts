import type { AgentState } from '../src/types.js';

const DEMO_AGENTS: Partial<AgentState>[] = [
  {
    wallet: '0xAAAA000000000000000000000000000000000001',
    tier: 'AAA',
    score: 102,
    multiplier: 0.60,
    blocked: false,
    gradeHistory: ['A', 'AA', 'AA', 'AAA', 'AAA', 'AAA', 'AAA', 'AAA'],
    requestCount: 342,
    lastRequestAt: Date.now(),
    recentStatuses: [200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200],
    recentLatencies: [45, 52, 38, 41, 55, 43, 47, 39, 51, 44, 48, 42, 46, 40, 53, 41, 49, 43, 50, 44],
    sparkline: [12, 15, 14, 16, 13, 15, 14, 17, 15, 14, 16, 13, 15, 14, 17, 15, 14, 16, 13, 15],
    directives: [],
  },
  {
    wallet: '0xBBBB000000000000000000000000000000000002',
    tier: 'C',
    score: 12,
    multiplier: Infinity,
    blocked: true,
    gradeHistory: ['BAA', 'BA', 'B', 'CAA', 'CA', 'C', 'C', 'C'],
    requestCount: 89,
    lastRequestAt: Date.now() - 600000,
    recentStatuses: [429, 500, 429, 0, 500, 429, 0, 500, 429, 0, 500, 429, 0, 429, 500, 0, 429, 500, 0, 429],
    recentLatencies: [2500, 3000, 1500, 0, 2800, 1200, 0, 3100, 2000, 0, 2700, 1800, 0, 2200, 2900, 0, 1900, 2600, 0, 2100],
    sparkline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    directives: [],
  },
  {
    wallet: '0xCCCC000000000000000000000000000000000003',
    tier: 'UNRATED',
    score: null,
    multiplier: 2.0,
    blocked: false,
    gradeHistory: [],
    requestCount: 0,
    lastRequestAt: 0,
    recentStatuses: [],
    recentLatencies: [],
    sparkline: [],
    directives: [],
  },
  {
    wallet: '0xDDDD000000000000000000000000000000000004',
    tier: 'BAA',
    score: 78,
    multiplier: 1.0,
    blocked: false,
    gradeHistory: ['AA', 'A', 'A', 'BAA', 'BAA', 'BAA', 'BAA', 'BAA'],
    requestCount: 156,
    lastRequestAt: Date.now(),
    recentStatuses: [200, 200, 429, 200, 200, 200, 500, 200, 200, 200, 200, 429, 200, 200, 200, 200, 200, 500, 200, 200],
    recentLatencies: [120, 95, 800, 110, 105, 98, 2000, 115, 100, 130, 90, 750, 108, 95, 125, 100, 92, 1800, 110, 105],
    sparkline: [8, 10, 7, 9, 11, 8, 10, 7, 12, 9, 8, 10, 7, 9, 11, 8, 10, 7, 12, 9],
    directives: [],
  },
  {
    wallet: '0xEEEE000000000000000000000000000000000005',
    tier: 'AAA',
    score: 99,
    multiplier: 0.60,
    blocked: false,
    gradeHistory: ['AAA', 'AAA', 'AAA', 'AAA', 'AAA', 'AAA', 'AAA', 'AAA'],
    requestCount: 1240,
    lastRequestAt: Date.now(),
    recentStatuses: [200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200],
    recentLatencies: [35, 40, 38, 42, 36, 39, 41, 37, 43, 38, 35, 40, 38, 42, 36, 39, 41, 37, 43, 38],
    sparkline: [25, 28, 30, 27, 32, 29, 31, 26, 33, 28, 25, 28, 30, 27, 32, 29, 31, 26, 33, 28],
    directives: [],
  },
];

export { DEMO_AGENTS };

async function seed(): Promise<void> {
  const baseUrl = process.env.FIREWALL_URL || 'http://localhost:3010';

  console.log('\n  🌱 Seeding demo agents...\n');

  try {
    const healthRes = await fetch(`${baseUrl}/health`);
    if (!healthRes.ok) throw new Error('Server not healthy');
  } catch {
    console.log('  ✗ Server not reachable at ' + baseUrl);
    console.log('  Start the server first: pnpm dev\n');
    process.exit(1);
  }

  const res = await fetch(`${baseUrl}/admin/seed`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ agents: DEMO_AGENTS }),
  });

  if (!res.ok) {
    console.log('  ✗ Seed failed:', await res.text());
    process.exit(1);
  }

  const result = await res.json() as { seeded: number; wallets: string[] };
  console.log(`  ✅ Seeded ${result.seeded} agents via POST /admin/seed\n`);

  const agentsRes = await fetch(`${baseUrl}/dashboard/agents`);
  const agents = await agentsRes.json() as Array<Record<string, unknown>>;

  for (const agent of agents) {
    const wallet = agent.wallet as string;
    const status = agent.blocked ? '🚫 BLOCKED' : `✅ ${agent.tier}`;
    console.log(`  ${status}  ${wallet.slice(0, 6)}...${wallet.slice(-4)}  score=${agent.score ?? 'N/A'}  reqs=${agent.requestCount}`);
  }

  console.log('');
}

seed().catch(console.error);
