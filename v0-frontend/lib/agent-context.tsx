"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import {
  generateAgentWallets,
  TIER_CONFIG,
  normalizeWalletForApi,
  type AgentWallet,
  type CreditTier,
} from "./dashboard-data";
import type { ValironTrustPatch } from "./valiron-trust";

const TIER_ORDER: CreditTier[] = [
  "AAA", "AA", "A", "BAA", "BA", "B", "CAA", "CA", "C", "BLOCKED",
];

export interface AgentAction {
  type: "downgrade" | "upgrade" | "directive" | "call";
  agentAddress: string;
  detail?: string;
  newTier?: CreditTier;
  timestamp: Date;
}

export interface ValironUiState {
  enabled: boolean;
  chain?: string;
  refreshMs: number;
  lastSyncAt: string | null;
  lastError: string | null;
}

interface AgentContextValue {
  agents: AgentWallet[];
  setAgents: React.Dispatch<React.SetStateAction<AgentWallet[]>>;
  actionLog: AgentAction[];
  valiron: ValironUiState;
  downgradeAgent: (address: string, reason?: string) => string;
  upgradeAgent: (address: string, reason?: string) => string;
  setAgentTier: (address: string, tier: CreditTier, reason?: string) => string;
  sendDirective: (address: string, directive: string) => string;
  findAgent: (query: string) => AgentWallet | undefined;
}

