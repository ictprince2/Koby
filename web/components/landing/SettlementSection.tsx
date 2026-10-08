import { Container } from "@/components/layout/Container";
import { ProvenanceTag } from "@/components/ui/ProvenanceTag";
import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { StrataField } from "@/components/landing/StrataField";
import { TechnicalLabel } from "@/components/landing/TechnicalLabel";

const OPERATIONS = [
  {
    name: "Create financing",
    body: "The agreed terms are recorded onchain. From this point the opportunity exists as contract state in Created.",
    state: "Created",
  },
  {
    name: "Fund financing",
    body: "The financier commits exactly the principal. Value moves straight to the business in the same transaction; the contract holds no balances.",
    state: "Created to Funded",
    emphasis: true,
  },
  {
    name: "Record repayment",
    body: "Each repayment is validated against the outstanding balance, then pushed straight to the financier. Overpayment reverts; partial payment keeps the position Repaying.",
    state: "Funded to Repaying",
  },
] as const;

/**
 * SettlementSection — full-width ledger band. Operations read as ledger
 * rows separated by hairlines (no boxes); the funding row carries the
 * accent edge as the settlement event. No network values: no chain IDs,
 * no RPC URLs, no contract or token addresses.
 */
export function SettlementSection() {
  return (
    <section
      aria-labelledby="koby-settlement-heading"
      className="bg-koby-bg-secondary"
    >
      {/* Accent rule: the settlement layer is the important boundary on this page. */}
      <div aria-hidden="true" className="h-0.5 bg-koby-accent" />
      <Container className="py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <div id="koby-settlement-heading">
                <SectionHeading
                  eyebrow="Settlement"
                  title="Settlement is the product, not the backdrop"
                  description="Create, fund, and every repayment are real transactions. The contract is the record both sides verify — no private database with a contract attached."
                />
              </div>
            </Reveal>
            <Reveal>
              <div aria-hidden="true" className="mt-8 hidden lg:block">
                <StrataField
                  bands={4}
                  fault="vertical"
                  fill={false}
                  className="h-44 rounded-koby-md border border-koby-border"
                />
                <div className="mt-1.5 flex justify-between font-mono text-[11px] text-koby-text-muted">
                  <span>Created</span>
                  <span className="font-semibold text-koby-accent">Funded</span>
                  <span>Repaying</span>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <ol>
              {OPERATIONS.map((operation, index) => (
                <Reveal key={operation.name} delay={index * 90}>
                  <li
                    className={
                      "emphasis" in operation && operation.emphasis === true
                        ? "border-t-2 border-t-koby-accent py-6 last:border-b last:border-b-koby-border"
                        : "border-t border-koby-border py-6 last:border-b"
                    }
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-lg font-semibold tracking-tight text-koby-text">
                        {operation.name}
                      </h3>
                      <TechnicalLabel>{operation.state}</TechnicalLabel>
                    </div>
                    <p className="mt-2 max-w-[62ch] text-base leading-relaxed text-koby-text-secondary">
                      {operation.body}
                    </p>
                  </li>
                </Reveal>
              ))}
            </ol>
            <Reveal>
              <div className="mt-2 flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-[60ch] text-sm leading-relaxed text-koby-text-secondary">
                  Completion is not a fourth action. The repayment that brings the
                  outstanding balance to exactly zero completes the position in the same
                  transaction.
                </p>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <ProvenanceTag source="Onchain" />
                  <ProvenanceTag source="Testnet" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
