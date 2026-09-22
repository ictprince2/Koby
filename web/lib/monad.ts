/**
 * Monad network configuration (MONAD.md Section 12).
 *
 * Values below are the MONAD.md-verified Monad Testnet defaults
 * (verified Sept 19, 2026; re-verify against docs.monad.xyz before
 * deployment — testnet has been reset from genesis before). Every value
 * can be overridden through the matching NEXT_PUBLIC_* variable; env wins
 * over the default. Nothing here is a secret.
 *
 * This module complements lib/config.ts (which reports null when
 * unconfigured). The financing flow needs concrete verified defaults to
 * run the testnet MVP, so this module applies them explicitly and labels
 * their source. lib/config.ts is left untouched.
 */

function nonEmpty(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseChainId(value: string | undefined, fallback: number): number {
  const raw = nonEmpty(value);
  if (raw === null) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Verified Monad Testnet chain ID (MONAD.md Section 12). */
export const MONAD_TESTNET_CHAIN_ID = 10143;

/** Verified public RPC default (MONAD.md Section 12). */
export const MONAD_TESTNET_RPC_URL = "https://testnet-rpc.monad.xyz";

/** Verified explorer default (MonadVision testnet). */
export const MONAD_TESTNET_EXPLORER_URL = "https://testnet.monadvision.com";

/**
 * Verified testnet USDC asset (MONAD.md Section 11, 6 decimals).
 * Re-verify immediately before deployment; never accept a user-supplied
 * token address.
 */
export const MONAD_TESTNET_USDC_ADDRESS = "0x534b2f3A21130d7a60830c2Df862319e593943A3";

/** Fixed verified decimals constant for the MVP asset. Never read per-use. */
export const USDC_DECIMALS = 6;

export const monadConfig = {
  chainName: nonEmpty(process.env.NEXT_PUBLIC_CHAIN_NAME) ?? "Monad Testnet",
  chainId: parseChainId(process.env.NEXT_PUBLIC_CHAIN_ID, MONAD_TESTNET_CHAIN_ID),
  rpcUrl: nonEmpty(process.env.NEXT_PUBLIC_RPC_URL) ?? MONAD_TESTNET_RPC_URL,
  explorerUrl: nonEmpty(process.env.NEXT_PUBLIC_EXPLORER_URL) ?? MONAD_TESTNET_EXPLORER_URL,
  /** Deployed KobyFinancing address, or null when not yet deployed. */
  contractAddress: nonEmpty(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS),
  /** Financing/repayment token. Env override exists only for local testing. */
  usdcAddress: nonEmpty(process.env.NEXT_PUBLIC_USDC_ADDRESS) ?? MONAD_TESTNET_USDC_ADDRESS,
} as const;

/** True only when a real deployed contract address has been configured. */
export function isFinancingConfigured(): boolean {
  return monadConfig.contractAddress !== null;
}

export function explorerTxUrl(hash: string): string {
  return `${monadConfig.explorerUrl.replace(/\/$/, "")}/tx/${hash}`;
}

export function explorerAddressUrl(address: string): string {
  return `${monadConfig.explorerUrl.replace(/\/$/, "")}/address/${address}`;
}
