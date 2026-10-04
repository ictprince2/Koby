/**
 * Official social / external presence (footer Social section).
 *
 * Lives in lib/ — not in a `"use client"` module — so the
 * server-rendered SiteFooter can import it (same pattern as lib/nav.ts).
 *
 * Adding Koby's official X account later is a configuration change only:
 * set NEXT_PUBLIC_X_URL (see web/.env.example) and the footer renders the
 * link with no component redesign. Empty = no link is rendered or
 * invented; the footer shows its minimal standby state instead.
 */

function nonEmpty(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export type SocialLink = {
  label: string;
  href: string;
};

const officialXUrl = nonEmpty(process.env.NEXT_PUBLIC_X_URL);

export const SOCIAL_LINKS: readonly SocialLink[] = [
  ...(officialXUrl !== null ? [{ label: "X", href: officialXUrl }] : []),
];
