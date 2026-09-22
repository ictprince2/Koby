import { cn } from "@/lib/cn";

/**
 * FlowSteps — where the user is in Input -> Analysis -> Opportunity ->
 * Settlement -> Repayment. Text + position, never color-only.
 */
export const FLOW_STEPS = ["Input", "Analysis", "Opportunity", "Settlement", "Repayment"] as const;

export function FlowSteps({ current }: { current: number }) {
  return (
    <ol aria-label="Financing progress" className="flex flex-wrap items-center gap-2">
      {FLOW_STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex items-center gap-2">
            {index > 0 ? (
              <span aria-hidden="true" className="text-koby-text-muted">→</span>
            ) : null}
            <span
              aria-current={active ? "step" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-koby-sm px-2 py-1 text-xs font-semibold",
                active
                  ? "bg-koby-accent text-koby-accent-text"
                  : done
                    ? "bg-koby-success-subtle text-koby-success"
                    : "bg-koby-bg-secondary text-koby-text-muted",
              )}
            >
              <span aria-hidden="true">{done ? "✓" : `${index + 1}.`}</span>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
