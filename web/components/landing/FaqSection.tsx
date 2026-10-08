import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";

const FAQS = [
  {
    question: "Is Koby a bank?",
    answer:
      "No. Koby is financing infrastructure: it structures receivables-backed financing opportunities and settles them onchain. It takes no deposits and makes no balance-sheet loans.",
  },
  {
    question: "Is Koby a generic lending protocol?",
    answer:
      "No. Koby is built for one asset class — business receivables and predictable future revenue — with terms, assessment, and repayment shaped around that cash flow rather than pooled collateral.",
  },
  {
    question: "Does AI approve financing?",
    answer:
      "No. The cash-flow assessment analyzes submitted business information and produces an advisory assessment with factors and confidence. The business proposes terms; the financier decides; the contract enforces.",
  },
  {
    question: "Does Koby custody my wallet?",
    answer:
      "No. Connection is through Privy or an installed wallet, and every financial action requires an explicit signature in the wallet. Koby cannot move funds on your behalf.",
  },
  {
    question: "Where is financing settled?",
    answer:
      "Onchain, through the configured Monad smart contract. Create, fund, and every repayment are transactions on the Monad network — the contract is the source of truth for position state.",
  },
  {
    question: "What does AI actually do?",
    answer:
      "It analyzes the business's submitted cash-flow information — historical revenue, operating history, projected receivables, requested financing, repayment horizon, consistency and risk factors — and returns a structured advisory assessment: score, confidence, factors, and recommendation.",
  },
  {
    question: "Is the future revenue guaranteed?",
    answer:
      "No. Receivables are business-submitted estimates, never guaranteed revenue. The assessment reports what it found — including thin or inconsistent data — and never promises approval, repayment, or returns.",
  },
  {
    question: "How does Koby compare to traditional receivables financing?",
    answer:
      "Traditional factoring is slow and opaque: manual review, private ledgers, unclear terms. Koby keeps the same economic idea — liquidity against receivables — but puts terms, assessment reasoning, and repayment state on a shared, verifiable onchain record with programmable execution.",
  },
] as const;

/**
 * FaqSection — clarification ledger. Direct questions, plain answers, ruled
 * rows. This is load-bearing product information (what Koby is and isn't),
 * not marketing filler — it stays on the page.
 */
export function FaqSection() {
  return (
    <section aria-labelledby="koby-faq-heading" className="border-t border-koby-border">
      <Container className="py-14 sm:py-20">
        <Reveal>
          <div id="koby-faq-heading">
            <SectionHeading
              eyebrow="Clarification"
              title="What Koby is — and isn't"
              description="Eight questions first-time visitors actually ask, answered without hedging."
            />
          </div>
        </Reveal>

        <dl className="mt-10 grid gap-x-12 lg:grid-cols-2">
          {FAQS.map((faq, index) => (
            <Reveal key={faq.question} delay={Math.min(index % 4, 3) * 50}>
              <div className="border-t border-koby-border py-5">
                <dt className="text-base font-semibold tracking-tight text-koby-text">
                  {faq.question}
                </dt>
                <dd className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-koby-text-secondary">
                  {faq.answer}
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </Container>
    </section>
  );
}
