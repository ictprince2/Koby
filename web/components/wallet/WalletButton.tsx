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
 * wallet: the chooser lists only actually detected wallets under their own
 * advertised names, plus the live Privy-session wallet when present.
 * Without a provider it says so; on the wrong network it blocks transaction
 * actions and offers a switch. Privy login is an additional onboarding path
 * behind the same WalletContext — never an account layer.
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

  function privyLabel(): string {
    if (privyBusy) return "Opening Privy…";
    if (privyAuthenticated && privyEntry) return "Connect Privy wallet";
    if (privyAuthenticated) return "Create embedded wallet";
    return "Continue with Privy";
  }

  if (status === "connected" && address) {
    return (
      <div className="relative flex items-center gap-2">
        {!isCorrectNetwork ? (
          <button
            type="button"
            onClick={() => void switchToMonad()}
            title={`Connected to chain ${chainId}. Switch to ${monadConfig.chainName} (${toHexChainId(monadConfig.chainId)}).`}
            className="inline-flex min-h-[44px] items-center rounded-koby-sm border border-koby-error bg-koby-error-subtle px-3 text-xs font-semibold text-koby-error"
          >
            Wrong network — switch to {monadConfig.chainName}
          </button>
        ) : null}
        <span
          title={activeWallet ? `Connected with ${activeWallet.name}: ${address}` : address}
          aria-label={`Connected wallet ${address}${activeWallet ? ` via ${activeWallet.name}` : ""}`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-koby-sm border border-koby-border bg-koby-surface px-3 font-mono text-sm text-koby-text"
        >
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-koby-success" />
          {truncateHex(address)}
        </span>
        <button
          type="button"
          onClick={() => disconnect()}
          title={
            activeWallet && isPrivyEntryId(activeWallet.id)
              ? "Disconnect this wallet from Koby and end the Privy session. Nothing is submitted onchain."
              : "Disconnect this wallet from Koby. This only clears Koby's local state; nothing is submitted onchain."
          }
          className="inline-flex min-h-[44px] items-center rounded-koby-sm border border-koby-border bg-koby-surface px-3 text-xs font-semibold text-koby-text-secondary transition-colors hover:text-koby-text"
        >
          Disconnect
        </button>
        {error ? (
          <p
            role="alert"
            className="absolute right-0 top-12 z-10 w-64 rounded-koby-md border border-koby-error bg-koby-surface p-3 text-xs text-koby-text-secondary"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  const busy = status === "connecting" || discovering;

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => void onConnectClick()}
        disabled={busy && !chooserOpen}
        aria-expanded={chooserOpen}
        aria-haspopup={chooserOpen ? "dialog" : undefined}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-koby-sm bg-koby-accent px-4 text-sm font-semibold text-koby-accent-text transition-colors hover:bg-koby-accent-hover disabled:opacity-50"
      >
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        {status === "connecting" ? "Connecting…" : discovering ? "Finding wallets…" : "Connect wallet"}
      </button>
      {privyAvailable ? (
        <button
          type="button"
          onClick={() => void onPrivyClick()}
          disabled={privyBusy || status === "connecting"}
          title={
            privyAuthenticated
              ? "Use your Privy wallet (embedded wallet created on login when you have none)."
              : "Log in with Privy (email or wallet). An embedded wallet is offered when you have none."
          }
          className="inline-flex min-h-[44px] items-center gap-2 rounded-koby-sm border border-koby-border bg-koby-surface px-4 text-sm font-semibold text-koby-text-secondary transition-colors hover:text-koby-text disabled:opacity-50"
        >
          {privyLabel()}
        </button>
      ) : null}
      {chooserOpen ? (
        <div
          role="dialog"
          aria-label="Choose a wallet to connect"
          className="absolute right-0 top-12 z-10 w-72 rounded-koby-md border border-koby-border bg-koby-surface p-2 shadow-lg"
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
          className="absolute right-0 top-12 z-10 w-64 rounded-koby-md border border-koby-error bg-koby-surface p-3 text-xs text-koby-text-secondary"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
