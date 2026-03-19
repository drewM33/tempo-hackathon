import type { TrustTier } from './types.js';

const BASE_PRICE_USD = parseFloat(process.env.BASE_PRICE_USD || '0.05');

const MY_PRICING: Record<string, number> = {
  AAA: 0.01,
  AA: 0.02,
  A: 0.03,
  BAA: 0.05,
  BA: 0.08,
  B: 0.10,
  CAA: 0.15,
  CA: 0.20,
  C: Infinity,
  UNRATED: 0.12,
};

export function getMultiplier(tier: TrustTier): number {
  const price = MY_PRICING[tier] ?? MY_PRICING.UNRATED;
  if (!isFinite(price)) return Infinity;
  return parseFloat((price / BASE_PRICE_USD).toFixed(3));
}

export function computeFinalPrice(tier: TrustTier): number {
  return MY_PRICING[tier] ?? MY_PRICING.UNRATED;
}

export function isBlocked(tier: TrustTier): boolean {
  return tier === 'C' || !isFinite(computeFinalPrice(tier));
}

export function getPricingTable(): Record<string, { multiplier: number; price: number }> {
  const table: Record<string, { multiplier: number; price: number }> = {};
  for (const [tier, price] of Object.entries(MY_PRICING)) {
    table[tier] = {
      multiplier: isFinite(price) ? parseFloat((price / BASE_PRICE_USD).toFixed(3)) : Infinity,
      price,
    };
  }
  return table;
}

export function getRiskLevel(tier: TrustTier): 'low' | 'medium' | 'high' | 'blocked' {
  if (tier === 'C') return 'blocked';
  if (['AAA', 'AA', 'A'].includes(tier)) return 'low';
  if (['BAA', 'BA', 'B'].includes(tier)) return 'medium';
  return 'high';
}
