'use client';

import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import type { AgentState, EndpointStats, FleetTick, EventLogEntry, WSEvent } from './types';
import { fetchAgents, fetchEndpoints, getWSUrl } from './operator-api';

interface State {
  agents: Record<string, AgentState>;
  endpoints: EndpointStats[];
  fleet: FleetTick;
  events: EventLogEntry[];
  wsStatus: 'connected' | 'disconnected' | 'reconnecting';
  highlightWallet: string | null;
}

type Action =
  | { type: 'SET_AGENTS'; agents: AgentState[] }
  | { type: 'SET_ENDPOINTS'; endpoints: EndpointStats[] }
  | { type: 'WS_EVENT'; event: WSEvent }
  | { type: 'WS_STATUS'; status: State['wsStatus'] }
  | { type: 'HIGHLIGHT_WALLET'; wallet: string | null }
  | { type: 'UPDATE_AGENT'; wallet: string; patch: Partial<AgentState> };

const initialState: State = {
  agents: {},
  endpoints: [],
  fleet: { totalRequests: 0, activeAgents: 0, blockedAttempts: 0, revenueProtected: 0 },
  events: [],
  wsStatus: 'disconnected',
  highlightWallet: null,
};

let eventCounter = 0;

function formatEventDescription(event: WSEvent): string {
  switch (event.type) {
    case 'request':
      return `${event.endpoint} → ${event.statusCode} (${event.tier}, ${event.multiplier}x)`;
    case 'grade_change':
      return `${event.oldTier} → ${event.newTier} ${tierIndex(event.newTier) < tierIndex(event.oldTier) ? '↑' : '↓'}`;
    case 'blocked':
      return `BLOCKED — score ${event.score}`;
    case 'probe_result':
      return `Probe: ${(event.latencyMs / 1000).toFixed(1)}s, ${event.status}`;
    case 'directive_issued':
      return `Directive: ${event.directive.message}`;
    case 'directive_acknowledged':
      return `Directive ${event.directiveId.slice(0, 8)} acknowledged`;
    case 'fleet_tick':
      return `Fleet: ${event.totalRequests} reqs, ${event.activeAgents} active`;
    case 'endpoint_update':
      return `${event.endpoints.length} endpoints updated`;
    default:
      return 'Unknown event';
  }
}

const TIER_ORDER = ['AAA', 'AA', 'A', 'BAA', 'BA', 'B', 'CAA', 'CA', 'C', 'UNRATED'];
function tierIndex(t: string): number {
  const i = TIER_ORDER.indexOf(t);
  return i === -1 ? 9 : i;
}

function shouldLogEvent(event: WSEvent): boolean {
  if (event.type === 'fleet_tick') return false;
  if (event.type === 'endpoint_update') return false;
  return true;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_AGENTS': {
      const agents: Record<string, AgentState> = {};
      for (const a of action.agents) agents[a.wallet] = a;
      return { ...state, agents };
    }
    case 'SET_ENDPOINTS':
      return { ...state, endpoints: action.endpoints };
    case 'WS_STATUS':
      return { ...state, wsStatus: action.status };
    case 'HIGHLIGHT_WALLET':
      return { ...state, highlightWallet: action.wallet };
    case 'UPDATE_AGENT': {
      const existing = state.agents[action.wallet];
      if (!existing) return state;
      return {
        ...state,
        agents: { ...state.agents, [action.wallet]: { ...existing, ...action.patch } },
      };
    }
    case 'WS_EVENT': {
      const event = action.event;
      let newState = { ...state };

      if (event.type === 'fleet_tick') {
        newState.fleet = {
          totalRequests: event.totalRequests,
          activeAgents: event.activeAgents,
          blockedAttempts: event.blockedAttempts,
          revenueProtected: event.revenueProtected,
        };
      }

      if (event.type === 'endpoint_update') {
        newState.endpoints = event.endpoints;
      }

      if (event.type === 'request' && event.wallet) {
        const agent = newState.agents[event.wallet];
        if (agent) {
          const sparkline = [...agent.sparkline, event.statusCode >= 400 ? 100 : Math.random() * 20 + 5];
          if (sparkline.length > 20) sparkline.shift();
          newState.agents = {
            ...newState.agents,
            [event.wallet]: {
              ...agent,
              requestCount: agent.requestCount + 1,
              sparkline,
            },
          };
        }
      }

      if (event.type === 'grade_change' && event.wallet) {
        const agent = newState.agents[event.wallet];
        if (agent) {
          newState.agents = {
            ...newState.agents,
            [event.wallet]: {
              ...agent,
              tier: event.newTier,
              score: event.newScore,
              multiplier: event.multiplier,
              gradeHistory: event.gradeHistory,
              blocked: event.newTier === 'C',
            },
          };
        }
      }

      if (event.type === 'blocked' && event.wallet) {
        const agent = newState.agents[event.wallet];
        if (agent) {
          newState.agents = {
            ...newState.agents,
            [event.wallet]: { ...agent, tier: 'C', blocked: true, score: event.score },
          };
        }
      }

      if (event.type === 'directive_issued' && event.wallet) {
        const agent = newState.agents[event.wallet];
        if (agent) {
          newState.agents = {
            ...newState.agents,
            [event.wallet]: {
              ...agent,
              directives: [...agent.directives, event.directive],
            },
          };
        }
      }

      if (shouldLogEvent(event)) {
        const entry: EventLogEntry = {
          id: `evt-${++eventCounter}`,
          type: event.type,
          wallet: 'wallet' in event ? (event as any).wallet : undefined,
          description: formatEventDescription(event),
          timestamp: event.timestamp,
          raw: event as any,
        };
        const events = [entry, ...newState.events].slice(0, 200);
        newState.events = events;
      }

      return newState;
    }
    default:
      return state;
  }
}

interface ContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  refreshEndpoints: () => void;
}

const AgentContext = createContext<ContextValue | null>(null);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reconnectDelay = useRef(1000);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    dispatch({ type: 'WS_STATUS', status: 'reconnecting' });

    try {
      const ws = new WebSocket(getWSUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        dispatch({ type: 'WS_STATUS', status: 'connected' });
        reconnectDelay.current = 1000;
      };

      ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as WSEvent;
          dispatch({ type: 'WS_EVENT', event });
        } catch { /* ignore malformed */ }
      };

      ws.onclose = () => {
        dispatch({ type: 'WS_STATUS', status: 'disconnected' });
        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
          connect();
        }, reconnectDelay.current);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      dispatch({ type: 'WS_STATUS', status: 'disconnected' });
    }
  }, []);

  const refreshEndpoints = useCallback(() => {
    fetchEndpoints()
      .then((endpoints) => dispatch({ type: 'SET_ENDPOINTS', endpoints }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAgents()
      .then((agents) => dispatch({ type: 'SET_AGENTS', agents }))
      .catch(() => {});

    fetchEndpoints()
      .then((endpoints) => dispatch({ type: 'SET_ENDPOINTS', endpoints }))
      .catch(() => {});

    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return (
    <AgentContext.Provider value={{ state, dispatch, refreshEndpoints }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgentContext() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgentContext must be inside AgentProvider');
  return ctx;
}
