import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";

const REAL_ITEMS = [
  "The transaction itself: created, funded, and repaid on Monad Testnet",
  "The resulting contract state: status, amounts repaid, outstanding balance",
  "The accounting: obligation minus repaid, validated on every write",
  "The emitted events behind the activity history",
] as const;

const SIMULATED_ITEMS = [
  "The example business and its $100,000 receivables figure",
  "Example business history feeding the illustrative assessment",
  "Illustrative analytics where live data is not part of the example",
  "Illustrative assessments, which advise on structure rather than decide terms",
] as const;

/**
 * TrustSection — one split surface, not two cards. A center fault line
 * divides the onchain record from the example; each half keeps its own
 * boundary language
 * (solid success edge vs. dashed demo edge). The honesty paragraph below
 * states the repayment model plainly.
 */
export function TrustSection() {
  return (
    <section aria-labelledby="koby-trust-heading" className="border-t border-koby-border">
      <Container className="py-14 sm:py-20">
        <Reveal>
          <div id="koby-trust-heading">
            <SectionHeading
              eyebrow="Trust"
              title="Honest about what is real"
              description="Confirmed onchain facts and labeled examples never look alike."
            />
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-8 grid overflow-hidden rounded-koby-lg border border-koby-border md:grid-cols-2">
            <div className="border-b-2 border-b-koby-success bg-koby-success-subtle p-6 sm:p-7 md:border-r md:border-b-0 md:border-r-koby-accent">
              <div aria-hidden="true" className="mb-4 h-1.5 rounded-full bg-koby-success" />
              <h3 className="text-base font-semibold text-koby-text">Recorded onchain</h3>
              <ul className="mt-3 space-y-2.5">
                {REAL_ITEMS.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm leading-relaxed text-koby-text"
                  >
                    <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-koby-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-koby-demo-bg p-6 sm:p-7">
              <div aria-hidden="true" className="mb-4 space-y-1">
                <div className="h-1 rounded-full bg-koby-text/[0.08]" />
                <div className="h-1 rounded-full bg-koby-text/[0.12]" />
                <div className="h-1 rounded-full bg-koby-text/[0.18]" />
              </div>
              <h3 className="text-base font-semibold text-koby-demo-text">
                Illustrative example
              </h3>
              <ul className="mt-3 space-y-2.5">
                {SIMULATED_ITEMS.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm leading-relaxed text-koby-demo-text"
                  >
                    <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-koby-demo-border" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <p className="mt-6 max-w-[70ch] text-sm leading-relaxed text-koby-text-secondary">
            Repayment is programmable tracking and execution: terms encoded onchain, each
            repayment validated by the contract, balances updated per transaction. Koby
            does not claim to collect real-world revenue on its own; that would need
            payment-rail integration a future version can earn.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
