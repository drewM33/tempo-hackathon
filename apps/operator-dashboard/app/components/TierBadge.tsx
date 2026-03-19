'use client';

import type { TrustTier } from '@/lib/types';
import Tooltip from './Tooltip';

const TIER_COLORS: Record<string, string> = {
  AAA: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  AA:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  A:   'bg-green-500/15 text-green-400 border-green-500/30',
  BAA: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  BA:  'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  B:   'bg-orange-500/15 text-orange-400 border-orange-500/30',
  CAA: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  CA:  'bg-red-500/15 text-red-400 border-red-500/30',
  C:   'bg-red-500/20 text-red-400 border-red-500/40',
  UNRATED: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

const TIER_DESCRIPTIONS: Record<string, string> = {
  AAA: 'AAA — Highest trust. App discount tier',
  AA:  'AA — Very high trust',
  A:   'A — High trust, minor variance',
  BAA: 'BAA — Moderate risk baseline',
  BA:  'BA — Moderate risk, elevated monitoring',
  B:   'B — Elevated risk',
  CAA: 'CAA — High risk',
  CA:  'CA — Near-blocked',
  C:   'C — BLOCKED. No API access',
  UNRATED: 'UNRATED — New or unscored agent',
};

export default function TierBadge({ tier, large }: { tier: TrustTier; large?: boolean }) {
  const colors = TIER_COLORS[tier] || TIER_COLORS.UNRATED;
  const size = large ? 'text-lg px-3 py-1.5 font-bold' : 'text-xs px-2 py-0.5 font-semibold';
  const desc = TIER_DESCRIPTIONS[tier] || `${tier} — Unknown tier`;

  return (
    <Tooltip content={desc}>
      <span className={`inline-flex items-center rounded border ${colors} ${size} tracking-wide cursor-default`}>
        {tier}
      </span>
    </Tooltip>
  );
}
