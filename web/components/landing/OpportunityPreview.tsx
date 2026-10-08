import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { TechnicalLabel } from "@/components/landing/TechnicalLabel";

const SUPPORTING_FIELDS = [
  {
    label: "Future receivables",
    value: "$100,000",
    note: "Business-submitted estimate",
  },
  {
    label: "Repayment horizon",
    value: "90 days",
    note: "Informational in this version",
  },
  {
    label: "Repayment obligation",
    value: "Per agreed terms",
    note: "Fixed at creation, enforced onchain",
  },
  {
    label: "Risk signals",
    value: "Assessment",
    note: "AI summary with stated confidence",
  },
] as const;

/**
 * OpportunityPreview — the product plate: one example as a schedule plate
 * with ledger rows, not a generic card. This is the category made concrete
 * (future receivables → immediate liquidity → programmable repayment). One
 * dominant figure ($70,000 financing, set large); supporting values are
 * deliberately secondary in size and tone. No invented obligation figure,
 * no status badge that could read as onchain state, no ranking language.
 * The live marketplace lists only real positions.
 */
export function OpportunityPreview() {
  return (
    <section aria-labelledby="koby-preview-heading" className="border-t border-koby-border">
      <Container className="py-12 sm:py-20">
        <div className="grid min-w-0 gap-10 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-4">
            <Reveal>
              <div id="koby-preview-heading">
                <SectionHeading
                  eyebrow="The product"
                  title="What a financier inspects"
                  description="Every opportunity shows the same comparable fields — receivables, financing, obligation, terms, risk signals. Never ranked."
                />
              </div>
            </Reveal>
            <Reveal>
              <p className="mt-6 text-sm text-koby-text-secondary">
                <Link
                  href="/marketplace"
                  className="font-medium text-koby-accent underline-offset-2 hover:underline"
                >
                  Open the marketplace
                </Link>{" "}
                to see live opportunities when positions exist. Empty until then, by
                design.
              </p>
              <div className="mt-6 border-t border-koby-border pt-4">
                <TechnicalLabel>What the numbers mean</TechnicalLabel>
                <p className="mt-2 text-sm leading-relaxed text-koby-text-secondary">
                  $100,000 is what the business expects to collect — an estimate,
                  never a promise. $70,000 is the liquidity proposed against it. The
                  two are different things, and the plate keeps them visually
                  distinct for that reason: one hero, the rest supporting context.
                </p>
              </div>
              <p className="mt-4 border-t border-koby-border pt-4 font-mono text-[11px] leading-relaxed tracking-[0.08em] text-koby-text-muted uppercase">
                Example context — Acme Logistics · $100,000 expected receivables →
                $70,000 financing → Monad settlement → validated repayment
              </p>
            </Reveal>
          </div>

          <Reveal delay={120} className="min-w-0 lg:col-span-8">
            <div className="koby-frame max-w-full rounded-koby-lg border border-koby-border-strong bg-koby-surface">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-koby-border px-6 py-4">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-koby-text">
                    Acme Logistics
                  </h3>
                  <p className="mt-0.5 text-xs text-koby-text-muted">
                    Example listing. Fictional business; nothing here is onchain.
                  </p>
                </div>
              </div>
              <dl>
                <div className="border-b border-koby-border px-6 py-6">
                  <dt>
                    <TechnicalLabel>Financing amount — the dominant figure</TechnicalLabel>
                  </dt>
                  <dd className="mt-2 text-5xl font-bold tabular-nums tracking-tight break-words text-koby-text sm:text-6xl">
                    $70,000
                  </dd>
                  <dd className="mt-1 text-xs text-koby-text-muted">
                    Eligible liquidity proposed against the receivables below, funded by a
                    financier and settled on Monad.
                  </dd>
                </div>
                {SUPPORTING_FIELDS.map((field) => (
                  <div
                    key={field.label}
                    className="grid gap-1 border-b border-koby-border px-6 py-4 last:border-b-0 sm:grid-cols-12 sm:items-baseline sm:gap-4"
                  >
                    <dt className="sm:col-span-4">
                      <TechnicalLabel>{field.label}</TechnicalLabel>
                    </dt>
                    <dd className="text-lg font-semibold tabular-nums tracking-tight text-koby-text-secondary sm:col-span-3">
                      {field.value}
                    </dd>
                    <dd className="text-xs text-koby-text-muted sm:col-span-5 sm:text-right">
                      {field.note}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
