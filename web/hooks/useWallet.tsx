"use client";

/**
 * Wallet abstraction (ARCHITECTURE.md Section 9).
 *
 * Provider-agnostic interface (connect / address / chain / send) over
 * injected EIP-1193 wallets plus Privy-surfaced wallets. Koby never
 * hard-codes a wallet: lib/wallets.ts discovers what is actually installed
 * (EIP-6963 announcements plus legacy `window.ethereum` fallbacks) and the
 * user picks one. A single installed wallet connects directly, preserving
 * the one-click flow; several installed wallets require an explicit choice,
 * so no wallet can silently capture the connection. Privy sits behind this
 * same interface via components/providers/PrivyWalletBridge (embedded wallet
 * creation + session wallets adapted to EIP-1193); components and hooks only
 * ever touch this context, never a provider SDK.
 * Koby has no account layer: the connected address is the only identity.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { monadConfig } from "@/lib/monad";
import { isPrivyConfigured, isPrivyEntryId } from "@/lib/privy";
import { PrivyWalletBridge, type PrivyActions } from "@/components/providers/PrivyWalletBridge";
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
  /** True when at least one wallet (injected or Privy) is available. */
  hasProvider: boolean;
  /** All connectable wallets: injected discoveries plus the Privy entry when present. */
  wallets: DiscoveredWallet[];
  /** The user-selected wallet, or null when none is selected. */
  activeWallet: DiscoveredWallet | null;
  error: string | null;
  /** True when a Privy App ID is configured (Privy onboarding available). */
  privyAvailable: boolean;
  /** True when Privy reports an authenticated user. Always false when unconfigured. */
  privyAuthenticated: boolean;
  /**
   * User-initiated Privy onboarding: opens login when logged out, creates the
   * embedded wallet when logged in without one, or connects the Privy entry
   * when it already exists. Never touches injected wallets.
   */
  connectPrivy: () => Promise<void>;
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
  const [injectedWallets, setInjectedWallets] = useState<DiscoveredWallet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Privy-surfaced entry + session, merged behind the same interface.
  // Null unless the bridge reports a live Privy-session wallet.
  const [privyEntry, setPrivyEntry] = useState<DiscoveredWallet | null>(null);
  const [privyAuthenticated, setPrivyAuthenticated] = useState(false);
  const privyActionsRef = useRef<PrivyActions | null>(null);

  const wallets = useMemo(
    () => (privyEntry ? [...injectedWallets, privyEntry] : injectedWallets),
    [injectedWallets, privyEntry],
  );

  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === selectedId) ?? null,
    [wallets, selectedId],
  );
  const activeProvider = activeWallet?.provider ?? null;

  const refreshWallets = useCallback(async (): Promise<DiscoveredWallet[]> => {
    const found = await discoverInjectedWallets();
    setInjectedWallets(found);
    // A lone wallet is selected silently, preserving the one-click flow.
    // Several wallets always require an explicit user choice. The Privy
    // entry counts toward the total, so it can never be silently bypassed.
    const combined = privyEntry ? [...found, privyEntry] : found;
    setSelectedId((prev) => (prev === null && combined.length === 1 ? combined[0].id : prev));
    return combined;
  }, [privyEntry]);

  // Privy bridge reports land here via effects, never during render.
  // Same-id entries keep their identity so downstream subscriptions stay stable.
  const handlePrivyEntry = useCallback((entry: DiscoveredWallet | null) => {
    setPrivyEntry((prev) => (prev?.id === entry?.id ? prev : entry));
  }, []);

  const handlePrivyAuth = useCallback((value: boolean) => {
    setPrivyAuthenticated(value);
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
    // Ending a Privy session is programmatic: log out only when the active
    // connection is the Privy entry. An injected connection never touches
    // the Privy session.
    if (isPrivyEntryId(selectedId)) {
      const actions = privyActionsRef.current;
      if (actions) void actions.logout().catch(() => {});
    }
    // Injected wallets have no programmatic disconnect; forget locally and
    // clear the selection so the subscription effect above unsubscribes.
    // Clearing state nulls the context provider, so no financing
    // transaction can proceed.
    setAddress(null);
    setChainId(null);
    setStatus("disconnected");
    setError(null);
    setSelectedId(null);
  }, [selectedId]);

  const connectPrivy = useCallback(async () => {
    setError(null);
    const actions = privyActionsRef.current;
    if (!isPrivyConfigured() || !actions) {
      setError("Privy onboarding is not available in this build. Use an injected wallet to continue.");
      return;
    }
    try {
      // Logged out: open the Privy login modal. Completion (plus the
      // embedded-wallet prompt) arrives through the bridge; the entry then
      // appears in the wallet list for an explicit connect.
      if (!privyAuthenticated) {
        actions.login();
        return;
      }
      // Logged in without a wallet yet: create the embedded wallet now
      // (user-initiated; the bridge surfaces it when ready).
      if (!privyEntry) {
        await actions.createWallet();
        return;
      }
      await connect(privyEntry.id);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      // A pre-existing embedded wallet surfacing late is not an error.
      if (/already exists/i.test(message)) return;
      // User declining login/creation is a clean return, not an app error.
      if (/rejected|denied|4001|exited/i.test(message)) return;
      setError("Privy wallet setup failed. Try again or use an injected wallet.");
    }
  }, [privyAuthenticated, privyEntry, connect]);

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
      privyAvailable: isPrivyConfigured(),
      privyAuthenticated,
      connectPrivy,
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
      privyAuthenticated,
      connectPrivy,
    ],
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
      {/* Mounted only when an App ID is configured, guaranteeing a
          PrivyProvider ancestor (see components/providers/Providers). */}
      {isPrivyConfigured() ? (
        <PrivyWalletBridge
          onEntry={handlePrivyEntry}
          onAuth={handlePrivyAuth}
          actionsRef={privyActionsRef}
        />
      ) : null}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
