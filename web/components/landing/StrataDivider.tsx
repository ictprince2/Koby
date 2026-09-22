import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/cn";

/**
 * StrataDivider — full-bleed layered divider between major movements.
 * Three offset hairlines (neutral, neutral, accent segment) with an
 * optional mono note. Used sparingly: a divider must separate two
 * genuinely different movements, not decorate a same-tone gap.
 */
export function StrataDivider({ note, className }: { note?: string; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("border-y border-koby-border bg-koby-bg", className)}>
      <Container>
        <div className="flex items-center gap-5 py-2.5">
          <div className="flex-1 space-y-[3px]" aria-hidden="true">
            <div className="h-px bg-koby-border-strong" />
            <div className="ml-10 h-px bg-koby-border sm:ml-20" />
            <div className="h-px w-1/2 bg-koby-accent/70 sm:w-1/3" />
          </div>
          {note !== undefined ? (
            <span className="shrink-0 font-mono text-[11px] tracking-[0.14em] text-koby-text-muted uppercase">
              {note}
            </span>
          ) : null}
        </div>
      </Container>
    </div>
  );
}
