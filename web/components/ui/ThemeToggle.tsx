"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * ThemeToggle — light/dark switch with hierarchy parity in both modes
 * (DESIGN.md Section 7). Persists to localStorage.
 *
 * Source of truth for the theme is `document.documentElement`'s `dark`
 * class. The initial render always uses the light default so server HTML
 * and the first client render agree; the real value is read in an effect
 * after hydration, so there is no hydration mismatch.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);

  // Read the applied theme after hydration so server HTML and the first
  // client render agree (no hydration mismatch). State lands in the
  // timeout callback below, never synchronously in the effect body.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDark(document.documentElement.classList.contains("dark"));
    }, 0);
    return () => window.clearTimeout(timer);
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
