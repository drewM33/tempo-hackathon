"use client";

import { useEffect, useState } from "react";
import {
  generateApiEndpoints,
  type ApiEndpoint,
} from "@/lib/dashboard-data";
import { useAgents } from "@/lib/agent-context";
import { AgentWalletCard } from "./agent-wallet-card";
import { ApiEndpointCard } from "./api-endpoints-table";
import { Wallet, Globe } from "lucide-react";

type View = "wallets" | "endpoints";

export function AgentWalletGrid() {
  const { agents } = useAgents();
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [view, setView] = useState<View>("wallets");

  useEffect(() => {
    setEndpoints(generateApiEndpoints());
  }, []);

  // Live-update endpoint data
  useEffect(() => {
    const interval = setInterval(() => {
      setEndpoints((prev) =>
        prev.map((ep) => ({
          ...ep,
          hits: ep.hits + Math.floor(Math.random() * 80),
          avgLatency: Math.max(
            8,
            ep.avgLatency + Math.floor((Math.random() - 0.5) * 12)
          ),
          p99Latency: Math.max(
            ep.avgLatency + 30,
            ep.p99Latency + Math.floor((Math.random() - 0.5) * 20)
          ),
          errorRate: Math.max(
            0,
            parseFloat(
              (ep.errorRate + (Math.random() - 0.52) * 0.4).toFixed(2)
            )
          ),
          rps: Math.max(
            5,
            ep.rps + Math.floor((Math.random() - 0.5) * 30)
          ),
          sparklineData: [
            ...ep.sparklineData.slice(1),
            ep.sparklineData[ep.sparklineData.length - 1] +
              (Math.random() - 0.5) * 20,
          ],
        }))
      );
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-6">
      {/* Header with toggle */}
      <div className="flex items-center gap-1 mb-3">
        <button
          onClick={() => setView("wallets")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
          style={{
            color: view === "wallets" ? "#22c55e" : "#6b7280",
            backgroundColor:
              view === "wallets" ? "#22c55e12" : "transparent",
            border:
              view === "wallets"
                ? "1px solid #22c55e30"
                : "1px solid transparent",
          }}
        >
          <Wallet className="h-3.5 w-3.5" />
          Active Agent Wallets
        </button>
        <button
          onClick={() => setView("endpoints")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
          style={{
            color: view === "endpoints" ? "#3b82f6" : "#6b7280",
            backgroundColor:
              view === "endpoints" ? "#3b82f612" : "transparent",
            border:
              view === "endpoints"
                ? "1px solid #3b82f630"
                : "1px solid transparent",
          }}
        >
          <Globe className="h-3.5 w-3.5" />
          API Endpoints
        </button>
      </div>

      {/* Content */}
      {view === "wallets" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map((agent) => (
            <AgentWalletCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {endpoints.map((endpoint) => (
            <ApiEndpointCard key={endpoint.id} endpoint={endpoint} />
          ))}
        </div>
      )}
    </div>
  );
}
