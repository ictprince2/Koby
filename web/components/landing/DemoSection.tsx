import { Container } from "@/components/layout/Container";
import { ProvenanceTag } from "@/components/ui/ProvenanceTag";
import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";

const DEMO_STEPS = [
  {
    text: "Acme Logistics describes $100,000 in expected receivables.",
    provenance: "Simulated" as const,
    note: "Fictional business, fictional figure.",
  },
  {
    text: "A cash-flow assessment is produced in the documented structure.",
    provenance: "Simulated" as const,
    note: "Illustrative on this page; a live assessment names its analysis engine.",
  },
  {
    text: "A $70,000 financing opportunity is created with agreed terms.",
    provenance: "Testnet" as const,
    note: "Recorded as an onchain transaction.",
  },
  {
    text: "A financier funds the position; settlement lands onchain.",
    provenance: "Testnet" as const,
    note: "Recorded as an onchain transaction.",
  },
  {
    text: "Repayments are submitted and validated; the outstanding balance updates from contract state.",
    provenance: "Testnet" as const,
    note: "Submitted as onchain transactions; triggered manually in this version.",
  },
  {
    text: "The qualifying repayment zeroes the balance; the position completes automatically.",
    provenance: "Testnet" as const,
    note: "Completion is the transaction result, not a separate action.",
  },
] as const;

/**
 * DemoSection — the example walkthrough as a provenance-tagged flow.
 * Fictional steps carry Simulated; transaction steps carry Testnet. No
 * hashes, no addresses, no balances beyond the two fictional figures, and
 * no confirmation is ever shown for something that has not happened here.
 */
export function DemoSection() {
  return (
    <section
      aria-labelledby="koby-demo-heading"
      className="bg-koby-bg-secondary"
    >
      <Container className="py-14 sm:py-20">
        <Reveal>
          <div id="koby-demo-heading">
            <SectionHeading
              eyebrow="Example flow"
              title="From expected revenue to a completed position"
              description="A fictional business walks through each stage while settlement steps are recorded as contract state. Example steps and onchain steps are labeled so they are never confused."
            />
          </div>
        </Reveal>

        <ol className="mt-10">
          {DEMO_STEPS.map((step, index) => (
            <Reveal key={step.text} delay={Math.min(index, 3) * 60}>
              <li className="relative flex gap-4 pb-6 last:pb-0 sm:gap-5">
                {index < DEMO_STEPS.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-6 left-[3px] h-[calc(100%-1.25rem)] w-px"
                    style={{
                      background:
                        "linear-gradient(to bottom, var(--koby-border-strong), var(--koby-accent))",
                    }}
                  />
                ) : null}
                <span
                  aria-hidden="true"
                  className={
                    step.provenance === "Testnet"
                      ? "mt-2 h-2 w-2 shrink-0 rounded-full bg-koby-accent"
                      : "mt-2 h-2 w-2 shrink-0 rounded-full bg-koby-demo-border"
                  }
                />
                <div className="max-w-[65ch] pt-0.5">
                  <p className="text-base leading-relaxed text-koby-text">{step.text}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <ProvenanceTag source={step.provenance} />
                    <span className="text-xs text-koby-text-muted">{step.note}</span>
                  </div>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
