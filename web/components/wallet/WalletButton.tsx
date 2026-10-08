"use client";

import { useState } from "react";
import { truncateHex } from "@/lib/format";
import { monadConfig } from "@/lib/monad";
import { toHexChainId, useWallet } from "@/hooks/useWallet";

/**
 * WalletButton — the ONLY wallet connection UI in Koby (USER_FLOW.md
 * Section 5). Privy is the primary connection authority: the main button
 * opens the real Privy login modal (wallet selection, embedded wallets, and
 * multi-wallet support all live inside Privy), shows the connected address,
 * and disconnects by ending the session. A thin injected-wallet fallback
 * (compact icon button, first detected wallet only — never a chooser
 * dialog) covers installed wallets when Privy is unavailable or the user
 * prefers it. Never fakes a connection, an address, or a wallet. On the
 * wrong network it blocks transaction actions and offers a switch.
 */
export function WalletButton() {
  const {
    status,
    address,
    chainId,
    isCorrectNetwork,
    error,
    walletLabel,
    injectedLabel,
    privyAvailable,
    connectPrivy,
    connectInjected,
    disconnect,
    switchToMonad,
  } = useWallet();
  const [busy, setBusy] = useState(false);
  const [injectedBusy, setInjectedBusy] = useState(false);

  async function onConnectClick() {
    if (busy || injectedBusy || status === "connecting") return;
    // Without Privy, the primary button is the injected fallback itself.
    if (!privyAvailable) {
      setInjectedBusy(true);
      try {
        await connectInjected();
      } finally {
        setInjectedBusy(false);
      }
      return;
    }
    setBusy(true);
    try {
      await connectPrivy();
    } finally {
      setBusy(false);
    }
  }

  async function onInjectedClick() {
    if (busy || injectedBusy || status === "connecting") return;
    setInjectedBusy(true);
    try {
      await connectInjected();
    } finally {
      setInjectedBusy(false);
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

  const showBusy = busy || injectedBusy || status === "connecting";

  return (
    <div className="relative flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        onClick={() => void onConnectClick()}
        disabled={showBusy}
        title={
          privyAvailable
            ? "Connect with Privy (email or wallet)"
            : `Connect with ${injectedLabel ?? "injected wallet"}`
        }
        className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-koby-sm bg-koby-accent px-3 text-sm font-semibold whitespace-nowrap text-koby-accent-text transition-colors hover:bg-koby-accent-hover disabled:opacity-50 sm:px-4"
      >
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        {status === "connecting" ? (
          "Connecting…"
        ) : busy || injectedBusy ? (
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
      {/*
        Thin injected fallback: one compact control for the first detected
        installed wallet. Rendered only when Privy is the primary path and
        an injected wallet actually exists — never a chooser dialog, never
        a second primary button. Fixed 44px size keeps the mobile header a
        single row.
      */}
      {privyAvailable && injectedLabel ? (
        <button
          type="button"
          onClick={() => void onInjectedClick()}
          disabled={showBusy}
          title={`Connect with ${injectedLabel} (installed wallet)`}
          aria-label={`Connect with ${injectedLabel} (installed wallet)`}
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-koby-sm border border-koby-border text-koby-text-secondary transition-colors hover:text-koby-text disabled:opacity-50"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1.5" y="4" width="15" height="11" rx="2" />
            <path d="M1.5 7h15" />
            <circle cx="13" cy="11.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        </button>
      ) : null}
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
