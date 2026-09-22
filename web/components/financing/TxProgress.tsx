"use client";

import { TransactionStatus } from "@/components/ui/Status";
import { AddressDisplay } from "@/components/ui/AddressDisplay";
import { explorerTxUrl } from "@/lib/monad";
import type { TxRecord } from "@/hooks/useTx";
import { useState } from "react";

/**
 * TxProgress — the transaction state, shown honestly (USER_FLOW.md 14):
 * hash appears at `submitted`, success only at `confirmed`, failure shows
 * what happened + what to do next, with raw detail expandable.
 */
const STATE_MESSAGES: Record<TxRecord["state"], string> = {
  idle: "No transaction in progress.",
  preparing: "Preparing transaction — validating parameters…",
  awaiting_wallet: "Waiting for wallet approval — check your wallet.",
  submitted: "Transaction submitted to Monad.",
  confirming: "Confirming on Monad — success is shown only after confirmation.",
  confirmed: "Settlement confirmed on Monad.",
  failed: "Transaction failed.",
};

export function TxProgress({ tx, label }: { tx: TxRecord; label: string }) {
  const [showDetail, setShowDetail] = useState(false);
  if (tx.state === "idle") return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-koby-md border border-koby-border bg-koby-surface p-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <TransactionStatus state={tx.state} />
        <p className="text-sm text-koby-text-secondary">
          <span className="font-medium text-koby-text">{label}: </span>
          {tx.state === "failed" && tx.failureMessage ? tx.failureMessage : STATE_MESSAGES[tx.state]}
        </p>
      </div>
      {tx.hash ? (
        <p className="mt-2 text-sm text-koby-text-secondary">
          Transaction hash: <AddressDisplay value={tx.hash} label="Transaction hash" />{" "}
          <a
            href={explorerTxUrl(tx.hash)}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-koby-text"
          >
            View on explorer
          </a>
        </p>
      ) : null}
      {tx.state === "confirming" && tx.hash ? (
        <p className="mt-1 text-xs text-koby-text-muted">
          Taking longer than expected? Check the transaction on the explorer above.
        </p>
      ) : null}
      {tx.state === "failed" && tx.failureDetail ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowDetail((v) => !v)}
            aria-expanded={showDetail}
            className="min-h-[44px] text-xs font-medium text-koby-text-secondary underline underline-offset-2"
          >
            {showDetail ? "Hide technical details" : "Show technical details"}
          </button>
          {showDetail ? (
            <pre className="mt-1 max-h-40 overflow-auto rounded-koby-sm bg-koby-bg-secondary p-2 font-mono text-xs text-koby-text-secondary">
              {tx.failureDetail}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
