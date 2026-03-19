'use client';

import { useId } from 'react';

export default function Sparkline({ data, width = 200, height = 40 }: { data: number[]; width?: number; height?: number }) {
  const gradId = useId();

  if (data.length < 2) {
    return <div style={{ width, height }} className="bg-surface-3/50 rounded" />;
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return { x, y };
  });

  const pathD = 'M ' + points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ');
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;
  const last = points[points.length - 1]!;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={areaD}
        fill={`url(#${gradId})`}
        className="sparkline-area"
      />
      <path
        d={pathD}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="sparkline-line"
      />
      <circle
        cx={last.x}
        cy={last.y}
        r="2.5"
        fill="#60a5fa"
        className="sparkline-dot"
      />
    </svg>
  );
}
