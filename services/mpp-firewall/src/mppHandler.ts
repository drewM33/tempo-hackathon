import crypto from 'crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { Mppx, tempo } from 'mppx/server';
import { evaluateAgent } from './trustGate.js';
import { computeFinalPrice } from './pricingEngine.js';
import { trackRequest } from './endpointTracker.js';
import { broadcast, incrementTotalRequests, addRevenueProtected, incrementBlockedAttempts } from './wsEventBus.js';
import type { AgentStore } from './agentStore.js';

const UPSTREAM_URL = process.env.UPSTREAM_URL || 'http://localhost:3011';
const RECIPIENT_ADDRESS = process.env.MPP_RECIPIENT_ADDRESS || '0x0000000000000000000000000000000000000001';
const PATH_USD = '0x20c0000000000000000000000000000000000000';
const mppSecretKey = process.env.MPP_SECRET_KEY || crypto.randomBytes(32).toString('base64');

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
  console.warn('  ⚠️  mppx initialization failed — running in proxy-only mode');
}

export function createMPPHandler(store: AgentStore) {
  return async function handleMPPRequest(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const wallet = extractWallet(request);
    const startTime = Date.now();

    const decision = await evaluateAgent(wallet, store);

    if (decision.blocked) {
      incrementBlockedAttempts();
      addRevenueProtected(computeFinalPrice(decision.tier));

      broadcast({
        type: 'blocked',
        wallet,
        tier: decision.tier,
        score: decision.score ?? 0,
        reason: 'Agent is C-rated — access revoked',
        timestamp: new Date().toISOString(),
      });

      injectHeaders(reply, decision);
      reply.status(403).send({
        error: 'blocked',
        tier: decision.tier,
        message: 'Access denied by trust policy.',
        reasons: decision.reasons,
      });
      return;
    }

    const adjustedPrice = computeFinalPrice(decision.tier);
    incrementTotalRequests();

    // mppx charge flow: create 402 challenge with trust-adjusted price
    if (mppx) {
      try {
        const webRequest = toWebRequest(request);
        const chargeHandler = (mppx as any).charge({
          amount: adjustedPrice.toString(),
          recipient: RECIPIENT_ADDRESS,
        });
        const mppResponse = await chargeHandler(webRequest);

        if (mppResponse.status === 402) {
          // Agent has not paid yet; return mpp challenge.
          const challengeResponse = mppResponse.challenge as Response;
          injectHeaders(reply, decision);
          reply.status(402);
          challengeResponse.headers.forEach((val: string, key: string) => {
            reply.header(key, val);
          });
          const body = await challengeResponse.text();
          reply.send(body);

          const totalLatency = Date.now() - startTime;
          trackRequest(request.method as any, request.url, totalLatency, 402, wallet);
          store.recordRequest(wallet, 402, totalLatency);
          return;
        }

        // Agent paid; proxy to upstream and return receipt.
        const { upstreamStatus, upstreamBody, totalLatency } = await proxyUpstream(request, wallet, decision, adjustedPrice, startTime);
        trackRequest(request.method as any, request.url, totalLatency, upstreamStatus, wallet);
        store.recordRequest(wallet, upstreamStatus, totalLatency);

        emitEvents(wallet, decision, adjustedPrice, upstreamStatus, request);

        const payload = {
          ...(typeof upstreamBody === 'object' && upstreamBody !== null ? upstreamBody : {}),
          _firewall: {
            tier: decision.tier,
            multiplier: decision.multiplier,
            priceCharged: adjustedPrice,
            riskLevel: decision.riskLevel,
            allow: decision.allow,
          },
        };

        const payloadResponse = Response.json(payload);
        const receiptResponse = mppResponse.withReceipt(payloadResponse) as Response;

        injectHeaders(reply, decision);
        reply.status(upstreamStatus);
        receiptResponse.headers.forEach((val: string, key: string) => {
          if (key.toLowerCase() !== 'content-type') {
            reply.header(key, val);
          }
        });
        reply.send(payload);
        return;
      } catch {
        // mppx charge failed at runtime — fall through to direct proxy
      }
    }

    // Fallback: direct proxy without mppx payment enforcement.
    const { upstreamStatus, upstreamBody, totalLatency } = await proxyUpstream(request, wallet, decision, adjustedPrice, startTime);
    trackRequest(request.method as any, request.url, totalLatency, upstreamStatus, wallet);
    store.recordRequest(wallet, upstreamStatus, totalLatency);

    emitEvents(wallet, decision, adjustedPrice, upstreamStatus, request);

    injectHeaders(reply, decision);
    reply.status(upstreamStatus).send({
      ...(typeof upstreamBody === 'object' && upstreamBody !== null ? upstreamBody : {}),
      _firewall: {
        tier: decision.tier,
        multiplier: decision.multiplier,
        priceCharged: adjustedPrice,
        riskLevel: decision.riskLevel,
        allow: decision.allow,
      },
    });
  };
}

