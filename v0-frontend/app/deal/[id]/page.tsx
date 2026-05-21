import { notFound } from "next/navigation";
import { MOCK_DEALS } from "@/lib/marketplace-data";
import { DealDetail } from "@/components/marketplace/deal-detail";

interface DealPageProps {
  params: Promise<{ id: string }>;
}

export default async function DealPage({ params }: DealPageProps) {
  const { id } = await params;
  const deal = MOCK_DEALS.find((d) => d.id === id);

  if (!deal) {
    notFound();
  }

  return <DealDetail deal={deal} />;
}

export async function generateStaticParams() {
  return MOCK_DEALS.map((deal) => ({
    id: deal.id,
  }));
}
