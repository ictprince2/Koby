import { Container } from "@/components/layout/Container";
import { ProvenanceTag } from "@/components/ui/ProvenanceTag";
import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { TechnicalLabel } from "@/components/landing/TechnicalLabel";

const STAGES = [
  {
    name: "Funding",
    state: "Created → Funded",
    body: "The financier commits exactly the agreed principal and value moves straight to the business. From this moment the position carries an outstanding balance enforced by the contract.",
  },
  {
    name: "Outstanding position",
    state: "Funded / Repaying",
    body: "Obligation minus repaid, recomputed on every write. The dashboard, marketplace, and position screens all read this same contract state — no side ledger can disagree with it.",
  },
  {
    name: "Repayment",
    state: "Validated per transaction",
    body: "Each repayment is checked against the outstanding balance before anything moves: overpayment reverts, partial payment keeps the position Repaying, value goes straight to the financier.",
  },
  {
    name: "Completed",
    state: "Balance zero → Completed",
    body: "The repayment that zeroes the balance completes the position automatically, in the same transaction. Completion is a transaction result, never a separate action or a button that edits a number.",
  },
] as const;

/**
 * RepaymentSection — programmable repayment tracking and execution, stated
 * honestly. Terms encoded onchain, each repayment validated by the
 * contract, balances updated per transaction. The trigger model is
 * explicit: repayments are submitted as transactions (manually in this
 * version, simulated where labeled) — Koby does not claim to collect
 * real-world revenue on its own. Genuinely autonomous collection would
 * need payment-rail integration, an oracle, or scheduled execution that a
 * future version can earn.
 */
export function RepaymentSection() {
  return (
    <section aria-labelledby="koby-repayment-heading" className="border-t border-koby-border">
      <Container className="py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-4">
            <Reveal>
              <div id="koby-repayment-heading">
                <SectionHeading
                  eyebrow="Repayment"
                  title="Programmable, validated, visible"
                  description="Repayment is contract-validated tracking and execution: the terms are encoded onchain, every repayment is checked against what is owed, and the balance updates per transaction."
                />
              </div>
            </Reveal>
            <Reveal>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <ProvenanceTag source="Onchain" />
                <ProvenanceTag source="Testnet" />
              </div>
              <p className="mt-4 border-t border-koby-border pt-4 text-sm leading-relaxed text-koby-text-secondary">
                What triggers a repayment transaction today is an explicit
                submission — made manually, or simulated where labeled. Koby
                does not intercept business revenue. Revenue-triggered
                automation would require payment-rail integration, a data
                oracle, or scheduled execution: future work, documented in
                MONAD.md, not implied here.
              </p>
            </Reveal>
          </div>

          <ol className="min-w-0 lg:col-span-8">
            {STAGES.map((stage, index) => (
              <Reveal key={stage.name} delay={Math.min(index, 3) * 60}>
                <li className="grid gap-2 border-t border-koby-border py-5 last:border-b sm:grid-cols-12 sm:gap-4">
                  <span aria-hidden="true" className="flex items-center gap-3 sm:col-span-2 sm:pt-1">
                    <span className="font-mono text-xs text-koby-text-muted">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={
                        stage.name === "Completed"
                          ? "block h-2 w-6 rounded-full bg-koby-success"
                          : stage.name === "Funding"
                            ? "block h-2 w-6 bg-koby-accent"
                            : "block h-px w-6 bg-koby-border-strong"
                      }
                    />
                  </span>
                  <div className="min-w-0 sm:col-span-10">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-lg font-semibold tracking-tight text-koby-text">
                        {stage.name}
                      </h3>
                      <TechnicalLabel>{stage.state}</TechnicalLabel>
                    </div>
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
