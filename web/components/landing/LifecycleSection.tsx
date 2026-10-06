import { Container } from "@/components/layout/Container";
import { ProvenanceTag } from "@/components/ui/ProvenanceTag";
import { FlowLine } from "@/components/landing/FlowLine";
import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { StrataField } from "@/components/landing/StrataField";
import { TechnicalLabel } from "@/components/landing/TechnicalLabel";

const STAGES = [
  {
    name: "Future business revenue",
    body: "The business describes its expected receivables. Estimates, never guaranteed revenue.",
  },
  {
    name: "Cash-flow analysis",
    body: "AI-assisted review of submitted data and available onchain signals. Advisory only; it never sets terms.",
  },
  {
    name: "Financing opportunity",
    body: "An eligible amount and proposed terms are published for financiers to inspect.",
  },
  {
    name: "Liquidity",
    body: "A financier funds the opportunity in exactly the agreed principal.",
  },
  {
    name: "Monad settlement",
    body: "Funding settles onchain. Funding is the settlement event; there is no separate escrow step.",
  },
  {
    name: "Programmable repayment",
    body: "Each repayment is a validated transaction. The contract updates the outstanding balance.",
  },
  {
    name: "Completed position",
    body: "The repayment that zeroes the balance completes the position automatically.",
  },
] as const;

/**
 * LifecycleSection — FlowLine vessel up top, then an asymmetric ledger:
 * sticky strata column (depth markers for seven stages) beside stage rows
 * separated by hairlines. Rows, not boxes; the column carries the depth.
 */
export function LifecycleSection() {
  return (
    <section aria-labelledby="koby-lifecycle-heading" className="border-t border-koby-border">
      <Container className="py-14 sm:py-20">
        <Reveal>
          <div id="koby-lifecycle-heading">
            <SectionHeading
              eyebrow="How Koby works"
              title="From expected revenue to a completed position"
              description="From expected revenue to a completed position, on one shared record. Anything that changes what is owed happens in a validated onchain transaction, never in a private ledger."
            />
          </div>
        </Reveal>

        <Reveal>
          <FlowLine className="mt-8" />
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <Reveal>
                <div className="relative overflow-hidden rounded-koby-md border border-koby-border-strong bg-koby-surface">
                  <StrataField bands={7} contours />
                  <div className="relative p-6">
                    <TechnicalLabel>Depth ledger</TechnicalLabel>
                    <ol className="mt-4 space-y-3">
                      {STAGES.map((stage, index) => (
                        <li key={stage.name} className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className={
                              index === 4
                                ? "h-2.5 w-2.5 shrink-0 rounded-full bg-koby-accent ring-4 ring-koby-accent-subtle"
                                : index === STAGES.length - 1
                                  ? "h-2 w-2 shrink-0 rounded-full bg-koby-success"
                                  : index > 4
                                    ? "h-2 w-2 shrink-0 rounded-full bg-koby-accent"
                                    : "h-2 w-2 shrink-0 rounded-full bg-koby-border-strong"
                            }
                          />
                          <span className="text-sm font-medium text-koby-text">
                            {stage.name}
                          </span>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-5 border-t border-koby-border pt-4">
                      <ProvenanceTag source="Testnet" />
                      <p className="mt-2 text-xs leading-relaxed text-koby-text-muted">
                        Stages from settlement onward are recorded as contract state on Monad Testnet.
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          <ol className="lg:col-span-8">
            {STAGES.map((stage, index) => (
              <Reveal key={stage.name} delay={Math.min(index, 3) * 60}>
                <li className="grid gap-2 border-t border-koby-border py-5 last:border-b sm:grid-cols-12 sm:gap-4">
                  <span aria-hidden="true" className="flex items-center gap-3 sm:col-span-2 sm:pt-1">
                    <span className="font-mono text-xs text-koby-text-muted">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={
                        stage.name === "Monad settlement"
                          ? "block h-2 w-6 bg-koby-accent"
                          : "block h-px w-6 bg-koby-border-strong"
                      }
                    />
                  </span>
                  <div className="sm:col-span-10">
                    <h3 className="text-lg font-semibold tracking-tight text-koby-text">
                      {stage.name}
                    </h3>
                    <p className="mt-1 max-w-[62ch] text-base leading-relaxed text-koby-text-secondary">
                      {stage.body}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
