import { AnalysisSection } from "@/components/landing/AnalysisSection";
import { ClosingCta } from "@/components/landing/ClosingCta";
import { DemoSection } from "@/components/landing/DemoSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingHero } from "@/components/landing/LandingHero";
import { LifecycleSection } from "@/components/landing/LifecycleSection";
import { OpportunityPreview } from "@/components/landing/OpportunityPreview";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { RepaymentSection } from "@/components/landing/RepaymentSection";
import { SettlementSection } from "@/components/landing/SettlementSection";
import { StrataDivider } from "@/components/landing/StrataDivider";
import { TechnicalSection } from "@/components/landing/TechnicalSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { WalkthroughSection } from "@/components/landing/WalkthroughSection";

/**
 * Landing route (/) — the full product experience.
 *
 * Section order: hero/category definition, the liquidity problem, the
 * condensed explanation plus the full lifecycle, the example financing
 * opportunity, the product walkthrough, AI analysis, Monad settlement,
 * programmable repayment, trust/transparency, technical infrastructure,
 * the example flow, FAQ/clarification, and the final CTA. Dividers
 * separate genuine movements only: into settlement, into the example flow.
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
      <LifecycleSection />
      <OpportunityPreview />
      <WalkthroughSection />
      <AnalysisSection />
      <StrataDivider note="settlement layer" />
      <SettlementSection />
      <RepaymentSection />
      <TrustSection />
      <TechnicalSection />
      <StrataDivider note="example flow" />
      <DemoSection />
      <FaqSection />
      <ClosingCta />
    </>
  );
}
