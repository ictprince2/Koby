import { Container } from "@/components/layout/Container";
import { EmptyState } from "@/components/ui/StateBlocks";

/**
 * /marketplace — route shell for Phase 4 (financing marketplace).
 * No opportunity cards until real or explicitly labeled data exists.
 */
export default function MarketplacePage() {
  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-koby-text">Financing marketplace</h1>
      <p className="mt-2 max-w-2xl text-sm text-koby-text-secondary">
        Open financing opportunities — business, receivables, terms, risk signals, and
        funding status — will be listed here. No rankings without a documented methodology.
      </p>
      <div className="mt-6">
        <EmptyState
          title="No financing opportunities yet"
          description="The marketplace experience arrives in Phase 4. Nothing is listed because no financing positions exist yet."
        />
      </div>
    </Container>
  );
}
