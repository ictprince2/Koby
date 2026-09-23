"use client";

import type { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { monadChainForPrivy, privyAppId } from "@/lib/privy";

/**
 * Providers — the single client-side provider boundary for the app
 * (App Router: app/layout.tsx stays a Server Component).
 *
 * RootLayout (server)
 * └─ Providers (client)
 *    └─ PrivyProvider (client, only when NEXT_PUBLIC_PRIVY_APP_ID is set)
 *       └─ WalletProvider (in AppShell — Koby's wallet abstraction)
 *          └─ AppShell / Koby UI
 *
 * Privy is wallet/identity/signing onboarding; viem remains the blockchain
 * interaction layer and lib/monad.ts remains the chain source of truth
 * (monadChainForPrivy is derived from it, never duplicated).
 *
 * When no App ID is configured, children render without Privy and the
 * existing injected-wallet flow works exactly as before.
 */
const privyConfig = {
  defaultChain: monadChainForPrivy,
  supportedChains: [monadChainForPrivy],
  embeddedWallets: {
    ethereum: {
      // Users without any wallet are prompted to create an embedded one
      // after login. Users with a wallet are never forced to create another.
      createOnLogin: "users-without-wallets" as const,
    },
  },
  appearance: {
    walletChainType: "ethereum-only" as const,
  },
};

export function Providers({ children }: { children: ReactNode }) {
  const appId = privyAppId();
  if (!appId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[koby] NEXT_PUBLIC_PRIVY_APP_ID is not set — Privy onboarding is disabled; injected wallets still work.",
      );
    }
    return <>{children}</>;
  }
  return (
    <PrivyProvider appId={appId} config={privyConfig}>
      {children}
    </PrivyProvider>
  );
}
