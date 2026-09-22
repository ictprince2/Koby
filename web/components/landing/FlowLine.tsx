import { cn } from "@/lib/cn";
import { StrataField } from "@/components/landing/StrataField";

const NODES = [
  { name: "Future revenue", tone: "neutral" },
  { name: "Financing", tone: "neutral" },
  { name: "Liquidity", tone: "neutral" },
  { name: "Settlement", tone: "accent" },
  { name: "Repayment", tone: "accent" },
] as const;

function Connector({ accent }: { accent?: boolean }) {
  return (
    <span aria-hidden="true" className="flex w-10 shrink-0 items-center sm:w-14">
      <svg width="100%" height="8" fill="none" preserveAspectRatio="none" viewBox="0 0 56 8">
        <line
          x1="0"
          y1="4"
          x2="56"
          y2="4"
          stroke={accent === true ? "var(--koby-accent)" : "var(--koby-border-strong)"}
          strokeWidth="1.5"
          className="koby-flowdash"
        />
      </svg>
    </span>
  );
}

/**
 * FlowLine — the financing flow as infrastructure, not chips.
 * Nodes sit inside one strata vessel that deepens toward settlement;
 * animated hairline connectors carry directional movement. Settlement is
 * the emphasized node. Horizontally scrollable on mobile.
 */
export function FlowLine({ className }: { className?: string }) {
  return (
    <div
      aria-label="Financing flow: future revenue to programmable repayment"
      className={cn(
        "relative overflow-hidden rounded-koby-md border border-koby-border-strong",
        className,
      )}
    >
      <StrataField bands={3} seam={false} />
      <ol className="koby-no-scrollbar relative flex items-center gap-1 overflow-x-auto px-4 py-4 sm:px-6">
        {NODES.map((node, index) => (
          <li key={node.name} className="flex shrink-0 items-center gap-1">
            <span
              className={cn(
                "flex items-center gap-2 rounded-koby-sm px-2.5 py-1.5 whitespace-nowrap",
                node.tone === "accent" && node.name === "Settlement"
                  ? "border border-koby-accent bg-koby-accent-subtle"
                  : "border border-transparent",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  node.tone === "accent" ? "bg-koby-accent" : "bg-koby-border-strong",
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  node.tone === "accent" ? "font-semibold text-koby-accent" : "text-koby-text",
                )}
              >
                {node.name}
              </span>
            </span>
            {index < NODES.length - 1 ? (
              <Connector accent={node.name === "Liquidity"} />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
