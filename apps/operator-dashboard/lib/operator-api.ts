import type { AgentState, EndpointStats, ProbeResult, ChatCommandResponse } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_FIREWALL_URL || 'http://localhost:3010';

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: { 'content-type': 'application/json', ...opts?.headers },
  });
  return res.json() as Promise<T>;
}

export async function fetchAgents(): Promise<AgentState[]> {
  return api<AgentState[]>('/dashboard/agents');
}

export async function fetchEndpoints(): Promise<EndpointStats[]> {
  return api<EndpointStats[]>('/dashboard/endpoints');
}

export async function fetchWatchedUrls(): Promise<string[]> {
  const res = await api<{ urls: string[] }>('/dashboard/watch');
  return res.urls ?? [];
}

export async function addWatchedEndpoint(url: string): Promise<{ ok: true; url: string } | { error: string }> {
  const res = await fetch(`${BASE_URL}/dashboard/watch`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
  if (!res.ok) {
    return { error: data.error || `HTTP ${res.status}` };
  }
  if (data.ok && data.url) {
    return { ok: true, url: data.url };
  }
  return { error: 'Unexpected response' };
}

export async function removeWatchedEndpoint(url: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/dashboard/watch/remove`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return res.ok;
}

export async function probeAgent(wallet: string): Promise<ProbeResult> {
  return api<ProbeResult>(`/agents/${wallet}/call`, { method: 'POST' });
}

export async function issueDirective(wallet: string, message: string): Promise<unknown> {
  return api(`/agents/${wallet}/directive`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function sendChatCommand(message: string): Promise<ChatCommandResponse> {
  return api<ChatCommandResponse>('/chat/command', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export function getWSUrl(): string {
  const httpUrl = BASE_URL.replace(/^http/, 'ws');
  return `${httpUrl}/ws/events`;
}
