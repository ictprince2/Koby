import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { TechnicalLabel } from "@/components/landing/TechnicalLabel";

const ROWS = [
  {
    label: "Settlement layer",
    value: "Monad",
    body: "Every state-changing financial operation — create, fund, each repayment — executes as a transaction on the configured Monad network. Fast, inexpensive, programmable settlement is what the financing lifecycle runs on.",
  },
  {
    label: "Source of truth",
    value: "Financing smart contract",
    body: "Position state lives in the contract: status, principal, repayment obligation, amount repaid, outstanding balance. The frontend reads it; it cannot fabricate it.",
  },
  {
    label: "Financing asset",
    value: "Testnet USDC · 6 decimals",
    body: "Funding and repayment move in the configured testnet USDC. Integer base-unit accounting throughout — no floating-point arithmetic in settlement logic.",
  },
  {
    label: "Wallet connection",
    value: "Privy primary · installed-wallet fallback",
    body: "Onboarding through Privy (embedded and external wallets), with EIP-6963 injected wallets as fallback. Browsing needs no wallet; creating, funding, or repaying does.",
  },
  {
    label: "Transaction state",
    value: "idle → confirmed, honestly",
    body: "Every blockchain action reports preparing, awaiting wallet, submitted, confirming, confirmed, or failed. Success is shown only after confirmation, with the hash when available.",
  },
  {
    label: "Repayment execution",
    value: "Programmable, per transaction",
    body: "Repayment terms encoded onchain; each repayment validated against the outstanding balance; completion automatic when the balance reaches zero. Triggered by explicit submission in this version.",
  },
  {
    label: "Position state",
    value: "Created · Funded · Repaying · Completed",
    body: "The contract enforces the state machine. Only transitions the chain validates can happen; invalid amounts, unauthorized callers, and double completion revert.",
  },
  {
    label: "Analysis layer",
    value: "AI assessment, advisory",
    body: "The cash-flow assessment informs the opportunity and nothing else. It never signs, never transfers, never writes onchain, and never guarantees an outcome.",
  },
] as const;

/**
 * TechnicalSection — restrained infrastructure ledger for readers who want
 * depth. Ruled definition rows (label / value / explanation), not SaaS
 * cards: one typographic system, no competing visuals. No network values
 * beyond what configuration already publishes (no chain IDs, RPC URLs, or
 * contract/token addresses on this page).
 */
export function TechnicalSection() {
  return (
    <section aria-labelledby="koby-technical-heading" className="border-t border-koby-border">
      <Container className="py-14 sm:py-20">
        <Reveal>
          <div id="koby-technical-heading">
            <SectionHeading
              eyebrow="Infrastructure"
              title="What the system is made of"
              description="Eight pieces, each with one job. The application structures financing, analysis advises on it, Monad settles it, and the contract remembers it."
            />
          </div>
        </Reveal>

        <dl className="mt-10">
          {ROWS.map((row, index) => (
            <Reveal key={row.label} delay={Math.min(index, 3) * 40}>
              <div className="grid min-w-0 gap-1 border-t border-koby-border py-5 last:border-b sm:grid-cols-12 sm:gap-4">
                <dt className="min-w-0 sm:col-span-3">
                  <TechnicalLabel>{row.label}</TechnicalLabel>
                </dt>
                <dd className="min-w-0 text-base font-semibold tracking-tight break-words text-koby-text sm:col-span-3">
                  {row.value}
                </dd>
                <dd className="min-w-0 text-sm leading-relaxed text-koby-text-secondary sm:col-span-6">
                  {row.body}
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </Container>
    </section>
  );
}
