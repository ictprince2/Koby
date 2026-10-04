import { Panel } from "@/components/ui/Card";
import type { AnalysisResponse } from "@/lib/analysis";

/**
 * AnalysisCard — the financing analysis presentation (AI.md Section 24):
 * assessment, confidence, key factors, recommendation, plus the structured
 * detail envelope. The heading names the live provider engine when live
 * output is shown, and the built-in assessment otherwise — advisory only,
 * never terms, never funds.
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

export function AnalysisCard({ result }: { result: AnalysisResponse }) {
  const { assessment, detail } = result;
  const live = result.source !== "deterministic-fallback";
  return (
    <Panel
      title="Koby Financial Analysis"
      description="Advisory analysis based on submitted financial data."
    >
      <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs">
        <span className="font-medium text-koby-text-secondary">Analysis engine</span>
        <span className="font-mono text-koby-text">{engineName(result)}</span>
      </div>
      {!live ? (
        <p className="mb-3 text-xs text-koby-text-muted">Live AI analysis currently unavailable.</p>
      ) : null}
      <p className="mb-4 text-xs text-koby-text-muted">
        This analysis is advisory only. It does not approve financing, set terms, guarantee
        repayment, or authorize any transaction.
      </p>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-koby-text-secondary">Assessment score</dt>
          <dd className="mt-1 text-3xl font-bold tabular-nums text-koby-text">
            {assessment.score}
            <span className="text-base font-medium text-koby-text-muted"> / 100</span>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-koby-text-secondary">Model confidence</dt>
          <dd className="mt-1 text-3xl font-bold tabular-nums text-koby-text">
            {assessment.confidence}
            <span className="text-base font-medium text-koby-text-muted">%</span>
          </dd>
          <p className="mt-1 text-xs text-koby-text-muted">
            Confidence reflects data completeness, not a guarantee of outcome.
          </p>
        </div>
      </dl>
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-koby-text">Key factors</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-koby-text-secondary">
          {assessment.factors.map((factor) => (
            <li key={factor}>{factor}</li>
          ))}
        </ul>
      </div>
      <div className="mt-4 rounded-koby-sm bg-koby-bg p-3">
        <h3 className="text-sm font-semibold text-koby-text">Recommendation</h3>
        <p className="mt-1 text-sm text-koby-text-secondary">{assessment.recommendation}</p>
      </div>

      <div className="mt-4 space-y-4">
        <section>
          <h3 className="text-sm font-semibold text-koby-text">Revenue &amp; request summary</h3>
          <p className="mt-1 text-sm text-koby-text-secondary">{detail.revenueSummary}</p>
          <p className="mt-1 text-sm text-koby-text-secondary">{detail.requestedFinancingSummary}</p>
        </section>
        <section>
          <h3 className="text-sm font-semibold text-koby-text">Cash-flow observations</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-koby-text-secondary">
            {detail.cashFlowObservations.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </section>
        <div className="grid gap-4 sm:grid-cols-2">
          <section>
            <h3 className="text-sm font-semibold text-koby-text">Consistency &amp; trend</h3>
            <p className="mt-1 text-sm text-koby-text-secondary">{detail.consistencyTrend}</p>
          </section>
          <section>
            <h3 className="text-sm font-semibold text-koby-text">Concentration</h3>
            <p className="mt-1 text-sm text-koby-text-secondary">{detail.concentrationNotes}</p>
          </section>
        </div>
        <section>
          <h3 className="text-sm font-semibold text-koby-text">Repayment capacity</h3>
          <p className="mt-1 text-sm text-koby-text-secondary">{detail.repaymentCapacity}</p>
        </section>
        {detail.inconsistencies.length > 0 ? (
          <section>
            <h3 className="text-sm font-semibold text-koby-text">Inconsistencies &amp; risk indicators</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-koby-text-secondary">
              {detail.inconsistencies.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {detail.missingInfo.length > 0 ? (
          <section>
            <h3 className="text-sm font-semibold text-koby-text">Missing information</h3>
            <p className="mt-1 text-sm text-koby-text-secondary">
              Not provided: {detail.missingInfo.join("; ")}. Supplying these would improve the analysis.
            </p>
          </section>
        ) : null}
        <section>
          <h3 className="text-sm font-semibold text-koby-text">Key findings</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-koby-text-secondary">
            {detail.keyFindings.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </section>
        <p className="text-xs text-koby-text-muted">{detail.confidenceLimitations}</p>
        <div className="rounded-koby-sm border border-koby-border-strong p-3">
          <p className="text-sm font-semibold text-koby-text">Human/financier review required</p>
          <p className="mt-1 text-sm text-koby-text-secondary">{detail.reviewerNote}</p>
        </div>
      </div>
    </Panel>
  );
}
