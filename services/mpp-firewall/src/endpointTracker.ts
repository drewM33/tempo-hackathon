import type { EndpointStats } from './types.js';

interface EndpointRecord {
  method: EndpointStats['method'];
  path: string;
  hitCount: number;
  latencies: number[];
  errors: number;
  recentAgents: string[];
  firstHitAt: number;
}

const endpoints = new Map<string, EndpointRecord>();

function key(method: string, path: string): string {
  return `${method}:${path}`;
}

export function trackRequest(
  method: string,
  path: string,
  latencyMs: number,
  statusCode: number,
  wallet: string,
): void {
  const k = key(method, path);
  const normalizedMethod = method.toUpperCase() as EndpointStats['method'];

  let record = endpoints.get(k);
  if (!record) {
    record = {
      method: normalizedMethod,
      path,
      hitCount: 0,
      latencies: [],
      errors: 0,
      recentAgents: [],
      firstHitAt: Date.now(),
    };
    endpoints.set(k, record);
  }

  record.hitCount++;
  record.latencies.push(latencyMs);
  if (record.latencies.length > 200) record.latencies.shift();
  if (statusCode >= 400) record.errors++;

  if (!record.recentAgents.includes(wallet)) {
    record.recentAgents.push(wallet);
  }
  if (record.recentAgents.length > 3) record.recentAgents.shift();
}

export function removeEndpointRecord(method: string, path: string): void {
  endpoints.delete(key(method, path));
}

export function getEndpointStats(): EndpointStats[] {
  const stats: EndpointStats[] = [];

  for (const record of endpoints.values()) {
    const sorted = [...record.latencies].sort((a, b) => a - b);
    const avg = sorted.length > 0 ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
    const p99Idx = Math.floor(sorted.length * 0.99);
    const p99 = sorted[p99Idx] ?? avg;

    const elapsedSec = (Date.now() - record.firstHitAt) / 1000;
    const reqPerSec = elapsedSec > 0 ? record.hitCount / elapsedSec : 0;

    const errorRate = record.hitCount > 0 ? record.errors / record.hitCount : 0;

    let health: EndpointStats['health'] = 'healthy';
    if (errorRate > 0.1) health = 'down';
    else if (errorRate > 0.02 || p99 > 2000) health = 'degraded';

    stats.push({
      method: record.method,
      path: record.path,
      hitCount: record.hitCount,
      avgLatencyMs: Math.round(avg),
      p99LatencyMs: Math.round(p99),
      errorRate: parseFloat(errorRate.toFixed(3)),
      reqPerSec: parseFloat(reqPerSec.toFixed(2)),
      recentAgents: record.recentAgents,
      health,
    });
  }

  return stats;
}
