import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { WalletProvider } from "@/hooks/useWallet";

/**
 * AppShell — header + main + footer for every route. Pages render their own
 * content inside <main>; chrome stays consistent and wallet-independent.
 * The WalletProvider is the single wallet abstraction for the whole app.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <div className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </div>
    </WalletProvider>
  );
}