const AgentContext = createContext<AgentContextValue | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<AgentWallet[]>([]);
  const [actionLog, setActionLog] = useState<AgentAction[]>([]);
  const [valiron, setValiron] = useState<ValironUiState>({
    enabled: false,
    refreshMs: 90_000,
    lastSyncAt: null,
    lastError: null,
  });
  const agentsRef = useRef<AgentWallet[]>([]);
  agentsRef.current = agents;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/valiron/bootstrap");
        const data = (await res.json()) as {
          valironEnabled?: boolean;
          seedAddresses?: string[];
          refreshMs?: number;
          chain?: string;
        };
        if (cancelled) return;

        const seeds = Array.isArray(data.seedAddresses)
          ? data.seedAddresses
          : [];
        const refreshMs =
          typeof data.refreshMs === "number" && data.refreshMs >= 5_000
            ? data.refreshMs
            : 90_000;

        setValiron((v) => ({
          ...v,
          enabled: Boolean(data.valironEnabled),
          chain: typeof data.chain === "string" ? data.chain : v.chain,
          refreshMs,
        }));

        const useSeeds =
          seeds.length > 0 ? seeds.slice(0, 9) : null;
        setAgents(generateAgentWallets(9, useSeeds));
      } catch {
        if (!cancelled) setAgents(generateAgentWallets(9));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!valiron.enabled) return;

    const sync = async () => {
      const list = agentsRef.current;
      const addrs = list
        .map((a) => normalizeWalletForApi(a.address))
        .filter((x): x is string => Boolean(x));
      if (addrs.length === 0) return;

      try {
        const res = await fetch("/api/valiron/trust", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addresses: addrs }),
        });
        const data = (await res.json()) as {
          enabled?: boolean;
          results?: Array<{
            address: string;
            ok: boolean;
            patch?: ValironTrustPatch;
          }>;
        };

        if (!data.enabled || !Array.isArray(data.results)) {
          setValiron((v) => ({ ...v, lastError: "trust_unavailable" }));
          return;
        }

        const patches = new Map<string, ValironTrustPatch>();
        for (const row of data.results) {
          if (row.ok && row.patch) {
            patches.set(row.address.toLowerCase(), row.patch);
          }
        }

        setAgents((prev) =>
          prev.map((agent) => {
            const key = normalizeWalletForApi(agent.address);
            if (!key) return agent;
            const patch = patches.get(key);
            if (!patch) return agent;
            const tierChanged = patch.tier !== agent.tier;
            return {
              ...agent,
              tier: patch.tier,
              riskLevel: patch.riskLevel,
              priceMultiplier: patch.priceMultiplier,
              usdPrice: patch.usdPrice,
              valiron: patch.valiron,
              gradeHistory: tierChanged
                ? [...agent.gradeHistory, patch.tier]
                : agent.gradeHistory,
            };
          })
        );

        setValiron((v) => ({
          ...v,
          lastSyncAt: new Date().toISOString(),
          lastError: null,
        }));
      } catch {
        setValiron((v) => ({ ...v, lastError: "network" }));
      }
    };

    sync();
    const id = setInterval(sync, valiron.refreshMs);
    return () => clearInterval(id);
  }, [valiron.enabled, valiron.refreshMs]);

  // Live-update wallet data
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          const isBlocked = agent.tier === "C" || agent.tier === "BLOCKED";
          const cerDelta = (Math.random() - 0.45) * 0.03;
          const newCer = Math.max(
            0,
            parseFloat(((agent.cer ?? 0) + cerDelta).toFixed(2))
          );
          const newInfra = Math.max(
            0.001,
            (agent.avgInfraCost ?? 0.01) + (Math.random() - 0.5) * 0.001
          );
          return {
            ...agent,
            requestCount: isBlocked
              ? agent.requestCount
              : agent.requestCount + Math.floor(Math.random() * 20),
            sparklineData: [
              ...agent.sparklineData.slice(1),
              agent.sparklineData[agent.sparklineData.length - 1] +
                (Math.random() - 0.5) * 15,
            ],
            cer: isBlocked ? 0 : newCer,
            cerTrend: (cerDelta > 0
              ? "up"
              : cerDelta < -0.01
                ? "down"
                : "neutral") as "up" | "down" | "neutral",
            cerTrendValue: `${cerDelta > 0 ? "+" : ""}${(cerDelta * 100).toFixed(1)}%`,
            avgInfraCost: parseFloat(newInfra.toFixed(4)),
            avgValuePerCall: parseFloat((newInfra * newCer).toFixed(4)),
          };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const findAgent = useCallback(
    (query: string): AgentWallet | undefined => {
      const q = query.toLowerCase().trim();
      return agents.find(
        (a) =>
          a.address.toLowerCase().includes(q) ||
          a.id.toLowerCase() === q
      );
    },
    [agents]
  );

  const downgradeAgent = useCallback(
    (address: string, reason?: string): string => {
      const agent = agents.find((a) =>
        a.address.toLowerCase().includes(address.toLowerCase())
      );
      if (!agent) return `Agent "${address}" not found. Use a partial wallet address (e.g. "0x3ef2").`;

      const currentIdx = TIER_ORDER.indexOf(agent.tier);
      if (currentIdx >= TIER_ORDER.length - 1) {
        return `Agent ${agent.address} is already at the lowest tier (${agent.tier}). Cannot downgrade further.`;
      }

      const newTier = TIER_ORDER[currentIdx + 1];
      const newConfig = TIER_CONFIG[newTier];
      const isNowBlocked = newTier === "C" || newTier === "BLOCKED";

      setAgents((prev) =>
        prev.map((a) =>
          a.id === agent.id
            ? {
                ...a,
                tier: newTier,
                priceMultiplier: newConfig.multiplier,
                usdPrice: newConfig.usd,
                riskLevel: (
                  newTier === "AAA" || newTier === "AA" || newTier === "A"
                    ? "low"
                    : newTier === "BAA" || newTier === "BA"
                      ? "medium"
                      : newTier === "B" || newTier === "CAA"
                        ? "high"
                        : "critical"
                ) as AgentWallet["riskLevel"],
                gradeHistory: [...a.gradeHistory, newTier],
                cer: isNowBlocked ? 0 : a.cer * 0.85,
              }
            : a
        )
      );

      setActionLog((prev) => [
        ...prev,
        {
          type: "downgrade",
          agentAddress: agent.address,
          detail: reason || "Manual override",
          newTier,
          timestamp: new Date(),
        },
      ]);

      return `Downgraded ${agent.address}\n${agent.tier} -> ${newTier}\n\nNew multiplier: ${newConfig.multiplier}x ($${newConfig.usd.toFixed(4)}/req)\n${isNowBlocked ? "Agent is now BLOCKED from the system." : `CER reduced by ~15% as penalty.`}${reason ? `\nReason: ${reason}` : ""}`;
    },
    [agents]
  );

  const upgradeAgent = useCallback(
    (address: string, reason?: string): string => {
      const agent = agents.find((a) =>
        a.address.toLowerCase().includes(address.toLowerCase())
      );
      if (!agent) return `Agent "${address}" not found. Use a partial wallet address (e.g. "0x3ef2").`;

      const currentIdx = TIER_ORDER.indexOf(agent.tier);
      if (currentIdx <= 0) {
        return `Agent ${agent.address} is already at the highest tier (${agent.tier}). Cannot upgrade further.`;
      }

      const newTier = TIER_ORDER[currentIdx - 1];
      const newConfig = TIER_CONFIG[newTier];

      setAgents((prev) =>
        prev.map((a) =>
          a.id === agent.id
            ? {
                ...a,
                tier: newTier,
                priceMultiplier: newConfig.multiplier,
                usdPrice: newConfig.usd,
                riskLevel: (
                  newTier === "AAA" || newTier === "AA" || newTier === "A"
                    ? "low"
                    : newTier === "BAA" || newTier === "BA"
                      ? "medium"
                      : newTier === "B" || newTier === "CAA"
                        ? "high"
                        : "critical"
                ) as AgentWallet["riskLevel"],
                gradeHistory: [...a.gradeHistory, newTier],
                cer: Math.min(3, a.cer * 1.1),
              }
            : a
        )
      );

      setActionLog((prev) => [
        ...prev,
        {
          type: "upgrade",
          agentAddress: agent.address,
          detail: reason || "Manual override",
          newTier,
          timestamp: new Date(),
        },
      ]);

      return `Upgraded ${agent.address}\n${agent.tier} -> ${newTier}\n\nNew multiplier: ${newConfig.multiplier}x ($${newConfig.usd.toFixed(4)}/req)\nCER boosted by ~10%.${reason ? `\nReason: ${reason}` : ""}`;
    },
    [agents]
  );

  const setAgentTier = useCallback(
    (address: string, tier: CreditTier, reason?: string): string => {
      if (!TIER_ORDER.includes(tier)) {
        return `Invalid tier "${tier}". Valid tiers: ${TIER_ORDER.join(", ")}`;
      }

      const agent = agents.find((a) =>
        a.address.toLowerCase().includes(address.toLowerCase())
      );
      if (!agent) return `Agent "${address}" not found.`;

      const newConfig = TIER_CONFIG[tier];
      const isNowBlocked = tier === "C" || tier === "BLOCKED";

      setAgents((prev) =>
        prev.map((a) =>
          a.id === agent.id
            ? {
                ...a,
                tier,
                priceMultiplier: newConfig.multiplier,
                usdPrice: newConfig.usd,
                riskLevel: (
                  tier === "AAA" || tier === "AA" || tier === "A"
                    ? "low"
                    : tier === "BAA" || tier === "BA"
                      ? "medium"
                      : tier === "B" || tier === "CAA"
                        ? "high"
                        : "critical"
                ) as AgentWallet["riskLevel"],
                gradeHistory: [...a.gradeHistory, tier],
                cer: isNowBlocked ? 0 : a.cer,
              }
            : a
        )
      );

      setActionLog((prev) => [
        ...prev,
        {
          type: "downgrade",
          agentAddress: agent.address,
          detail: reason || `Manual override to ${tier}`,
          newTier: tier,
          timestamp: new Date(),
        },
      ]);

      return `Set ${agent.address} to tier ${tier}\n\nPrevious: ${agent.tier} -> New: ${tier}\nMultiplier: ${newConfig.multiplier}x ($${newConfig.usd.toFixed(4)}/req)${isNowBlocked ? "\nAgent is now BLOCKED." : ""}${reason ? `\nReason: ${reason}` : ""}`;
    },
    [agents]
  );

  const sendDirective = useCallback(
    (address: string, directive: string): string => {
      const agent = agents.find((a) =>
        a.address.toLowerCase().includes(address.toLowerCase())
      );
      if (!agent) return `Agent "${address}" not found.`;

      setActionLog((prev) => [
        ...prev,
        {
          type: "directive",
          agentAddress: agent.address,
          detail: directive,
          timestamp: new Date(),
        },
      ]);

      // Simulate the directive effect -- slightly improve agent metrics
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agent.id
            ? {
                ...a,
                cer: Math.min(3, parseFloat((a.cer + 0.05).toFixed(2))),
                cerTrend: "up" as const,
                cerTrendValue: "+1.2%",
              }
            : a
        )
      );

      return `Directive sent to ${agent.address} (${agent.tier}):\n"${directive}"\n\nStatus: Acknowledged\nExpected impact: CER +0.05 adjustment applied.\nThe agent will recalibrate on the next evaluation cycle.`;
    },
    [agents]
  );

  return (
    <AgentContext.Provider
      value={{
        agents,
        setAgents,
        actionLog,
        valiron,
        downgradeAgent,
        upgradeAgent,
        setAgentTier,
        sendDirective,
        findAgent,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgents() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgents must be used within AgentProvider");
  return ctx;
}
