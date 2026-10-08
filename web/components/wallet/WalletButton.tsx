"use client";

import { useState } from "react";
import { truncateHex } from "@/lib/format";
import { monadConfig } from "@/lib/monad";
import { toHexChainId, useWallet } from "@/hooks/useWallet";

/**
 * WalletButton — the ONLY wallet connection UI in Koby (USER_FLOW.md
 * Section 5). Privy is the single connection authority: this button opens
 * the real Privy login modal (wallet selection, embedded wallets, and
 * multi-wallet support all live inside Privy), shows the connected address,
 * and disconnects by ending the Privy session. Never fakes a connection,
 * an address, or a wallet. On the wrong network it blocks transaction
 * actions and offers a switch. There is no second connector and no wallet
 * chooser dialog — wallet selection happens in the Privy modal.
 */
export function WalletButton() {
  const {
    status,
    address,
    chainId,
    isCorrectNetwork,
    error,
    walletLabel,
    connectPrivy,
    disconnect,
    switchToMonad,
  } = useWallet();
  const [busy, setBusy] = useState(false);

  async function onConnectClick() {
    if (busy || status === "connecting") return;
    setBusy(true);
    try {
      await connectPrivy();
    } finally {
      setBusy(false);
    }
  }

  if (status === "connected" && address) {
    return (
      <div className="relative flex min-w-0 max-w-full flex-wrap items-center justify-end gap-1.5 sm:gap-2">
        {!isCorrectNetwork ? (
          <button
            type="button"
            onClick={() => void switchToMonad()}
            title={`Connected to chain ${chainId}. Switch to ${monadConfig.chainName} (${toHexChainId(monadConfig.chainId)}).`}
            className="inline-flex min-h-[44px] max-w-full items-center rounded-koby-sm border border-koby-error bg-koby-error-subtle px-3 text-xs font-semibold text-koby-error"
          >
            <span className="truncate">Wrong network — switch to {monadConfig.chainName}</span>
          </button>
        ) : null}
        <span
          title={walletLabel ? `Connected with ${walletLabel}: ${address}` : address}
          aria-label={`Connected wallet ${address}${walletLabel ? ` via ${walletLabel}` : ""}`}
          className="inline-flex min-h-[44px] min-w-0 items-center gap-2 rounded-koby-sm border border-koby-border bg-koby-surface px-2 font-mono text-sm whitespace-nowrap text-koby-text sm:px-3"
        >
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-koby-success" />
          <span className="min-w-0 truncate">{truncateHex(address)}</span>
        </span>
        <button
          type="button"
          onClick={() => disconnect()}
          title="Disconnect this wallet from Koby and end the Privy session. Nothing is submitted onchain."
          aria-label="Disconnect wallet"
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-koby-sm border border-koby-border bg-koby-surface px-2 text-xs font-semibold whitespace-nowrap text-koby-text-secondary transition-colors hover:text-koby-text sm:px-3"
        >
          <span aria-hidden="true" className="sm:hidden">✕</span>
          <span className="hidden sm:inline">Disconnect</span>
        </button>
        {error ? (
          <p
            role="alert"
            className="absolute top-12 right-0 z-10 w-64 max-w-[calc(100vw-2rem)] rounded-koby-md border border-koby-error bg-koby-surface p-3 text-xs text-koby-text-secondary"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  const showBusy = busy || status === "connecting";

  return (
    <div className="relative flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        onClick={() => void onConnectClick()}
        disabled={showBusy}
        title="Connect with Privy (email or wallet)"
        className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-koby-sm bg-koby-accent px-3 text-sm font-semibold whitespace-nowrap text-koby-accent-text transition-colors hover:bg-koby-accent-hover disabled:opacity-50 sm:px-4"
      >
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        {status === "connecting" ? (
          "Connecting…"
        ) : busy ? (
          <>
            <span className="sm:hidden">Opening…</span>
            <span className="hidden sm:inline">Opening wallet options…</span>
          </>
        ) : (
          <>
            <span className="sm:hidden">Connect</span>
            <span className="hidden sm:inline">Connect wallet</span>
          </>
        )}
      </button>
      {error ? (
        <p
          role="alert"
          className="absolute top-12 right-0 z-10 w-64 max-w-[calc(100vw-2rem)] rounded-koby-md border border-koby-error bg-koby-surface p-3 text-xs text-koby-text-secondary"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
