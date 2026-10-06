"use client";

import { useState } from "react";
import Image from "next/image";
import { truncateHex } from "@/lib/format";
import { monadConfig } from "@/lib/monad";
import { isPrivyEntryId } from "@/lib/privy";
import { toHexChainId, useWallet } from "@/hooks/useWallet";

/**
 * WalletButton — connect / choose / connected / wrong-network states
 * (USER_FLOW.md Section 5). Never fakes a connection, an address, or a
 * wallet. The primary control uses the real Privy flow when a Privy App ID
 * is configured (opening the Privy wallet modal with its wallet options);
 * without Privy it falls back to the injected-wallet chooser, which lists
 * only actually detected wallets under their own advertised names, plus
 * the live Privy-session wallet when present. Without a provider it says
 * so; on the wrong network it blocks transaction actions and offers a
 * switch. Privy login is an additional onboarding path behind the same
 * WalletContext — never an account layer.
 */
export function WalletButton() {
  const {
    status,
    address,
    chainId,
    isCorrectNetwork,
    error,
    wallets,
    activeWallet,
    connect,
    disconnect,
    refreshWallets,
    switchToMonad,
    privyAvailable,
    privyAuthenticated,
    connectPrivy,
  } = useWallet();
  const [chooserOpen, setChooserOpen] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [privyBusy, setPrivyBusy] = useState(false);

  const privyEntry = wallets.find((w) => isPrivyEntryId(w.id)) ?? null;

  async function onConnectClick() {
    if (status === "connecting" || discovering) return;
    setDiscovering(true);
    try {
      const found = await refreshWallets();
      if (found.length === 1) {
        // Lone wallet: connect directly, preserving the one-click flow.
        setChooserOpen(false);
        await connect(found[0].id);
      } else if (found.length > 1) {
        setChooserOpen(true);
      } else {
        setChooserOpen(false);
        await connect();
      }
    } finally {
      setDiscovering(false);
    }
  }

  async function onChoose(id: string) {
    if (status === "connecting") return;
    setChooserOpen(false);
    await connect(id);
  }

  async function onPrivyClick() {
    if (privyBusy || status === "connecting") return;
    // Logged in with a live Privy wallet: connect it directly through the
    // same WalletContext path as any injected wallet.
    if (privyAuthenticated && privyEntry) {
      setChooserOpen(false);
      await connect(privyEntry.id);
      return;
    }
    // Otherwise: open Privy login or create the embedded wallet.
    // The login modal is its own UI; completion surfaces the entry above.
    setPrivyBusy(true);
    try {
      await connectPrivy();
    } finally {
      setPrivyBusy(false);
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
          title={activeWallet ? `Connected with ${activeWallet.name}: ${address}` : address}
          aria-label={`Connected wallet ${address}${activeWallet ? ` via ${activeWallet.name}` : ""}`}
          className="inline-flex min-h-[44px] min-w-0 items-center gap-2 rounded-koby-sm border border-koby-border bg-koby-surface px-2 font-mono text-sm whitespace-nowrap text-koby-text sm:px-3"
        >
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-koby-success" />
          <span className="min-w-0 truncate">{truncateHex(address)}</span>
        </span>
        <button
          type="button"
          onClick={() => disconnect()}
          title={
            activeWallet && isPrivyEntryId(activeWallet.id)
              ? "Disconnect this wallet from Koby and end the Privy session. Nothing is submitted onchain."
              : "Disconnect this wallet from Koby. This only clears Koby's local state; nothing is submitted onchain."
          }
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

  const busy = status === "connecting" || discovering;

  /**
   * Primary connect control. When Privy onboarding is configured, this uses
   * the real Privy flow (logged out → opens the Privy wallet modal with its
   * wallet options; Privy session present → connects the Privy wallet
   * through the same WalletContext as any injected wallet). When Privy is
   * unconfigured, it falls back to the existing injected-wallet discovery
   * flow below. No wallet state is mocked — both paths use useWallet.
   */
  async function onPrimaryClick() {
    if (privyAvailable) {
      await onPrivyClick();
      return;
    }
    await onConnectClick();
  }

  const primaryBusy = busy || privyBusy;

  return (
    <div className="relative flex min-w-0 shrink items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        onClick={() => void onPrimaryClick()}
        disabled={primaryBusy && !chooserOpen}
        aria-expanded={chooserOpen}
        aria-haspopup={chooserOpen ? "dialog" : undefined}
        title={
          privyAvailable
            ? "Connect with Privy (email or wallet)"
            : "Connect a wallet"
        }
        className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-koby-sm bg-koby-accent px-3 text-sm font-semibold whitespace-nowrap text-koby-accent-text transition-colors hover:bg-koby-accent-hover disabled:opacity-50 sm:px-4"
      >        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        {status === "connecting" ? (
          "Connecting…"
        ) : discovering || privyBusy ? (
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
      {chooserOpen ? (
        <div
          role="dialog"
          aria-label="Choose a wallet to connect"
          className="absolute top-12 right-0 z-10 w-72 max-w-[calc(100vw-2rem)] rounded-koby-md border border-koby-border bg-koby-surface p-2 shadow-lg"
        >
          <p className="px-2 pb-1 pt-1 text-xs font-semibold text-koby-text-secondary">
            Choose a wallet ({wallets.length} detected)
          </p>
          <ul className="space-y-1">
            {wallets.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => void onChoose(w.id)}
                  disabled={status === "connecting"}
                  title={`Connect with ${w.name}`}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-koby-sm px-2 py-2 text-left text-sm text-koby-text transition-colors hover:bg-koby-bg-secondary disabled:opacity-50"
                >
                  {w.icon ? (
                    // Icon supplied by the wallet's own EIP-6963 announcement
                    // (runtime data URL, so the image is explicitly unoptimized).
                    <Image src={w.icon} alt="" width={24} height={24} unoptimized className="h-6 w-6 rounded-full" />
                  ) : (
                    <span aria-hidden="true" className="h-6 w-6 rounded-full bg-koby-border" />
                  )}
                  <span className="font-medium">{w.name}</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setChooserOpen(false)}
            className="mt-1 min-h-[44px] w-full rounded-koby-sm px-2 py-2 text-center text-xs font-semibold text-koby-text-secondary transition-colors hover:text-koby-text"
          >
            Cancel
          </button>
        </div>
      ) : error ? (
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
