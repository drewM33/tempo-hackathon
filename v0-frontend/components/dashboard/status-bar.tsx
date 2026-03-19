"use client";

import { Shield } from "lucide-react";

import { useAgents } from "@/lib/agent-context";

export function StatusBar() {
  const { valiron } = useAgents();

  return (
    <header className="flex items-center gap-3 px-6 py-3 border-b border-border">
      <Shield className="h-5 w-5 text-primary" />
      <h1 className="text-foreground font-mono text-lg font-semibold tracking-tight">
        Valiron MPP Firewall
      </h1>
      <span className="text-muted-foreground font-mono text-sm">
        {"— Live"}
      </span>
      <div className="flex items-center gap-2 ml-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
        </span>
        <span className="text-xs font-mono text-primary">CONNECTED</span>
      </div>
      {valiron.enabled ? (
        <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/10">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wide text-emerald-400">
            Valiron SDK
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {valiron.chain ?? "default"}
            {valiron.lastError
              ? ` · ${valiron.lastError}`
              : valiron.lastSyncAt
                ? " · synced"
                : ""}
          </span>
        </div>
      ) : (
        <span className="text-[10px] font-mono text-muted-foreground ml-2 uppercase tracking-wide">
          Trust overlay off (set VALIRON_ENABLED=true)
        </span>
      )}
      <div className="ml-auto text-xs font-mono text-muted-foreground">
        {new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </div>
    </header>
  );
}
