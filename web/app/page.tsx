import { ClosingCta } from "@/components/landing/ClosingCta";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingHero } from "@/components/landing/LandingHero";
import { OpportunityPreview } from "@/components/landing/OpportunityPreview";
import { SettlementSection } from "@/components/landing/SettlementSection";
import { TrustSection } from "@/components/landing/TrustSection";

/**
 * Landing route (/) — category-style product page.
 *
 * Deliberately few sections with one clear hierarchy: the category
 * (hero), a 3-step explanation (HowItWorks), the product plate
 * (OpportunityPreview), settlement + trust infrastructure, and the final
 * CTA. The full seven-stage lifecycle, the AI assessment structure, and
 * the provenance-tagged example walkthrough no longer lecture from the
 * homepage — that detail lives where money is involved (the settlement
 * operations below, the opportunity plate above, and the financing
 * creation/funding flows). Components for the retired sections remain in
 * components/landing for reuse; they are simply not rendered here.
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
      <HowItWorks />
      <OpportunityPreview />
      <SettlementSection />
      <TrustSection />
      <ClosingCta />
    </>
  );
}
