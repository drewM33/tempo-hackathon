"use client";

import Link from "next/link";
import type { Deal } from "@/lib/marketplace-data";
import { DEFAULT_TIER_ALLOCATION, computeAllocation } from "@/lib/marketplace-data";
import { TIER_CONFIG, type CreditTier } from "@/lib/dashboard-data";
import { ProtocolBadge } from "@/components/shared/protocol-badge";
import { ProviderAvatar } from "@/components/marketplace/deal-card";
import { AgentClaimFlow } from "@/components/claim/agent-claim-flow";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  ArrowLeft,
  ShieldCheck,
  Users,
  Clock,
  DollarSign,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DealDetailProps {
  deal: Deal;
}

const DISPLAY_TIERS: CreditTier[] = ["AAA", "AA", "A", "BAA", "BA", "B", "CAA", "CA"];

export function DealDetail({ deal }: DealDetailProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 lg:px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Deals
            </Link>
          </Button>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Deal details */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Provider header */}
            <div className="flex items-start gap-4">
              <ProviderAvatar
                name={deal.provider.name}
                logoUrl={deal.provider.logoUrl}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground">{deal.provider.name}</h1>
                  <ProtocolBadge protocol={deal.endpoint.protocol} />
                  {deal.featured && (
                    <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{deal.provider.description}</p>
              </div>
            </div>

            {/* Trial offer card */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <p className="text-xl font-bold text-primary">{deal.trial.creditDisplay}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Save up to ${deal.trial.maxSavings.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {deal.trial.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    ${deal.trial.creditAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Agents</span>
                </div>
                <span className="text-lg font-bold text-foreground font-mono">
                  {deal.stats.totalAgents.toLocaleString()}
                </span>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Claims</span>
                </div>
                <span className="text-lg font-bold text-foreground font-mono">
                  {deal.stats.totalClaims.toLocaleString()}
                </span>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Avg Score</span>
                </div>
                <span className="text-lg font-bold text-foreground font-mono">
                  {deal.stats.avgRiskScore.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Endpoint details */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Endpoint Details</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Method + Path</span>
                  <code className="text-sm font-mono text-foreground bg-muted/60 rounded px-2 py-0.5">
                    {deal.endpoint.method} {deal.endpoint.path}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Base URL</span>
                  <code className="text-sm font-mono text-muted-foreground truncate max-w-[300px]">
                    {deal.endpoint.url}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Protocol</span>
                  <ProtocolBadge protocol={deal.endpoint.protocol} />
                </div>
              </div>
            </div>

            {/* Risk-adaptive allocation table */}
            {deal.riskConfig.useValironScoring && (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="h-4 w-4 text-chart-3" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Risk-Adaptive Credit Allocation
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  This provider uses Valiron risk scoring. Credits scale with your agent&apos;s trust tier.
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {DISPLAY_TIERS.map((tier) => {
                    const credits = computeAllocation(deal, tier);
                    const config = TIER_CONFIG[tier];
                    return (
                      <div
                        key={tier}
                        className="flex flex-col items-center rounded-lg border border-border bg-muted/30 p-2.5"
                      >
                        <span
                          className="text-xs font-bold font-mono px-1.5 py-0.5 rounded"
                          style={{ color: config.color, backgroundColor: config.bg }}
                        >
                          {tier}
                        </span>
                        <span className="text-sm font-bold text-foreground font-mono mt-1">
                          ${credits.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags */}
            {deal.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {deal.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right: Claim panel */}
          <aside className="w-full lg:w-[380px] shrink-0">
            <div className="lg:sticky lg:top-20">
              <AgentClaimFlow deal={deal} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
