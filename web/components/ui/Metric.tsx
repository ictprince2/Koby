import type { Provenance } from "@/lib/types";
import { cn } from "@/lib/cn";
import { ProvenanceTag } from "@/components/ui/ProvenanceTag";

type MetricProps = {
  /** Short label, e.g. "Financing". */
  label: string;
  /**
   * Pre-formatted display string, e.g. "$70,000". The Metric never computes
   * finance — callers pass strings formatted at the UI boundary (lib/format).
   */
  value: string;
  caption?: string;
  provenance?: Provenance;
  className?: string;
};

/**
 * Metric — the KPI/hero-number pattern (DESIGN.md Section 8, PRD.md Section 18).
 * Tabular figures, one dominant value. At most one hero Metric per view.
 */
export function Metric({ label, value, caption, provenance, className }: MetricProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <dt className="order-2 text-sm font-medium text-koby-text-secondary">{label}</dt>
      <dd className="order-1 text-3xl font-bold tabular-nums tracking-tight text-koby-text sm:text-4xl">
        {value}
      </dd>
      {caption !== undefined ? (
        <p className="order-3 text-xs text-koby-text-muted">{caption}</p>
      ) : null}
      {provenance !== undefined ? (
        <div className="order-4 mt-1">
          <ProvenanceTag source={provenance} />
        </div>
      ) : null}
    </div>
  );
}
