import { Container } from "@/components/layout/Container";
import { EmptyState } from "@/components/ui/StateBlocks";

/**
 * /financing/[id] — route shell for Phase 5 (position experience).
 * The id from the URL is display-only: it selects what to fetch later, and
 * never authorizes anything or implies an existing position.
 */
export default async function FinancingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-koby-text">Financing position</h1>
      <p className="mt-2 max-w-2xl font-mono text-sm text-koby-text-muted" aria-label={`Requested position ${id}`}>
        {id}
      </p>
      <div className="mt-6">
        <EmptyState
          title="Position detail is not available yet"
          description="The position experience — lifecycle state, repayment progress, outstanding balance, and onchain history — arrives in Phase 5. No position data is shown because contract reads are not wired up yet."
        />
      </div>
    </Container>
  );
}
