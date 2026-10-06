"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { SITE_LINKS } from "@/lib/nav";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * SiteNav — persistent, low-decoration primary navigation
 * (DESIGN.md Section 20). Desktop inline links only; the mobile menu
 * lives in MobileNavMenu below so the header can place its control at
 * the top-right. No wallet required to browse.
 */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {SITE_LINKS.map((link) => (
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
    </nav>
  );
}

/**
 * MobileNavMenu — compact collapsible menu for narrow viewports, rendered
 * by the header at the top-right. The dropdown is anchored to the button
 * (right-aligned, viewport-capped) so it overlays content without causing
 * horizontal scrolling. Closes on outside tap, Escape, navigation, or
 * item selection, with 44px touch targets throughout.
 */
export function MobileNavMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on navigation, including back/forward buttons and programmatic
  // route changes (item taps close via their own onClick). Render-time
  // adjustment on the pathname value — never setState inside an effect.
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
  }

  // Close on outside tap.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open ]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open ]);

  return (
    <div ref={rootRef} className="relative shrink-0 md:hidden">
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
          className="absolute top-[calc(100%+8px)] right-0 z-30 w-56 max-w-[calc(100vw-2.5rem)] rounded-koby-md border border-koby-border bg-koby-surface p-2 shadow-lg"
        >
          {SITE_LINKS.map((link) => (
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
          <li className="mt-1 border-t border-koby-border pt-1">
            <Link
              href="/financing/create"
              onClick={() => setOpen(false)}
              className="flex min-h-[44px] items-center rounded-koby-sm px-3 text-sm font-medium text-koby-text-secondary"
            >
              Create financing request
            </Link>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
