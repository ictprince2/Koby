import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { SiteNav } from "@/components/layout/SiteNav";
import { WalletButton } from "@/components/wallet/WalletButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";

/**
 * SiteHeader — sticky structural chrome (DESIGN.md Sections 10/20).
 * Wordmark + primary nav + create action + wallet area + theme toggle.
 * Bottom boundary is a segmented strata rule, not a plain border.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 bg-koby-bg">
      <Container>
        <div className="flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              aria-label="Koby home"
              className="text-lg font-bold tracking-tight text-koby-text"
            >
              Koby
            </Link>
            <SiteNav />
          </div>
          <div className="flex items-center gap-2">
            <Button href="/financing/create" variant="secondary" size="sm" className="hidden sm:inline-flex">
              Create financing request
            </Button>
            <ThemeToggle />
            <WalletButton />
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
