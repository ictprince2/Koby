import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { SiteNav, MobileNavMenu } from "@/components/layout/SiteNav";
import { WalletButton } from "@/components/wallet/WalletButton";
import { Button } from "@/components/ui/Button";

/**
 * SiteHeader — sticky structural chrome (DESIGN.md Sections 10/20).
 * Wordmark left, primary nav beside it on desktop, actions right.
 * On mobile the menu control sits at the top-right; the dropdown is
 * anchored to it so it can never overflow the viewport.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 bg-koby-bg">
      <Container>
        <div className="flex min-h-16 items-center justify-between gap-2 py-2 sm:h-16 sm:py-0">
          <div className="flex min-w-0 items-center gap-4 md:gap-6">
            <Link
              href="/"
              aria-label="Koby home"
              className="shrink-0 text-lg font-bold tracking-tight text-koby-text"
            >
              Koby
            </Link>
            <SiteNav />
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button href="/financing/create" variant="secondary" size="sm" className="hidden sm:inline-flex">
              Create financing request
            </Button>
            <WalletButton />
            <MobileNavMenu />
          </div>
        </div>
      </Container>
      <div aria-hidden="true" className="flex h-[2px]">
        <span className="flex-1 bg-koby-border" />
        <span className="w-24 bg-koby-border-strong sm:w-40" />
        <span className="w-10 bg-koby-accent sm:w-16" />
      </div>
    </header>
  );
}
