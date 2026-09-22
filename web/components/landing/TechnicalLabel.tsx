import { cn } from "@/lib/cn";

/**
 * TechnicalLabel — 11-13px uppercase mono annotation for metadata, state
 * names, and figure labels. Never a section eyebrow (those stay rationed
 * in SectionHeading); this is for inline technical texture with a reason.
 */
export function TechnicalLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}
