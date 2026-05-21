"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { StepBasicInfo, type BasicInfoData } from "./step-basic-info";
import { StepTrialConfig, type TrialConfigData } from "./step-trial-config";
import { StepRiskSettings, type RiskSettingsData } from "./step-risk-settings";
import { StepReview } from "./step-review";

export interface WizardData {
  basicInfo: BasicInfoData;
  trialConfig: TrialConfigData;
  riskSettings: RiskSettingsData;
}

const STEPS = [
  { key: "basic", label: "Basic Info" },
  { key: "trial", label: "Trial Config" },
  { key: "risk", label: "Risk Settings" },
  { key: "review", label: "Review" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

const DEFAULT_BASIC_INFO: BasicInfoData = {
  name: "",
  description: "",
  category: "AI & ML",
  tags: "",
};

const DEFAULT_TRIAL_CONFIG: TrialConfigData = {
  creditAmount: 1000,
  creditDisplay: "",
  duration: "3 months",
  endpointUrl: "",
  protocol: "x402",
  method: "POST",
  path: "",
};

const DEFAULT_RISK_SETTINGS: RiskSettingsData = {
  useValironScoring: true,
  blockLowTier: true,
  tierMultipliers: {
    AAA: 1.0,
    AA: 0.9,
    A: 0.8,
    BAA: 0.65,
    BA: 0.5,
    B: 0.35,
    CAA: 0.2,
    CA: 0.1,
  },
};

export function ProviderWizard() {
  const [currentStep, setCurrentStep] = useState<StepKey>("basic");
  const [basicInfo, setBasicInfo] = useState<BasicInfoData>(DEFAULT_BASIC_INFO);
  const [trialConfig, setTrialConfig] = useState<TrialConfigData>(DEFAULT_TRIAL_CONFIG);
  const [riskSettings, setRiskSettings] = useState<RiskSettingsData>(DEFAULT_RISK_SETTINGS);
  const [isPublished, setIsPublished] = useState(false);

  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  function goNext() {
    const next = STEPS[currentIndex + 1];
    if (next) setCurrentStep(next.key);
  }

  function goBack() {
    const prev = STEPS[currentIndex - 1];
    if (prev) setCurrentStep(prev.key);
  }

  function handlePublish() {
    setIsPublished(true);
  }

  if (isPublished) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 mb-4">
          <span className="text-2xl text-primary">V</span>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Deal Published</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Your API trial deal for <strong className="text-foreground">{basicInfo.name}</strong> is
          now live on the Valiron marketplace. Agents can start claiming credits immediately.
        </p>
        <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 mb-6">
          <p className="text-xs text-muted-foreground mb-1">Agent Claim Endpoint</p>
          <code className="text-sm font-mono text-foreground">
            POST /api/claim {"{"}&quot;dealId&quot;: &quot;deal-{basicInfo.name.toLowerCase().replace(/\s+/g, "-")}&quot;{"}"}
          </code>
        </div>
        <a
          href="/"
          className="text-sm text-primary hover:underline"
        >
          View Marketplace
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((step, i) => {
          const isCurrent = step.key === currentStep;
          const isDone = i < currentIndex;

          return (
            <div key={step.key} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => i <= currentIndex && setCurrentStep(step.key)}
                disabled={i > currentIndex}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors w-full",
                  isCurrent
                    ? "bg-primary/15 text-primary"
                    : isDone
                      ? "bg-muted text-foreground cursor-pointer hover:bg-muted/80"
                      : "bg-muted/40 text-muted-foreground cursor-not-allowed"
                )}
              >
                <span className="font-mono font-bold">{i + 1}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px w-4 shrink-0",
                    isDone ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      {currentStep === "basic" && (
        <StepBasicInfo data={basicInfo} onChange={setBasicInfo} onNext={goNext} />
      )}
      {currentStep === "trial" && (
        <StepTrialConfig data={trialConfig} onChange={setTrialConfig} onNext={goNext} onBack={goBack} />
      )}
      {currentStep === "risk" && (
        <StepRiskSettings data={riskSettings} onChange={setRiskSettings} onNext={goNext} onBack={goBack} />
      )}
      {currentStep === "review" && (
        <StepReview
          data={{ basicInfo, trialConfig, riskSettings }}
          onBack={goBack}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
}
