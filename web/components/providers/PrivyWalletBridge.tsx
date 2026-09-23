"use client";

import { useEffect } from "react";
import { useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { adaptEip1193Provider, toPrivyEntryId } from "@/lib/privy";
import type { DiscoveredWallet } from "@/hooks/useWallet";

/**
 * PrivyWalletBridge — the only component that touches the Privy SDK besides
 * Providers. It surfaces the Privy-session wallet as a standard
 * DiscoveredWallet entry and reports auth state, so hooks/useWallet can merge
 * it behind the existing WalletContext. Pages and buttons never import
 * Privy hooks directly.
 *
 * Rendered only when a Privy App ID is configured (guaranteeing a
 * PrivyProvider ancestor). Returns no UI.
 */
export type PrivyActions = {
  /** Open the Privy login modal. Returns immediately; completion arrives via onEntry/onAuth. */
  login: () => void;
  /** End the Privy session. */
  logout: () => Promise<void>;
  /** Create the user's embedded wallet (user-initiated via connectPrivy). */
  createWallet: () => Promise<unknown>;
};

type BridgeProps = {
  onEntry: (entry: DiscoveredWallet | null) => void;
  onAuth: (authenticated: boolean) => void;
  actionsRef: { current: PrivyActions | null };
};

export function PrivyWalletBridge({ onEntry, onAuth, actionsRef }: BridgeProps) {
  const { authenticated, ready, login, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { createWallet } = useCreateWallet();

  useEffect(() => {
    actionsRef.current = {
      login: () => login(),
      logout: () => logout(),
      createWallet: () => createWallet(),
    };
  }, [actionsRef, createWallet, login, logout]);

  useEffect(() => {
    onAuth(ready && authenticated);
  }, [onAuth, ready, authenticated]);

  // Prefer the embedded wallet; fall back to the first Privy-session wallet.
  // Address string drives the provider-resolution effect below.
  const pickedAddress = (() => {
    const eth = wallets.filter((w) => w.type === "ethereum");
    const embedded = eth.find((w) => w.walletClientType === "privy");
    return (embedded ?? eth[0] ?? null)?.address ?? null;
  })();

  useEffect(() => {
    let cancelled = false;
    if (!authenticated || !pickedAddress) {
      onEntry(null);
      return;
    }
    const found = wallets.find((w) => w.address.toLowerCase() === pickedAddress.toLowerCase());
    if (!found || found.type !== "ethereum") {
      onEntry(null);
      return;
    }
    found
      .getEthereumProvider()
      .then((provider) => {
        if (cancelled) return;
        const adapted = adaptEip1193Provider(provider);
        if (!adapted) {
          onEntry(null);
          return;
        }
        const embedded = found.walletClientType === "privy";
        onEntry({
          id: toPrivyEntryId(found.address),
          name: embedded ? "Privy embedded wallet" : `Privy (${found.walletClientType})`,
          icon: null,
          provider: adapted,
        });
      })
      .catch(() => {
        if (!cancelled) onEntry(null);
      });
    return () => {
      cancelled = true;
    };
  }, [authenticated, pickedAddress, wallets, walletsReady, onEntry]);

  return null;
}
