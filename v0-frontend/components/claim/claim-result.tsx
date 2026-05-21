import type { Deal, ClaimAllocation } from "@/lib/marketplace-data";
import { TIER_CONFIG } from "@/lib/dashboard-data";
import { ProtocolBadge } from "@/components/shared/protocol-badge";
import { Copy, Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClaimResultProps {
  allocation: ClaimAllocation;
  deal: Deal;
  walletAddress: string;
  onCopyEndpoint: () => void;
  copiedEndpoint: boolean;
}

export function ClaimResult({
  allocation,
  deal,
  walletAddress,
  onCopyEndpoint,
  copiedEndpoint,
}: ClaimResultProps) {
  const tierConfig = TIER_CONFIG[allocation.tier];

  return (
    <div className="space-y-4">
      {/* Success banner */}
      <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
        <p className="text-sm font-medium text-primary">
          Trial credits claimed successfully
        </p>
      </div>

      {/* Allocation details */}
      <div className="grid gap-3">
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
          <span className="text-xs text-muted-foreground">Credits Allocated</span>
          <span className="text-lg font-bold text-foreground font-mono">
            ${allocation.credits.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
          <span className="text-xs text-muted-foreground">Risk Tier</span>
          <span
            className="text-sm font-bold font-mono px-2 py-0.5 rounded"
            style={{ color: tierConfig.color, backgroundColor: tierConfig.bg }}
          >
            {allocation.tier}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
          <span className="text-xs text-muted-foreground">Risk Level</span>
          <span className="text-sm text-foreground capitalize">{allocation.riskLevel}</span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
          <span className="text-xs text-muted-foreground">Protocol</span>
          <ProtocolBadge protocol={allocation.protocol} />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
          <span className="text-xs text-muted-foreground">Expires</span>
          <span className="text-sm text-foreground font-mono">
            {new Date(allocation.expiresAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Endpoint */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-medium">Endpoint</label>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-muted/60 px-3 py-2 text-xs font-mono text-foreground truncate">
            {allocation.endpoint}
          </code>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onCopyEndpoint}>
            {copiedEndpoint ? (
              <Check className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-medium">Trial API Key</label>
        <code className="block rounded-lg bg-muted/60 px-3 py-2 text-xs font-mono text-foreground break-all">
          {allocation.apiKey}
        </code>
      </div>

      {/* Usage example */}
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-xs font-medium text-foreground mb-2">Quick Start</p>
        <pre className="text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre">
{`curl -X ${deal.endpoint.method} ${allocation.endpoint} \\
  -H "Authorization: Bearer ${allocation.apiKey}" \\
  -H "X-Wallet: ${walletAddress.slice(0, 10)}..." \\
  -H "Content-Type: application/json"`}
        </pre>
      </div>
    </div>
  );
}
