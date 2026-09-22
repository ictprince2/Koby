import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/landing/Reveal";
import { StrataField } from "@/components/landing/StrataField";

/**
 * ClosingCta — conversion on the strata bed. Same two CTA labels as the
 * hero (one label per intent: inspect as financier, start as business).
 */
export function ClosingCta() {
  return (
    <section aria-labelledby="koby-cta-heading" className="relative overflow-hidden">
      <StrataField bands={5} />
      <Container className="relative py-16 sm:py-24">
        <Reveal>
          <div className="max-w-2xl">
            <div aria-hidden="true" className="h-0.5 w-10 bg-koby-accent" />
            <h2
              id="koby-cta-heading"
              className="mt-5 text-3xl font-bold tracking-tight text-koby-text sm:text-4xl"
            >
              Give future revenue a present tense.
            </h2>
            <p className="mt-3 max-w-[52ch] text-base leading-relaxed text-koby-text-secondary">
              Inspect an opportunity as a financier, or describe receivables as a
              business. Both paths start without a wallet.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button href="/marketplace" size="lg">
                Explore financing opportunities
              </Button>
              <Button href="/financing/create" variant="secondary" size="lg">
                Create financing request
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