async function proxyUpstream(
  request: FastifyRequest,
  wallet: string,
  decision: { tier: string; multiplier: number },
  adjustedPrice: number,
  startTime: number,
): Promise<{ upstreamStatus: number; upstreamBody: unknown; totalLatency: number }> {
  let upstreamStatus = 200;
  let upstreamBody: unknown = {};

  try {
    const upstreamRes = await fetch(`${UPSTREAM_URL}${request.url}`, {
      method: request.method,
      headers: {
        'content-type': 'application/json',
        'x-agent-wallet': wallet,
        'x-firewall-tier': decision.tier,
        'x-firewall-price': adjustedPrice.toString(),
      },
      body: ['POST', 'PUT', 'PATCH'].includes(request.method)
        ? JSON.stringify(request.body)
        : undefined,
    });
    upstreamStatus = upstreamRes.status;
    upstreamBody = await upstreamRes.json().catch(() => ({}));
  } catch {
    upstreamStatus = 502;
    upstreamBody = { error: 'upstream_unavailable' };
  }

  return { upstreamStatus, upstreamBody, totalLatency: Date.now() - startTime };
}

function emitEvents(
  wallet: string,
  decision: { tier: string; multiplier: number },
  adjustedPrice: number,
  upstreamStatus: number,
  request: FastifyRequest,
): void {
  broadcast({
    type: 'request',
    wallet,
    tier: decision.tier as any,
    multiplier: decision.multiplier,
    priceCharged: adjustedPrice,
    statusCode: upstreamStatus,
    endpoint: `${request.method} ${request.url}`,
    timestamp: new Date().toISOString(),
  });
}

function toWebRequest(req: FastifyRequest): Request {
  const url = `http://${req.hostname || 'localhost'}${req.url}`;
  const headers = new Headers();
  for (const [key, val] of Object.entries(req.headers)) {
    if (val) headers.set(key, Array.isArray(val) ? val.join(', ') : val);
  }
  const init: RequestInit = {
    method: req.method,
    headers,
  };
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    init.body = JSON.stringify(req.body);
  }
  return new Request(url, init);
}

function extractWallet(request: FastifyRequest): string {
  const header = request.headers['x-agent-wallet'];
  if (typeof header === 'string' && header.startsWith('0x')) return header;
  return '0x' + '0'.repeat(40);
}

function injectHeaders(
  reply: FastifyReply,
  decision: { tier: string; score: number | null; riskLevel: string; multiplier: number },
): void {
  reply.header('X-Tempo-Trust-Score', decision.score?.toString() ?? 'N/A');
  reply.header('X-Tempo-Trust-Tier', decision.tier);
  reply.header('X-Tempo-Risk-Level', decision.riskLevel);
  reply.header('X-Tempo-Price-Multiplier', decision.multiplier.toString());
}
