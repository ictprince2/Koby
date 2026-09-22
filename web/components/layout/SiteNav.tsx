"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/** Product areas only — ARCHITECTURE.md Section 3. No invented sections. */
const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/activity", label: "Activity" },
] as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * SiteNav — persistent, low-decoration primary navigation
 * (DESIGN.md Section 20). Desktop inline links; compact collapsible menu on
 * mobile with 44px touch targets. No wallet required to browse.
 */
export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav aria-label="Primary">
      {/* Desktop */}
      <ul className="hidden items-center gap-1 md:flex">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
              className={cn(
                "inline-flex min-h-[44px] items-center rounded-koby-sm px-3 text-sm font-medium transition-colors",
                isActive(pathname, link.href)
                  ? "text-koby-text underline decoration-koby-accent decoration-2 underline-offset-8"
                  : "text-koby-text-secondary hover:text-koby-text",
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Mobile */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-koby-sm border border-koby-border text-koby-text"
        >
          <span aria-hidden="true">{open ? "✕" : "☰"}</span>
        </button>
        {open ? (
          <ul
            id="mobile-nav"
            className="absolute inset-x-4 top-16 z-10 rounded-koby-md border border-koby-border bg-koby-surface p-2"
          >
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, link.href) ? "page" : undefined}
                  className={cn(
                    "flex min-h-[44px] items-center rounded-koby-sm px-3 text-sm font-medium",
                    isActive(pathname, link.href)
                      ? "bg-koby-bg-secondary text-koby-text"
                      : "text-koby-text-secondary",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </nav>
  );
}
