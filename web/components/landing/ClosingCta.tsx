import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/landing/Reveal";
import { StrataField } from "@/components/landing/StrataField";

/**
 * ClosingCta — conversion on the strata bed. Same two CTA labels as the
 * hero (one label per intent: start as business, inspect as financier).
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
              Describe receivables as a business, or inspect an opportunity as a
              financier. Both paths start without a wallet.
            </p>
            <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start">
              <Button href="/financing/create" size="lg" className="w-full text-center sm:w-auto">
                Create financing request
              </Button>
              <Button href="/marketplace" variant="secondary" size="lg" className="w-full text-center sm:w-auto">
                Explore marketplace
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
