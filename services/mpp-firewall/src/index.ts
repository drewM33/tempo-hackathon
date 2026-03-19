import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { AgentStore } from './agentStore.js';
import { createMPPHandler } from './mppHandler.js';
import { evaluateAgent, triggerSandboxTest } from './trustGate.js';
import { getEndpointStats } from './endpointTracker.js';
import { probeAgent, issueDirective, getDirectives, initAgentComms } from './agentComms.js';
import { executeCommand } from './chatCommand.js';
import { getPricingTable } from './pricingEngine.js';
import {
  registerWSRoute,
  startFleetTicker,
  startEndpointTicker,
  getStats,
} from './wsEventBus.js';
import { startDemoSimulator } from './demoSimulator.js';
import {
  addWatchedUrl,
  removeWatchedUrl,
  getWatchedUrls,
  startEndpointWatchProbe,
  probeUrlOnce,
} from './endpointWatcher.js';

const PORT = parseInt(process.env.PORT || '3010', 10);

const app = Fastify({ logger: false });
const store = new AgentStore();

async function start(): Promise<void> {
  await app.register(cors, { origin: true });
  await app.register(websocket);

  initAgentComms();

  registerWSRoute(app);

  // ── Health & Status ──

  app.get('/health', async () => ({ ok: true }));

  app.get('/status', async () => {
    const stats = getStats();
    return {
      uptime: process.uptime(),
      port: PORT,
      upstream: process.env.UPSTREAM_URL || 'http://localhost:3011',
      pricingTable: getPricingTable(),
      stats,
      connectedServices: {
        valironSdk: true,
        upstream: process.env.UPSTREAM_URL || 'http://localhost:3011',
      },
    };
  });

  // ── Trust Evaluation ──

  app.get<{ Params: { wallet: string } }>('/trust/:wallet', async (req) => {
    return evaluateAgent(req.params.wallet, store);
  });

  app.post<{ Params: { wallet: string } }>('/trust/:wallet/sandbox', async (req) => {
    const wallet = req.params.wallet;
    const sandbox = await triggerSandboxTest(wallet);
    return { message: 'SDK sandbox evaluation triggered', wallet, sandbox };
  });

  // ── Dashboard Data ──

  app.get('/dashboard/agents', async () => {
    return store.getAllAgents();
  });

  app.get('/dashboard/endpoints', async () => {
    return getEndpointStats();
  });

  app.get('/dashboard/watch', async () => ({ urls: getWatchedUrls() }));

  app.post<{ Body: { url?: string } }>('/dashboard/watch', async (req, reply) => {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return reply.status(400).send({ error: 'url is required' });
    }
    const result = addWatchedUrl(url);
    if (!result.ok) {
      return reply.status(400).send({ error: result.error });
    }
    void probeUrlOnce(result.url);
    return { ok: true, url: result.url };
  });

  app.post<{ Body: { url?: string } }>('/dashboard/watch/remove', async (req, reply) => {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return reply.status(400).send({ error: 'url is required' });
    }
    removeWatchedUrl(url);
    return { ok: true };
  });

  // ── Agent Communication ──

  app.get<{ Params: { wallet: string } }>('/agents/:wallet/directives', async (req) => {
    return getDirectives(req.params.wallet);
  });

  app.post<{ Params: { wallet: string } }>('/agents/:wallet/call', async (req) => {
    const wallet = req.params.wallet;
    const agent = store.getAgent(wallet);
    const blocked = agent?.blocked ?? false;

    if (blocked) {
      return { error: 'Agent is blocked (C-tier)', statusCode: 403 };
    }

    return probeAgent(wallet, blocked);
  });

  app.post<{
    Params: { wallet: string };
    Body: { type?: string; message: string };
  }>('/agents/:wallet/directive', async (req) => {
    const { wallet } = req.params;
    const { type = 'recommendation', message } = req.body || {};

    if (!message) {
      return { error: 'message is required' };
    }

    const directive = await issueDirective(
      wallet,
      message,
      type as 'recommendation' | 'warning' | 'mandate',
    );

    const agent = store.getAgent(wallet);
    if (agent) {
      agent.directives.push(directive);
    }

    return directive;
  });

  // ── Chat Command Center ──

  app.post<{ Body: { message: string } }>('/chat/command', async (req) => {
    const { message } = req.body || {};
    if (!message) {
      return { error: 'message is required' };
    }
    return executeCommand(message, store);
  });

  // ── Admin (seed / debug) ──

  app.post<{ Body: { agents: Array<Record<string, unknown>> } }>('/admin/seed', async (req) => {
    const { agents } = req.body || {};
    if (!Array.isArray(agents)) {
      return { error: 'body.agents must be an array' };
    }
    const seeded: string[] = [];
    for (const agentData of agents) {
      const wallet = agentData.wallet as string;
      if (!wallet) continue;
      store.seedAgent(wallet, agentData as any);
      seeded.push(wallet);
    }
    return { seeded: seeded.length, wallets: seeded };
  });

  // ── MPP Proxy (catch-all) ──

  const mppHandler = createMPPHandler(store);

  app.all('/api/*', async (req, reply) => {
    return mppHandler(req, reply);
  });

  // ── Periodic Tickers ──

  startFleetTicker(() => store.getAllAgents());
  startEndpointTicker(getEndpointStats);
  startEndpointWatchProbe();
  startDemoSimulator(store);

  // ── Start ──

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`\n  🛡️  MPP Firewall running on http://localhost:${PORT}`);
  console.log(`  📡 WebSocket events at ws://localhost:${PORT}/ws/events`);
  console.log(`  📊 Dashboard data at http://localhost:${PORT}/dashboard/agents`);
  console.log(`  💬 Chat commands at POST http://localhost:${PORT}/chat/command\n`);
}

start().catch((err) => {
  console.error('Failed to start MPP Firewall:', err);
  process.exit(1);
});

export { app, store };
