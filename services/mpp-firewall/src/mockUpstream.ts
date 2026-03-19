import crypto from 'crypto';
import Fastify from 'fastify';
import { Mppx, tempo } from 'mppx/server';

const PORT = parseInt(process.env.UPSTREAM_PORT || '3011', 10);
const RECIPIENT_ADDRESS = process.env.MPP_RECIPIENT_ADDRESS || '0x0000000000000000000000000000000000000001';
const PATH_USD = '0x20c0000000000000000000000000000000000000';
const BASE_PRICE = 0.05;
const mppSecretKey = process.env.MPP_SECRET_KEY || crypto.randomBytes(32).toString('base64');

const app = Fastify({ logger: false });

let mppx: any = null;
try {
  mppx = Mppx.create({
    methods: [
      tempo.charge({
        currency: PATH_USD as `0x${string}`,
        recipient: RECIPIENT_ADDRESS as `0x${string}`,
        testnet: true,
      }),
    ],
    secretKey: mppSecretKey,
  });
} catch {
  console.warn('  ⚠️  mockUpstream: mppx init failed — running without payment enforcement');
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function toWebRequest(req: import('fastify').FastifyRequest): Request {
  const url = `http://${req.hostname || 'localhost'}${req.url}`;
  const headers = new Headers();
  for (const [key, val] of Object.entries(req.headers)) {
    if (val) headers.set(key, Array.isArray(val) ? val.join(', ') : val);
  }
  const init: RequestInit = { method: req.method, headers };
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    init.body = JSON.stringify(req.body);
  }
  return new Request(url, init);
}

async function enforcePayment(
  req: import('fastify').FastifyRequest,
  reply: import('fastify').FastifyReply,
): Promise<boolean> {
  if (!mppx) return true;

  try {
    const webReq = toWebRequest(req);
    const chargeHandler = (mppx as any).charge({
      amount: BASE_PRICE.toString(),
      recipient: RECIPIENT_ADDRESS,
    });
    const mppResponse = await chargeHandler(webReq);

    if (mppResponse.status === 402) {
      const challenge = mppResponse.challenge as Response;
      reply.status(402);
      challenge.headers.forEach((val: string, key: string) => {
        reply.header(key, val);
      });
      const body = await challenge.text();
      reply.send(body);
      return false;
    }

    return true;
  } catch {
    return true;
  }
}

// GET /api/data — fast (50ms), low compute
app.get('/api/data', async (req, reply) => {
  const paid = await enforcePayment(req, reply);
  if (!paid) return;

  await delay(50);
  return {
    products: [
      { id: 1, name: 'Widget Alpha', price: 29.99, stock: 150 },
      { id: 2, name: 'Widget Beta', price: 49.99, stock: 82 },
      { id: 3, name: 'Widget Gamma', price: 19.99, stock: 340 },
    ],
    generatedAt: new Date().toISOString(),
  };
});

// GET /api/premium — medium (200ms), medium compute
app.get('/api/premium', async (req, reply) => {
  const paid = await enforcePayment(req, reply);
  if (!paid) return;

  await delay(200);
  return {
    content: {
      title: 'Premium Intelligence Report',
      summary: 'Market analysis with advanced AI-driven insights.',
      dataPoints: 2847,
      confidence: 0.94,
      sectors: ['fintech', 'defi', 'infrastructure'],
    },
    accessLevel: 'premium',
    generatedAt: new Date().toISOString(),
  };
});

// GET /api/search?q= — variable (100–500ms depending on query length)
app.get<{ Querystring: { q?: string } }>('/api/search', async (req, reply) => {
  const paid = await enforcePayment(req, reply);
  if (!paid) return;

  const query = req.query.q || '';
  const latency = 100 + Math.min(400, query.length * 20);
  await delay(latency);

  const results = Array.from({ length: Math.min(10, Math.max(1, query.length)) }, (_, i) => ({
    id: i + 1,
    title: `Result ${i + 1} for "${query}"`,
    relevance: parseFloat((1 - i * 0.08).toFixed(2)),
  }));

  return {
    query,
    results,
    totalHits: results.length * 12,
    latencyMs: latency,
    generatedAt: new Date().toISOString(),
  };
});

// POST /api/analyze — slow (500ms–1s), high compute
app.post<{ Body: Record<string, unknown> }>('/api/analyze', async (req, reply) => {
  const paid = await enforcePayment(req, reply);
  if (!paid) return;

  const body = (req.body as Record<string, unknown>) || {};
  const complexity = JSON.stringify(body).length;
  const latency = 500 + Math.min(500, complexity * 2);
  await delay(latency);

  return {
    analysis: {
      inputComplexity: complexity,
      riskScore: parseFloat((Math.random() * 100).toFixed(1)),
      anomalies: Math.floor(Math.random() * 5),
      classification: complexity > 200 ? 'complex' : 'simple',
      processingTimeMs: latency,
    },
    model: 'valiron-analyze-v2',
    generatedAt: new Date().toISOString(),
  };
});

// PUT /api/update — fast (50ms)
app.put<{ Body: Record<string, unknown> }>('/api/update', async (req, reply) => {
  const paid = await enforcePayment(req, reply);
  if (!paid) return;

  await delay(50);
  return {
    updated: true,
    fields: Object.keys((req.body as Record<string, unknown>) || {}),
    timestamp: new Date().toISOString(),
  };
});

// DELETE /api/remove/:id — fast (50ms)
app.delete<{ Params: { id: string } }>('/api/remove/:id', async (req, reply) => {
  const paid = await enforcePayment(req, reply);
  if (!paid) return;

  await delay(50);
  return {
    removed: true,
    id: req.params.id,
    timestamp: new Date().toISOString(),
  };
});

// Health check
app.get('/health', async () => ({ ok: true, service: 'mock-upstream' }));

async function start(): Promise<void> {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`\n  🎯 Mock Upstream API running on http://localhost:${PORT}`);
  console.log(`  💰 Base price: $${BASE_PRICE} per request`);
  console.log(`  📦 Routes: /api/data, /api/premium, /api/search, /api/analyze, /api/update, /api/remove/:id\n`);
}

start().catch((err) => {
  console.error('Failed to start Mock Upstream:', err);
  process.exit(1);
});

export { app };
