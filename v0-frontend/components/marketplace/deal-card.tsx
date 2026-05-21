"use client";

import { useState } from "react";
import Link from "next/link";
import type { Deal } from "@/lib/marketplace-data";
import { ProtocolBadge } from "@/components/shared/protocol-badge";
import { cn } from "@/lib/utils";
import { ShieldCheck, Users } from "lucide-react";

interface DealCardProps {
  deal: Deal;
}

export function ProviderAvatar({
  name,
  logoUrl,
  size = "sm",
}: {
  name: string;
  logoUrl: string | null;
  size?: "sm" | "lg";
}) {
  const [imgError, setImgError] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const dims = size === "lg" ? "h-14 w-14" : "h-10 w-10";
  const textSize = size === "lg" ? "text-lg" : "text-sm";

  if (logoUrl && !imgError) {
    return (
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-lg border border-border bg-white overflow-hidden",
          dims
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="h-full w-full object-contain p-1.5"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-muted font-bold text-foreground",
        dims,
        textSize
      )}
    >
      {initials}
    </div>
  );
}

export function DealCard({ deal }: DealCardProps) {
  return (
    <Link
      href={`/deal/${deal.id}`}
      className={cn(
        "group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:border-primary/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      {/* Top badges */}
      <div className="flex items-center gap-2 mb-4">
        {deal.featured && (
          <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
            Featured
          </span>
        )}
        {deal.riskConfig.useValironScoring && (
          <span className="inline-flex items-center gap-1 rounded-full bg-chart-3/15 px-2 py-0.5 text-xs font-semibold text-chart-3">
            <ShieldCheck className="h-3 w-3" />
            Risk-Adaptive
          </span>
        )}
        <ProtocolBadge protocol={deal.endpoint.protocol} className="ml-auto" />
      </div>

      {/* Provider info */}
      <div className="flex items-start gap-3 mb-4">
        <ProviderAvatar name={deal.provider.name} logoUrl={deal.provider.logoUrl} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {deal.provider.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {deal.provider.description}
          </p>
        </div>
      </div>

      {/* Trial offer */}
      <div className="mb-3">
        <p className="text-sm font-semibold text-primary leading-snug">
          {deal.trial.creditDisplay}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Save up to ${deal.trial.maxSavings.toLocaleString()} &middot; {deal.trial.duration}
        </p>
      </div>

      {/* Endpoint path */}
      <div className="mb-4">
        <code className="text-xs font-mono text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5">
          {deal.endpoint.method} {deal.endpoint.path}
        </code>
      </div>

      {/* Stats footer */}
      <div className="mt-auto flex items-center gap-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span className="font-mono">{deal.stats.totalAgents.toLocaleString()}</span>
          <span>agents</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-mono">{deal.stats.totalClaims.toLocaleString()}</span>
          <span>claims</span>
        </div>
      </div>

      {/* Bottom accent strip */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl transition-all group-hover:h-1",
          deal.endpoint.protocol === "x402" ? "bg-primary" : "bg-chart-2"
        )}
      />
    </Link>
  );
}
