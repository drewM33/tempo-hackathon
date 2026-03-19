'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { AgentState } from '@/lib/types';
import { probeAgent } from '@/lib/operator-api';
import TierBadge from './TierBadge';
import Sparkline from './Sparkline';
import Tooltip from './Tooltip';

type CallState = 'idle' | 'calling' | 'success' | 'error';

function truncate(wallet: string): string {
  if (wallet.length <= 10) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

const DOT_COLORS: Record<string, string> = {
  AAA: 'bg-emerald-400', AA: 'bg-emerald-400', A: 'bg-green-400',
  BAA: 'bg-yellow-400', BA: 'bg-yellow-400',
  B: 'bg-orange-400', CAA: 'bg-orange-400',
  CA: 'bg-red-400', C: 'bg-red-500',
  UNRATED: 'bg-gray-500',
};

function riskColor(tier: string): string {
  if (['AAA', 'AA', 'A'].includes(tier)) return 'bg-emerald-500';
  if (['BAA', 'BA'].includes(tier)) return 'bg-yellow-500';
  if (['B', 'CAA'].includes(tier)) return 'bg-orange-500';
  if (['CA', 'C'].includes(tier)) return 'bg-red-500';
  return 'bg-gray-500';
}

interface Props {
  agent: AgentState;
  highlighted: boolean;
}

export default function AgentCard({ agent, highlighted }: Props) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [callResult, setCallResult] = useState<string>('');
  const [showDirectives, setShowDirectives] = useState(false);
  const mountedRef = useRef(true);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleCall = useCallback(async () => {
    if (agent.blocked || callState === 'calling') return;
    setCallState('calling');
    try {
      const result = await probeAgent(agent.wallet);
      if (!mountedRef.current) return;
      if (result.status === 'success') {
        setCallState('success');
        setCallResult(`${(result.latencyMs / 1000).toFixed(1)}s ago`);
      } else {
        setCallState('error');
        setCallResult(result.status);
      }
    } catch {
      if (!mountedRef.current) return;
      setCallState('error');
      setCallResult('failed');
    }
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setCallState('idle');
    }, 5000);
  }, [agent.wallet, agent.blocked, callState]);

  const price = agent.multiplier && isFinite(agent.multiplier) ? (0.05 * agent.multiplier).toFixed(3) : '—';
  const multStr = agent.multiplier && isFinite(agent.multiplier) ? `${agent.multiplier}x` : '∞';

  return (
    <div
      className={`
        bg-surface-2 border rounded-lg overflow-hidden animate-slide-up transition-all duration-300
        ${agent.blocked ? 'opacity-60 border-red-500/40' : 'border-border'}
        ${highlighted ? 'ring-2 ring-blue-500 ring-opacity-70' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-gray-300" title={agent.wallet}>
            {truncate(agent.wallet)}
          </span>
          <TierBadge tier={agent.tier} large />
        </div>

        {/* Call button */}
        {agent.blocked ? (
          <span className="text-xs font-bold text-red-400 px-2 py-1 bg-red-500/10 rounded">BLOCKED</span>
        ) : (
          <button
            onClick={handleCall}
            disabled={callState === 'calling'}
            className={`
              px-3 py-1.5 rounded text-xs font-medium transition-all
              ${callState === 'idle' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : ''}
              ${callState === 'calling' ? 'bg-blue-500/10 text-blue-300 animate-pulse' : ''}
              ${callState === 'success' ? 'bg-emerald-500/20 text-emerald-400' : ''}
              ${callState === 'error' ? 'bg-red-500/20 text-red-400' : ''}
            `}
          >
            {callState === 'idle' && '⚡ Call'}
            {callState === 'calling' && '⏳ Calling...'}
            {callState === 'success' && `✓ ${callResult}`}
            {callState === 'error' && `✗ ${callResult}`}
          </button>
        )}
      </div>

      {/* Sparkline */}
      <div className="px-4 py-1">
        <Tooltip content="Recent request volume — 20-point rolling window, updates every 2.5s" position="bottom">
          <div>
            <Sparkline data={agent.sparkline} width={280} height={36} />
          </div>
        </Tooltip>
        {callState === 'calling' && (
          <div className="mt-1 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-progress-bar" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-2 space-y-2">
        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-white">{multStr}</span>
          <span className="text-lg text-emerald-400 font-mono">→ ${price}</span>
        </div>

        {/* Request count */}
        <div className="text-xs text-gray-500">
          {agent.requestCount.toLocaleString()} requests
          {agent.score !== null && <span className="ml-2">· score {agent.score.toFixed(0)}</span>}
          {agent.riskLevel && <span className="ml-2">· risk {agent.riskLevel}</span>}
        </div>

        {/* Directives */}
        {agent.directives.length > 0 && (
          <button
            onClick={() => setShowDirectives(!showDirectives)}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
          >
            <span>🚩</span>
            <span>{agent.directives.length} directive{agent.directives.length > 1 ? 's' : ''}</span>
          </button>
        )}
        {showDirectives && agent.directives.map((d) => (
          <div key={d.id} className="text-xs bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1 text-amber-300">
            {d.message}
          </div>
        ))}

      </div>

      {/* Footer: grade history */}
      <div className="px-4 py-2 flex items-center gap-1">
        <span className="text-[10px] text-gray-600 mr-1">GRADE</span>
        {agent.gradeHistory.length === 0 && <span className="text-[10px] text-gray-600">—</span>}
        {agent.gradeHistory.map((tier, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full ${DOT_COLORS[tier] || 'bg-gray-500'}`}
            title={tier}
          />
        ))}
      </div>

      {/* Risk strip */}
      <div className={`h-1 ${riskColor(agent.tier)}`} />
    </div>
  );
}
