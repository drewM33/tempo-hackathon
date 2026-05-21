"use client";

import { Button } from "@/components/ui/button";
import { ProtocolBadge } from "@/components/shared/protocol-badge";
import type { WizardData } from "./provider-wizard";
import {
  ArrowLeft,
  Check,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";

interface StepReviewProps {
  data: WizardData;
  onBack: () => void;
  onPublish: () => void;
}

export function StepReview({ data, onBack, onPublish }: StepReviewProps) {
  const { basicInfo, trialConfig, riskSettings } = data;
  const displayText =
    trialConfig.creditDisplay ||
    `$${trialConfig.creditAmount.toLocaleString()} in API credits`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Review {"&"} Publish</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review your deal before publishing it to the marketplace.
        </p>
      </div>

      {/* Deal card preview */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary bg-primary/15 rounded-full px-2 py-0.5">
            Preview
          </span>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-foreground">
            {basicInfo.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "??"}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{basicInfo.name || "Provider Name"}</h3>
            <p className="text-xs text-muted-foreground">{basicInfo.description || "Description..."}</p>
          </div>
        </div>

        <p className="text-sm font-semibold text-primary">{displayText}</p>
        <p className="text-xs text-muted-foreground">
          Save up to ${trialConfig.creditAmount.toLocaleString()} &middot; {trialConfig.duration}
        </p>

        <code className="text-xs font-mono text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5">
          {trialConfig.method} {trialConfig.path || "/..."}
        </code>
      </div>

      {/* Summary sections */}
      <div className="grid gap-4">
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Endpoint</h3>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">URL</span>
            <code className="text-xs font-mono text-foreground">{trialConfig.endpointUrl || "--"}</code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Protocol</span>
            <ProtocolBadge protocol={trialConfig.protocol} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Category</span>
            <span className="text-xs text-foreground">{basicInfo.category}</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            {riskSettings.useValironScoring ? (
              <>
                <ShieldCheck className="h-4 w-4 text-primary" />
                Risk-Adaptive Scoring Enabled
              </>
            ) : (
              <>
                <ShieldOff className="h-4 w-4 text-muted-foreground" />
                Flat Credit Allocation
              </>
            )}
          </h3>
          {riskSettings.useValironScoring ? (
            <p className="text-xs text-muted-foreground">
              Credits will scale from {Math.round((riskSettings.tierMultipliers["CA"] ?? 0.1) * 100)}%
              (CA) to {Math.round((riskSettings.tierMultipliers["AAA"] ?? 1) * 100)}% (AAA) of
              ${trialConfig.creditAmount.toLocaleString()}.
              {riskSettings.blockLowTier && " C and BLOCKED tier agents will be denied."}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              All agents receive the full ${trialConfig.creditAmount.toLocaleString()} in credits.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onPublish} className="min-w-[140px]">
          <Check className="mr-1.5 h-4 w-4" />
          Publish Deal
        </Button>
      </div>
    </div>
  );
}
