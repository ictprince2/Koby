"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms for sequenced reveals. Keep small (restrained motion). */
  delay?: number;
};

/**
 * Reveal — scroll-triggered entrance for landing storytelling only
 * (DESIGN.md Section 29, landing may use more expressive motion than the
 * product screens). Opacity + 12px rise, nothing else. Respects
 * prefers-reduced-motion by showing content immediately, and degrades to
 * visible when scripting is unavailable (see globals.css fallback).
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("koby-reveal-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("koby-reveal-visible");
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("koby-reveal", className)}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
