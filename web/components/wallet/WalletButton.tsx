"use client";

import { useState } from "react";

/**
 * WalletButton — Phase 1 placeholder for the wallet-aware header area.
 *
 * Shows the disconnected state honestly. The real connection flow
 * (provider-agnostic abstraction, Privy behind it) lands in Phase 3.
 * Clicking explains that; it never fakes a connection or an address.
 */
export function WalletButton() {
  const [showNote, setShowNote] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowNote((value) => !value)}
        aria-expanded={showNote}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-koby-sm bg-koby-accent px-4 text-sm font-semibold text-koby-accent-text transition-colors hover:bg-koby-accent-hover"
      >
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        Connect wallet
      </button>
      {showNote ? (
        <p
          role="status"
          className="absolute right-0 top-12 z-10 w-64 rounded-koby-md border border-koby-border bg-koby-surface p-3 text-xs text-koby-text-secondary"
        >
          Wallet connection arrives in Phase 3. Browsing Koby requires no wallet.
        </p>
      ) : null}
    </div>
  );
}
