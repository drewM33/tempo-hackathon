"use client";

import { PRICING_TIERS, TIER_CONFIG } from "@/lib/dashboard-data";

export function PricingChart() {
  const maxMultiplier = 3.0;

  return (
    <div className="mx-6 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-mono font-medium text-foreground uppercase tracking-wider">
          Behavioral Rating Pricing Table
        </h2>
        <span className="text-xs font-mono text-muted-foreground">
          Base rate: $0.010 / request
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {PRICING_TIERS.map((tier) => {
          const config = TIER_CONFIG[tier.tier];
          const widthPercent =
            tier.multiplier === 0 ? 100 : (tier.multiplier / maxMultiplier) * 100;
          const isBlocked = tier.multiplier === 0;

          return (
            <div key={tier.label} className="flex items-center gap-3 group">
              <span
                className="w-10 text-right font-mono text-xs font-bold shrink-0"
                style={{ color: config.color }}
              >
                {tier.label}
              </span>
              <div className="flex-1 h-5 rounded-sm overflow-hidden bg-secondary/50 relative">
                <div
                  className="h-full rounded-sm transition-all duration-700 ease-out"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: isBlocked ? "#7f1d1d" : config.color,
                    opacity: isBlocked ? 0.7 : 0.8,
                  }}
                />
                {isBlocked && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-destructive-foreground tracking-widest">
                    BLOCKED
                  </span>
                )}
              </div>
              <span className="w-16 text-right font-mono text-xs text-muted-foreground shrink-0">
                {isBlocked ? (
                  <span className="text-destructive font-bold">BLOCKED</span>
                ) : (
                  <>
                    <span style={{ color: config.color }}>
                      {tier.multiplier}x
                    </span>{" "}
                    {tier.usd}
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
