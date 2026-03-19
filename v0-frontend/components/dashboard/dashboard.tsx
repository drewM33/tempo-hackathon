"use client";

import { AgentProvider } from "@/lib/agent-context";
import { StatusBar } from "./status-bar";
import { KpiCards } from "./kpi-cards";
import { PricingChart } from "./pricing-chart";
import { AgentWalletGrid } from "./agent-wallet-grid";
import { EventLog } from "./event-log";
import { ChatWidget } from "./chat-widget";

export function Dashboard() {
  return (
    <AgentProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <StatusBar />
        <main className="flex flex-col gap-4 py-4 overflow-auto flex-1">
          <KpiCards />
          <PricingChart />
          <AgentWalletGrid />
          <EventLog />
          <div className="pb-2" />
        </main>
        <ChatWidget />
      </div>
    </AgentProvider>
  );
}
