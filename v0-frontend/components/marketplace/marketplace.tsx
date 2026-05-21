"use client";

import { useState, useMemo } from "react";
import { MOCK_DEALS, DEAL_CATEGORIES } from "@/lib/marketplace-data";
import { MarketplaceHeader } from "./marketplace-header";
import { MarketplaceHero } from "./marketplace-hero";
import { CategorySidebar } from "./category-sidebar";
import { DealGrid } from "./deal-grid";

export function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Deals");

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of DEAL_CATEGORIES) {
      if (cat === "All Deals") continue;
      counts[cat] = MOCK_DEALS.filter((d) => d.category === cat).length;
    }
    return counts;
  }, []);

  const totalClaims = useMemo(
    () => MOCK_DEALS.reduce((sum, d) => sum + d.stats.totalClaims, 0),
    []
  );

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <MarketplaceHero totalDeals={MOCK_DEALS.length} totalClaims={totalClaims} />

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              <CategorySidebar
                selected={selectedCategory}
                onSelect={setSelectedCategory}
                counts={categoryCounts}
              />
            </div>
          </aside>

          {/* Main grid */}
          <DealGrid
            deals={MOCK_DEALS}
            category={selectedCategory}
            searchQuery={searchQuery}
          />
        </div>
      </div>
    </div>
  );
}
