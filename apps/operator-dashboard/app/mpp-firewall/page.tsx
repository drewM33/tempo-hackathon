'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { AgentProvider, useAgentContext } from '@/lib/agent-context';
import { addWatchedEndpoint, fetchWatchedUrls, removeWatchedEndpoint } from '@/lib/operator-api';
import StatusBar from '../components/StatusBar';
import PricingChart from '../components/PricingChart';
import AgentCard from '../components/AgentCard';
import EndpointCard from '../components/EndpointCard';
import EventLog from '../components/EventLog';
import ChatWidget from '../components/ChatWidget';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<'agents' | 'endpoints'>('agents');
  const { state, refreshEndpoints } = useAgentContext();
  const [watchUrls, setWatchUrls] = useState<string[]>([]);
  const [watchInput, setWatchInput] = useState('');
  const [watchError, setWatchError] = useState<string | null>(null);
  const [watchBusy, setWatchBusy] = useState(false);

  const loadWatch = useCallback(() => {
    fetchWatchedUrls().then(setWatchUrls).catch(() => {});
  }, []);

  useEffect(() => {
    loadWatch();
  }, [loadWatch]);

  async function handleAddWatch(): Promise<void> {
    setWatchError(null);
    setWatchBusy(true);
    try {
      const res = await addWatchedEndpoint(watchInput);
      if ('error' in res) {
        setWatchError(res.error);
        return;
      }
      setWatchInput('');
      await loadWatch();
      refreshEndpoints();
    } finally {
      setWatchBusy(false);
    }
  }

  async function handleRemoveWatch(url: string): Promise<void> {
    setWatchBusy(true);
    try {
      await removeWatchedEndpoint(url);
      await loadWatch();
      refreshEndpoints();
    } finally {
      setWatchBusy(false);
    }
  }

  const agents = useMemo(
    () => Object.values(state.agents).sort((a, b) => {
      if (a.blocked !== b.blocked) return a.blocked ? 1 : -1;
      return (b.score ?? -1) - (a.score ?? -1);
    }),
    [state.agents],
  );

  return (
    <div className="min-h-screen bg-surface p-6 pb-24 max-w-[1920px] mx-auto space-y-5">
      <StatusBar />
      <PricingChart />

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'agents'
              ? 'bg-surface-3 text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Active Agent Wallets
          <span className="ml-2 text-xs text-gray-600">({agents.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('endpoints')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'endpoints'
              ? 'bg-surface-3 text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          API Endpoints
          <span className="ml-2 text-xs text-gray-600">({state.endpoints.length})</span>
        </button>
      </div>

      {/* Tab content — both panels stay mounted to survive rapid switching */}
      <div className={activeTab === 'agents' ? '' : 'hidden'}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-600">
              No agents yet. Run <code className="text-gray-400">pnpm seed</code> to add demo agents.
            </div>
          )}
          {agents.map((agent) => (
            <AgentCard
              key={agent.wallet}
              agent={agent}
              highlighted={state.highlightWallet === agent.wallet}
            />
          ))}
        </div>
      </div>

      <div className={activeTab === 'endpoints' ? '' : 'hidden'}>
        <div className="mb-4 rounded-lg border border-border bg-surface-2 p-4 space-y-3">
          <div className="text-sm text-gray-400">
            Watch public URLs — the firewall probes them on a short interval and shows latency, errors, and throughput here (same cards as proxy traffic).
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={watchInput}
              onChange={(e) => setWatchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleAddWatch()}
              placeholder="https://api.example.com/v1/status"
              className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              disabled={watchBusy}
            />
            <button
              type="button"
              onClick={() => void handleAddWatch()}
              disabled={watchBusy || !watchInput.trim()}
              className="rounded-md bg-emerald-600/90 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-40 disabled:pointer-events-none"
            >
              Add URL
            </button>
          </div>
          {watchError && (
            <p className="text-sm text-red-400">{watchError}</p>
          )}
          {watchUrls.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {watchUrls.map((u) => (
                <li
                  key={u}
                  className="group flex items-center gap-1 max-w-full rounded-md border border-border bg-surface px-2 py-1 text-xs font-mono text-gray-300"
                >
                  <span className="truncate" title={u}>{u}</span>
                  <button
                    type="button"
                    onClick={() => void handleRemoveWatch(u)}
                    disabled={watchBusy}
                    className="shrink-0 text-gray-500 hover:text-red-400 disabled:opacity-40"
                    aria-label={`Remove ${u}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {state.endpoints.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-600">
              No endpoint data yet. Add a URL above, or send requests through the firewall proxy to see stats.
            </div>
          )}
          {state.endpoints.map((ep) => (
            <EndpointCard key={`${ep.method}:${ep.path}`} endpoint={ep} />
          ))}
        </div>
      </div>

      <EventLog />
      <ChatWidget />
    </div>
  );
}

export default function MPPFirewallPage() {
  return (
    <AgentProvider>
      <DashboardContent />
    </AgentProvider>
  );
}
