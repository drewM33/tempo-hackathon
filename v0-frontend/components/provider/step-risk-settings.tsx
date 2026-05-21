"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { TIER_CONFIG, type CreditTier } from "@/lib/dashboard-data";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

export interface RiskSettingsData {
  useValironScoring: boolean;
  blockLowTier: boolean;
  tierMultipliers: Record<string, number>;
}

interface StepRiskSettingsProps {
  data: RiskSettingsData;
  onChange: (data: RiskSettingsData) => void;
  onNext: () => void;
  onBack: () => void;
}

const CONFIGURABLE_TIERS: CreditTier[] = ["AAA", "AA", "A", "BAA", "BA", "B", "CAA", "CA"];

export function StepRiskSettings({ data, onChange, onNext, onBack }: StepRiskSettingsProps) {
  function updateMultiplier(tier: string, value: number) {
    onChange({
      ...data,
      tierMultipliers: { ...data.tierMultipliers, [tier]: value },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Risk Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure how Valiron risk scoring affects credit allocation.
        </p>
      </div>

      <div className="space-y-6">
        {/* Use Valiron toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <Label className="text-sm font-medium text-foreground">
                Use Valiron Risk Scoring
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Allocate credits based on each agent&apos;s trust tier. Higher-rated agents get more credits.
              </p>
            </div>
          </div>
          <Switch
            checked={data.useValironScoring}
            onCheckedChange={(checked) =>
              onChange({ ...data, useValironScoring: checked })
            }
          />
        </div>

        {/* Block low tier toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div>
            <Label className="text-sm font-medium text-foreground">
              Block C / BLOCKED Tier Agents
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Prevent the riskiest agents from claiming any credits.
            </p>
          </div>
          <Switch
            checked={data.blockLowTier}
            onCheckedChange={(checked) =>
              onChange({ ...data, blockLowTier: checked })
            }
          />
        </div>

        {/* Tier multipliers */}
        {data.useValironScoring && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Tier-Based Credit Allocation
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Set what percentage of the full credit amount each tier receives.
            </p>

            <div className="space-y-4">
              {CONFIGURABLE_TIERS.map((tier) => {
                const config = TIER_CONFIG[tier];
                const value = data.tierMultipliers[tier] ?? 0.5;
                const pct = Math.round(value * 100);

                return (
                  <div key={tier} className="flex items-center gap-4">
                    <span
                      className="w-10 text-xs font-bold font-mono text-center px-1.5 py-0.5 rounded shrink-0"
                      style={{ color: config.color, backgroundColor: config.bg }}
                    >
                      {tier}
                    </span>
                    <Slider
                      value={[value]}
                      min={0}
                      max={1}
                      step={0.05}
                      onValueChange={([v]) => updateMultiplier(tier, v)}
                      className="flex-1"
                    />
                    <span className="w-12 text-right text-xs font-mono text-foreground tabular-nums">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!data.useValironScoring && (
          <div className="rounded-lg bg-muted/50 border border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              All agents will receive the same flat credit amount regardless of their risk profile.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext}>
          Next: Review
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
