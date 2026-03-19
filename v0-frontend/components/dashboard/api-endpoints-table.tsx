"use client";

import { type ApiEndpoint } from "@/lib/dashboard-data";
import { Sparkline } from "./sparkline";
import {
  Activity,
  AlertTriangle,
  XCircle,
  Zap,
  Hash,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const METHOD_COLORS: Record<string, { color: string; bg: string }> = {
  GET: { color: "#22c55e", bg: "#22c55e18" },
  POST: { color: "#3b82f6", bg: "#3b82f618" },
  PUT: { color: "#f59e0b", bg: "#f59e0b18" },
  DELETE: { color: "#ef4444", bg: "#ef444418" },
  PATCH: { color: "#a855f7", bg: "#a855f718" },
};

const METHOD_DESCRIPTIONS: Record<string, string> = {
  GET: "Read-only request. Retrieves data without modifying server state.",
  POST: "Write request. Creates new resources or triggers actions.",
  PUT: "Full update. Replaces an existing resource entirely.",
  DELETE: "Destructive request. Removes the specified resource.",
  PATCH: "Partial update. Modifies specific fields of an existing resource.",
};

const STATUS_CONFIG = {
  healthy: { icon: Activity, color: "#22c55e", label: "Healthy" },
  degraded: { icon: AlertTriangle, color: "#facc15", label: "Degraded" },
  down: { icon: XCircle, color: "#ef4444", label: "Down" },
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  healthy: "Endpoint is operating normally. Response times and error rates are within acceptable thresholds.",
  degraded: "Endpoint is experiencing elevated latency or increased error rates. Monitoring closely.",
  down: "Endpoint is unresponsive or returning critical errors. Requests may be failing.",
};

export function ApiEndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  const methodStyle = METHOD_COLORS[endpoint.method] || METHOD_COLORS.GET;
  const statusCfg = STATUS_CONFIG[endpoint.status];
  const StatusIcon = statusCfg.icon;

  const latencyColor =
    endpoint.avgLatency < 100
      ? "#22c55e"
      : endpoint.avgLatency < 250
        ? "#facc15"
        : "#ef4444";

  const errorColor =
    endpoint.errorRate < 1
      ? "#22c55e"
      : endpoint.errorRate < 3
        ? "#facc15"
        : "#ef4444";

  return (
    <div className="relative rounded-lg border border-border bg-card overflow-hidden group hover:border-primary/30 transition-colors">
      {/* Status strip at bottom */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute bottom-0 left-0 right-0 h-1 cursor-default hover:h-1.5 transition-all"
            style={{ backgroundColor: statusCfg.color }}
          />
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          sideOffset={4}
          className="max-w-[240px] bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs leading-relaxed"
        >
          {STATUS_DESCRIPTIONS[endpoint.status]}
        </TooltipContent>
      </Tooltip>

      <div className="p-4 flex flex-col gap-3">
        {/* Header: Method badge + Status */}
        <div className="flex items-start justify-between gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="shrink-0 px-2.5 py-1 rounded font-mono text-xs font-bold tracking-wider cursor-default"
                style={{
                  color: methodStyle.color,
                  backgroundColor: methodStyle.bg,
                  border: `1px solid ${methodStyle.color}30`,
                }}
              >
                {endpoint.method}
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={4}
              className="max-w-[220px] bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs leading-relaxed"
            >
              {METHOD_DESCRIPTIONS[endpoint.method]}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-default">
                <StatusIcon
                  className="h-3.5 w-3.5"
                  style={{ color: statusCfg.color }}
                />
                <span
                  className="font-mono text-[10px] uppercase tracking-wider"
                  style={{ color: statusCfg.color }}
                >
                  {statusCfg.label}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={4}
              className="max-w-[240px] bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs leading-relaxed"
            >
              {STATUS_DESCRIPTIONS[endpoint.status]}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Endpoint path */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="font-mono text-sm text-foreground truncate cursor-default">
              {endpoint.path}
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            sideOffset={4}
            className="bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs font-mono"
          >
            {endpoint.path}
          </TooltipContent>
        </Tooltip>

        {/* Hits + Sparkline */}
        <div className="flex items-end justify-between gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-default">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  Total Hits
                </div>
                <div className="font-mono text-sm font-semibold text-foreground tabular-nums">
                  {endpoint.hits.toLocaleString()}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={4}
              className="bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs"
            >
              Total number of requests to this endpoint in the current monitoring window.
            </TooltipContent>
          </Tooltip>
          <Sparkline data={endpoint.sparklineData} color={methodStyle.color} />
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-default">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  Avg Latency
                </div>
                <div
                  className="font-mono text-xs font-semibold tabular-nums"
                  style={{ color: latencyColor }}
                >
                  {endpoint.avgLatency}ms
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={4}
              className="max-w-[200px] bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs leading-relaxed"
            >
              {"Average response time. Green < 100ms, yellow < 250ms, red > 250ms."}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-default">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  P99
                </div>
                <div className="font-mono text-xs font-semibold tabular-nums text-foreground">
                  {endpoint.p99Latency}ms
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={4}
              className="max-w-[220px] bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs leading-relaxed"
            >
              99th percentile latency. 99% of requests complete faster than this. Indicates worst-case user experience.
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-default">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  Error Rate
                </div>
                <div
                  className="font-mono text-xs font-semibold tabular-nums"
                  style={{ color: errorColor }}
                >
                  {endpoint.errorRate}%
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={4}
              className="max-w-[200px] bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs leading-relaxed"
            >
              {"Percentage of requests returning 4xx/5xx. Green < 1%, yellow < 3%, red > 3%."}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Footer: RPS + Recent agents */}
        <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-default">
                <Zap className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                  {endpoint.rps} req/s
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={4}
              className="bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs"
            >
              Current requests per second hitting this endpoint.
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 overflow-hidden cursor-default">
                <Hash className="h-3 w-3 text-muted-foreground shrink-0" />
                {endpoint.recentAgents.map((agent, i) => (
                  <span
                    key={i}
                    className="font-mono text-[10px] text-muted-foreground px-1 py-0.5 rounded bg-muted/30"
                  >
                    {agent}
                  </span>
                ))}
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={4}
              className="max-w-[220px] bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs leading-relaxed"
            >
              Most recent agent wallets that called this endpoint.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
