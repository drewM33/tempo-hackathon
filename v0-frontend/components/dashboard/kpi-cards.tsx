"use client";

import { useEffect, useState } from "react";
import { Activity, Bot, ShieldAlert, DollarSign, TrendingUp, Info } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface KpiMetric {
  label: string;
  value: number;
  format: "number" | "currency" | "ratio";
  icon: React.ReactNode;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  description: string;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

export function KpiCards() {
  const [metrics, setMetrics] = useState<KpiMetric[]>([
    {
      label: "Total Requests",
      value: 2847193,
      format: "number",
      icon: <Activity className="h-4 w-4" />,
      trend: "up",
      trendValue: "+12.4%",
      description:
        "Total API requests processed through the firewall. Includes all tiers and blocked attempts.",
    },
    {
      label: "Active Agents",
      value: 1284,
      format: "number",
      icon: <Bot className="h-4 w-4" />,
      trend: "up",
      trendValue: "+8.2%",
      description:
        "Number of unique agent wallets that have made at least one request in the last 24 hours.",
    },
    {
      label: "Blocked Attempts",
      value: 4721,
      format: "number",
      icon: <ShieldAlert className="h-4 w-4" />,
      trend: "down",
      trendValue: "-3.1%",
      description:
        "Requests rejected by the firewall. Includes C-rated agents, BLOCKED wallets, and policy violations.",
    },
    {
      label: "Revenue Protected",
      value: 892450,
      format: "currency",
      icon: <DollarSign className="h-4 w-4" />,
      trend: "up",
      trendValue: "+22.7%",
      description:
        "Estimated revenue saved by blocking malicious or abusive requests before they reached your infrastructure.",
    },
    {
      label: "CER (Value / Infra $)",
      value: 1.3,
      format: "ratio",
      icon: <TrendingUp className="h-4 w-4" />,
      trend: "up",
      trendValue: "+4.5%",
      description:
        "Cost Efficiency Ratio: the value generated per dollar of infrastructure spend. A CER above 1.0x means you're earning more than you spend. Below 1.0x indicates a net loss on compute.",
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((m) => {
          if (m.format === "ratio") {
            const delta = (Math.random() - 0.45) * 0.05;
            const newVal = parseFloat((m.value + delta).toFixed(2));
            return { ...m, value: Math.max(0.1, newVal) };
          }
          return {
            ...m,
            value:
              m.value +
              Math.floor(
                (Math.random() - 0.3) * (m.format === "currency" ? 500 : 50)
              ),
          };
        })
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 px-6">
      {metrics.map((metric) => (
        <Tooltip key={metric.label}>
          <TooltipTrigger asChild>
            <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-4 cursor-default group/kpi relative">
              <div className="flex items-center gap-2 text-muted-foreground">
                {metric.icon}
                <span className="text-xs font-medium uppercase tracking-wider">
                  {metric.label}
                </span>
                <Info className="h-3 w-3 ml-auto opacity-0 group-hover/kpi:opacity-50 transition-opacity" />
              </div>
              <div className="font-mono text-2xl font-bold text-foreground tabular-nums">
                {metric.format === "currency"
                  ? formatCurrency(metric.value)
                  : metric.format === "ratio"
                    ? `${metric.value.toFixed(1)}x`
                    : formatNumber(metric.value)}
              </div>
              <div
                className={`text-xs font-mono ${
                  metric.trend === "up"
                    ? "text-primary"
                    : metric.trend === "down"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }`}
              >
                {metric.trendValue} vs last 24h
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            sideOffset={8}
            className="max-w-[260px] bg-[#1a1a2e] text-foreground border border-border px-4 py-3 text-xs leading-relaxed"
          >
            {metric.description}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
