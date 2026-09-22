import { Container } from "@/components/layout/Container";
import { Panel } from "@/components/ui/Card";
import { ProvenanceTag } from "@/components/ui/ProvenanceTag";
import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { TechnicalLabel } from "@/components/landing/TechnicalLabel";

const FACTOR_CATEGORIES = [
  "Revenue consistency in the submitted profile",
  "Cash-flow volatility across the observed activity",
  "Concentration across payers or periods",
  "Completeness of the data behind the assessment",
] as const;

/**
 * AnalysisSection — asymmetric ledger: narrow annotation rail beside the
 * assessment surface. Shows the assessment structure with example factor
 * categories and documented example wording. No invented score, no risk
 * verdict; the panel is labeled Simulated.
 */
export function AnalysisSection() {
  return (
    <section aria-labelledby="koby-analysis-heading" className="border-t border-koby-border">
      <Container className="py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <div id="koby-analysis-heading">
                <SectionHeading
                  title="Analysis that explains itself"
                  description="AI reads the cash-flow picture and reports what it found, with reasons and a stated confidence. It advises; the business and the financier decide, and the contract enforces."
                />
              </div>
            </Reveal>
            <Reveal>
              <dl className="mt-8 space-y-0 border-t border-koby-border">
                {[
                  ["Never moves funds", "No signatures, no transfers"],
                  ["Never sets terms", "The business proposes them"],
                  ["Never writes onchain", "Only validated transactions do"],
                  ["Never invents data", "Thin evidence is reported as thin"],
                ].map(([term, detail]) => (
                  <div key={term} className="border-b border-koby-border py-3">
                    <dt>
                      <TechnicalLabel>{term}</TechnicalLabel>
                    </dt>
                    <dd className="mt-1 text-sm text-koby-text-secondary">{detail}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal delay={120} className="lg:col-span-8">
            <Panel
              title="AI cash-flow assessment"
              description="Structure of every assessment. Score and confidence are reported separately: confidence describes the data quality, not the business."
            >
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <ProvenanceTag source="AI Analysis" />
                <ProvenanceTag source="Simulated" />
              </div>
              <dl className="grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-koby-text-secondary">Score</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-koby-text">
                    The assessment of the opportunity, given what was found. Shown only
                    with its supporting factors, never as a bare number.
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-koby-text-secondary">Confidence</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-koby-text">
                    How much weight the answer deserves, given the data available. High
                    confidence never means low risk.
                  </dd>
                </div>
              </dl>
              <div className="mt-5">
                <h3 className="text-sm font-medium text-koby-text-secondary">
                  Example factor categories
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {FACTOR_CATEGORIES.map((factor) => (
                    <li key={factor} className="flex items-start gap-2 text-sm text-koby-text">
                      <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-koby-ai" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
              <blockquote className="mt-5 border-l-2 border-koby-ai pl-4">
                <p className="text-sm leading-relaxed text-koby-text">
                  “Observed activity supports further financing review based on the
                  submitted data.”
                </p>
                <cite className="mt-1 block text-xs text-koby-text-muted not-italic">
                  Example recommendation wording. Assessments never promise approval,
                  repayment, or returns.
                </cite>
              </blockquote>
            </Panel>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
