"use client";

import { useState } from "react";
import type { Deal } from "@/lib/marketplace-data";
import type { ClaimAllocation } from "@/lib/marketplace-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Wallet, ShieldCheck, Loader2, Copy, Check, ArrowRight, Terminal } from "lucide-react";
import { ClaimResult } from "./claim-result";

interface AgentClaimFlowProps {
  deal: Deal;
}

type ClaimStep = "wallet" | "scoring" | "result";

export function AgentClaimFlow({ deal }: AgentClaimFlowProps) {
  const [step, setStep] = useState<ClaimStep>("wallet");
  const [walletAddress, setWalletAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allocation, setAllocation] = useState<ClaimAllocation | null>(null);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  const isValidWallet = /^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim());

  async function handleClaim() {
    if (!isValidWallet) return;

    setIsLoading(true);
    setError(null);
    setStep("scoring");

    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: deal.id,
          walletAddress: walletAddress.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Claim failed. Please try again.");
        setStep("wallet");
        return;
      }

      setAllocation(data.allocation);
      setStep("result");
    } catch {
      setError("Network error. Please try again.");
      setStep("wallet");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopyEndpoint() {
    if (!allocation) return;
    navigator.clipboard.writeText(allocation.endpoint);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-base font-semibold text-foreground mb-1">Claim Trial Credits</h3>
      <p className="text-sm text-muted-foreground mb-6">
        {deal.riskConfig.useValironScoring
          ? "Credits allocated based on your Valiron risk score."
          : "Flat credit allocation for all agents."}
      </p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {(["wallet", "scoring", "result"] as ClaimStep[]).map((s, i) => {
          const labels = ["Wallet", "Scoring", "Credits"];
          const isCurrent = s === step;
          const isDone =
            (s === "wallet" && (step === "scoring" || step === "result")) ||
            (s === "scoring" && step === "result");

          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={cn(
                    "h-px w-6",
                    isDone || isCurrent ? "bg-primary" : "bg-border"
                  )}
                />
              )}
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                  isCurrent
                    ? "bg-primary/15 text-primary"
                    : isDone
                      ? "bg-primary/10 text-primary/70"
                      : "bg-muted text-muted-foreground"
                )}
              >
                <span className="font-mono">{i + 1}</span>
                <span>{labels[i]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step: Wallet Input */}
      {step === "wallet" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wallet" className="text-sm font-medium text-foreground">
              Agent Wallet Address
            </Label>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="wallet"
                type="text"
                placeholder="0x742d35Cc6634C0532925a3b..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="pl-9 font-mono text-sm"
              />
            </div>
            {walletAddress && !isValidWallet && (
              <p className="text-xs text-destructive">
                Enter a valid EVM wallet address (0x + 40 hex characters)
              </p>
            )}
          </div>

          {/* API-first hint */}
          <div className="rounded-lg bg-muted/50 border border-border px-3 py-2.5">
            <div className="flex items-start gap-2">
              <Terminal className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground mb-1">Agent-First API</p>
                <code className="text-xs font-mono text-muted-foreground break-all">
                  POST /api/claim {"{"}&quot;dealId&quot;: &quot;{deal.id}&quot;, &quot;walletAddress&quot;: &quot;0x...&quot;{"}"}
                </code>
              </div>
            </div>
          </div>

          <Button
            onClick={handleClaim}
            disabled={!isValidWallet}
            className="w-full"
            size="lg"
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Check Score {"&"} Claim
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step: Scoring */}
      {step === "scoring" && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Checking Valiron risk score...
          </p>
        </div>
      )}

      {/* Step: Result */}
      {step === "result" && allocation && (
        <ClaimResult
          allocation={allocation}
          deal={deal}
          walletAddress={walletAddress}
          onCopyEndpoint={handleCopyEndpoint}
          copiedEndpoint={copiedEndpoint}
        />
      )}
    </div>
  );
}
