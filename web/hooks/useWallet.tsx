"use client";

/**
 * Wallet abstraction (ARCHITECTURE.md Section 9).
 *
 * Privy is the SINGLE wallet connection authority for Koby: connect UI,
 * wallet selection, connection state, disconnect, supported wallets, and
 * account identity all come from Privy (@privy-io/react-auth), consumed
 * here via usePrivy/useWallets/useCreateWallet. There is no second
 * connector — no wagmi, no RainbowKit/ConnectKit/Web3Modal, no custom
 * injected-wallet discovery, no wallet chooser UI. The picked Privy-session
 * wallet (embedded first, otherwise the first ethereum wallet) is adapted
 * to Koby's EIP-1193 interface for the existing viem transaction path
 * (services/financing.ts), which is untouched.
 *
 * Koby has no account layer: the connected address is the only identity.
 * Nothing here hard-codes a wallet or an address, and connection state is
 * never mocked — it derives from the live Privy session. When no Privy App
 * ID is configured, the context honestly reports that connection is
 * unavailable instead of falling back to a parallel connection system.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { monadConfig } from "@/lib/monad";
import { adaptEip1193Provider, isPrivyConfigured, type Eip1193Provider } from "@/lib/privy";

export type { Eip1193Provider };

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
  error: string | null;
  /**
   * Human-readable label for the active Privy-session wallet
   * ("Privy embedded wallet" or "Privy (<connector>)"). Null when none.
   */
  walletLabel: string | null;
  /**
   * User-initiated Privy onboarding: opens the Privy login modal when logged
   * out, creates the embedded wallet when logged in without one. When a
   * wallet is already present, connection state syncs automatically.
   */
  connectPrivy: () => Promise<void>;
  /** End the Privy session and clear local wallet state. */
  disconnect: () => void;
  switchToMonad: () => Promise<void>;
  /** Raw provider for transaction submission. Null unless connected. */
  provider: Eip1193Provider | null;
};

const WalletContext = createContext<WalletContextValue | null>(null);

/**
 * Privy-backed wallet state. Rendered only under a PrivyProvider ancestor
 * (see WalletProvider below and components/providers/Providers).
 */
