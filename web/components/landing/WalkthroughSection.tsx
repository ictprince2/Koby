import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { TechnicalLabel } from "@/components/landing/TechnicalLabel";

const PHASES = [
  {
    phase: "Request",
    note: "No wallet needed to explore; the business describes its position.",
    steps: [
      {
        name: "Create financing request",
        body: "Start a request from the homepage or the financing flow. Browsing and drafting require no wallet.",
      },
      {
        name: "Enter business information",
        body: "Business identity, operating history, historical revenue, and the projected receivables behind the request — plus the requested liquidity and repayment horizon.",
      },
      {
        name: "Analyze cash flow",
        body: "Run the cash-flow assessment over the submitted information. Advisory only: it explains its factors and states its confidence, and never sets terms.",
      },
      {
        name: "Review financing opportunity",
        body: "The proposed terms — receivables, financing amount, repayment obligation, horizon — are laid out for inspection before anything touches the chain.",
      },
    ],
  },
  {
    phase: "Settle",
    note: "A wallet is needed only when value moves or state is written.",
    steps: [
      {
        name: "Connect wallet",
        body: "Privy onboarding first, with installed-wallet fallback. Connection is the identity; Koby never custodies it.",
      },
      {
        name: "Fund",
        body: "The financier funds exactly the agreed principal. Funding is the settlement event: value moves straight to the business in the same transaction.",
      },
      {
        name: "Monitor position",
        body: "Status, amount repaid, and outstanding balance read from contract state — the same record both sides verify, with onchain activity history.",
      },
    ],
  },
  {
    phase: "Repay",
    note: "Each repayment is a validated transaction, not a database edit.",
    steps: [
      {
        name: "Repay",
        body: "Repayments are submitted against the outstanding balance. The contract validates each one and pushes value straight to the financier.",
      },
      {
        name: "Complete",
        body: "The repayment that brings the outstanding balance to exactly zero completes the position in the same transaction — no separate close action.",
      },
    ],
  },
] as const;

/**
 * WalkthroughSection — the product walkthrough as grouped ledger rows:
 * Request (no wallet) → Settle (wallet signs) → Repay (validated
 * transactions). Editorial rows with hairlines, not marketing copy; each
 * step names what the user does and what the system does with it.
 */
export function WalkthroughSection() {
  return (
    <section aria-labelledby="koby-walkthrough-heading" className="border-t border-koby-border">
      <Container className="py-14 sm:py-20">
        <Reveal>
          <div id="koby-walkthrough-heading">
            <SectionHeading
              eyebrow="Product walkthrough"
              title="Using Koby, end to end"
              description="The actual sequence inside the application — from a drafted request to a completed position. Read it as the app's table of contents."
            />
          </div>
        </Reveal>

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
          {PHASES.map((group, groupIndex) => (
            <div key={group.phase} className="min-w-0 lg:col-span-4">
              <Reveal delay={Math.min(groupIndex, 2) * 80}>
                <div className="border-t-2 border-koby-text pt-4">
                  <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase">
                    Phase {String(groupIndex + 1).padStart(2, "0")} — {group.phase}
                  </p>
                  <p className="mt-1 text-sm text-koby-text-secondary">{group.note}</p>
                </div>
                <ol className="mt-2">
                  {group.steps.map((step) => (
                    <li key={step.name} className="border-b border-koby-border py-4 last:border-b-0">
                      <h3 className="text-base font-semibold tracking-tight text-koby-text">
                        {step.name}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-koby-text-secondary">
                        {step.body}
                      </p>
                    </li>
                  ))}
                </ol>
                <p className="mt-2 font-mono text-[11px] text-koby-text-muted">
                  {group.phase === "Request"
                    ? "Steps 01–04 · offchain"
                    : group.phase === "Settle"
                      ? "Steps 05–07 · onchain from funding"
                      : "Steps 08–09 · onchain"}
                </p>
              </Reveal>
            </div>
          ))}
        </div>

        <Reveal>
          <p className="mt-10 border-t border-koby-border pt-5 text-sm leading-relaxed text-koby-text-secondary">
            <TechnicalLabel>Where this runs — </TechnicalLabel>
            Steps 01–04 live in the financing creation flow; steps 05–09 live on the
            position and marketplace screens against Monad Testnet state.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
