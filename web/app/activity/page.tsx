import { Container } from "@/components/layout/Container";
import { EmptyState } from "@/components/ui/StateBlocks";

/**
 * /activity — route shell for Phase 6+ (indexed transaction history).
 * History renders only from real indexed events or direct reads — never
 * fabricated. Until then, an honest empty state.
 */
export default function ActivityPage() {
  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-koby-text">Onchain activity</h1>
      <p className="mt-2 max-w-2xl text-sm text-koby-text-secondary">
        Financing creation, funding, repayment, and completion events will appear here with
        transaction references once indexing is wired up.
      </p>
      <div className="mt-6">
        <EmptyState
          title="No onchain activity yet"
          description="Activity history arrives with contract integration and indexing. No events are shown because none have happened yet."
        />
      </div>
    </Container>
  );
}
