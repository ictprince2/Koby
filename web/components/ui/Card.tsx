import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "children" | "title">;

/**
 * Card — for genuinely discrete, comparable items (DESIGN.md Section 10),
 * e.g. a marketplace opportunity or a dashboard KPI. Not a default wrapper.
 */
export function Card({ title, description, children, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-koby-md border border-koby-border bg-koby-surface p-5",
        className,
      )}
      {...rest}
    >
      {title !== undefined || description !== undefined ? (
        <div className="mb-3">
          {title !== undefined ? (
            <h3 className="text-base font-semibold text-koby-text">{title}</h3>
          ) : null}
          {description !== undefined ? (
            <p className="mt-1 text-sm text-koby-text-secondary">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

type PanelProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children" | "title">;

/**
 * Panel — flatter grouping for larger content sections (e.g. AI assessment),
 * tonal contrast over borders (DESIGN.md Section 10).
 */
export function Panel({ title, description, children, className, ...rest }: PanelProps) {
  return (
    <section
      className={cn("rounded-koby-md bg-koby-bg-secondary p-5 sm:p-6", className)}
      {...rest}
    >
      {title !== undefined || description !== undefined ? (
        <div className="mb-4">
          {title !== undefined ? (
            <h2 className="text-lg font-semibold text-koby-text">{title}</h2>
          ) : null}
          {description !== undefined ? (
            <p className="mt-1 text-sm text-koby-text-secondary">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
