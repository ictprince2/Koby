/**
 * Privy helpers — App-ID gating, Monad chain derivation, and provider
 * adaptation (ARCHITECTURE.md Section 9).
 *
 * This module is server-safe: pure functions over environment names and the
 * existing Monad configuration. It never imports the Privy SDK, so the
 * injected-wallet flow works identically when Privy is unconfigured.
 *
 * Koby's Monad values live in exactly one place (lib/monad.ts). The chain
 * object below is derived from it, never duplicated.
 */

import { monadConfig } from "@/lib/monad";
import type { Eip1193Provider } from "@/lib/wallets";

/** Discovery-id prefix for Privy-surfaced wallets. Never collides with EIP-6963 rdns ids. */
export const PRIVY_WALLET_ID_PREFIX = "privy:";

function nonEmpty(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** The configured Privy App ID, or null when Privy onboarding is disabled. Never a secret. */
export function privyAppId(): string | null {
  return nonEmpty(process.env.NEXT_PUBLIC_PRIVY_APP_ID);
}

/** True only when Privy onboarding can be offered. Injected wallets always work regardless. */
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

/** Stable discovery id for a Privy-surfaced wallet address. */
export function toPrivyEntryId(address: string): string {
  return `${PRIVY_WALLET_ID_PREFIX}${address.toLowerCase()}`;
}

/** True only for wallet ids surfaced through Privy (never injected discoveries). */
export function isPrivyEntryId(id: string | null): boolean {
  return id !== null && id.startsWith(PRIVY_WALLET_ID_PREFIX);
}

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
