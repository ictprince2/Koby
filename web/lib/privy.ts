/**
 * Privy helpers — App-ID gating, Monad chain derivation, and the EIP-1193
 * provider interface Koby standardizes on (ARCHITECTURE.md Section 9).
 *
 * This module is server-safe: pure functions and types over environment
 * names and the existing Monad configuration. It never imports the Privy
 * SDK.
 *
 * Koby's Monad values live in exactly one place (lib/monad.ts). The chain
 * object below is derived from it, never duplicated.
 */

import { monadConfig } from "@/lib/monad";

/**
 * Minimal EIP-1193 interface Koby uses: account/chain reads, network
 * switching, and transaction submission. Privy-session wallet providers
 * are adapted to this shape; the viem transaction path
 * (services/financing.ts) only ever sees this interface.
 */
export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

function nonEmpty(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** The configured Privy App ID, or null when Privy onboarding is disabled. Never a secret. */
export function privyAppId(): string | null {
  return nonEmpty(process.env.NEXT_PUBLIC_PRIVY_APP_ID);
}

/** True only when Privy onboarding can be offered. */
export function isPrivyConfigured(): boolean {
  return privyAppId() !== null;
}

/**
 * Monad Testnet chain object for PrivyProvider config, derived from the
 * single source of truth (lib/monad.ts). Shape matches Privy's Chain subset
 * (id / name / nativeCurrency / rpcUrls / blockExplorers / testnet).
 */
export const monadChainForPrivy = {
  id: monadConfig.chainId,
  name: monadConfig.chainName,
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [monadConfig.rpcUrl] } },
  blockExplorers: { default: { name: "MonadVision", url: monadConfig.explorerUrl } },
  testnet: true,
} as const;

/**
 * Parse a CAIP-2 chain id ("eip155:10143") as used by Privy wallets.
 * Returns the numeric chain id, or null for anything else. Never throws.
 */
export function parseCaip2ChainId(caip2: string): number | null {
  const match = /^eip155:(\d+)$/.exec(caip2.trim());
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Adapt a Privy-issued EIP-1193 provider to Koby's provider interface.
 * Returns null when the value is not a usable EIP-1193 provider.
 *
 * Calls are forwarded with the original provider as receiver (some wallet
 * providers read internal state via `this`; detaching the method breaks
 * them — same lesson as hooks/useWallet's subscription binding).
 */
export function adaptEip1193Provider(value: unknown): Eip1193Provider | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.request !== "function") return null;
  const request = candidate.request as (args: {
    method: string;
    params?: unknown;
  }) => Promise<unknown>;
  const on =
    typeof candidate.on === "function"
      ? (candidate.on as (event: string, listener: (...args: unknown[]) => void) => void)
      : null;
  const removeListener =
    typeof candidate.removeListener === "function"
      ? (candidate.removeListener as (event: string, listener: (...args: unknown[]) => void) => void)
      : null;
  return {
    request: (args) => request.call(value, args),
    ...(on ? { on: (event, listener) => on.call(value, event, listener) } : {}),
    ...(removeListener
      ? { removeListener: (event, listener) => removeListener.call(value, event, listener) }
      : {}),
  };
}
