import { Container } from "@/components/layout/Container";
import { EmptyState } from "@/components/ui/StateBlocks";

/**
 * /financing/create — route shell for Phase 6 (financing creation flow).
 * The business-proposed terms form, advisory AI assessment, and onchain
 * creation transaction all land in later phases.
 */
export default function CreateFinancingPage() {
  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-koby-text">Create financing request</h1>
      <p className="mt-2 max-w-2xl text-sm text-koby-text-secondary">
        Submit business and receivables information, review the cash-flow assessment, and
        accept terms to create an onchain financing opportunity.
      </p>
      <div className="mt-6">
        <EmptyState
          title="Financing creation is not available yet"
          description="The creation flow arrives in a later phase. Nothing is submitted and no transaction is prepared from this screen."
        />
      </div>
    </Container>
  );
}
