import { AnalysisSection } from "@/components/landing/AnalysisSection";
import { ClosingCta } from "@/components/landing/ClosingCta";
import { DemoSection } from "@/components/landing/DemoSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingHero } from "@/components/landing/LandingHero";
import { OpportunityPreview } from "@/components/landing/OpportunityPreview";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { RepaymentSection } from "@/components/landing/RepaymentSection";
import { SettlementSection } from "@/components/landing/SettlementSection";
import { StrataDivider } from "@/components/landing/StrataDivider";
import { TrustSection } from "@/components/landing/TrustSection";

/**
 * Landing route (/) — the focused product story.
 *
 * Section order: hero with the signature liquidity figure, the liquidity
 * problem, the condensed three-move explanation, the example financing
 * opportunity, AI analysis, settlement, programmable repayment,
 * trust/transparency, the example flow, FAQ/clarification, and the final
 * CTA. Dividers separate genuine movements only: into settlement, into the
 * example flow.
 *
 * Removed in the visual redesign: the full seven-stage lifecycle ledger,
 * the nine-step product walkthrough, and the eight-row infrastructure
 * ledger. Those stories now live where they belong: the condensed
 * explanation above, the settlement and repayment sections below, and the
 * technical documentation at /docs. The page stays focused on problem,
 * outcome, and path into the product.
 *
 * Honesty rules enforced here, not just documented:
 * - The $100,000 / $70,000 figures are the canonical fictional example,
 *   presented as an illustrative example with contextual notes, never
 *   presented as onchain state.
 * - No transaction hashes, addresses, balances, or confirmations appear:
 *   nothing on this page has happened onchain yet.
 * - No network values (chain IDs, RPC URLs, contract/token addresses) are
 *   referenced; those arrive only through verified configuration.
 */
export default function Home() {
  return (
    <>
      <LandingHero />
      <ProblemSection />
      <HowItWorks />
      <OpportunityPreview />
      <AnalysisSection />
      <StrataDivider note="settlement layer" />
      <SettlementSection />
      <RepaymentSection />
      <TrustSection />
      <StrataDivider note="example flow" />
      <DemoSection />
      <FaqSection />
      <ClosingCta />
    </>
  );
}
