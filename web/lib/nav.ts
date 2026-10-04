/**
 * Canonical product-area navigation (ARCHITECTURE.md Section 3).
 *
 * Lives in lib/ — not in a `"use client"` module — so both the client
 * SiteNav and the server-rendered SiteFooter can import it. Data exports
 * from client-boundary modules do not cross to the server, so this list
 * must stay here to remain the single source of truth.
 *
 * Product areas only. No invented sections.
 */
export const SITE_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/activity", label: "Activity" },
] as const;
