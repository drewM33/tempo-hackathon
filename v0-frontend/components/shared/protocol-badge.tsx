import type { ProtocolType } from "@/lib/marketplace-data";
import { cn } from "@/lib/utils";

interface ProtocolBadgeProps {
  protocol: ProtocolType;
  className?: string;
}

export function ProtocolBadge({ protocol, className }: ProtocolBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono font-semibold",
        protocol === "x402"
          ? "bg-primary/15 text-primary"
          : "bg-chart-2/15 text-chart-2",
        className
      )}
    >
      {protocol}
    </span>
  );
}
