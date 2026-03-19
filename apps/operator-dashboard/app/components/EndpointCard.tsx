'use client';

import type { EndpointStats } from '@/lib/types';

const METHOD_COLORS: Record<string, string> = {
  GET:    'bg-emerald-500/20 text-emerald-400',
  POST:   'bg-blue-500/20 text-blue-400',
  PUT:    'bg-yellow-500/20 text-yellow-400',
  DELETE: 'bg-red-500/20 text-red-400',
  PATCH:  'bg-purple-500/20 text-purple-400',
};

function errorColor(rate: number): string {
  if (rate < 0.02) return 'text-emerald-400';
  if (rate < 0.05) return 'text-amber-400';
  return 'text-red-400';
}

function healthColor(health: string): string {
  if (health === 'healthy') return 'bg-emerald-500';
  if (health === 'degraded') return 'bg-yellow-500';
  return 'bg-red-500';
}

function truncate(wallet: string): string {
  if (wallet.length <= 10) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export default function EndpointCard({ endpoint }: { endpoint: EndpointStats }) {
  return (
    <div className="bg-surface-2 border border-border rounded-lg overflow-hidden">
      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${METHOD_COLORS[endpoint.method] || METHOD_COLORS.GET}`}>
          {endpoint.method}
        </span>
        <span className="font-mono text-sm text-gray-200 break-all">{endpoint.path}</span>
      </div>

      <div className="px-4 py-2 grid grid-cols-4 gap-3 text-sm">
        <div>
          <div className="text-[10px] text-gray-500 uppercase">Hits</div>
          <div className="text-white font-bold tabular-nums">{endpoint.hitCount.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase">Avg / P99</div>
          <div className="text-gray-300 tabular-nums">
            {endpoint.avgLatencyMs}ms / <span className="text-gray-400">{endpoint.p99LatencyMs}ms</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase">Error Rate</div>
          <div className={`font-bold tabular-nums ${errorColor(endpoint.errorRate)}`}>
            {(endpoint.errorRate * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase">Req/s</div>
          <div className="text-gray-300 tabular-nums">{endpoint.reqPerSec.toFixed(1)}</div>
        </div>
      </div>

      {endpoint.recentAgents.length > 0 && (
        <div className="px-4 py-1.5 flex items-center gap-2 text-xs text-gray-500">
          <span>Recent:</span>
          {endpoint.recentAgents.map((w) => (
            <span key={w} className="font-mono text-gray-400">{truncate(w)}</span>
          ))}
        </div>
      )}

      <div className={`h-1 ${healthColor(endpoint.health)}`} />
    </div>
  );
}
