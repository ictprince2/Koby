import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/StateBlocks";

/**
 * /dashboard — route shell for Phase 4 (business dashboard).
 * No figures, no mock positions: an honest empty state only.
 */
export default function DashboardPage() {
  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-koby-text">Business dashboard</h1>
      <p className="mt-2 max-w-2xl text-sm text-koby-text-secondary">
        Active financing, amounts repaid, outstanding balances, cash-flow assessment, and
        onchain activity will live here. Browsing requires no wallet.
      </p>
      <div className="mt-6">
        <EmptyState
          title="No financing to show yet"
          description="The dashboard experience arrives in Phase 4. No positions exist onchain yet, so there is nothing to list — and nothing is fabricated to fill this space."
          action={<Button href="/financing/create" variant="secondary">Create financing request</Button>}
        />
      </div>
    </Container>
  );
}
