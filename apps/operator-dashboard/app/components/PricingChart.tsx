'use client';

import { useState } from 'react';

const PRICING_ROWS = [
  { tier: 'AAA',     mult: 0.20, price: 0.010, color: '#22c55e' },
  { tier: 'AA',      mult: 0.40, price: 0.020, color: '#4ade80' },
  { tier: 'A',       mult: 0.60, price: 0.030, color: '#86efac' },
  { tier: 'BAA',     mult: 1.00, price: 0.050, color: '#eab308', isBase: true },
  { tier: 'BA',      mult: 1.60, price: 0.080, color: '#f59e0b' },
  { tier: 'B',       mult: 2.00, price: 0.100, color: '#f97316' },
  { tier: 'CAA',     mult: 3.00, price: 0.150, color: '#ef4444' },
  { tier: 'CA',      mult: 4.00, price: 0.200, color: '#dc2626' },
  { tier: 'UNRATED', mult: 2.40, price: 0.120, color: '#6b7280' },
];

const MAX_MULT = 4.0;

export default function PricingChart() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="bg-surface-2 border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-sm text-gray-400 hover:text-gray-200 transition-colors"
      >
        <span className="font-medium">Pricing Table</span>
        <span className="text-xs">{collapsed ? '▼ Expand' : '▲ Collapse'}</span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-1.5">
          {PRICING_ROWS.map((row) => (
            <div key={row.tier} className="flex items-center gap-3 text-sm">
              <span className="w-16 font-mono font-semibold text-gray-300">{row.tier}</span>
              <span className="w-12 text-right text-gray-500 tabular-nums">{row.mult}x</span>
              <div className="flex-1 h-5 bg-surface-3 rounded-sm overflow-hidden relative">
                <div
                  className="h-full rounded-sm transition-all duration-500"
                  style={{
                    width: `${(row.mult / MAX_MULT) * 100}%`,
                    backgroundColor: row.color,
                    opacity: 0.7,
                  }}
                />
                {row.isBase && (
                  <div className="absolute right-2 top-0 h-full flex items-center">
                    <span className="text-[10px] text-yellow-300/70">← base rate</span>
                  </div>
                )}
              </div>
              <span className="w-16 text-right font-mono text-emerald-400 tabular-nums">${row.price.toFixed(3)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
