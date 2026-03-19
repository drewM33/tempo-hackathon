import { ValironSDK } from '@valiron/sdk';
import type { SupportedChain } from '@valiron/sdk';
import type { TrustDecision } from './types.js';
import { getMultiplier, isBlocked, getRiskLevel } from './pricingEngine.js';
import { getDirectives } from './agentComms.js';
import type { AgentStore } from './agentStore.js';

const SUPPORTED_CHAINS: SupportedChain[] = [
  'ethereum',
  'monad',
  'arbitrum',
  'base',
  'avalanche',
  'celo',
  'polygon',
  'linea',
  'abstract',
  'bsc',
  'gnosis',
  'goat',
  'mantle',
  'megaeth',
  'metis',
  'optimism',
  'scroll',
  'skale_base',
  'soneium',
  'taiko',
  'xlayer',
];

function resolveChain(rawChain: string | undefined): SupportedChain {
  if (rawChain && SUPPORTED_CHAINS.includes(rawChain as SupportedChain)) {
    return rawChain as SupportedChain;
  }
  return 'base';
}

const valiron = new ValironSDK({ chain: resolveChain(process.env.VALIRON_CHAIN) });
const MIN_SCORE = parseInt(process.env.VALIRON_MIN_SCORE || '65', 10);
const TTL_MS = parseInt(process.env.VALIRON_TTL_MS || '3600000', 10);

export async function evaluateAgent(
  wallet: string,
  store: AgentStore,
): Promise<TrustDecision> {
  const directives = await getDirectives(wallet).catch(() => []);
  const previous = store.getOrCreateAgent(wallet);

  try {
    const result = await valiron.gate(wallet, { minScore: MIN_SCORE, ttlMs: TTL_MS });
    const tier = result.tier ?? 'UNRATED';
    const score = typeof result.score === 'number' ? result.score : null;
    const riskLevel = result.riskLevel ?? getRiskLevel(tier);
    const route = result.route ?? 'sdk';
    const reasons = Array.isArray(result.reasons) ? result.reasons : [];
    const allow = typeof result.allow === 'boolean' ? result.allow : !isBlocked(tier);
    const multiplier = getMultiplier(tier);
    const blocked = !allow || isBlocked(tier);

    const nextHistory = previous.gradeHistory[previous.gradeHistory.length - 1] === tier
      ? previous.gradeHistory
      : [...previous.gradeHistory, tier].slice(-8);

    store.seedAgent(wallet, {
      tier,
      score,
      allow,
      riskLevel,
      route,
      reasons,
      multiplier,
      blocked,
      gradeHistory: nextHistory,
    });

    return {
      wallet,
      allow,
      tier,
      score,
      riskLevel,
      route,
      reasons,
      multiplier,
      blocked,
      source: 'sdk',
      directives,
      gradeHistory: nextHistory,
    };
  } catch {
    const tier = previous.tier ?? 'UNRATED';
    const score = previous.score;
    const blocked = isBlocked(tier);

    return {
      wallet,
      allow: !blocked,
      tier,
      score,
      riskLevel: previous.riskLevel || 'unknown',
      route: 'sdk_error',
      reasons: ['valiron_sdk_error'],
      multiplier: getMultiplier(tier),
      blocked,
      source: 'sdk',
      directives,
      gradeHistory: previous.gradeHistory,
    };
  }
}

export async function triggerSandboxTest(agentId: string): Promise<unknown> {
  return valiron.triggerSandboxTest(agentId);
}
