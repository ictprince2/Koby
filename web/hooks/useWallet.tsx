"use client";

/**
 * Wallet abstraction (ARCHITECTURE.md Section 9).
 *
 * Privy is the PRIMARY wallet connection authority for Koby: connect UI,
 * wallet selection, connection state, disconnect, supported wallets, and
 * account identity come from Privy (@privy-io/react-auth) via
 * usePrivy/useWallets/useCreateWallet. EIP-6963 injected wallets are a
 * THIN fallback behind the same interface (PRD §16 / ARCH §9 / MONAD §10's
 * provider-agnostic requirement): discovery only, no selection framework,
 * no persistence, no chooser UI, no wallet SDK. The picked Privy-session
 * wallet (embedded first, otherwise the first ethereum wallet) — or the
 * first discovered injected wallet when the user chooses it — is adapted
 * to Koby's EIP-1193 interface for the existing viem transaction path
 * (services/financing.ts), which is untouched.
 *
 * Koby has no account layer: the connected address is the only identity.
 * Nothing here hard-codes a wallet or an address, and connection state is
 * never mocked — it derives from the live Privy session or a live
 * injected provider. When neither is available, the context honestly
 * reports that connection is unavailable instead of falling back to
 * anything else.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { monadConfig } from "@/lib/monad";
import { adaptEip1193Provider, isPrivyConfigured, type Eip1193Provider } from "@/lib/privy";
import { discoverInjectedWallets, type DiscoveredWallet } from "@/lib/wallets";

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
   * Human-readable label for the active wallet ("Privy embedded wallet",
   * "Privy (<connector>)", or the injected wallet's own name). Null when none.
   */
  walletLabel: string | null;
  /**
   * Name of the first discovered injected wallet, or null when none is
   * installed. Drives the thin fallback affordance; never a full list UI.
   */
  injectedLabel: string | null;
  /** True when a Privy App ID is configured (Privy onboarding available). */
  privyAvailable: boolean;
  /**
   * User-initiated Privy onboarding: opens the Privy login modal when logged
   * out, creates the embedded wallet when logged in without one. When a
   * wallet is already present, connection state syncs automatically.
   */
  connectPrivy: () => Promise<void>;
  /**
   * User-initiated injected fallback: discovers installed wallets and
   * connects the first one found. Secondary to Privy in every respect.
   */
  connectInjected: () => Promise<void>;
  /** End the session (Privy logout where applicable) and clear local state. */
  disconnect: () => void;
  switchToMonad: () => Promise<void>;
  /** Raw provider for transaction submission. Null unless connected. */
  provider: Eip1193Provider | null;
};

const WalletContext = createContext<WalletContextValue | null>(null);

/**
 * Shared address/chain sync + event subscriptions for whichever EIP-1193
 * provider is active. Re-runs when the provider changes; cleanup
 * unsubscribes. The empty-provider reset lands in a timeout callback,
 * never synchronously in the effect body.
 */
