"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * ThemeToggle — light/dark switch with hierarchy parity in both modes
 * (DESIGN.md Section 7). Persists to localStorage; defaults to OS preference
 * via the init script in app/layout.tsx.
 *
 * Source of truth for the theme is `document.documentElement`'s `dark`
 * class (set pre-hydration by the init script). The initial render always
 * uses the light default so server HTML and the first client render agree;
 * the real value is read in an effect after hydration, so there is no
 * hydration mismatch regardless of the stored/OS theme.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("koby-theme", next ? "dark" : "light");
    } catch {
      // Storage unavailable — theme still applies for this session.
    }
    setDark(next);
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-koby-sm",
        "border border-koby-border text-sm text-koby-text-secondary hover:text-koby-text",
        className,
      )}
    >
      <span aria-hidden="true">{dark ? "☀" : "☾"}</span>
    </button>
  );
}
