import type { ChatCommandResponse, TrustTier } from './types.js';
import type { AgentStore } from './agentStore.js';
import { issueDirective } from './agentComms.js';

const VALID_TIERS: TrustTier[] = ['AAA', 'AA', 'A', 'BAA', 'BA', 'B', 'CAA', 'CA', 'C', 'UNRATED'];

export async function executeCommand(
  message: string,
  store: AgentStore,
): Promise<ChatCommandResponse> {
  const trimmed = message.trim().toLowerCase();

  if (/^list\s+agents?$/i.test(trimmed)) {
    return listAgents(store);
  }

  if (/^show\s+blocked$/i.test(trimmed)) {
    return showBlocked(store);
  }

  if (/^top\s+trusted$/i.test(trimmed)) {
    return topTrusted(store);
  }

  const downgradeMatch = message.match(/^downgrade\s+(0x[a-fA-F0-9]+)\s*(.*)?$/i);
  if (downgradeMatch) {
    return downgradeAgent(downgradeMatch[1]!, downgradeMatch[2] || '', store);
  }

  const upgradeMatch = message.match(/^upgrade\s+(0x[a-fA-F0-9]+)\s*(.*)?$/i);
  if (upgradeMatch) {
    return upgradeAgent(upgradeMatch[1]!, upgradeMatch[2] || '', store);
  }

  const setTierMatch = message.match(/^set\s+tier\s+(0x[a-fA-F0-9]+)\s+(\w+)$/i);
  if (setTierMatch) {
    return setTier(setTierMatch[1]!, setTierMatch[2]!.toUpperCase(), store);
  }

  const tellMatch = message.match(/^tell\s+(0x[a-fA-F0-9]+)\s+(.+)$/i);
  if (tellMatch) {
    return tellAgent(tellMatch[1]!, tellMatch[2]!, store);
  }

  return {
    type: 'query',
    response: `Unknown command: "${message}"\n\nAvailable commands:\n` +
      '• list agents — show all active agents\n' +
      '• show blocked — list blocked agents\n' +
      '• top trusted — agents sorted by score\n' +
      '• downgrade 0x... [reason] — step tier down\n' +
      '• upgrade 0x... [reason] — step tier up\n' +
      '• set tier 0x... TIER — jump to specific tier\n' +
      '• tell 0x... message — issue directive',
  };
}

function listAgents(store: AgentStore): ChatCommandResponse {
  const agents = store.getAllAgents();
  if (agents.length === 0) {
    return { type: 'query', response: 'No active agents.' };
  }

  const lines = agents.map((a) => {
    const status = a.blocked ? '🚫 BLOCKED' : `${a.tier}`;
    return `${truncateWallet(a.wallet)} — ${status} — score ${a.score ?? 'N/A'} — ${a.requestCount} reqs`;
  });

  return { type: 'query', response: `Active Agents (${agents.length}):\n\n${lines.join('\n')}` };
}

function showBlocked(store: AgentStore): ChatCommandResponse {
  const blocked = store.getAllAgents().filter((a) => a.blocked);
  if (blocked.length === 0) {
    return { type: 'query', response: 'No blocked agents.' };
  }

  const lines = blocked.map((a) =>
    `${truncateWallet(a.wallet)} — score ${a.score ?? 'N/A'} — ${a.requestCount} reqs`,
  );
  return { type: 'query', response: `Blocked Agents (${blocked.length}):\n\n${lines.join('\n')}` };
}

function topTrusted(store: AgentStore): ChatCommandResponse {
  const agents = store.getAllAgents()
    .filter((a) => !a.blocked)
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  if (agents.length === 0) {
    return { type: 'query', response: 'No trusted agents with score data yet.' };
  }

  const lines = agents.slice(0, 10).map((a, i) =>
    `${i + 1}. ${truncateWallet(a.wallet)} — ${a.tier} — score ${a.score ?? 'N/A'}`,
  );
  return { type: 'query', response: `Top Trusted Agents:\n\n${lines.join('\n')}` };
}

