import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Container — single content-width + page-margin system (DESIGN.md Section 9).
 * 1152px measure; 20px gutters mobile, 32px tablet, 40px desktop.
 * min-w-0 keeps the container from forcing width inside flex parents
 * (e.g. the single-row mobile header).
 */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto box-border w-full max-w-[var(--koby-content-max)] min-w-0 px-5 sm:px-8 lg:px-10",
        className,
      )}
    >
      {children}
    </div>
  );
}
