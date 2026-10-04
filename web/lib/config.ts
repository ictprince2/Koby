/**
 * Configuration abstraction for footer display.
 *
 * Reports the effective Monad Testnet configuration (MONAD.md Section 12):
 * verified public defaults with NEXT_PUBLIC_* overrides winning. This keeps
 * the footer consistent with the canonical runtime source of truth
 * (lib/monad.ts), which applies the same defaults for transactions, wallet,
 * and chain reads. Public network values (chain name/ID, RPC, explorer) are
 * not secrets and are safe to default; the deployed contract address has no
 * default and remains env-only (empty = not yet deployed).
 *
 * See ARCHITECTURE.md Section 22 for categories and web/.env.example for names.
 */

import {
  MONAD_TESTNET_CHAIN_ID,
  MONAD_TESTNET_CHAIN_NAME,
  MONAD_TESTNET_EXPLORER_URL,
  MONAD_TESTNET_RPC_URL,
} from "./monad";

function nonEmpty(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseChainId(value: string | undefined): number | null {
  const raw = nonEmpty(value);
  if (raw === null) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export const kobyConfig = {
  /** Human-readable network name. Env override wins; defaults to Monad Testnet. */
  chainName: nonEmpty(process.env.NEXT_PUBLIC_CHAIN_NAME) ?? MONAD_TESTNET_CHAIN_NAME,
  /** Chain ID. Env override wins; defaults to verified Monad Testnet (10143). */
  chainId: parseChainId(process.env.NEXT_PUBLIC_CHAIN_ID) ?? MONAD_TESTNET_CHAIN_ID,
  /** Public RPC endpoint. Env override wins; defaults to verified testnet RPC. */
  rpcUrl: nonEmpty(process.env.NEXT_PUBLIC_RPC_URL) ?? MONAD_TESTNET_RPC_URL,
  /** Deployed Koby financing contract address, or null (not yet deployed). */
  contractAddress: nonEmpty(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS),
  /** Block explorer base URL. Env override wins; defaults to MonadVision testnet. */
  explorerUrl: nonEmpty(process.env.NEXT_PUBLIC_EXPLORER_URL) ?? MONAD_TESTNET_EXPLORER_URL,
} as const;

/** True only when a real deployed contract address has been configured. */
export function isContractConfigured(): boolean {
  return kobyConfig.contractAddress !== null;
}

/** True only when the network has been configured via verified values. */
export function isNetworkConfigured(): boolean {
  return kobyConfig.chainId !== null && kobyConfig.rpcUrl !== null;
}
