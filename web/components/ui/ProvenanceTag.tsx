import type { Provenance } from "@/lib/types";
import { cn } from "@/lib/cn";

const PROVENANCE_STYLES: Record<Provenance, string> = {
  Onchain: "border-koby-success text-koby-success",
  Indexed: "border-koby-info text-koby-info",
  "External Data": "border-koby-info text-koby-info",
  "AI Analysis": "border-koby-ai text-koby-ai",
  "User Provided": "border-koby-border-strong text-koby-text-secondary",
  // Simulated/demo states: single consistent dashed treatment, never
  // warning/error colors (DESIGN.md Sections 7/25).
  Demo: "border-dashed border-koby-demo-border text-koby-demo-text",
  Simulated: "border-dashed border-koby-demo-border text-koby-demo-text",
  Testnet: "border-dashed border-koby-border-strong text-koby-text-secondary",
};

/**
 * ProvenanceTag — small source label attached to any value whose provenance
 * isn't obvious from context (DESIGN.md Section 14, USER_FLOW.md Section 21).
 * Lightweight; never competes with the value itself.
 */
export function ProvenanceTag({ source }: { source: Provenance }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-koby-sm border px-1.5 py-0.5",
        "text-[11px] font-medium tracking-wide uppercase",
        PROVENANCE_STYLES[source],
      )}
    >
      {source}
    </span>
  );
}
