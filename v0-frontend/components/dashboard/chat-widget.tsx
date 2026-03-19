"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Minimize2,
  ChevronDown,
  Terminal,
} from "lucide-react";
import { useAgents } from "@/lib/agent-context";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isAction?: boolean;
}

const SUGGESTED_PROMPTS = [
  "List agents",
  "What is CER?",
  "Show low CER agents",
  "Help",
];

const HELP_TEXT = `Available commands:

QUERY:
  list agents -- Show all agents with tiers & CER
  show low cer -- Agents with CER below 0.6x
  show blocked -- List blocked agents
  what is cer? -- Explain Cost-Efficiency Ratio

ACTIONS:
  downgrade <address> [reason]
    Drops agent one tier. Use when a power player is dragging your CER.
    Example: downgrade 0x3ef2 excessive infra costs

  upgrade <address> [reason]
    Promotes agent one tier.
    Example: upgrade 0xc4a1 strong performance

  set tier <address> <TIER> [reason]
    Set agent to a specific tier (AAA, AA, A, BAA, BA, B, CAA, CA, C).
    Example: set tier 0x81db B risk mitigation

  tell <address> <directive>
    Send an improvement directive to the agent.
    Example: tell 0x3ef2 reduce batch sizes to lower infra cost

  trust <address>
    Live Valiron operator lookup for a wallet (full 0x + 40 hex, or partial match to a fleet row).
    Example: trust 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0

Use partial wallet addresses (e.g. "0x3ef2" matches a row on the dashboard).`;

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
          content:
            'Valiron MPP Firewall Assistant online.\n\nI can query agents, run live Valiron trust lookups ("trust 0x…"), downgrade power players hurting your CER, send improvement directives, and more.\n\nType "help" for a full command list.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { agents, downgradeAgent, upgradeAgent, setAgentTier, sendDirective } =
    useAgents();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const processCommand = useCallback(
    (text: string): { content: string; isAction: boolean } => {
      const normalized = text.toLowerCase().trim();

      // Help
      if (normalized === "help" || normalized === "commands") {
        return { content: HELP_TEXT, isAction: false };
      }

      // List agents
      if (
        normalized === "list agents" ||
        normalized === "show agents" ||
        normalized === "agents"
      ) {
        if (agents.length === 0)
          return { content: "No agents loaded yet.", isAction: false };
        const lines = agents.map(
          (a) =>
            `${a.address}  ${a.tier.padEnd(7)} CER ${(a.cer ?? 0).toFixed(1)}x  ${a.requestCount.toLocaleString()} reqs`
        );
        return {
          content: `Active Agents (${agents.length}):\n\n${lines.join("\n")}`,
          isAction: false,
        };
      }

      // Show low CER
      if (
        normalized.includes("low cer") ||
        normalized.includes("bad cer") ||
        normalized.includes("worst cer")
      ) {
        const lowCer = agents
          .filter((a) => (a.cer ?? 0) < 0.6 && a.tier !== "C" && a.tier !== "BLOCKED")
          .sort((a, b) => (a.cer ?? 0) - (b.cer ?? 0));
        if (lowCer.length === 0)
          return {
            content:
              "No agents with CER below 0.6x found. Fleet is operating efficiently.",
            isAction: false,
          };
        const lines = lowCer.map(
          (a) =>
            `${a.address}  ${a.tier}  CER ${(a.cer ?? 0).toFixed(1)}x  $${(a.avgInfraCost ?? 0).toFixed(4)}/call\n  -> Consider: downgrade ${a.address.slice(0, 6)}`
        );
        return {
          content: `Agents with sub-0.6x CER (${lowCer.length}):\n\n${lines.join("\n\n")}\n\nThese agents are consuming more infra cost than they generate in value. Downgrading increases their price multiplier, which can improve fleet-wide CER.`,
          isAction: false,
        };
      }

      // Show blocked
      if (normalized.includes("blocked")) {
        const blocked = agents.filter(
          (a) => a.tier === "C" || a.tier === "BLOCKED"
        );
        if (blocked.length === 0)
          return { content: "No blocked agents.", isAction: false };
        const lines = blocked.map(
          (a) =>
            `${a.address}  ${a.tier}  ${a.requestCount.toLocaleString()} total reqs`
        );
        return {
          content: `Blocked Agents (${blocked.length}):\n\n${lines.join("\n")}\n\nBlocked agents are denied all API access. Use "upgrade <address>" to reinstate.`,
          isAction: false,
        };
      }

      // What is CER
      if (normalized.includes("what is cer") || normalized === "cer") {
        return {
          content:
            'CER (Cost-Efficiency Ratio) measures the value generated per infrastructure dollar spent.\n\nFormula: CER = Avg Value Per Call / Avg Infra Cost Per Call\n\n- CER > 1.0x = Profitable (green) -- agent generates more value than it costs\n- CER 0.6-1.0x = Break-even (amber) -- marginal efficiency\n- CER < 0.6x = Loss-making (red) -- costing more than it produces\n\nWhen a high-traffic agent has a low CER, it drags down the fleet average. Downgrading such agents increases their price multiplier, discouraging heavy usage and improving overall CER.\n\nTry: "show low cer" to find inefficient agents.',
          isAction: false,
        };
      }

      // Downgrade command
      const downgradeMatch = normalized.match(
        /^downgrade\s+(0x[\da-f]+\S*)\s*(.*)?$/i
      );
      if (downgradeMatch) {
        const addr = downgradeMatch[1];
        const reason = downgradeMatch[2]?.trim() || undefined;
        const result = downgradeAgent(addr, reason);
        return { content: result, isAction: true };
      }

      // Upgrade command
      const upgradeMatch = normalized.match(
        /^upgrade\s+(0x[\da-f]+\S*)\s*(.*)?$/i
      );
      if (upgradeMatch) {
        const addr = upgradeMatch[1];
        const reason = upgradeMatch[2]?.trim() || undefined;
        const result = upgradeAgent(addr, reason);
        return { content: result, isAction: true };
      }

      // Set tier command
      const setTierMatch = normalized.match(
        /^set\s+tier\s+(0x[\da-f]+\S*)\s+(aaa|aa|a|baa|ba|b|caa|ca|c|blocked)\s*(.*)?$/i
      );
      if (setTierMatch) {
        const addr = setTierMatch[1];
        const tier = setTierMatch[2].toUpperCase();
        const reason = setTierMatch[3]?.trim() || undefined;
        const result = setAgentTier(addr, tier as any, reason);
        return { content: result, isAction: true };
      }

      // Tell / directive command
      const tellMatch = normalized.match(
        /^tell\s+(0x[\da-f]+\S*)\s+(.+)$/i
      );
      if (tellMatch) {
        const addr = tellMatch[1];
        const directive = text.match(/^tell\s+\S+\s+(.+)$/i)?.[1] || tellMatch[2];
        const result = sendDirective(addr, directive);
        return { content: result, isAction: true };
      }

      // Pricing tiers
      if (
        normalized.includes("pricing") ||
        normalized.includes("tiers") ||
        normalized.includes("explain pricing")
      ) {
        return {
          content:
            "Behavioral Rating Pricing Tiers:\n\nAAA  0.5x  $0.0050/req -- Highest trust\nAA   0.65x $0.0065/req -- Very reliable\nA    0.8x  $0.0080/req -- Good standing\nBAA  1.0x  $0.0100/req -- Baseline\nBA   1.3x  $0.0130/req -- Below average\nB    1.6x  $0.0160/req -- Risky\nCAA  2.0x  $0.0200/req -- High risk\nCA   3.0x  $0.0300/req -- Very high risk\nC    BLOCKED            -- Access denied\n\nDowngrading an agent moves it down one tier, increasing its cost multiplier and discouraging heavy usage.",
          isAction: false,
        };
      }

      // Fallback
      const agentSummary = agents.length
        ? `\nFleet: ${agents.length} agents | ${agents.filter((a) => a.tier !== "C" && a.tier !== "BLOCKED").length} active | ${agents.filter((a) => a.tier === "C" || a.tier === "BLOCKED").length} blocked`
        : "";

      return {
        content: `Command not recognized: "${text}"\n${agentSummary}\n\nType "help" for available commands, or try:\n- "list agents" to see all agents\n- "downgrade 0x..." to demote an agent\n- "tell 0x... <directive>" to send instructions`,
        isAction: false,
      };
    },
    [agents, downgradeAgent, upgradeAgent, setAgentTier, sendDirective]
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isTyping) return;

      const trustMatch = text.match(/^trust\s+(0x[0-9a-fA-F]+)/i);
      if (trustMatch) {
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          role: "user",
          content: text.trim(),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        const raw = trustMatch[1];
        (async () => {
          let lookupAddr = raw;
          if (lookupAddr.length !== 42) {
            const hit = agents.find((a) =>
              a.address.toLowerCase().includes(lookupAddr.toLowerCase())
            );
            if (hit) lookupAddr = hit.address;
          }

          try {
            const res = await fetch("/api/valiron/trust", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ addresses: [lookupAddr] }),
            });
            const data = (await res.json()) as {
              enabled?: boolean;
              results?: Array<{
                ok: boolean;
                error?: string;
                code?: string;
                patch?: {
                  tier: string;
                  riskLevel: string;
                  valiron?: { finalRoute?: string; decision?: string };
                };
              }>;
            };

            let content: string;
            if (!data.enabled) {
              content =
                'Valiron is disabled on this deployment. Set VALIRON_ENABLED=true in .env.local and restart `pnpm dev`.';
            } else {
              const row = data.results?.[0];
              if (!row) {
                content = "No result returned from Valiron.";
              } else if (!row.ok) {
                content = `Trust lookup failed:\n${row.error ?? "unknown"}${row.code ? `\n(${row.code})` : ""}`;
              } else if (row.patch) {
                const p = row.patch;
                content = `Valiron trust — ${lookupAddr}\n\nRoute: ${p.valiron?.finalRoute ?? "—"}\nTier: ${p.tier}\nRisk: ${p.riskLevel}\n\n${p.valiron?.decision ?? ""}`;
              } else {
                content = "Unexpected trust response.";
              }
            }

            setMessages((prev) => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                role: "assistant",
                content,
                timestamp: new Date(),
              },
            ]);
          } catch {
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                role: "assistant",
                content: "Could not reach /api/valiron/trust (network error).",
                timestamp: new Date(),
              },
            ]);
          } finally {
            setIsTyping(false);
          }
        })();
        return;
      }

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      const delay = 400 + Math.random() * 800;
      setTimeout(() => {
        const { content, isAction } = processCommand(text);
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content,
          timestamp: new Date(),
          isAction,
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
      }, delay);
    },
    [isTyping, processCommand, agents]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

  // Floating bubble when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-110 hover:shadow-primary/40 active:scale-95"
        aria-label="Open chat"
      >
        <Terminal className="h-6 w-6" />
        <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20" />
      </button>
    );
  }

  // Minimized bar
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 shadow-xl shadow-black/40 cursor-pointer transition-all hover:bg-accent/50"
        onClick={() => setIsMinimized(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setIsMinimized(false)}
      >
        <Bot className="h-4 w-4 text-primary" />
        <span className="font-mono text-xs text-foreground">
          MPP Assistant
        </span>
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
            setIsMinimized(false);
          }}
          className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close chat"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // Full chat panel
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex w-[420px] flex-col rounded-xl border border-border bg-card shadow-2xl shadow-black/50 overflow-hidden"
      style={{ maxHeight: "min(620px, calc(100vh - 48px))" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Terminal className="h-5 w-5 text-primary" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary border border-background animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-mono font-medium text-foreground">
              MPP Assistant
            </h3>
            <span className="text-[10px] font-mono text-primary uppercase tracking-wider">
              Commands Active
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Minimize chat"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setIsMinimized(false);
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
        style={{ minHeight: 300, maxHeight: 440 }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                msg.role === "assistant"
                  ? msg.isAction
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-primary/15 text-primary"
                  : "bg-accent text-foreground"
              }`}
            >
              {msg.role === "assistant" ? (
                msg.isAction ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <Bot className="h-3.5 w-3.5" />
                )
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
            </div>
            <div
              className={`flex max-w-[80%] flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`rounded-lg px-3 py-2 text-xs leading-relaxed font-mono whitespace-pre-wrap ${
                  msg.role === "assistant"
                    ? msg.isAction
                      ? "bg-amber-500/10 text-amber-100 border border-amber-500/20"
                      : "bg-secondary text-secondary-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {msg.content}
              </div>
              <span className="text-[10px] font-mono text-muted-foreground px-1">
                {formatTime(msg.timestamp)}
                {msg.isAction && (
                  <span className="ml-1.5 text-amber-400">ACTION</span>
                )}
              </span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-lg bg-secondary px-4 py-3 flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Suggested prompts */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-[11px] font-mono text-muted-foreground transition-colors hover:bg-accent hover:text-foreground hover:border-primary/40"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border px-3 py-2.5 bg-background"
      >
        <span className="text-primary font-mono text-xs select-none">
          {">"}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="downgrade 0x... | tell 0x... | help"
          disabled={isTyping}
          className="flex-1 bg-transparent text-xs font-mono text-foreground placeholder:text-muted-foreground/60 outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:bg-primary/80 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
