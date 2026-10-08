import { ProvenanceTag } from "@/components/ui/ProvenanceTag";
import type { AnalysisResponse } from "@/lib/analysis";

/**
 * AnalysisCard — the financing analysis presentation (AI.md Section 24):
 * assessment, confidence, key factors, recommendation, plus the structured
 * detail envelope. The heading names the live provider engine when live
 * output is shown, and the built-in assessment otherwise — advisory only,
 * never terms, never funds.
 *
 * Ledger-styled to the editorial financing composition: hairlines and
 * typography carry the structure, never a rounded panel. All assessment
 * information is preserved — score and confidence stay visually distinct
 * (AI.md Section 8), factors stay a scannable list, the recommendation is
 * set apart typographically (DESIGN.md Section 15).
 */

/**
 * Engine display name per response source. The OpenRouter model id is
 * derived from the response (suffix stripped) so the label stays correct
 * if OPENROUTER_MODEL changes; the built-in assessment names the Koby
 * assessment, never a model provider or internal version.
 */
function engineName(result: AnalysisResponse): string {
  if (result.source === "openrouter") {
    const modelId = result.model.replace(/\s*\(.*\)$/, "").trim();
    return modelId === "" ? "OpenRouter" : `OpenRouter · ${modelId}`;
  }
  if (result.source === "kimi") {
    return "Kimi";
  }
  return "Koby assessment";
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase">
      {children}
    </p>
  );
}

export function AnalysisCard({ result }: { result: AnalysisResponse }) {
  const { assessment, detail } = result;
  const live = result.source !== "deterministic-fallback";
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Label>Analysis engine</Label>
        <span className="font-mono text-sm text-koby-text">{engineName(result)}</span>
        <ProvenanceTag source="AI Analysis" />
      </div>
      {!live ? (
        <p className="mt-2 text-xs text-koby-text-muted">Live AI analysis currently unavailable.</p>
      ) : null}
      <p className="mt-2 max-w-[62ch] text-xs leading-relaxed text-koby-text-muted">
        This analysis is advisory only. It does not approve financing, set terms, guarantee
        repayment, or authorize any transaction.
      </p>

      <div className="mt-6 grid min-w-0 gap-x-10 sm:grid-cols-2">
        <div className="min-w-0 border-t border-koby-border py-5">
          <Label>Assessment score</Label>
          <p className="mt-2 text-5xl font-bold tabular-nums tracking-tight text-koby-text">
            {assessment.score}
            <span className="text-xl font-medium text-koby-text-muted"> / 100</span>
          </p>
        </div>
        <div className="min-w-0 border-t border-koby-border py-5">
          <Label>Model confidence</Label>
          <p className="mt-2 text-5xl font-bold tabular-nums tracking-tight text-koby-text">
            {assessment.confidence}
            <span className="text-xl font-medium text-koby-text-muted">%</span>
          </p>
          <p className="mt-1 text-xs text-koby-text-muted">
            Confidence reflects data completeness, not a guarantee of outcome.
          </p>
        </div>
      </div>

      <div className="grid min-w-0 gap-x-10 sm:grid-cols-12">
        <div className="min-w-0 sm:col-span-7">
          <div className="border-t border-koby-border py-5">
            <Label>Key factors</Label>
            <ul className="mt-3 space-y-3">
              {assessment.factors.map((factor) => (
                <li key={factor} className="border-t border-koby-border pt-3 text-sm leading-relaxed text-koby-text first:border-t-0 first:pt-0">
                  {factor}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-koby-border py-5">
            <Label>Revenue &amp; request</Label>
            <p className="mt-2 text-sm leading-relaxed text-koby-text-secondary">{detail.revenueSummary}</p>
            <p className="mt-2 text-sm leading-relaxed text-koby-text-secondary">{detail.requestedFinancingSummary}</p>
          </div>
          <div className="border-t border-koby-border py-5">
            <Label>Cash-flow observations</Label>
            <ul className="mt-3 space-y-3">
              {detail.cashFlowObservations.map((o) => (
                <li key={o} className="border-t border-koby-border pt-3 text-sm leading-relaxed text-koby-text-secondary first:border-t-0 first:pt-0">
                  {o}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-koby-border py-5">
            <Label>Key findings</Label>
            <ul className="mt-3 space-y-3">
              {detail.keyFindings.map((o) => (
                <li key={o} className="border-t border-koby-border pt-3 text-sm leading-relaxed text-koby-text-secondary first:border-t-0 first:pt-0">
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="min-w-0 sm:col-span-5">
          <div className="border-t-2 border-koby-text py-5">
            <Label>Recommendation</Label>
            <p className="mt-3 text-xl leading-snug font-medium tracking-tight text-koby-text">
              “{assessment.recommendation}”
            </p>
          </div>
          <div className="border-t border-koby-border py-5">
            <Label>Consistency &amp; trend</Label>
            <p className="mt-2 text-sm leading-relaxed text-koby-text-secondary">{detail.consistencyTrend}</p>
          </div>
          <div className="border-t border-koby-border py-5">
            <Label>Concentration</Label>
            <p className="mt-2 text-sm leading-relaxed text-koby-text-secondary">{detail.concentrationNotes}</p>
          </div>
          <div className="border-t border-koby-border py-5">
            <Label>Repayment capacity</Label>
            <p className="mt-2 text-sm leading-relaxed text-koby-text-secondary">{detail.repaymentCapacity}</p>
          </div>
          {detail.inconsistencies.length > 0 ? (
            <div className="border-t border-koby-border py-5">
              <Label>Inconsistencies &amp; risk indicators</Label>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-koby-text-secondary">
                {detail.inconsistencies.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {detail.missingInfo.length > 0 ? (
            <div className="border-t border-koby-border py-5">
              <Label>Missing information</Label>
              <p className="mt-2 text-sm leading-relaxed text-koby-text-secondary">
                Not provided: {detail.missingInfo.join("; ")}. Supplying these would improve the analysis.
              </p>
            </div>
          ) : null}
          <div className="border-t border-koby-border py-5">
            <Label>Reviewer note</Label>
            <p className="mt-2 text-sm font-medium text-koby-text">Human/financier review required.</p>
            <p className="mt-1 text-sm leading-relaxed text-koby-text-secondary">{detail.reviewerNote}</p>
            <p className="mt-3 text-xs leading-relaxed text-koby-text-muted">{detail.confidenceLimitations}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
