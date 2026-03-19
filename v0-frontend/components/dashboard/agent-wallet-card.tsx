"use client";

import { useState, useCallback } from "react";
import {
  TIER_CONFIG,
  formatWalletDisplay,
  type AgentWallet,
} from "@/lib/dashboard-data";
import { Sparkline } from "./sparkline";
import { Hash, Zap, Check, RotateCcw, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const RISK_COLORS = {
  low: "#22c55e",
  medium: "#facc15",
  high: "#f97316",
  critical: "#ef4444",
};

const RISK_DESCRIPTIONS: Record<string, string> = {
  low: "Low risk. This agent has a strong behavioral track record and stable credit rating.",
  medium: "Medium risk. Some inconsistency in behavior patterns. May see occasional rate limiting.",
  high: "High risk. Frequent anomalies detected. Subject to aggressive rate limiting and elevated pricing.",
  critical: "Critical risk. This agent is one step from being blocked. Sandboxing may be in effect.",
};

const TIER_DESCRIPTIONS: Record<string, string> = {
  AAA: "Highest rated. Excellent behavioral history, lowest pricing tier, full API access.",
  AA: "Very high rated. Near-perfect track record, very low pricing, full access.",
  A: "High rated. Strong behavioral signals, low pricing, full access.",
  BAA: "Upper medium. Mostly good behavior with minor flags. Moderate pricing.",
  BA: "Lower medium. Noticeable behavioral variance. Above-average pricing.",
  B: "Speculative. Inconsistent behavior. High pricing and rate limits apply.",
  CAA: "Poor rating. Significant risk signals. Very high pricing, restricted access.",
  CA: "Very poor. Near-default behavior. Extreme pricing, heavily restricted.",
  C: "Default. Agent is blocked from all endpoints.",
  BLOCKED: "Permanently blocked. No API access permitted.",
  UNRATED: "Not yet rated. Insufficient behavioral data to assign a tier.",
};

type CallState = "idle" | "calling" | "success" | "error";

export function AgentWalletCard({ agent }: { agent: AgentWallet }) {
  const config = TIER_CONFIG[agent.tier];
  const isBlocked = agent.tier === "C" || agent.tier === "BLOCKED";
  const cer = agent.cer ?? 0;
  const cerTrend = agent.cerTrend ?? "neutral";
  const cerTrendValue = agent.cerTrendValue ?? "0%";
  const avgInfraCost = agent.avgInfraCost ?? 0;
  const avgValuePerCall = agent.avgValuePerCall ?? 0;
  const [callState, setCallState] = useState<CallState>("idle");
  const [lastCallTime, setLastCallTime] = useState<string | null>(null);

  const handleCall = useCallback(() => {
    if (callState === "calling" || isBlocked) return;
    setCallState("calling");

    const duration = Math.random() * 2000 + 800;
    setTimeout(() => {
      const success = Math.random() > 0.15;
      if (success) {
        setCallState("success");
        setLastCallTime(`${(duration / 1000).toFixed(1)}s ago`);
        setTimeout(() => setCallState("idle"), 3000);
      } else {
        setCallState("error");
        setTimeout(() => setCallState("idle"), 4000);
      }
    }, duration);
  }, [callState, isBlocked]);

  return (
    <div className="relative rounded-lg border border-border bg-card overflow-hidden group hover:border-primary/30 transition-colors">
      {/* Risk level strip with tooltip */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute bottom-0 left-0 right-0 h-1 cursor-default hover:h-1.5 transition-all"
            style={{ backgroundColor: RISK_COLORS[agent.riskLevel] }}
          />
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          sideOffset={4}
          className="max-w-[240px] bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs leading-relaxed"
        >
          {RISK_DESCRIPTIONS[agent.riskLevel]}
        </TooltipContent>
      </Tooltip>

      <div className="p-4 flex flex-col gap-3">
        {/* Header: Address + Call Button + Tier Badge */}
        <div className="flex items-start justify-between gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 min-w-0 cursor-default">
                <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-mono text-xs text-muted-foreground truncate">
                  <span title={agent.address}>
                    {formatWalletDisplay(agent.address)}
                  </span>
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={4}
              className="bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs"
            >
              Agent wallet address. Used as the unique identifier for behavioral scoring.
            </TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-2 shrink-0">
            {/* Call Agent button */}
            {!isBlocked && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleCall}
                    disabled={callState === "calling"}
                    className={`
                      flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-wider
                      transition-all duration-200 cursor-pointer
                      ${callState === "idle"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-500/50"
                        : callState === "calling"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : callState === "success"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
                            : "bg-red-500/15 text-red-400 border border-red-500/40 hover:bg-red-500/25"
                      }
                      disabled:cursor-wait
                    `}
                  >
                    {callState === "idle" && (
                      <>
                        <Zap className="h-3 w-3" />
                        <span>Call</span>
                      </>
                    )}
                    {callState === "calling" && (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Calling</span>
                      </>
                    )}
                    {callState === "success" && (
                      <>
                        <Check className="h-3 w-3" />
                        <span>{lastCallTime}</span>
                      </>
                    )}
                    {callState === "error" && (
                      <>
                        <RotateCcw className="h-3 w-3" />
                        <span>Retry</span>
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  sideOffset={4}
                  className="max-w-[200px] bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs leading-relaxed"
                >
                  Send a test request to this agent to verify connectivity and measure round-trip latency.
                </TooltipContent>
              </Tooltip>
            )}
            {/* Tier badge */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="px-2.5 py-1 rounded font-mono text-xs font-bold tracking-wider cursor-default"
                  style={{
                    color: config.color,
                    backgroundColor: config.bg,
                    border: `1px solid ${config.color}30`,
                  }}
                >
                  {agent.tier}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={4}
                className="max-w-[240px] bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs leading-relaxed"
              >
                {TIER_DESCRIPTIONS[agent.tier] || "Unknown tier."}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Price + CER info */}
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3">
            {isBlocked ? (
              <span className="font-mono text-sm font-bold text-destructive">
                BLOCKED
              </span>
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-baseline gap-3 cursor-default">
                      <span
                        className="font-mono text-lg font-bold"
                        style={{ color: config.color }}
                      >
                        {agent.priceMultiplier}x
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        ${agent.usdPrice.toFixed(4)} / req
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    sideOffset={4}
                    className="max-w-[220px] bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs leading-relaxed"
                  >
                    Price multiplier applied to this agent based on their behavioral rating tier. Higher tiers pay less per request.
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-baseline gap-1.5 cursor-default">
                  <span className={`font-mono text-sm font-bold ${cer >= 1.0 ? "text-emerald-400" : cer >= 0.6 ? "text-amber-400" : "text-red-400"}`}>
                    {cer.toFixed(1)}x
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">CER</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    sideOffset={4}
                    className="max-w-[240px] bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs leading-relaxed"
                  >
                    Cost Efficiency Ratio for this agent. Measures value generated per dollar of infrastructure cost. Above 1.0x is profitable, below 1.0x is a net loss.
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
          {/* CER detail row */}
          {!isBlocked && (
            <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
              <span>${avgInfraCost.toFixed(4)} infra/call</span>
              <span className="text-foreground/30">|</span>
              <span>${avgValuePerCall.toFixed(4)} value/call</span>
              <span className={`ml-auto ${cerTrend === "up" ? "text-emerald-400" : cerTrend === "down" ? "text-red-400" : "text-muted-foreground"}`}>
                {cerTrendValue}
              </span>
            </div>
          )}
        </div>

        {/* Request count + Sparkline */}
        <div className="flex items-end justify-between gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-default">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  Requests
                </div>
                <div className="font-mono text-sm font-semibold text-foreground tabular-nums">
                  {agent.requestCount.toLocaleString()}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={4}
              className="bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs"
            >
              Total requests from this agent in the current monitoring window.
            </TooltipContent>
          </Tooltip>
          <div className="relative">
            <Sparkline data={agent.sparklineData} color={config.color} />
            {callState === "calling" && (
              <div className="absolute -bottom-1.5 left-0 right-0 h-[2px] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full animate-pulse"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${config.color} 50%, transparent 100%)`,
                    animation: "callPulse 1s ease-in-out infinite",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Grade History */}
        <div className="pt-2 border-t border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 cursor-default w-fit">
                Grade History
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={4}
              className="max-w-[220px] bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs leading-relaxed"
            >
              Recent behavioral rating transitions. Shows how this agent's credit tier has changed over time.
            </TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-1 flex-wrap">
            {agent.gradeHistory.map((grade, i) => {
              const gradeConfig =
                TIER_CONFIG[grade as keyof typeof TIER_CONFIG] ||
                TIER_CONFIG.UNRATED;
              return (
                <span key={i} className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="font-mono text-[10px] font-bold px-1 py-0.5 rounded cursor-default"
                        style={{
                          color: gradeConfig.color,
                          backgroundColor: gradeConfig.bg,
                        }}
                      >
                        {grade}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      sideOffset={4}
                      className="max-w-[200px] bg-[#1a1a2e] text-foreground border border-border px-3 py-2 text-xs leading-relaxed"
                    >
                      {TIER_DESCRIPTIONS[grade] || "Unknown tier."}
                    </TooltipContent>
                  </Tooltip>
                  {i < agent.gradeHistory.length - 1 && (
                    <span className="text-muted-foreground text-[10px]">
                      {"\u2192"}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Call pulse animation */}
      <style jsx>{`
        @keyframes callPulse {
          0%,
          100% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
