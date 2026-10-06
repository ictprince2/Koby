import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { SITE_LINKS } from "@/lib/nav";
import { CONTACT_EMAIL } from "@/lib/contact";
import { kobyConfig } from "@/lib/config";

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
 * globals.css, both modes). Brand row, then Product + Resources
 * side-by-side on mobile (editorial 12-col grid on desktop), then a
 * compact contact row, then the lower legal row with copyright and the
 * network name as infrastructure metadata.
 *
 * Deliberately absent until real destinations exist: Privacy/Terms (no
 * pages), social links (no official URLs configured — no standby block,
 * no invented links), per-column contract status (the legal row names
 * the network only).
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-koby-footer-border bg-koby-footer-bg">
      <Container>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-6 text-left sm:py-12 lg:grid-cols-12 lg:gap-10">
          <div className="col-span-2 min-w-0 lg:col-span-4 lg:max-w-sm">
            <Link
              href="/"
              aria-label="Koby home"
              className="flex items-center gap-2"
            >
              <Image
                src="/koby-logo.svg"
                alt="Koby"
                width={24}
                height={24}
                className="h-6 w-6 shrink-0"
              />
              <span className="text-lg font-bold tracking-tight whitespace-nowrap text-koby-footer-text">
                Koby
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-koby-footer-text-secondary">
              Onchain receivables financing infrastructure.
            </p>
          </div>

          <nav aria-label="Footer product" className="min-w-0 lg:col-span-2">
            <FooterHeading>Product</FooterHeading>
            <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
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

          <nav aria-label="Footer resources" className="min-w-0 lg:col-span-2">
            <FooterHeading>Resources</FooterHeading>
            <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
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

          <div className="col-span-2 min-w-0 lg:col-span-4">
            <FooterHeading>Contact</FooterHeading>
            <p className="mt-3 sm:mt-4">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-sm break-words text-koby-footer-text-secondary transition-colors hover:text-koby-footer-text"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1 border-t border-koby-footer-border py-4 text-left text-xs text-koby-footer-muted sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:py-5">
          <p>© 2026 Koby</p>
          <p>{kobyConfig.chainName}</p>
        </div>
      </Container>
    </footer>
  );
}
