"use client";

import { DEAL_CATEGORIES, type DealCategory } from "@/lib/marketplace-data";
import { cn } from "@/lib/utils";
import {
  Cpu,
  Database,
  MessageSquare,
  Server,
  Wrench,
  BarChart3,
  DollarSign,
  Shield,
  HardDrive,
  LayoutGrid,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CATEGORY_ICONS: Record<DealCategory, LucideIcon> = {
  "All Deals": LayoutGrid,
  "AI & ML": Cpu,
  "Data": Database,
  "Communication": MessageSquare,
  "Infrastructure": Server,
  "Developer Tools": Wrench,
  "Analytics": BarChart3,
  "Finance": DollarSign,
  "Security": Shield,
  "Storage": HardDrive,
};

interface CategorySidebarProps {
  selected: string;
  onSelect: (category: string) => void;
  counts: Record<string, number>;
}

export function CategorySidebar({ selected, onSelect, counts }: CategorySidebarProps) {
  return (
    <nav className="w-full space-y-1" aria-label="Deal categories">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3">
        Categories
      </h2>
      {DEAL_CATEGORIES.map((cat) => {
        const Icon = CATEGORY_ICONS[cat];
        const isSelected = selected === cat;
        const count = cat === "All Deals"
          ? Object.values(counts).reduce((a, b) => a + b, 0)
          : (counts[cat] ?? 0);

        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              isSelected
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{cat}</span>
            <span
              className={cn(
                "ml-auto text-xs font-mono tabular-nums",
                isSelected ? "text-primary" : "text-muted-foreground/60"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
