import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Container — single content-width + page-margin system (DESIGN.md Section 9).
 * 1152px measure; 20px gutters mobile, 32px tablet, 40px desktop.
 */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[var(--koby-content-max)] px-5 sm:px-8 lg:px-10",
        className,
      )}
    >
      {children}
    </div>
  );
}
