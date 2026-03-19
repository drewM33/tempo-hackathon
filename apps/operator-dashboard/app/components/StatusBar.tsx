'use client';

import { useEffect, useRef, useState } from 'react';
import { useAgentContext } from '@/lib/agent-context';
import Tooltip from './Tooltip';

function useAnimatedNumber(target: number, duration = 600): number {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  const raf = useRef<number>(0);

  useEffect(() => {
    const from = prev.current;
    const delta = target - from;
    if (delta === 0) return;

    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplay(Math.round(from + delta * eased));
      if (t < 1) raf.current = requestAnimationFrame(step);
      else prev.current = target;
    };

    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return display;
}

function WSIndicator({ status }: { status: 'connected' | 'disconnected' | 'reconnecting' }) {
  const color = status === 'connected' ? 'bg-emerald-400' : status === 'reconnecting' ? 'bg-yellow-400' : 'bg-red-400';
  const animate = status === 'connected' ? 'animate-pulse-green' : '';

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${color} ${animate}`} />
      <span className="text-xs text-gray-500 uppercase">{status}</span>
    </div>
  );
}

function KPICard({ label, value, color = 'text-white', borderClass = 'border-border', tooltip }: {
  label: string;
  value: string;
  color?: string;
  borderClass?: string;
  tooltip?: string;
}) {
  const [flash, setFlash] = useState(false);
  const prevVal = useRef(value);

  useEffect(() => {
    if (value !== prevVal.current) {
      setFlash(true);
      prevVal.current = value;
      const t = setTimeout(() => setFlash(false), 400);
      return () => clearTimeout(t);
    }
  }, [value]);

  const card = (
    <div className={`bg-surface-2 border ${borderClass} rounded-lg p-4 transition-all duration-300 cursor-default`}>
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${color} transition-colors duration-300 ${flash ? 'kpi-flash' : ''}`}>
        {value}
      </div>
    </div>
  );

  if (tooltip) {
    return <Tooltip content={tooltip} position="bottom">{card}</Tooltip>;
  }

  return card;
}

export default function StatusBar() {
  const { state } = useAgentContext();
  const { fleet, wsStatus } = state;

  const totalReqs = useAnimatedNumber(fleet.totalRequests);
  const activeAgents = useAnimatedNumber(fleet.activeAgents, 400);
  const blocked = useAnimatedNumber(fleet.blockedAttempts);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white tracking-tight">
          MPP Firewall — <span className="text-blue-400">Live</span>
        </h1>
        <WSIndicator status={wsStatus} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Total Requests"
          value={totalReqs.toLocaleString()}
          tooltip="Total HTTP requests processed through the MPP firewall"
        />
        <KPICard
          label="Active Agents"
          value={String(activeAgents)}
          tooltip="Unique agent wallets with active sessions"
        />
        <KPICard
          label="Blocked Attempts"
          value={String(blocked)}
          color="text-red-400"
          tooltip="Requests rejected (HTTP 403) from C-tier or revoked agents"
        />
        <KPICard
          label="Revenue Protected"
          value={`$${fleet.revenueProtected.toFixed(2)}`}
          color="text-emerald-400"
          tooltip="Revenue saved by dynamic pricing vs. flat base rate"
        />
      </div>
    </div>
  );
}
