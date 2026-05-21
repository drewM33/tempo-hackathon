import Link from "next/link";
import { ProviderWizard } from "@/components/provider/provider-wizard";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProviderPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-4 px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Marketplace
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">List Your API Trial</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a self-service free trial listing on the Valiron marketplace.
            Agents can claim credits through x402 or MPP endpoints.
          </p>
        </div>

        <ProviderWizard />
      </main>
    </div>
  );
}
