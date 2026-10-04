import { AnalysisSection } from "@/components/landing/AnalysisSection";
import { ClosingCta } from "@/components/landing/ClosingCta";
import { DemoSection } from "@/components/landing/DemoSection";
import { LandingHero } from "@/components/landing/LandingHero";
import { LifecycleSection } from "@/components/landing/LifecycleSection";
import { OpportunityPreview } from "@/components/landing/OpportunityPreview";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SettlementSection } from "@/components/landing/SettlementSection";
import { StrataDivider } from "@/components/landing/StrataDivider";
import { TrustSection } from "@/components/landing/TrustSection";

/**
 * Landing route (/) — visual redesign on the Strata language.
 *
 * Section order follows USER_FLOW.md Section 4 (Hero, Problem, How Koby
 * Works, Lifecycle, AI Analysis, Monad Settlement, Marketplace preview,
 * Trust/Transparency, Demo/Example, Call to Action). Dividers separate
 * genuine movements only: into settlement, into the demo.
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
      <LifecycleSection />
      <AnalysisSection />
      <StrataDivider note="settlement layer" />
      <SettlementSection />
      <OpportunityPreview />
      <TrustSection />
      <StrataDivider note="example flow" />
      <DemoSection />
      <ClosingCta />
    </>
  );
}
