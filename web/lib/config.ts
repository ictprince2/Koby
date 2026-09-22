/**
 * Configuration abstraction (Phase 1 skeleton).
 *
 * D23 — TECHNICAL VERIFICATION PENDING. No Monad RPC/network values, token
 * addresses, decimals, faucet details, or deployed contract addresses are
 * hardcoded here or anywhere in the frontend. Every external infrastructure
 * fact enters through environment variables, which are EMPTY until D23
 * verification fills them in. `null` means "not configured", never a guess.
 *
 * See ARCHITECTURE.md Section 22 for categories and web/.env.example for names.
 */

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
  /** Human-readable network name. Falls back to an explicit pending label. */
  chainName: nonEmpty(process.env.NEXT_PUBLIC_CHAIN_NAME) ?? "Unconfigured (D23 pending)",
  /** Chain ID, or null when not configured. Never defaulted to a guess. */
  chainId: parseChainId(process.env.NEXT_PUBLIC_CHAIN_ID),
  /** Public RPC endpoint, or null when not configured. */
  rpcUrl: nonEmpty(process.env.NEXT_PUBLIC_RPC_URL),
  /** Deployed Koby financing contract address, or null (not yet deployed). */
  contractAddress: nonEmpty(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS),
  /** Block explorer base URL, or null when not configured. */
  explorerUrl: nonEmpty(process.env.NEXT_PUBLIC_EXPLORER_URL),
} as const;

/** True only when a real deployed contract address has been configured. */
export function isContractConfigured(): boolean {
  return kobyConfig.contractAddress !== null;
}

/** True only when the network has been configured via verified values. */
export function isNetworkConfigured(): boolean {
  return kobyConfig.chainId !== null && kobyConfig.rpcUrl !== null;
}
