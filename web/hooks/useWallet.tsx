"use client";

/**
 * Wallet abstraction (ARCHITECTURE.md Section 9).
 *
 * Provider-agnostic interface (connect / address / chain / send) over
 * injected EIP-1193 wallets. Koby never hard-codes a wallet: lib/wallets.ts
 * discovers what is actually installed (EIP-6963 announcements plus legacy
 * `window.ethereum` fallbacks) and the user picks one. A single installed
 * wallet connects directly, preserving the one-click flow; several
 * installed wallets require an explicit choice, so no wallet can silently
 * capture the connection. Privy sits behind this same interface later;
 * components and hooks only ever touch this context, never a provider SDK.
 * Koby has no account layer: the connected address is the only identity.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { monadConfig } from "@/lib/monad";
import {
  discoverInjectedWallets,
  type DiscoveredWallet,
  type Eip1193Provider,
} from "@/lib/wallets";

export type { Eip1193Provider };
export type { DiscoveredWallet };

function hexToChainId(hex: string): number | null {
  if (!/^0x[0-9a-fA-F]+$/.test(hex)) return null;
  const parsed = Number.parseInt(hex, 16);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function toHexChainId(chainId: number): string {
  return `0x${chainId.toString(16)}`;
}

export type WalletStatus = "disconnected" | "connecting" | "connected";

type WalletContextValue = {
  status: WalletStatus;
  address: string | null;
  chainId: number | null;
  /** True when the wallet is on the configured Monad network. */
  isCorrectNetwork: boolean;
  /** True when at least one injected wallet was discovered. */
  hasProvider: boolean;
  /** Actually installed wallets; empty until discovery completes. */
  wallets: DiscoveredWallet[];
  /** The user-selected wallet, or null when none is selected. */
  activeWallet: DiscoveredWallet | null;
  error: string | null;
  /** Re-run discovery (chooser open, new install). Returns what was found. */
  refreshWallets: () => Promise<DiscoveredWallet[]>;
  /**
   * Connect a wallet by discovery id. With no id, connects the current
   * selection, or the only wallet when exactly one is installed.
   */
  connect: (walletId?: string) => Promise<void>;
  disconnect: () => void;
  switchToMonad: () => Promise<void>;
  /** Raw provider for transaction submission. Null unless connected. */
  provider: Eip1193Provider | null;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wallets, setWallets] = useState<DiscoveredWallet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === selectedId) ?? null,
    [wallets, selectedId],
  );
  const activeProvider = activeWallet?.provider ?? null;

  const refreshWallets = useCallback(async (): Promise<DiscoveredWallet[]> => {
    const found = await discoverInjectedWallets();
    setWallets(found);
    // A lone wallet is selected silently, preserving the one-click flow.
    // Several wallets always require an explicit user choice.
    setSelectedId((prev) => (prev === null && found.length === 1 ? found[0].id : prev));
    return found;
  }, []);

  // Initial discovery on mount.
  useEffect(() => {
    void refreshWallets();
  }, [refreshWallets]);

  // Silent sync + event subscriptions follow the SELECTED provider, never a
  // hard-coded global. Re-runs on selection change; cleanup unsubscribes.
  useEffect(() => {
    if (!activeProvider) return;
    let cancelled = false;
    // Initial sync: async wallet reads; state lands in the callback below.
    Promise.all([
      activeProvider.request({ method: "eth_accounts" }),
      activeProvider.request({ method: "eth_chainId" }),
    ])
      .then(([accounts, chainHex]) => {
        if (cancelled) return;
        const list = accounts as string[];
        setAddress(list[0] ?? null);
        setChainId(hexToChainId(chainHex as string));
        setStatus(list[0] ? "connected" : "disconnected");
      })
      .catch(() => {
        // Keep prior state; a failed silent refresh is not shown as an error.
      });
    const onAccounts = (...args: unknown[]) => {
      // Account switch mid-flow: re-validate dependents (SECURITY.md 8).
      const accounts = args[0] as string[];
      setAddress(accounts[0] ?? null);
      setStatus(accounts[0] ? "connected" : "disconnected");
    };
    const onChain = (...args: unknown[]) => {
      setChainId(hexToChainId(args[0] as string));
    };
    // Subscribe with the provider as receiver: injected wallets implement
    // `on`/`removeListener` as instance methods that read internal state
    // via `this`. Detaching the method loses that context and throws inside
    // the extension. Binding preserves it. Both methods are required so
    // every subscription has a matching unsubscription (Strict Mode
    // remounts and re-runs stay symmetric).
    const subscribe =
      typeof activeProvider.on === "function" ? activeProvider.on.bind(activeProvider) : null;
    const unsubscribe =
      typeof activeProvider.removeListener === "function"
        ? activeProvider.removeListener.bind(activeProvider)
        : null;
    if (!subscribe || !unsubscribe) return;
    subscribe("accountsChanged", onAccounts);
    subscribe("chainChanged", onChain);
    return () => {
      cancelled = true;
      unsubscribe("accountsChanged", onAccounts);
      unsubscribe("chainChanged", onChain);
    };
  }, [activeProvider]);

  const connect = useCallback(
    async (walletId?: string) => {
      const target =
        walletId !== undefined
          ? (wallets.find((w) => w.id === walletId) ?? null)
          : (wallets.find((w) => w.id === selectedId) ??
            (wallets.length === 1 ? wallets[0] : null));
      if (!target) {
        if (wallets.length === 0) {
          setError("No wallet found in this browser. Install a wallet (e.g. MetaMask) to continue.");
        } else {
          setError("Choose a wallet to continue.");
        }
        return;
      }
      setSelectedId(target.id);
      setStatus("connecting");
      setError(null);
      try {
        const accounts = (await target.provider.request({
          method: "eth_requestAccounts",
        })) as string[];
        const chainHex = (await target.provider.request({ method: "eth_chainId" })) as string;
        setAddress(accounts[0] ?? null);
        setChainId(hexToChainId(chainHex));
        setStatus(accounts[0] ? "connected" : "disconnected");
      } catch (e) {
        setStatus("disconnected");
        const message = e instanceof Error ? e.message : "";
        // User declining connection is a clean return, not an app error.
        if (/rejected|denied|4001/i.test(message)) return;
        setError("Wallet connection failed. Check your wallet and try again.");
      }
    },
    [wallets, selectedId],
  );

  const disconnect = useCallback(() => {
    // Injected wallets have no programmatic disconnect; forget locally and
    // clear the selection so the subscription effect above unsubscribes.
    // Clearing state nulls the context provider, so no financing
    // transaction can proceed.
    setAddress(null);
    setChainId(null);
    setStatus("disconnected");
    setError(null);
    setSelectedId(null);
  }, []);

  const switchToMonad = useCallback(async () => {
    if (!activeProvider) {
      setError("No wallet found in this browser.");
      return;
    }
    setError(null);
    const target = toHexChainId(monadConfig.chainId);
    try {
      await activeProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: target }],
      });
      const chainHex = (await activeProvider.request({ method: "eth_chainId" })) as string;
      setChainId(hexToChainId(chainHex));
    } catch (e) {
      const err = e as { code?: number; message?: string };
      if (err?.code === 4902) {
        // Network unknown to the wallet: offer to add it.
        try {
          await activeProvider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: target,
                chainName: monadConfig.chainName,
                nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
                rpcUrls: [monadConfig.rpcUrl],
                blockExplorerUrls: [monadConfig.explorerUrl],
              },
            ],
          });
          const chainHex = (await activeProvider.request({ method: "eth_chainId" })) as string;
          setChainId(hexToChainId(chainHex));
          return;
        } catch {
          setError("The network could not be added. Add Monad Testnet manually and try again.");
          return;
        }
      }
      if (/rejected|denied|4001/i.test(err?.message ?? "")) return;
      setError("Could not switch networks. Switch your wallet manually and try again.");
    }
  }, [activeProvider]);

  const value = useMemo<WalletContextValue>(
    () => ({
      status,
      address,
      chainId,
      isCorrectNetwork: chainId === monadConfig.chainId,
      hasProvider: wallets.length > 0,
      wallets,
      activeWallet,
      error,
      refreshWallets,
      connect,
      disconnect,
      switchToMonad,
      provider: status === "connected" && address && activeProvider ? activeProvider : null,
    }),
    [
      status,
      address,
      chainId,
      wallets,
      activeWallet,
      activeProvider,
      error,
      refreshWallets,
      connect,
      disconnect,
      switchToMonad,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
