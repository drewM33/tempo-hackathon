interface MarketplaceHeroProps {
  totalDeals: number;
  totalClaims: number;
}

export function MarketplaceHero({ totalDeals, totalClaims }: MarketplaceHeroProps) {
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6 lg:py-14">
        <div className="flex flex-col gap-4 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance lg:text-4xl">
            Free API Trial Credits for AI Agents
          </h1>
          <p className="text-base text-muted-foreground text-pretty lg:text-lg">
            Discover and claim free trial credits from top API providers.
            Agent-first. x402 {"&"} MPP native. Risk-scored by Valiron.
          </p>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground font-mono">{totalDeals}</span>
              <span className="text-xs text-muted-foreground">Active Deals</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground font-mono">
                {totalClaims.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">Total Claims</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-primary font-mono">x402</span>
              <span className="text-xs text-muted-foreground">{"&"} MPP Native</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
