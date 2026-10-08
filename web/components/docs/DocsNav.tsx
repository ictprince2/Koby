"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/**
 * Documentation sections. Single source of truth for the docs sidebar,
 * the mobile docs menu, and prev/next links between doc pages.
 */
export const DOC_SECTIONS = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/how-it-works", label: "How It Works" },
  { href: "/docs/architecture", label: "Architecture" },
  { href: "/docs/monad", label: "Monad Integration" },
  { href: "/docs/ai-assessment", label: "AI Assessment" },
  { href: "/docs/security", label: "Smart Contracts & Security" },
  { href: "/docs/developer-guide", label: "Developer Guide" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/docs") return pathname === "/docs";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * DocsNav — left sidebar on desktop (sticky), collapsible menu on mobile.
 * Active page is indicated with text color + accent bar (never color alone:
 * aria-current="page" is set for assistive technology).
 */
export function DocsNav() {
  const pathname = usePathname();
  const current =
    DOC_SECTIONS.find((section) => isActive(pathname, section.href)) ?? DOC_SECTIONS[0];

  return (
    <>
      {/* Mobile: accessible collapsible navigation menu. */}
      <details className="rounded-koby-md border border-koby-border bg-koby-surface lg:hidden">
        <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 truncate">
            <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase">
              Docs ·{" "}
            </span>
            <span className="font-semibold text-koby-text">{current.label}</span>
          </span>
          <span aria-hidden="true" className="shrink-0 text-koby-text-muted">
            ☰
          </span>
        </summary>
        <nav aria-label="Documentation sections">
          <ul className="border-t border-koby-border p-2">
            {DOC_SECTIONS.map((section) => {
              const active = isActive(pathname, section.href);
              return (
                <li key={section.href}>
                  <Link
                    href={section.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-[44px] items-center rounded-koby-sm px-3 text-sm font-medium",
                      active
                        ? "bg-koby-bg-secondary text-koby-text"
                        : "text-koby-text-secondary",
                    )}
                  >
                    {section.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </details>

      {/* Desktop: sticky sidebar. */}
      <nav aria-label="Documentation sections" className="hidden lg:block">
        <div className="sticky top-24">
          <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase">
            Documentation
          </p>
          <ul className="mt-3 border-l border-koby-border">
            {DOC_SECTIONS.map((section) => {
              const active = isActive(pathname, section.href);
              return (
                <li key={section.href}>
                  <Link
                    href={section.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "-ml-px block border-l-2 py-2 pr-2 pl-4 text-sm transition-colors",
                      active
                        ? "border-koby-accent font-semibold text-koby-text"
                        : "border-transparent font-medium text-koby-text-secondary hover:text-koby-text",
                    )}
                  >
                    {section.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-[44px] items-center text-sm font-medium text-koby-text-secondary transition-colors hover:text-koby-text"
          >
            ← Back to the Koby app
          </Link>
        </div>
      </nav>
    </>
  );
}
