/**
 * Shared product types — mirrors the documented model only.
 *
 * - TransactionState: ARCHITECTURE.md Section 8 / MONAD.md Section 9.
 * - FinancingStatus: the MVP state machine, ARCHITECTURE.md Section 5 /
 *   MONAD.md Section 6. `Active`, `Defaulted`, `Cancelled` are NOT included.
 * - Provenance: per-value source labels, USER_FLOW.md Section 21.
 */

/** idle → preparing → awaiting_wallet → submitted → confirming → confirmed → failed */
export type TransactionState =
  | "idle"
  | "preparing"
  | "awaiting_wallet"
  | "submitted"
  | "confirming"
  | "confirmed"
  | "failed";

export const TRANSACTION_STATES: readonly TransactionState[] = [
  "idle",
  "preparing",
  "awaiting_wallet",
  "submitted",
  "confirming",
  "confirmed",
  "failed",
];

/** MVP financing state machine: Created → Funded → Repaying → Completed */
export type FinancingStatus = "Created" | "Funded" | "Repaying" | "Completed";

export const FINANCING_STATUSES: readonly FinancingStatus[] = [
  "Created",
  "Funded",
  "Repaying",
  "Completed",
];

/** Canonical per-value provenance set (USER_FLOW.md Section 21). */
export type Provenance =
  | "Onchain"
  | "Indexed"
  | "External Data"
  | "AI Analysis"
  | "User Provided"
  | "Demo"
  | "Simulated"
  | "Testnet";

export const PROVENANCES: readonly Provenance[] = [
  "Onchain",
  "Indexed",
  "External Data",
  "AI Analysis",
  "User Provided",
  "Demo",
  "Simulated",
  "Testnet",
];
