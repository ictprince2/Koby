import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  /** Small uppercase label. Rationed: at most 1 eyebrow per 3 sections. */
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
};

/**
 * SectionHeading — stacked headline block (headline, then description).
 * Never the split left-headline/right-paragraph pattern; one focused
 * message per section.
 */
export function SectionHeading({ eyebrow, title, description, className }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow !== undefined ? (
        <p className="text-xs font-semibold tracking-widest text-koby-text-muted uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-2xl font-bold tracking-tight text-koby-text sm:text-3xl",
          eyebrow !== undefined && "mt-2",
        )}
      >
        {title}
      </h2>
      {description !== undefined ? (
        <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-koby-text-secondary">
          {description}
        </p>
      ) : null}
    </div>
  );
}
