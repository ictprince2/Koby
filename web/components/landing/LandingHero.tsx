import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/landing/Reveal";
import { StrataField } from "@/components/landing/StrataField";
import { LiquidityFigure } from "@/components/landing/LiquidityFigure";

/**
 * LandingHero — full-bleed strata environment, asymmetric editorial grid.
 *
 * Category-first: the eyebrow names the product category (onchain
 * receivables financing) before the H1 states the promise. Copy sits in a
 * wide left column; the right holds the signature liquidity figure: future
 * estimate settling through the seam into present financing, with programmed
 * paydown below. Both figures are the illustrative example; nothing here is
 * onchain state.
 */
export function LandingHero() {
  return (
    <section aria-labelledby="koby-hero-heading" className="relative overflow-hidden">
      <StrataField bands={7} contours />

      <Container className="relative py-10 sm:py-14">
        <div className="grid min-w-0 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          <Reveal className="min-w-0 lg:col-span-7">
            <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-koby-text-muted uppercase sm:tracking-[0.14em]">
              Onchain receivables financing
            </p>
            <h1
              id="koby-hero-heading"
              className="mt-3 max-w-[16ch] font-bold tracking-tight text-koby-text [font-size:clamp(2rem,9vw,2.6rem)] [line-height:1.1] sm:text-5xl"
            >
              Koby turns future business cash flow into programmable liquidity.
            </h1>
            <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-koby-text-secondary sm:text-lg">
              Future revenue, analyzed and financed on transparent terms, settled onchain
              with programmable repayment.
            </p>
            <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start">
              <Button href="/financing/create" size="lg" className="w-full text-center sm:w-auto">
                Create financing request
              </Button>
              <Button href="/marketplace" variant="secondary" size="lg" className="w-full text-center sm:w-auto">
                Explore marketplace
              </Button>
            </div>
            {/* Eyebrow rule: tighter tracking on mobile so it never overflows. */}
            <p className="mt-6 border-t border-koby-border-strong pt-4 font-mono text-[11px] tracking-[0.08em] text-koby-text-muted uppercase sm:tracking-[0.14em]">
              Estimates above the line. Contracts below it.
            </p>
          </Reveal>

          <Reveal delay={140} className="min-w-0 lg:col-span-4 lg:col-start-9">
            <LiquidityFigure />
          </Reveal>
        </div>
      </Container>

      {/* Utility strip: browsing needs no wallet. Separate block, not hero copy. */}
      <div className="relative border-y border-koby-border bg-koby-bg-secondary">
        <Container>
          <p className="py-3 text-sm text-koby-text-secondary">
            Browsing Koby requires no wallet. A wallet is only needed when you act:
            creating, funding, or repaying a financing position.
          </p>
        </Container>
      </div>
    </section>
  );
}
