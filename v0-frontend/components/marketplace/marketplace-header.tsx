"use client";

import Link from "next/link";
import { Search, Plus, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/shared/theme-toggle";

interface MarketplaceHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function MarketplaceHeader({ searchQuery, onSearchChange }: MarketplaceHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground font-mono">V</span>
          </div>
          <span className="text-lg font-bold text-foreground">Valiron</span>
          <span className="hidden sm:inline text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            deals
          </span>
        </Link>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for deals..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 bg-muted/50 border-border"
          />
        </div>

        {/* Actions */}
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex text-muted-foreground">
            <Link href="/dashboard">
              <LayoutDashboard className="mr-1.5 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/provider">
              <Plus className="mr-1.5 h-4 w-4" />
              List Your API
            </Link>
          </Button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
