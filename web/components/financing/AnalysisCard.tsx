import { Panel } from "@/components/ui/Card";
import { ProvenanceTag } from "@/components/ui/ProvenanceTag";
import type { AnalysisResult } from "@/lib/analysis";

/**
 * AnalysisCard — the RiskAssessment presentation (AI.md Section 24):
 * assessment, confidence, key factors, recommendation. Always labeled
 * Demo AI Assessment while the deterministic fallback is the source.
 */
export function AnalysisCard({ result }: { result: AnalysisResult }) {
  const { assessment } = result;
  return (
    <Panel
      title="AI cash-flow assessment"
      description="Advisory only. This assessment informs the financing decision; it never sets terms or moves funds."
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ProvenanceTag source="Simulated" />
        <span className="text-xs font-medium text-koby-text-secondary">Demo AI Assessment</span>
        <span className="font-mono text-xs text-koby-text-muted">{result.methodologyVersion}</span>
      </div>
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
    </Panel>
  );
}