function downgradeAgent(
  walletFragment: string,
  reason: string,
  store: AgentStore,
): ChatCommandResponse {
  const wallet = resolveWallet(walletFragment, store);
  if (!wallet) {
    return { type: 'action', response: `Agent ${walletFragment} not found.`, badge: 'ACTION' };
  }

  const result = store.stepTierDown(wallet);
  if (!result) {
    return { type: 'action', response: `Cannot downgrade ${truncateWallet(wallet)} further.`, badge: 'ACTION' };
  }

  return {
    type: 'action',
    response: `Downgraded ${truncateWallet(wallet)}: ${result.oldTier} → ${result.newTier}` +
      (reason ? ` (reason: ${reason.trim()})` : ''),
    badge: 'ACTION',
    affectedWallet: wallet,
    mutation: { field: 'tier', oldValue: result.oldTier, newValue: result.newTier },
  };
}

function upgradeAgent(
  walletFragment: string,
  reason: string,
  store: AgentStore,
): ChatCommandResponse {
  const wallet = resolveWallet(walletFragment, store);
  if (!wallet) {
    return { type: 'action', response: `Agent ${walletFragment} not found.`, badge: 'ACTION' };
  }

  const result = store.stepTierUp(wallet);
  if (!result) {
    return { type: 'action', response: `Cannot upgrade ${truncateWallet(wallet)} further.`, badge: 'ACTION' };
  }

  return {
    type: 'action',
    response: `Upgraded ${truncateWallet(wallet)}: ${result.oldTier} → ${result.newTier}` +
      (reason ? ` (reason: ${reason.trim()})` : ''),
    badge: 'ACTION',
    affectedWallet: wallet,
    mutation: { field: 'tier', oldValue: result.oldTier, newValue: result.newTier },
  };
}

function setTier(
  walletFragment: string,
  tierStr: string,
  store: AgentStore,
): ChatCommandResponse {
  const wallet = resolveWallet(walletFragment, store);
  if (!wallet) {
    return { type: 'action', response: `Agent ${walletFragment} not found.`, badge: 'ACTION' };
  }

  if (!VALID_TIERS.includes(tierStr as TrustTier)) {
    return {
      type: 'action',
      response: `Invalid tier "${tierStr}". Valid: ${VALID_TIERS.join(', ')}`,
      badge: 'ACTION',
    };
  }

  const agent = store.getAgent(wallet);
  const oldTier = agent?.tier ?? 'UNRATED';
  store.setAgentTier(wallet, tierStr as TrustTier);

  return {
    type: 'action',
    response: `Set ${truncateWallet(wallet)} tier: ${oldTier} → ${tierStr}`,
    badge: 'ACTION',
    affectedWallet: wallet,
    mutation: { field: 'tier', oldValue: oldTier, newValue: tierStr },
  };
}

async function tellAgent(
  walletFragment: string,
  message: string,
  store: AgentStore,
): Promise<ChatCommandResponse> {
  const wallet = resolveWallet(walletFragment, store);
  if (!wallet) {
    return { type: 'action', response: `Agent ${walletFragment} not found.`, badge: 'ACTION' };
  }

  const directive = await issueDirective(wallet, message.trim());
  const agent = store.getAgent(wallet);
  if (agent) {
    agent.directives.push(directive);
  }

  return {
    type: 'action',
    response: `Directive issued to ${truncateWallet(wallet)}: "${message.trim()}"`,
    badge: 'ACTION',
    affectedWallet: wallet,
    mutation: { field: 'directive', oldValue: '', newValue: message.trim() },
  };
}

function resolveWallet(fragment: string, store: AgentStore): string | null {
  const agents = store.getAllAgents();
  const lower = fragment.toLowerCase();

  const exact = agents.find((a) => a.wallet.toLowerCase() === lower);
  if (exact) return exact.wallet;

  const partial = agents.find((a) => a.wallet.toLowerCase().startsWith(lower));
  if (partial) return partial.wallet;

  const contains = agents.find((a) => a.wallet.toLowerCase().includes(lower.replace('0x', '')));
  if (contains) return contains.wallet;

  return null;
}

function truncateWallet(wallet: string): string {
  if (wallet.length <= 10) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}
