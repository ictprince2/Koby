import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";

const STEPS = [
  {
    index: "01",
    name: "Submit",
    body: "The business describes its expected receivables. An AI-assisted review advises on the cash-flow picture; it never sets terms or moves funds.",
  },
  {
    index: "02",
    name: "Finance",
    body: "A financier funds the agreed principal. Funding is the settlement event: value moves straight to the business on Monad.",
  },
  {
    index: "03",
    name: "Repay",
    body: "Each repayment is validated onchain and the outstanding balance updates. The repayment that zeroes the balance completes the position.",
  },
] as const;

/**
 * HowItWorks — the condensed homepage explanation: three moves from
 * expected revenue to a completed position.
 *
 * This replaces the seven-stage ledger on the landing route. The full
 * stage detail still lives where money is involved: the settlement
 * operations below, the opportunity plate above, and the financing
 * creation/funding flows. The homepage communicates the concept quickly.
 */
export function HowItWorks() {
  return (
    <section aria-labelledby="koby-how-heading" className="border-t border-koby-border">
      <Container className="py-12 sm:py-16">
        <Reveal>
          <div id="koby-how-heading">
            <SectionHeading
              eyebrow="How it works"
              title="From expected revenue to a completed position"
              description="Businesses earn later and need capital now. Traditional receivables financing is slow and opaque — private ledgers, unclear terms, waiting. Koby replaces that with shared, validated onchain state. Three moves bridge the gap."
            />
          </div>
        </Reveal>

        <ol className="mt-8">
          {STEPS.map((step, index) => (
            <Reveal key={step.name} delay={Math.min(index, 2) * 60}>
              <li className="grid min-w-0 gap-1 border-t border-koby-border py-5 last:border-b sm:grid-cols-12 sm:gap-4">
                <span aria-hidden="true" className="flex items-center gap-3 sm:col-span-2 sm:pt-1">
                  <span className="font-mono text-xs text-koby-text-muted">{step.index}</span>
                  <span className="block h-px w-6 bg-koby-border-strong" />
                </span>
                <div className="min-w-0 sm:col-span-10">
                  <h3 className="text-lg font-semibold tracking-tight text-koby-text">
                    {step.name}
                  </h3>
                  <p className="mt-1 max-w-[62ch] text-base leading-relaxed text-koby-text-secondary">
                    {step.body}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
        <Reveal>
          <div className="mt-10 border-t-2 border-koby-text pt-5">
            <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase">
              Where AI fits
            </p>
            <dl className="mt-4 grid gap-x-10 gap-y-0 sm:grid-cols-2">
              <div className="border-t border-koby-border py-3">
                <dt className="text-sm font-semibold text-koby-text">AI advises</dt>
                <dd className="mt-1 text-sm leading-relaxed text-koby-text-secondary">
                  Assesses the submitted cash-flow picture; explains its factors and states its
                  confidence. Advisory only — the business proposes terms, the financier decides.
                </dd>
              </div>
              <div className="border-t border-koby-border py-3">
                <dt className="text-sm font-semibold text-koby-text">AI never</dt>
                <dd className="mt-1 text-sm leading-relaxed text-koby-text-secondary">
                  Moves funds, signs transactions, sets terms, writes onchain, or guarantees
                  approval, repayment, or returns.
                </dd>
              </div>
            </dl>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
