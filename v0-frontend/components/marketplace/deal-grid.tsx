"use client";

import { useState, useMemo } from "react";
import type { Deal, ProtocolType } from "@/lib/marketplace-data";
import { filterDeals } from "@/lib/marketplace-data";
import { DealCard } from "./deal-card";
import { cn } from "@/lib/utils";

type SortOption = "popular" | "recent" | "value";

interface DealGridProps {
  deals: Deal[];
  category: string;
  searchQuery: string;
}

export function DealGrid({ deals, category, searchQuery }: DealGridProps) {
  const [sort, setSort] = useState<SortOption>("popular");
  const [protocolFilter, setProtocolFilter] = useState<ProtocolType | null>(null);

  const filtered = useMemo(
    () =>
      filterDeals(deals, {
        category,
        search: searchQuery,
        sort,
        protocol: protocolFilter ?? undefined,
      }),
    [deals, category, searchQuery, sort, protocolFilter]
  );

  const sortTabs: { key: SortOption; label: string }[] = [
    { key: "popular", label: "Most Popular" },
    { key: "recent", label: "Recently Added" },
    { key: "value", label: "Highest Value" },
  ];

  return (
    <div className="flex-1 min-w-0">
      {/* Controls bar */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-1">
          {sortTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSort(tab.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                sort === tab.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Protocol filter */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setProtocolFilter(null)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-mono font-semibold transition-colors",
                !protocolFilter
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground bg-muted/40"
              )}
            >
              All
            </button>
            <button
              onClick={() => setProtocolFilter(protocolFilter === "x402" ? null : "x402")}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-mono font-semibold transition-colors",
                protocolFilter === "x402"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground bg-muted/40"
              )}
            >
              x402
            </button>
            <button
              onClick={() => setProtocolFilter(protocolFilter === "MPP" ? null : "MPP")}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-mono font-semibold transition-colors",
                protocolFilter === "MPP"
                  ? "bg-chart-2/15 text-chart-2"
                  : "text-muted-foreground hover:text-foreground bg-muted/40"
              )}
            >
              MPP
            </button>
          </div>

          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {filtered.length} {filtered.length === 1 ? "deal" : "deals"}
          </span>
        </div>
      </div>

      {/* Section title */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          {category === "All Deals" ? "All Deals" : category}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {category === "All Deals"
            ? "Browse all free trial credit deals available for AI agents."
            : `${category} deals for AI agents.`}
        </p>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">No deals found matching your criteria.</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
        </div>
      )}
    </div>
  );
}
