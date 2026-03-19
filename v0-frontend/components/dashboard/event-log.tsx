"use client";

import { useEffect, useState, useRef } from "react";
import {
  generateEventLog,
  type EventLogEntry,
} from "@/lib/dashboard-data";
import { useAgents } from "@/lib/agent-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRightLeft,
  ShieldX,
  CheckCircle2,
  Radio,
  MessageSquareText,
} from "lucide-react";

const EVENT_ICONS: Record<EventLogEntry["type"], React.ReactNode> = {
  request: <Radio className="h-3.5 w-3.5 text-muted-foreground" />,
  grade_change: <ArrowRightLeft className="h-3.5 w-3.5 text-chart-2" />,
  block: <ShieldX className="h-3.5 w-3.5 text-destructive" />,
  sandbox_complete: <CheckCircle2 className="h-3.5 w-3.5 text-primary" />,
  directive: <MessageSquareText className="h-3.5 w-3.5 text-amber-400" />,
};

const EVENT_ROW_STYLES: Record<EventLogEntry["type"], string> = {
  request: "border-l-muted-foreground/20",
  grade_change: "border-l-chart-2",
  block: "border-l-destructive",
  sandbox_complete: "border-l-primary",
  directive: "border-l-amber-400",
};

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function EventLog() {
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { actionLog } = useAgents();
  const prevActionCountRef = useRef(0);

  useEffect(() => {
    setEvents(generateEventLog(25));
  }, []);

  useEffect(() => {
    if (actionLog.length <= prevActionCountRef.current) {
      prevActionCountRef.current = actionLog.length;
      return;
    }
    const newActions = actionLog.slice(prevActionCountRef.current);
    prevActionCountRef.current = actionLog.length;

    const newEntries: EventLogEntry[] = newActions.map((action, i) => ({
      id: `action-${Date.now()}-${i}`,
      timestamp: action.timestamp.toISOString(),
      type: action.type === "directive" ? "directive" as const : "grade_change" as const,
      wallet: action.agentAddress,
      description:
        action.type === "directive"
          ? `Directive sent: "${action.detail}"`
          : action.type === "downgrade"
            ? `Downgraded to ${action.newTier}${action.detail ? ` — ${action.detail}` : ""}`
            : action.type === "upgrade"
              ? `Upgraded to ${action.newTier}${action.detail ? ` — ${action.detail}` : ""}`
              : `${action.type}: ${action.detail ?? ""}`,
    }));

    setEvents((prev) => [...newEntries, ...prev].slice(0, 50));
  }, [actionLog]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prev) => {
        const newEvents = generateEventLog(1).map((e) => ({
          ...e,
          id: `evt-${Date.now()}`,
          timestamp: new Date().toISOString(),
        }));
        return [...newEvents, ...prev].slice(0, 50);
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-6 rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-mono font-medium text-foreground uppercase tracking-wider">
          Event Log
        </h2>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          {events.length} events
        </span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[80px_28px_140px_1fr] gap-2 px-4 py-2 border-b border-border text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <span>Time</span>
        <span></span>
        <span>Wallet</span>
        <span>Event</span>
      </div>

      <ScrollArea className="h-[220px]" ref={scrollRef}>
        <div className="flex flex-col">
          {events.map((event, i) => (
            <div
              key={event.id + i}
              className={`grid grid-cols-[80px_28px_140px_1fr] gap-2 px-4 py-2 border-l-2 border-b border-b-border/50 items-center transition-colors hover:bg-accent/30 ${EVENT_ROW_STYLES[event.type]} ${i < 2 ? 'event-slide-in' : ''}`}
            >
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {formatTime(event.timestamp)}
              </span>
              <span className="flex items-center justify-center">
                {EVENT_ICONS[event.type]}
              </span>
              <span className="font-mono text-xs text-foreground/80 truncate">
                {event.wallet}
              </span>
              <span
                className={`font-mono text-xs truncate ${
                  event.type === "block"
                    ? "text-destructive"
                    : event.type === "grade_change"
                      ? "text-chart-2"
                      : event.type === "sandbox_complete"
                        ? "text-primary"
                        : event.type === "directive"
                          ? "text-amber-400"
                          : "text-muted-foreground"
                }`}
              >
                {event.description}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
