import { StrataField } from "@/components/landing/StrataField";
import { TechnicalLabel } from "@/components/landing/TechnicalLabel";

/**
 * LiquidityFigure - the signature receivables to liquidity visual.
 *
 * A single vertical ledger plate that reads top to bottom as time moves
 * from future commitment to present liquidity to programmed paydown:
 *
 * Future (top, diffuse, dashed boundary): $100,000 estimate, muted, dated
 * as illustrative. Settlement (middle seam, full ink): $70,000 financing
 * available now, crossed by the vertical settlement fault. Repayment
 * (bottom): six ticks that drain left to right, validated per transaction
 * until the balance reaches zero.
 *
 * All figures are the canonical illustrative example. Nothing here is
 * onchain state. Motion is limited to one animated dash connector and the
 * fault draw that arrives with the parent Reveal. Reduced motion collapses
 * both via the global rule in globals.css.
 */
export function LiquidityFigure() {
  return (
    <div
      aria-label="Illustrative example: $100,000 in expected receivables becomes $70,000 in financing now, repaid over time"
      className="koby-frame relative overflow-hidden rounded-koby-lg border border-koby-border-strong bg-koby-surface"
    >
      <StrataField bands={6} fault="vertical" />
      <div className="relative flex min-h-[440px] flex-col sm:min-h-[480px]">
        {/* Future commitment. Dashed boundary and muted figure read as estimate. */}
        <div className="p-6 pb-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <TechnicalLabel>Future receivables - estimate</TechnicalLabel>
            <span className="shrink-0 border border-dashed border-koby-border-strong px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-koby-text-muted uppercase">
              Illustrative
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-koby-text-secondary sm:text-4xl">
            $100,000
          </p>
          <p className="mt-1 text-xs leading-relaxed text-koby-text-muted">
            Expected revenue described by the business. Never guaranteed.
          </p>
          <p className="mt-2 font-mono text-[11px] tabular-nums text-koby-text-muted">
            Due in 90 days (illustrative)
          </p>
        </div>

        {/* Eligibility connector. One animated dash, vertical, future to now. */}
        <div aria-hidden="true" className="flex items-stretch gap-3 px-6">
          <div className="flex flex-col items-center">
            <span className="h-2 w-2 rounded-full border border-koby-border-strong bg-koby-bg" />
            <svg width="2" height="36" fill="none" preserveAspectRatio="none" viewBox="0 0 2 36" className="my-1">
              <line
                x1="1"
                y1="0"
                x2="1"
                y2="36"
                stroke="var(--koby-accent)"
                strokeWidth="1.5"
                className="koby-flowdash"
              />
            </svg>
            <span className="h-2 w-2 rounded-full bg-koby-accent" />
          </div>
          <p className="pt-1 font-mono text-[11px] tracking-[0.08em] text-koby-text-muted uppercase">
            Eligibility review
          </p>
        </div>

        {/* Present liquidity. The seam is the settlement event. Full ink hero figure. */}
        <div className="mt-4 border-t-2 border-t-koby-accent bg-koby-surface/80 px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <TechnicalLabel className="text-koby-accent">Financing - liquidity now</TechnicalLabel>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-koby-accent">
              Now
            </span>
          </div>
          <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-koby-text sm:text-5xl">
            $70,000
          </p>
          <p className="mt-1 text-xs leading-relaxed text-koby-text-muted">
            Eligible amount proposed from the assessment, funded by a financier.
          </p>
        </div>

        {/* Programmed paydown. Six ticks drain toward completion. Static by design. */}
        <div className="border-t border-koby-border px-6 py-5">
          <div className="flex items-center justify-between gap-2">
            <TechnicalLabel>Monad settlement</TechnicalLabel>
            <span className="font-mono text-[11px] text-koby-text-muted">90 days</span>
          </div>
          <div
            aria-hidden="true"
            className="mt-3 grid grid-cols-6 gap-1.5"
          >
            <span className="h-2 rounded-full bg-koby-accent" />
            <span className="h-2 rounded-full bg-koby-accent" />
            <span className="h-2 rounded-full bg-koby-accent/50" />
            <span className="h-2 rounded-full bg-koby-border-strong/60" />
            <span className="h-2 rounded-full bg-koby-border-strong/60" />
            <span className="h-2 rounded-full border border-koby-border-strong" />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-koby-text-muted">
            Repayment validated per transaction until the balance reaches zero.
            Illustrative schedule.
          </p>
        </div>
      </div>
    </div>
  );
}
