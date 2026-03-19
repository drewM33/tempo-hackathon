import { v4 as uuid } from 'uuid';
import { Redis } from 'ioredis';
import type { AgentDirective, ProbeResult } from './types.js';
import { broadcast } from './wsEventBus.js';

const DIRECTIVE_TTL = 86400; // 24 hours
const PROBE_TIMEOUT_MS = 5000;
const SIMULATED_FAILURE_RATE = 0.15;

let redis: Redis | null = null;

export function initAgentComms(redisUrl?: string): void {
  try {
    redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 200, 2000)),
      lazyConnect: true,
    });
    redis.on('error', () => {});
    redis.connect().catch(() => {
      redis = null;
    });
  } catch {
    redis = null;
  }
}

export async function probeAgent(wallet: string, blocked: boolean): Promise<ProbeResult> {
  if (blocked) {
    return {
      wallet,
      latencyMs: 0,
      status: 'error',
      responseCode: 403,
      timestamp: new Date().toISOString(),
    };
  }

  const start = Date.now();

  const simulatedLatency = 50 + Math.random() * 2000;
  const isTimeout = simulatedLatency > PROBE_TIMEOUT_MS;
  const isFailure = !isTimeout && Math.random() < SIMULATED_FAILURE_RATE;

  await new Promise((r) => setTimeout(r, Math.min(simulatedLatency, PROBE_TIMEOUT_MS)));

  const latencyMs = Date.now() - start;

  let status: ProbeResult['status'];
  let responseCode: number;

  if (isTimeout) {
    status = 'timeout';
    responseCode = 408;
  } else if (isFailure) {
    status = 'error';
    responseCode = 500;
  } else {
    status = 'success';
    responseCode = 200;
  }

  const result: ProbeResult = {
    wallet,
    latencyMs,
    status,
    responseCode,
    timestamp: new Date().toISOString(),
  };

  broadcast({
    type: 'probe_result',
    wallet,
    latencyMs,
    status,
    timestamp: result.timestamp,
  });

  return result;
}

export async function issueDirective(
  wallet: string,
  message: string,
  type: AgentDirective['type'] = 'recommendation',
  issuedBy: string = 'operator',
): Promise<AgentDirective> {
  const directive: AgentDirective = {
    id: uuid(),
    wallet,
    type,
    message,
    issuedBy,
    issuedAt: new Date().toISOString(),
    acknowledged: false,
  };

  if (redis) {
    try {
      const key = `firewall:directives:${wallet}`;
      await redis.rpush(key, JSON.stringify(directive));
      await redis.expire(key, DIRECTIVE_TTL);
    } catch {
      // fall through to in-memory
    }
  }

  broadcast({
    type: 'directive_issued',
    wallet,
    directive,
    timestamp: directive.issuedAt,
  });

  return directive;
}

export async function getDirectives(wallet: string): Promise<AgentDirective[]> {
  if (!redis) return [];

  try {
    const raw = await redis.lrange(`firewall:directives:${wallet}`, 0, -1);
    return raw.map((r: string) => JSON.parse(r) as AgentDirective);
  } catch {
    return [];
  }
}

export async function acknowledgeDirective(wallet: string, directiveId: string): Promise<boolean> {
  if (!redis) return false;

  try {
    const key = `firewall:directives:${wallet}`;
    const raw = await redis.lrange(key, 0, -1);
    const directives = raw.map((r: string) => JSON.parse(r) as AgentDirective);
    const idx = directives.findIndex((d: AgentDirective) => d.id === directiveId);

    if (idx === -1) return false;

    directives[idx]!.acknowledged = true;
    await redis.del(key);
    for (const d of directives) {
      await redis.rpush(key, JSON.stringify(d));
    }
    await redis.expire(key, DIRECTIVE_TTL);

    broadcast({
      type: 'directive_acknowledged',
      wallet,
      directiveId,
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch {
    return false;
  }
}

export async function shutdownComms(): Promise<void> {
  if (redis) {
    try { await redis.quit(); } catch { /* noop */ }
  }
}
