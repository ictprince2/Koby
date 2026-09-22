"use client";

/**
 * Transaction lifecycle state (ARCHITECTURE.md Section 8, MONAD.md 9):
 * idle -> preparing -> awaiting_wallet -> submitted -> confirming
 * -> confirmed | failed. Success is only shown at `confirmed`.
 */

import { useCallback, useState } from "react";
import type { TransactionState } from "@/lib/types";

export type TxRecord = {
  state: TransactionState;
  /** Real transaction hash, set at `submitted`. Never fabricated. */
  hash: string | null;
  /** Plain-language failure message for `failed`. */
  failureMessage: string | null;
  /** Raw technical detail, shown only in an expandable section. */
  failureDetail: string | null;
};

export const IDLE_TX: TxRecord = { state: "idle", hash: null, failureMessage: null, failureDetail: null };

/** Map a raw send/confirm error to a plain-language message + raw detail. */
export function describeTxError(error: unknown): { message: string; detail: string } {
  const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  if (/user rejected|user denied|rejected the request|4001|ACTION_REJECTED/i.test(detail)) {
    return { message: "You declined to sign this transaction. No funds moved and nothing changed onchain.", detail };
  }
  if (/insufficient funds|insufficient balance|gas/i.test(detail) && /fund/i.test(detail)) {
    return { message: "Your wallet does not have enough funds to complete this transaction.", detail };
  }
  if (/allowance|approve|ERC20InsufficientAllowance/i.test(detail)) {
    return { message: "The token approval was missing or too low. Approve the exact amount first, then retry.", detail };
  }
  if (/NotCreated|already funded/i.test(detail)) {
    return { message: "This position has already been funded. No funds were transferred.", detail };
  }
  if (/NotRepayable|not yet funded|Completed/i.test(detail)) {
    return { message: "This position cannot accept repayment right now. No funds were transferred.", detail };
  }
  if (/Overpayment|exceed/i.test(detail)) {
    return { message: "The repayment amount exceeds the outstanding balance, so the contract rejected it. No funds were transferred.", detail };
  }
  if (/NotBusiness/i.test(detail)) {
    return { message: "Only the recorded business address can submit repayment for this position.", detail };
  }
  if (/network|timeout|fetch failed|ECONNRESET|429/i.test(detail)) {
    return { message: "We are having trouble reaching the network. Check the transaction status before retrying.", detail };
  }
  return { message: "The transaction could not be completed. No state change should be assumed.", detail };
}

export function useTx() {
  const [tx, setTx] = useState<TxRecord>(IDLE_TX);

  const reset = useCallback(() => setTx(IDLE_TX), []);

  /**
   * Drive one transaction through the lifecycle.
   * - prepare: build calldata/params (state: preparing)
   * - send: request wallet signature + broadcast, returns hash (awaiting_wallet -> submitted)
   * - confirm: wait for required confirmation depth (confirming -> confirmed)
   */
  const run = useCallback(
    async (steps: {
      prepare: () => Promise<{ to: string; data: string }>;
      send: (txParams: { to: string; data: string }) => Promise<string>;
      confirm: (hash: string) => Promise<void>;
    }) => {
      setTx({ state: "preparing", hash: null, failureMessage: null, failureDetail: null });
      try {
        const params = await steps.prepare();
        setTx((t) => ({ ...t, state: "awaiting_wallet" }));
        const hash = await steps.send(params);
        setTx({ state: "submitted", hash, failureMessage: null, failureDetail: null });
        setTx({ state: "confirming", hash, failureMessage: null, failureDetail: null });
        await steps.confirm(hash);
        setTx({ state: "confirmed", hash, failureMessage: null, failureDetail: null });
        return hash;
      } catch (error) {
        const { message, detail } = describeTxError(error);
        setTx((t) => ({ ...t, state: "failed", failureMessage: message, failureDetail: detail }));
        throw error;
      }
    },
    [],
  );

  return { tx, run, reset };
}