function PrivyBackedWallet({ children }: { children: ReactNode }) {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();

  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [entry, setEntry] = useState<{
    walletAddress: string;
    label: string;
    provider: Eip1193Provider;
  } | null>(null);

  // Prefer the embedded wallet; fall back to the first Privy-session
  // ethereum wallet (e.g. an external wallet connected through Privy).
  const pickedAddress = useMemo(() => {
    const eth = wallets.filter((w) => w.type === "ethereum");
    const embedded = eth.find((w) => w.walletClientType === "privy");
    return (embedded ?? eth[0] ?? null)?.address ?? null;
  }, [wallets]);

  // Resolve the picked Privy-session wallet to an adapted EIP-1193 provider.
  // Sync resets land in timeout callbacks below, never synchronously in the
  // effect body; async resolutions land in the promise callback.
  useEffect(() => {
    let cancelled = false;
    if (!authenticated || !pickedAddress) {
      const timer = window.setTimeout(() => {
        if (!cancelled) setEntry(null);
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }
    const found = wallets.find((w) => w.address.toLowerCase() === pickedAddress.toLowerCase());
    if (!found || found.type !== "ethereum") {
      const timer = window.setTimeout(() => {
        if (!cancelled) setEntry(null);
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }
    found
      .getEthereumProvider()
      .then((provider) => {
        if (cancelled) return;
        const adapted = adaptEip1193Provider(provider);
        if (!adapted) {
          setEntry(null);
          return;
        }
        const embedded = found.walletClientType === "privy";
        setEntry({
          walletAddress: found.address,
          label: embedded ? "Privy embedded wallet" : `Privy (${found.walletClientType})`,
          provider: adapted,
        });
      })
      .catch(() => {
        if (!cancelled) setEntry(null);
      });
    return () => {
      cancelled = true;
    };
  }, [authenticated, pickedAddress, wallets]);

  // Silent sync + event subscriptions follow the Privy-session provider.
  // Re-runs when the entry changes; cleanup unsubscribes. The empty-entry
  // reset lands in the timeout callback below, never synchronously in the
  // effect body.
  useEffect(() => {
    const activeProvider = entry?.provider ?? null;
    if (!activeProvider) {
      const timer = window.setTimeout(() => {
        setAddress(null);
        setChainId(null);
      }, 0);
      return () => window.clearTimeout(timer);
    }
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
      })
      .catch(() => {
        // Keep prior state; a failed silent refresh is not shown as an error.
      });
    const onAccounts = (...args: unknown[]) => {
      // Account switch mid-flow: re-validate dependents (SECURITY.md 8).
      const accounts = args[0] as string[];
      setAddress(accounts[0] ?? null);
    };
    const onChain = (...args: unknown[]) => {
      setChainId(hexToChainId(args[0] as string));
    };
    // Subscribe with the provider as receiver: wallet providers implement
    // `on`/`removeListener` as instance methods that read internal state
    // via `this`. Detaching the method loses that context and throws.
    // Binding preserves it. Both methods are required so every subscription
    // has a matching unsubscription.
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
  }, [entry]);

  const connectPrivy = useCallback(async () => {
    setError(null);
    try {
      // Logged out: open the Privy login modal. Completion (plus the
      // embedded-wallet prompt) arrives through the session above.
      if (!authenticated) {
        login();
        return;
      }
      // Logged in without a wallet yet: create the embedded wallet now
      // (user-initiated; the session above surfaces it when ready).
      if (!entry) {
        setCreating(true);
        try {
          await createWallet();
        } finally {
          setCreating(false);
        }
      }
      // Entry present: the sync effect above is already converging on it.
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      // A pre-existing embedded wallet surfacing late is not an error.
      if (/already exists/i.test(message)) return;
      // User declining login/creation is a clean return, not an app error.
      if (/rejected|denied|4001|exited/i.test(message)) return;
      setError("Privy wallet setup failed. Try again.");
    }
  }, [authenticated, entry, login, createWallet]);

  const disconnect = useCallback(() => {
    // Ending the Privy session is programmatic. Clearing state nulls the
    // context provider, so no financing transaction can proceed.
    void logout().catch(() => {});
    setAddress(null);
    setChainId(null);
    setEntry(null);
    setError(null);
  }, [logout]);

  const switchToMonad = useCallback(async () => {
    const activeProvider = entry?.provider ?? null;
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
  }, [entry]);

  const status: WalletStatus =
    !ready || creating ? "connecting" : address && entry ? "connected" : "disconnected";

  const value = useMemo<WalletContextValue>(
    () => ({
      status,
      address,
      chainId,
      isCorrectNetwork: chainId === monadConfig.chainId,
      error,
      walletLabel: entry?.label ?? null,
      connectPrivy,
      disconnect,
      switchToMonad,
      provider: status === "connected" && address && entry ? entry.provider : null,
    }),
    [status, address, chainId, error, entry, connectPrivy, disconnect, switchToMonad],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

/**
 * Wallet state when Privy is not configured. Reports honestly that wallet
 * connection is unavailable — never a mocked connection, never a parallel
 * fallback connector.
 */
function UnavailableWallet({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const value = useMemo<WalletContextValue>(
    () => ({
      status: "disconnected",
      address: null,
      chainId: null,
      isCorrectNetwork: false,
      error,
      walletLabel: null,
      connectPrivy: async () => {
        setError("Wallet connection is not available in this build (Privy is not configured).");
      },
      disconnect: () => {},
      switchToMonad: async () => {},
      provider: null,
    }),
    [error],
  );
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  if (!isPrivyConfigured()) return <UnavailableWallet>{children}</UnavailableWallet>;
  return <PrivyBackedWallet>{children}</PrivyBackedWallet>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
