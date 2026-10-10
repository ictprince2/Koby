"use client";

import { useEffect, useRef, useState } from "react";
import { truncateHex } from "@/lib/format";
import { discoverInjectedWallets, type DiscoveredWallet } from "@/lib/wallets";
import { useWallet } from "@/hooks/useWallet";

/**
 * WalletButton — the ONLY wallet connection UI in Koby (USER_FLOW.md
 * Section 5). Privy is the primary connection authority: the main button
 * opens the real Privy login modal (wallet selection, embedded wallets, and
 * multi-wallet support all live inside Privy), shows the connected address,
 * and disconnects by ending the session.
 *
 * The thin injected-wallet fallback is an explicit secondary choice: a
 * compact control opens a menu listing the actually discovered installed
 * wallets, and only the wallet the user clicks is ever connected. Nothing
 * is auto-picked by discovery order, and the fallback is never triggered
 * merely because Privy is loading, stalled, or unconfigured. Never fakes a
 * connection, an address, or a wallet. On the wrong network it blocks
 * transaction actions and offers a switch.
 */
export function WalletButton() {
  const {
    status,
    address,
    error,
    walletLabel,
    injectedLabel,
    privyAvailable,
    connectPrivy,
    connectInjected,
    disconnect,
  } = useWallet();
  const [busy, setBusy] = useState(false);
  const [injectedBusy, setInjectedBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuWallets, setMenuWallets] = useState<DiscoveredWallet[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const menuRootRef = useRef<HTMLDivElement>(null);

  async function refreshMenuWallets() {
    setMenuLoading(true);
    try {
      setMenuWallets(await discoverInjectedWallets());
    } finally {
      setMenuLoading(false);
    }
  }

  function openMenu() {
    setMenuOpen(true);
    void refreshMenuWallets();
  }

  // Close the selection menu on outside tap.
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (menuRootRef.current && !menuRootRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  // Close the selection menu on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen ]);

  async function onConnectClick() {
    if (busy || injectedBusy || status === "connecting") return;
    // Without Privy, the primary button opens the explicit installed-wallet
    // menu instead of auto-connecting whatever was discovered first.
    if (!privyAvailable) {
      openMenu();
      return;
    }
    setBusy(true);
    try {
      await connectPrivy();
    } finally {
      setBusy(false);
    }
  }

  function onInjectedButtonClick() {
    if (busy || injectedBusy || status === "connecting") return;
    setMenuOpen((value) => {
      if (!value) void refreshMenuWallets();
      return !value;
    });
  }

  async function onSelectWallet(walletId: string) {
    if (injectedBusy) return;
    setInjectedBusy(true);
    try {
      await connectInjected(walletId);
    } finally {
      setInjectedBusy(false);
    }
  }

  if (status === "connected" && address) {
    // Compact single-row status only: the address pill plus disconnect.
    // Wrong-network recovery lives in NetworkNotice (second header row), so
    // this row can never crowd or clip the hamburger at 320–414px.
    return (
      <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
        <span
          title={walletLabel ? `Connected with ${walletLabel}: ${address}` : address}
          aria-label={`Connected wallet ${address}${walletLabel ? ` via ${walletLabel}` : ""}`}
          className="inline-flex min-h-[44px] min-w-0 max-w-[120px] items-center gap-2 rounded-koby-sm border border-koby-border bg-koby-surface px-2 font-mono text-[13px] whitespace-nowrap text-koby-text min-[375px]:max-w-[168px] sm:max-w-none sm:px-3 sm:text-sm"
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
      </div>
    );
  }

  const showBusy = busy || injectedBusy || status === "connecting";

  return (
    <div ref={menuRootRef} className="relative flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        onClick={() => void onConnectClick()}
        disabled={showBusy}
        title={
          privyAvailable
            ? "Connect with Privy (email or wallet)"
            : "Privy isn't configured — choose an installed wallet"
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
        Explicit secondary choice: a compact control opening a menu of the
        actually discovered installed wallets. Rendered only when an
        injected wallet exists — never a chooser dialog that picks for the
        user, never an automatic connection. Fixed 44px size keeps the
        mobile header a single row.
      */}
      {privyAvailable && injectedLabel ? (
        <button
          type="button"
          onClick={onInjectedButtonClick}
          disabled={showBusy}
          aria-expanded={menuOpen}
          aria-controls="koby-injected-wallet-menu"
          aria-label="Choose an installed wallet"
          title="Choose an installed wallet (explicit selection — nothing connects automatically)"
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-koby-sm border border-koby-border text-koby-text-secondary transition-colors hover:text-koby-text disabled:opacity-50"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1.5" y="4" width="15" height="11" rx="2" />
            <path d="M1.5 7h15" />
            <circle cx="13" cy="11.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        </button>
      ) : null}
      {menuOpen ? (
        <div
          id="koby-injected-wallet-menu"
          role="menu"
          aria-label="Choose an installed wallet"
          className="absolute top-[calc(100%+8px)] right-0 z-30 w-72 max-w-[calc(100vw-2rem)] rounded-koby-md border border-koby-border bg-koby-surface p-2 shadow-lg"
        >
          <p className="px-3 pt-2 font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase">
            {privyAvailable ? "Installed wallets" : "Privy unavailable"}
          </p>
          <p className="px-3 pt-1 pb-2 text-xs leading-relaxed text-koby-text-secondary">
            {privyAvailable
              ? "Connect one explicitly — nothing connects automatically."
              : "Privy onboarding isn't configured in this build. Choose an installed wallet to continue."}
          </p>
          {menuLoading ? (
            <p className="px-3 py-3 text-sm text-koby-text-secondary">Looking for installed wallets…</p>
          ) : menuWallets.length === 0 ? (
            <p className="px-3 py-3 text-sm text-koby-text-secondary">
              No installed wallets detected in this browser.
            </p>
          ) : (
            <ul>
              {menuWallets.map((wallet) => (
                <li key={wallet.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void onSelectWallet(wallet.id)}
                    disabled={injectedBusy}
                    className="flex min-h-[44px] w-full items-center rounded-koby-sm px-3 text-left text-sm font-medium text-koby-text-secondary transition-colors hover:bg-koby-bg-secondary hover:text-koby-text disabled:opacity-50"
                  >
                    {wallet.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
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
