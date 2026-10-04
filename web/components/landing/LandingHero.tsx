import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/landing/Reveal";
import { StrataField } from "@/components/landing/StrataField";
import { TechnicalLabel } from "@/components/landing/TechnicalLabel";

/**
 * LandingHero — full-bleed strata environment, asymmetric editorial grid.
 *
 * Copy sits in a wide left column; the right holds a settlement column:
 * diffuse estimate ($100,000) settling through bands into full-contrast
 * financing ($70,000) on the seam, crossed by the settlement fault with
 * repayment ticks below. Both figures are presented as an illustrative
 * example; nothing here is onchain state.
 */
export function LandingHero() {
  return (
    <section aria-labelledby="koby-hero-heading" className="relative overflow-hidden">
      <StrataField bands={7} contours />

      <Container className="relative py-14 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <h1
              id="koby-hero-heading"
              className="max-w-[16ch] text-5xl font-bold tracking-tight text-koby-text sm:text-6xl"
            >
              Koby turns future business cash flow into programmable liquidity.
            </h1>
            <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-koby-text-secondary">
              Future revenue, analyzed and financed on transparent terms, settled onchain
              with programmable repayment.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/marketplace" size="lg">
                Explore financing opportunities
              </Button>
              <Button href="/financing/create" variant="secondary" size="lg">
                Create financing request
              </Button>
            </div>
            <p className="mt-8 border-t border-koby-border-strong pt-4 font-mono text-[11px] tracking-[0.14em] text-koby-text-muted uppercase">
              Estimates above the line. Contracts below it.
            </p>
          </Reveal>

          <Reveal delay={140} className="lg:col-span-4 lg:col-start-9">
            <div
              aria-label="Settlement column: fictional receivables settling into financing, crossed by settlement"
              className="koby-frame relative overflow-hidden rounded-koby-lg border border-koby-border-strong bg-koby-surface"
            >
              <StrataField bands={6} fault="vertical" />
              <div className="relative flex h-[480px] flex-col justify-between p-6 sm:h-[540px] sm:p-7">
                <div>
                  <p className="text-xs text-koby-text-muted">Illustrative example</p>
                  <div className="mt-3">
                    <TechnicalLabel>Future receivables - estimate</TechnicalLabel>
                  </div>
                  <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-koby-text-secondary sm:text-5xl">
                    $100,000
                  </p>
                  <p className="mt-1 text-xs text-koby-text-muted">
                    Expected revenue described by the business. Never guaranteed.
                  </p>
                </div>

                <div className="border-t border-koby-border pt-5">
                  <TechnicalLabel>Financing</TechnicalLabel>
                  <p className="mt-2 text-5xl font-bold tabular-nums tracking-tight text-koby-text">
                    $70,000
                  </p>
                  <p className="mt-1 text-xs text-koby-text-muted">
                    Eligible amount proposed from the assessment, funded by a financier.
                  </p>
                </div>

                <div className="border-t border-koby-border pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <TechnicalLabel className="text-koby-accent">
                      Monad settlement
                    </TechnicalLabel>
                    <span className="flex gap-1.5" aria-hidden="true">
                      <span className="h-2 w-8 rounded-full bg-koby-accent" />
                      <span className="h-2 w-8 rounded-full bg-koby-accent/50" />
                      <span className="h-2 w-8 rounded-full bg-koby-border-strong" />
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-koby-text-muted">
                    Funding settles onchain. Repayment ticks validate against the
                    outstanding balance until completion.
                  </p>
                </div>
              </div>
            </div>
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
