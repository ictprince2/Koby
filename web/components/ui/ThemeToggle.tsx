"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";

function initialDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

/**
 * ThemeToggle — light/dark switch with hierarchy parity in both modes
 * (DESIGN.md Section 7). Persists to localStorage; defaults to OS preference
 * via the init script in app/layout.tsx.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(initialDark);

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
