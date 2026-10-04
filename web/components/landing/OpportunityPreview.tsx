import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { TechnicalLabel } from "@/components/landing/TechnicalLabel";

const FIELDS = [
  {
    label: "Future receivables",
    value: "$100,000",
    note: "Business-submitted estimate",
    soft: true,
  },
  {
    label: "Financing amount",
    value: "$70,000",
    note: "Proposed against the receivables above",
    soft: false,
  },
  {
    label: "Repayment obligation",
    value: "Per agreed terms",
    note: "Fixed at creation, enforced onchain",
    soft: false,
  },
  {
    label: "Risk signals",
    value: "Assessment",
    note: "AI summary with stated confidence",
    soft: false,
  },
] as const;

/**
 * OpportunityPreview — one example as a schedule plate: an
 * offset-framed surface with ledger rows, not a generic card. No invented
 * obligation figure, no status badge that could read as onchain state, no
 * ranking language. The live marketplace lists only real positions.
 */
export function OpportunityPreview() {
  return (
    <section aria-labelledby="koby-preview-heading">
      <Container className="py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <div id="koby-preview-heading">
                <SectionHeading
                  title="What a financier inspects"
                  description="Every opportunity shows the same comparable fields: the business, its expected receivables, the financing asked, the obligation, the terms, and the risk signals. Sorted by neutral criteria, never ranked."
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
            </Reveal>
          </div>

          <Reveal delay={120} className="lg:col-span-8">
            <div className="koby-frame rounded-koby-lg border border-koby-border-strong bg-koby-surface">
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
                {FIELDS.map((field) => (
                  <div
                    key={field.label}
                    className="grid gap-1 border-b border-koby-border px-6 py-4 last:border-b-0 sm:grid-cols-12 sm:items-baseline sm:gap-4"
                  >
                    <dt className="sm:col-span-4">
                      <TechnicalLabel>{field.label}</TechnicalLabel>
                    </dt>
                    <dd
                      className={
                        field.soft === true
                          ? "text-2xl font-bold tabular-nums tracking-tight text-koby-text-secondary sm:col-span-3"
                          : "text-2xl font-bold tabular-nums tracking-tight text-koby-text sm:col-span-3"
                      }
                    >
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
