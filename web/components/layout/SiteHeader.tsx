import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { SiteNav, MobileNavMenu } from "@/components/layout/SiteNav";
import { NetworkNotice } from "@/components/wallet/NetworkNotice";
import { WalletButton } from "@/components/wallet/WalletButton";
import { Button } from "@/components/ui/Button";

/**
 * SiteHeader — sticky structural chrome (DESIGN.md Sections 10/20).
 * Logo + wordmark left, desktop nav beside it, actions right:
 * create action (sm and up), Privy connect control, mobile menu
 * control at the top-right.
 *
 * Mobile is a single non-wrapping row: every control is shrink-0 with
 * nowrap labels, the brand takes the remaining space (min-w-0/flex-1),
 * and the create action lives in the hamburger menu instead of the bar —
 * so nothing can push the header wider than the viewport. Wallet status
 * stays compact (address pill + disconnect only); wrong-network recovery
 * lives in NetworkNotice, a calm second row below the main bar, so it can
 * never crowd the header controls or clip at 320–414px.
 * Bottom boundary is a segmented strata rule, not a plain border.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 bg-koby-bg">
      <Container className="min-w-0">
        <div className="flex min-h-16 min-w-0 flex-nowrap items-center justify-between gap-2 py-2 sm:h-16 sm:py-0">
          <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-6">
            <Link
              href="/"
              aria-label="Koby home"
              className="flex min-w-0 shrink-0 items-center gap-2"
            >
              <Image
                src="/koby-logo-symbol.jpg"
                alt="Koby"
                width={28}
                height={28}
                className="h-6 w-6 shrink-0 rounded-[6px] border border-koby-border bg-white object-cover sm:h-7 sm:w-7"
                priority
              />
              {/* Wordmark hidden on the narrowest phones (logo mark stays);
                  the connected wallet pill needs the room at 320px. */}
              <span className="hidden truncate text-lg font-bold tracking-tight whitespace-nowrap text-koby-text min-[375px]:inline">
                Koby
              </span>
            </Link>
            <SiteNav />
          </div>
          <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
            {/*
              Visibility wrapper (not the Button itself): Button's base
              `inline-flex` beats the `hidden` utility in the Tailwind v4
              display cascade, so `hidden` must live on a plain wrapper to
              actually hide the create action below sm. Verified at 320px:
              the unwrapped Button rendered 192px wide and forced page
              overflow (document scrollWidth 421).
            */}
            <span className="hidden shrink-0 sm:inline-flex">
              <Button
                href="/financing/create"
                variant="secondary"
                size="sm"
                className="whitespace-nowrap"
              >
                Create financing request
              </Button>
            </span>
            <WalletButton />
            <MobileNavMenu />
          </div>
        </div>
      </Container>
      <NetworkNotice />
      <div aria-hidden="true" className="flex h-[2px]">
        <span className="flex-1 bg-koby-border" />
        <span className="w-24 bg-koby-border-strong sm:w-40" />
        <span className="w-10 bg-koby-accent sm:w-16" />
      </div>
    </header>
  );
}