function useSyncedChain(provider: Eip1193Provider | null): {
  address: string | null;
  chainId: number | null;
  setAddress: (v: string | null) => void;
  setChainId: (v: number | null) => void;
} {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    if (!provider) {
      const timer = window.setTimeout(() => {
        setAddress(null);
        setChainId(null);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    let cancelled = false;
    // Initial sync: async wallet reads; state lands in the callback below.
    Promise.all([
      provider.request({ method: "eth_accounts" }),
      provider.request({ method: "eth_chainId" }),
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
      typeof provider.on === "function" ? provider.on.bind(provider) : null;
    const unsubscribe =
      typeof provider.removeListener === "function"
        ? provider.removeListener.bind(provider)
        : null;
    if (!subscribe || !unsubscribe) return;
    subscribe("accountsChanged", onAccounts);
    subscribe("chainChanged", onChain);
    return () => {
      cancelled = true;
      unsubscribe("accountsChanged", onAccounts);
      unsubscribe("chainChanged", onChain);
    };
  }, [provider]);

  return { address, chainId, setAddress, setChainId };
}

/** Shared network-switch implementation over any active provider. */
async function requestSwitchToMonad(
  provider: Eip1193Provider | null,
  onChainId: (id: number | null) => void,
  onError: (message: string | null) => void,
): Promise<void> {
  if (!provider) {
    onError("No wallet found in this browser.");
    return;
  }
  onError(null);
  const target = toHexChainId(monadConfig.chainId);
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: target }],
    });
    const chainHex = (await provider.request({ method: "eth_chainId" })) as string;
    onChainId(hexToChainId(chainHex));
  } catch (e) {
    const err = e as { code?: number; message?: string };
    if (err?.code === 4902) {
      // Network unknown to the wallet: offer to add it.
      try {
        await provider.request({
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
        const chainHex = (await provider.request({ method: "eth_chainId" })) as string;
        onChainId(hexToChainId(chainHex));
        return;
      } catch {
        onError("The network could not be added. Add Monad Testnet manually and try again.");
        return;
      }
    }
    if (/rejected|denied|4001/i.test(err?.message ?? "")) return;
    onError("Could not switch networks. Switch your wallet manually and try again.");
  }
}

/** Thin fallback discovery: first installed wallet, or null. No UI, no state machine. */
async function firstInjected(): Promise<DiscoveredWallet | null> {
  const found = await discoverInjectedWallets();
  return found[0] ?? null;
}

/**
 * Privy-backed wallet state with thin injected fallback. Rendered only
 * under a PrivyProvider ancestor (see WalletProvider below and
 * components/providers/Providers).
 */
function PrivyBackedWallet({ children }: { children: ReactNode }) {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();

  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [injecting, setInjecting] = useState(false);
  const [preferInjected, setPreferInjected] = useState(false);
  /**
   * Watchdog for Privy SDK initialization. `ready` is normally true within
   * a second; if it never arrives (invalid App ID, blocked SDK requests,
   * offline), the wallet button would otherwise sit on a disabled
   * "Connecting…" forever with no explanation. After the grace period the
   * UI reports the stall honestly and re-enables the injected fallback —
   * no state is faked, and a late `ready` clears the stall.
   */
  const [privyStalled, setPrivyStalled] = useState(false);
  useEffect(() => {
    if (!ready) {
      const timer = window.setTimeout(() => {
        setPrivyStalled(true);
        setError((prev) =>
          prev ??
          "Privy wallet service isn't responding. Check your connection and try again, or use an installed wallet below.",
        );
      }, 12000);
      return () => window.clearTimeout(timer);
    }
    // A late `ready` clears the stall. Reset lands in a timeout callback,
    // never synchronously in the effect body (see useSyncedChain above).
    const timer = window.setTimeout(() => {
      setPrivyStalled(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ready]);
  const [entry, setEntry] = useState<{
    walletAddress: string;
    label: string;
    provider: Eip1193Provider;
  } | null>(null);
  const [injected, setInjected] = useState<DiscoveredWallet | null>(null);

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

  // Passive fallback discovery on mount (read-only; never connects alone).
  // State lands in the promise callback below.
  useEffect(() => {
    let cancelled = false;
    void firstInjected().then((found) => {
      if (!cancelled) setInjected(found);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Explicit choice wins; otherwise Privy first, injected as fallback.
  // Memoized so downstream callbacks keep stable dependencies.
  const active = useMemo(
    () =>
      preferInjected && injected
        ? { label: injected.name, provider: injected.provider }
        : (entry ?? (injected ? { label: injected.name, provider: injected.provider } : null)),
    [preferInjected, injected, entry],
  );

  const { address, chainId, setAddress, setChainId } = useSyncedChain(active?.provider ?? null);

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
      // Entry present: the sync above is already converging on it.
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      // A pre-existing embedded wallet surfacing late is not an error.
      if (/already exists/i.test(message)) return;
      // User declining login/creation is a clean return, not an app error.
      if (/rejected|denied|4001|exited/i.test(message)) return;
      setError("Privy wallet setup failed. Try again.");
    }
  }, [authenticated, entry, login, createWallet]);

  const connectInjected = useCallback(async () => {
    setError(null);
    setInjecting(true);
    try {
      const found = await firstInjected();
      if (!found) {
        setError("No injected wallet found in this browser. Install a wallet (e.g. MetaMask) or continue with Privy.");
        return;
      }
      setInjected(found);
      setPreferInjected(true);
      const accounts = (await found.provider.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts[0]) {
        setPreferInjected(false);
        return;
      }
      // Explicit user connect: set state directly. The shared sync below is
      // keyed on provider identity, which does not change when merely
      // switching preference to an already-discovered provider.
      const chainHex = (await found.provider.request({ method: "eth_chainId" })) as string;
      setAddress(accounts[0]);
      setChainId(hexToChainId(chainHex));
      // Address/chain keep converging through the shared sync above.
    } catch (e) {
      setPreferInjected(false);
      const message = e instanceof Error ? e.message : "";
      // User declining connection is a clean return, not an app error.
      if (/rejected|denied|4001/i.test(message)) return;
      setError("Injected wallet connection failed. Check your wallet and try again.");
    } finally {
      setInjecting(false);
    }
  }, [setAddress, setChainId]);

  const disconnect = useCallback(() => {
    // Ending the Privy session is programmatic. Clearing state nulls the
    // context provider, so no financing transaction can proceed.
    void logout().catch(() => {});
    setAddress(null);
    setChainId(null);
    setEntry(null);
    setPreferInjected(false);
    setError(null);
  }, [logout, setAddress, setChainId]);

  const switchToMonad = useCallback(async () => {
    await requestSwitchToMonad(active?.provider ?? null, setChainId, setError);
  }, [active, setChainId]);

  const status: WalletStatus =
    (!ready && !privyStalled) || creating || injecting
      ? "connecting"
      : address && active
        ? "connected"
        : "disconnected";

  const value = useMemo<WalletContextValue>(
    () => ({
      status,
      address,
      chainId,
      isCorrectNetwork: chainId === monadConfig.chainId,
      error,
      walletLabel: active?.label ?? null,
      injectedLabel: injected?.name ?? null,
      privyAvailable: true,
      connectPrivy,
      connectInjected,
      disconnect,
      switchToMonad,
      provider: status === "connected" && address && active ? active.provider : null,
    }),
    [status, address, chainId, error, active, injected, connectPrivy, connectInjected, disconnect, switchToMonad],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

/**
 * Injected-only wallet state for builds without a Privy App ID. Same
 * interface, same honesty: reports connected only for a live provider.
 */
function InjectedOnlyWallet({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [injected, setInjected] = useState<DiscoveredWallet | null>(null);
  const [chosen, setChosen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void firstInjected().then((found) => {
      if (!cancelled) setInjected(found);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeProvider = chosen && injected ? injected.provider : null;
  const { address, chainId, setAddress, setChainId } = useSyncedChain(activeProvider);

  const connectInjected = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const found = await firstInjected();
      if (!found) {
        setError("No injected wallet found in this browser. Install a wallet (e.g. MetaMask) to continue.");
        return;
      }
      setInjected(found);
      const accounts = (await found.provider.request({ method: "eth_requestAccounts" })) as string[];
      if (accounts[0]) setChosen(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      if (/rejected|denied|4001/i.test(message)) return;
      setError("Injected wallet connection failed. Check your wallet and try again.");
    } finally {
      setBusy(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setChosen(false);
    setError(null);
  }, [setAddress, setChainId]);

  const switchToMonad = useCallback(async () => {
    await requestSwitchToMonad(activeProvider, setChainId, setError);
  }, [activeProvider, setChainId]);

  const status: WalletStatus = busy ? "connecting" : address && activeProvider ? "connected" : "disconnected";

  const value = useMemo<WalletContextValue>(
    () => ({
      status,
      address,
      chainId,
      isCorrectNetwork: chainId === monadConfig.chainId,
      error,
      walletLabel: activeProvider && injected ? injected.name : null,
      injectedLabel: injected?.name ?? null,
      privyAvailable: false,
      connectPrivy: async () => {
        setError("Wallet connection is not available in this build (Privy is not configured).");
      },
      connectInjected,
      disconnect,
      switchToMonad,
      provider: status === "connected" && address && activeProvider ? activeProvider : null,
    }),
    [status, address, chainId, error, activeProvider, injected, connectInjected, disconnect, switchToMonad],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  if (!isPrivyConfigured()) return <InjectedOnlyWallet>{children}</InjectedOnlyWallet>;
  return <PrivyBackedWallet>{children}</PrivyBackedWallet>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
