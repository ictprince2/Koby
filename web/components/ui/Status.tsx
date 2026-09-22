import type { FinancingStatus, TransactionState } from "@/lib/types";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "pending" | "success" | "error" | "info";

const TONE_STYLES: Record<Tone, string> = {
  neutral: "bg-koby-bg-secondary text-koby-text-secondary",
  pending: "bg-koby-pending-subtle text-koby-pending",
  success: "bg-koby-success-subtle text-koby-success",
  error: "bg-koby-error-subtle text-koby-error",
  info: "bg-koby-info-subtle text-koby-info",
};

const DOT_STYLES: Record<Tone, string> = {
  neutral: "bg-koby-text-muted",
  pending: "bg-koby-pending",
  success: "bg-koby-success",
  error: "bg-koby-error",
  info: "bg-koby-info",
};

const TX_META: Record<TransactionState, { label: string; tone: Tone }> = {
  idle: { label: "Idle", tone: "neutral" },
  preparing: { label: "Preparing…", tone: "neutral" },
  awaiting_wallet: { label: "Waiting for wallet approval…", tone: "neutral" },
  submitted: { label: "Submitted", tone: "pending" },
  confirming: { label: "Confirming…", tone: "pending" },
  confirmed: { label: "Confirmed", tone: "success" },
  failed: { label: "Failed", tone: "error" },
};

const FINANCING_META: Record<FinancingStatus, { label: string; tone: Tone }> = {
  Created: { label: "Created", tone: "info" },
  Funded: { label: "Funded", tone: "pending" },
  Repaying: { label: "Repaying", tone: "pending" },
  Completed: { label: "Completed", tone: "success" },
};

function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-koby-sm px-2 py-1",
        "text-xs font-semibold",
        TONE_STYLES[tone],
      )}
    >
      <span aria-hidden="true" className={cn("inline-block h-2 w-2 rounded-full", DOT_STYLES[tone])} />
      {label}
    </span>
  );
}

/**
 * TransactionStatus — shared indicator for the 7 transaction states
 * (DESIGN.md Sections 7/21). Status is never color-only: dot + text always.
 * `submitted`/`confirming` use the pending language, never success.
 */
export function TransactionStatus({ state }: { state: TransactionState }) {
  const meta = TX_META[state];
  return <StatusPill label={meta.label} tone={meta.tone} />;
}

/**
 * FinancingStatusBadge — persistent position-state indicator. Only the four
 * MVP states; anything else is a product defect, not a new badge.
 */
export function FinancingStatusBadge({ status }: { status: FinancingStatus }) {
  const meta = FINANCING_META[status];
  return <StatusPill label={meta.label} tone={meta.tone} />;
}
