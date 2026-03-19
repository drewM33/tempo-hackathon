'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useAgentContext } from '@/lib/agent-context';

const EVENT_STYLES: Record<string, { icon: string; color: string }> = {
  request:                { icon: '→', color: 'text-gray-500' },
  grade_change:           { icon: '↕', color: 'text-blue-400' },
  blocked:                { icon: '🚫', color: 'text-red-400' },
  probe_result:           { icon: '📡', color: 'text-purple-400' },
  directive_issued:       { icon: '📋', color: 'text-amber-400' },
  directive_acknowledged: { icon: '✓', color: 'text-emerald-400' },
};

function truncate(wallet: string): string {
  if (!wallet || wallet.length <= 10) return wallet || '';
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour12: false });
  } catch {
    return '—';
  }
}

export default function EventLog() {
  const { state } = useAgentContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    setAutoScroll(atBottom);
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [state.events.length, autoScroll]);

  return (
    <div className="bg-surface-2 border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-2 flex items-center justify-between border-b border-border">
        <h3 className="text-sm font-semibold text-gray-300">Event Log</h3>
        <span className="text-[10px] text-gray-600">{state.events.length} events</span>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-48 overflow-y-auto px-3 py-1 space-y-0.5"
      >
        {state.events.length === 0 && (
          <div className="text-xs text-gray-600 py-4 text-center">Waiting for events...</div>
        )}
        {state.events.map((evt, idx) => {
          const style = EVENT_STYLES[evt.type] || { icon: '•', color: 'text-gray-500' };
          return (
            <div
              key={evt.id}
              className={`flex items-start gap-2 text-xs py-0.5 ${style.color} ${idx < 3 ? 'event-slide-in' : ''}`}
            >
              <span className="text-gray-600 tabular-nums font-mono shrink-0">{formatTime(evt.timestamp)}</span>
              <span className="shrink-0">{style.icon}</span>
              {evt.wallet && (
                <span className="font-mono text-gray-400 shrink-0">{truncate(evt.wallet)}</span>
              )}
              <span className="truncate">{evt.description}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
