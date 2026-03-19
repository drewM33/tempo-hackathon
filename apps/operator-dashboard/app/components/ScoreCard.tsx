'use client';

export default function ScoreCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const textColor = color === 'green' ? 'text-emerald-400'
    : color === 'amber' ? 'text-amber-400'
    : color === 'red' ? 'text-red-400'
    : 'text-white';

  return (
    <div className="bg-surface-2 border border-border rounded-lg p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-2xl font-bold tabular-nums ${textColor}`}>{value}</span>
    </div>
  );
}
