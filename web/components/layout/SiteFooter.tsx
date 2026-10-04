import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { SITE_LINKS } from "@/lib/nav";
import { SOCIAL_LINKS } from "@/lib/social";
import { isContractConfigured, isNetworkConfigured, kobyConfig } from "@/lib/config";

/** Official product contact address. Rendered visibly with a mailto: link. */
const CONTACT_EMAIL = "princesundayk9@gmail.com";

/**
 * Product column: primary nav entries reused from lib/nav.ts (single source
 * of truth, shared with SiteNav) with the header's create action slotted
 * between Marketplace and Activity. All four are real app routes.
 */
const PRODUCT_LINKS = [
  SITE_LINKS[0],
  SITE_LINKS[1],
  { href: "/financing/create", label: "Create financing request" },
  SITE_LINKS[2],
] as const;

/**
 * Resources column: only destinations that exist. "How it works" targets
 * the lifecycle section on the homepage; "Monad explorer" uses the
 * configured explorer URL (lib/config.ts), never a hardcoded address.
 *
 * Intentionally omitted until real destinations exist (no dead links):
 * - Documentation (no docs page or URL configured)
 * - Security (no security page configured)
 */
const RESOURCE_LINKS = [
  { href: "/#koby-lifecycle-heading", label: "How it works" },
  { href: kobyConfig.explorerUrl, label: "Monad explorer", external: true },
] as const;

/**
 * Column heading — same mono/uppercase TechnicalLabel language as the rest
 * of the site, rendered inline with footer-scoped color. (TechnicalLabel
 * itself is not reused here because the project's `cn` is a plain joiner
 * with no class merging — layering a second text color would conflict.)
 */
function FooterHeading({ children }: { children: string }) {
  return (
    <h2 className="font-mono text-[11px] font-medium tracking-[0.14em] text-koby-footer-muted uppercase">
      {children}
    </h2>
  );
}

/**
 * SiteFooter — quiet infrastructure footer, not a SaaS sitemap.
 *
 * Deliberate deep-charcoal closing section (footer-scoped tokens in
 * globals.css, both modes). Brand + product/resources/contact/social
 * columns on one row, then a subtle lower row with the copyright and the
 * testnet status as infrastructure metadata (chain name + contract state
 * from lib/config.ts, reported truthfully: pending states are shown as
 * pending, never guessed).
 *
 * Social/External is configuration-driven (lib/social.ts via
 * NEXT_PUBLIC_X_URL): adding the official X URL later renders the link
 * with no redesign, and no link is invented while it is unset.
 *
 * Deliberately absent until real destinations exist: Privacy/Terms (no
 * pages), Website (no URL configured).
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-koby-footer-border bg-koby-footer-bg">
      <Container>
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-4 lg:max-w-sm">
            <Link
              href="/"
              aria-label="Koby home"
              className="text-lg font-bold tracking-tight text-koby-footer-text"
            >
              Koby
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-koby-footer-text-secondary">
              Onchain receivables financing infrastructure.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-koby-footer-muted">
              Turn future business cash flow into immediate liquidity.
            </p>
          </div>

          <nav aria-label="Footer product" className="lg:col-span-2">
            <FooterHeading>Product</FooterHeading>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-koby-footer-text-secondary transition-colors hover:text-koby-footer-text"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Footer resources" className="lg:col-span-2">
            <FooterHeading>Resources</FooterHeading>
            <ul className="mt-4 space-y-2.5">
              {RESOURCE_LINKS.map((link) =>
                "external" in link && link.external ? (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-koby-footer-text-secondary transition-colors hover:text-koby-footer-text"
                    >
                      {link.label}
                    </a>
                  </li>
                ) : (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-koby-footer-text-secondary transition-colors hover:text-koby-footer-text"
                    >
                      {link.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="lg:col-span-2">
            <FooterHeading>Contact</FooterHeading>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-sm break-all text-koby-footer-text-secondary transition-colors hover:text-koby-footer-text"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <FooterHeading>Social</FooterHeading>
            {SOCIAL_LINKS.length > 0 ? (
              <ul className="mt-4 space-y-2.5">
                {SOCIAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-koby-footer-text-secondary transition-colors hover:text-koby-footer-text"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-koby-footer-muted">
                Official channels coming soon.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-koby-footer-border py-5 text-xs text-koby-footer-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Koby</p>
          <p aria-live="polite">
            {kobyConfig.chainName} · Contract:{" "}
            {isContractConfigured() ? "configured" : "not yet deployed (pending verification)"}
            {isNetworkConfigured() ? "" : " · Network config pending verification"}
          </p>
        </div>
      </Container>
    </footer>
  );
}
