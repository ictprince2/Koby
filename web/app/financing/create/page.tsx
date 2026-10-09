"use client";

/**
 * /financing/create — the business financing-creation flow:
 * Input -> Analysis -> Opportunity -> Review -> Monad settlement.
 *
 * Presentation: an institutional financing workspace. Typographic scale
 * does the work — large tabular financial figures, strong section titles,
 * quiet labels, underline data-entry controls, horizontal rules instead of
 * cards. Tiny monospace metadata appears only where genuinely needed
 * (wallet relationship, informational duration).
 *
 * Behavior is unchanged:
 * - Input, analysis, and opportunity review are offchain and need no
 *   wallet. The wallet becomes required only at settlement (review
 *   phase), where the UI states the signature requirement explicitly.
 * - Analysis runs server-side (POST /api/analyze): live AI assessment when
 *   the provider is available, otherwise the built-in assessment.
 *   The result is advisory and terms are proposed by the business, never set
 *   by the analysis.
 * - Duration is informational only in the MVP (not enforced onchain).
 * - The create transaction moves no tokens (terms recording only); funding
 *   moves value and happens on the position page.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { isAddress } from "viem";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { ErrorState, LoadingState } from "@/components/ui/StateBlocks";
import { ProvenanceTag } from "@/components/ui/ProvenanceTag";
import { AnalysisCard } from "@/components/financing/AnalysisCard";
import { ReviewCard } from "@/components/financing/ReviewCard";
import { TxProgress } from "@/components/financing/TxProgress";
import { useWallet } from "@/hooks/useWallet";
import { useTx } from "@/hooks/useTx";
import {
  formatCentsToUsd,
  parseUsdToCents,
  validateCashFlowInput,
  type AnalysisResponse,
  type CashFlowInput,
} from "@/lib/analysis";
import {
  encodeCreate,
  isFinancingConfigured,
  readCreatedIdFromReceipt,
  sendViaWallet,
  usdToBaseUnits,
  waitForConfirmation,
} from "@/services/financing";
import { formatBaseUnits, truncateHex } from "@/lib/format";
import { USDC_DECIMALS, monadConfig } from "@/lib/monad";

const DEMO_VALUES = {
  businessName: "Acme Logistics",
  businessType: "Logistics",
  operatingHistoryMonths: 36,
  futureReceivablesUsd: "100000",
  requestedFinancingUsd: "70000",
  repaymentPeriodDays: 90,
  monthlyRevenueUsd: "34000",
  historicalRevenueUsd: "300000",
  operatingExpensesUsd: "22000",
  existingObligationsUsd: "15000",
  topCustomerSharePct: 35,
  paymentTermsDays: 45,
};

type Phase = "input" | "analyzing" | "opportunity" | "review" | "settled";

/* ---------- Editorial primitives (presentation only, page-local) ---------- */

/** Quiet technical label for figures, fields, and ledger rows. */
function Label({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase">
      {children}
    </p>
  );
}

/**
 * StageHead — section title with authority: small mono index beside a
 * strong editorial heading, closed by a horizontal rule. No explanatory
 * note; the workspace below carries the meaning. `index` is omitted for
 * unnumbered blocks (e.g. ASSESSMENT).
 */
function StageHead({ index, name }: { index?: string; name: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-4">
        {index !== undefined ? (
          <span
            aria-hidden="true"
            className="font-mono text-sm font-medium tabular-nums text-koby-text-muted"
          >
            {index}
          </span>
        ) : null}
        <h2 className="text-xl font-bold tracking-tight text-koby-text sm:text-2xl">{name}</h2>
      </div>
      <div aria-hidden="true" className="mt-4 border-t border-koby-border-strong" />
    </div>
  );
}

/**
 * ProcessRail — the lifecycle as a status rail, not step cards: five
 * ruled cells, small type, the active cell edged in accent. Text and
 * position carry state, never color alone.
 */
const RAIL_STEPS = ["Input", "Analysis", "Opportunity", "Settlement", "Repayment"] as const;

function ProcessRail({ current }: { current: number }) {
  return (
    <ol
      aria-label="Financing progress"
      className="koby-no-scrollbar flex gap-6 overflow-x-auto sm:grid sm:grid-cols-5 sm:gap-8 sm:overflow-visible"
    >
      {RAIL_STEPS.map((label, step) => {
        const done = step < current;
        const active = step === current;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className="min-w-[7rem] shrink-0 sm:min-w-0"
          >
            <div
              aria-hidden="true"
              className={
                active
                  ? "border-t-2 border-koby-accent"
                  : done
                    ? "border-t-2 border-koby-success"
                    : "border-t border-koby-border"
              }
            />
            <p className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-[11px] tabular-nums text-koby-text-muted">
                {String(step + 1).padStart(2, "0")}
              </span>
              <span
                className={
                  active || done
                    ? "text-sm font-semibold text-koby-text"
                    : "text-sm font-medium text-koby-text-muted"
                }
              >
                {label}
              </span>
              {done ? (
                <span aria-hidden="true" className="text-xs text-koby-success">
                  ✓
                </span>
              ) : null}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/** Ledger figures. The hero figure is the largest number on screen. */
function Figure({ label, value, caption, hero }: { label: string; value: string; caption?: string; hero?: boolean }) {
  return (
    <div className="min-w-0 border-t border-koby-border py-6 first:border-t-0 first:pt-0">
      <Label>{label}</Label>
      <p
        className={
          hero === true
            ? "mt-2 text-5xl font-bold break-words tabular-nums tracking-tight text-koby-text sm:text-6xl"
            : "mt-2 text-3xl font-bold break-words tabular-nums tracking-tight text-koby-text sm:text-4xl"
        }
      >
        {value}
      </p>
      {caption !== undefined ? (
        <p className="mt-1 text-xs text-koby-text-muted">{caption}</p>
      ) : null}
    </div>
  );
}

/**
 * Underline data-entry controls: no boxes, no shadows — a bottom rule,
 * strong confident type, accent on focus. Financial controls scale up to
 * figure size. Units sit at the control's right edge.
 */
const INPUT_CLASS =
  "block w-full border-b border-koby-border-strong bg-transparent px-0 py-2 pr-14 text-lg font-medium text-koby-text placeholder:text-koby-text-muted focus:border-koby-accent focus:outline-none";
const MONEY_INPUT_CLASS =
  "block w-full border-b border-koby-border-strong bg-transparent px-0 py-3 pr-16 text-3xl font-bold tabular-nums tracking-tight text-koby-text placeholder:text-koby-text-muted focus:border-koby-accent focus:outline-none sm:text-4xl";

/**
 * Field — small precise label over its control, no box, no per-field
 * instruction. `meta` is reserved for the rare line that genuinely
 * matters (wallet relationship, informational duration).
 */
function Field({
  label,
  unit,
  meta,
  children,
}: {
  label: string;
  unit?: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0 py-5">
      <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase">
        {label}
      </span>
      <span className="mt-1 block">
        {unit !== undefined ? (
          <span className="relative block">
            {children}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 font-mono text-xs text-koby-text-muted"
            >
              {unit}
            </span>
          </span>
        ) : (
          children
        )}
      </span>
      {meta !== undefined ? (
        <span className="mt-1.5 block font-mono text-[11px] tracking-wide text-koby-text-muted">
          {meta}
        </span>
      ) : null}
    </label>
  );
}

/* ------------------------------- Page ---------------------------------- */

export default function CreateFinancingPage() {
  const {
    address,
    isCorrectNetwork,
    provider,
    status,
    privyAvailable,
    connectPrivy,
  } = useWallet();
  const { tx, run, reset } = useTx();
  const [connectBusy, setConnectBusy] = useState(false);
  const [settlementNotice, setSettlementNotice] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [historyMonths, setHistoryMonths] = useState("");
  const [receivables, setReceivables] = useState("");
  const [requested, setRequested] = useState("");
  const [periodDays, setPeriodDays] = useState("90");
  const [monthly, setMonthly] = useState("");
  const [historical, setHistorical] = useState("");
  const [opex, setOpex] = useState("");
  const [obligationsInput, setObligationsInput] = useState("");
  const [concentration, setConcentration] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [obligation, setObligation] = useState("");

  const [phase, setPhase] = useState<Phase>("input");
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [createdId, setCreatedId] = useState<bigint | null>(null);

  const configured = isFinancingConfigured();
  const effectiveBusiness = businessAddress.trim() === "" ? (address ?? "") : businessAddress.trim();

  function fillDemo() {
    setBusinessName(DEMO_VALUES.businessName);
    setBusinessType(DEMO_VALUES.businessType);
    setHistoryMonths(String(DEMO_VALUES.operatingHistoryMonths));
    setReceivables(DEMO_VALUES.futureReceivablesUsd);
    setRequested(DEMO_VALUES.requestedFinancingUsd);
    setPeriodDays(String(DEMO_VALUES.repaymentPeriodDays));
    setMonthly(DEMO_VALUES.monthlyRevenueUsd);
    setHistorical(DEMO_VALUES.historicalRevenueUsd);
    setOpex(DEMO_VALUES.operatingExpensesUsd);
    setObligationsInput(DEMO_VALUES.existingObligationsUsd);
    setConcentration(String(DEMO_VALUES.topCustomerSharePct));
    setPaymentTerms(String(DEMO_VALUES.paymentTermsDays));
    setNotes("");
    setObligation(DEMO_VALUES.requestedFinancingUsd);
    setFormErrors([]);
  }

  function toOptionalNumber(raw: string): number | undefined {
    const trimmed = raw.trim();
    if (trimmed === "") return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }

  async function analyze() {
    setFormErrors([]);
    setAnalysisError(null);
    const period = Number.parseInt(periodDays, 10);
    const cashInput: CashFlowInput = {
      businessName,
      futureReceivablesUsd: receivables,
      requestedFinancingUsd: requested,
      repaymentPeriodDays: period,
      monthlyRevenueUsd: monthly.trim() === "" ? undefined : monthly,
    };
    if (businessType.trim() !== "") cashInput.businessType = businessType;
    const months = toOptionalNumber(historyMonths);
    if (months !== undefined) cashInput.operatingHistoryMonths = months;
    if (historical.trim() !== "") cashInput.historicalRevenueUsd = historical;
    if (opex.trim() !== "") cashInput.operatingExpensesUsd = opex;
    if (obligationsInput.trim() !== "") cashInput.existingObligationsUsd = obligationsInput;
    const share = toOptionalNumber(concentration);
    if (share !== undefined) cashInput.topCustomerSharePct = share;
    const terms = toOptionalNumber(paymentTerms);
    if (terms !== undefined) cashInput.paymentTermsDays = terms;
    if (notes.trim() !== "") cashInput.supportingNotes = notes;
    const inputErrors = validateCashFlowInput(cashInput);
    const extra: string[] = [];
    if (businessAddress.trim() !== "" && !isAddress(businessAddress.trim())) {
      extra.push("Business address must be a valid Ethereum address, or left empty to use your connected wallet.");
    }
    const obligationCents = parseUsdToCents(obligation);
    const requestedCents = parseUsdToCents(requested);
    if (obligationCents === null || obligationCents <= 0n) {
      extra.push("Proposed repayment obligation must be a positive USD amount.");
    } else if (requestedCents !== null && obligationCents < requestedCents) {
      extra.push("Proposed repayment obligation must be at least the requested financing amount.");
    }
    if (inputErrors.length > 0 || extra.length > 0) {
      setFormErrors([...inputErrors.map((e) => e.message), ...extra]);
      return;
    }
    setPhase("analyzing");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(cashInput),
      });
      const body = (await res.json()) as AnalysisResponse & { errors?: { message: string }[]; error?: string };
      if (!res.ok) {
        const detail = body.errors?.map((e) => e.message).join(" ") ?? body.error ?? "Assessment failed.";
        setAnalysisError(`Cash-flow assessment is temporarily unavailable. ${detail}`);
        setPhase("input");
        return;
      }
      setAnalysis(body);
      if (obligation.trim() === "") setObligation(requested);
      setPhase("opportunity");
    } catch {
      setAnalysisError("Cash-flow assessment is temporarily unavailable. Check your connection and retry — nothing was submitted onchain.");
      setPhase("input");
    }
  }

  const principalBase = usdToBaseUnits(requested);
  const obligationBase = usdToBaseUnits(obligation);

  // Live obligation-to-requested ratio from the user's own entries —
  // calculator-style derived display, not a term or a quote.
  const obligationRatio = (() => {
    const req = parseUsdToCents(requested);
    const obl = parseUsdToCents(obligation);
    if (req === null || obl === null || req <= 0n) return null;
    return Number((obl * 10000n) / req) / 100;
  })();

  async function createOnchain() {
    setAnalysisError(null);
    if (!provider || !address) return;
    if (principalBase === null || obligationBase === null || !isAddress(effectiveBusiness)) return;
    reset();
    setCreatedId(null);
    setPhase("review");
    try {
      await run({
        prepare: async () => {
          if (!monadConfig.contractAddress) throw new Error("CONTRACT_NOT_CONFIGURED");
          return { to: monadConfig.contractAddress, data: encodeCreate(effectiveBusiness, principalBase, obligationBase) };
        },
        send: (params) => sendViaWallet(provider, address, params.to, params.data as `0x${string}`),
        confirm: (hash) => waitForConfirmation(hash),
      });
      // Confirmation is reflected in tx state; the position id resolves below.
    } catch {
      // Failure UI is rendered from tx state below.
    }
  }

  // After confirmation, resolve the real position id from the receipt event.
  // Guarded by a ref (not state); state updates land in the callbacks below.
  const resolvingRef = useRef(false);
  useEffect(() => {
    if (tx.state !== "confirmed" || createdId !== null || !tx.hash || resolvingRef.current) return;
    resolvingRef.current = true;
    readCreatedIdFromReceipt(tx.hash)
      .then((id) => {
        resolvingRef.current = false;
        if (id !== null) {
          setCreatedId(id);
          setPhase("settled");
        }
      })
      .catch(() => {
        resolvingRef.current = false;
      });
  }, [tx.state, tx.hash, createdId]);

  const stepIndex = phase === "input" || phase === "analyzing" ? 0 : phase === "opportunity" ? 2 : phase === "review" ? 3 : 4;

  // Settlement-time connect only: input, analysis, and opportunity review
  // never ask for a wallet. Uses the existing wallet authority unchanged —
  // Privy primary, explicit installed-wallet menu via the header control —
  // surfaced here as an explicit step. Nothing auto-picks an injected
  // wallet by discovery order.
  async function connectForSettlement() {
    if (connectBusy || status === "connecting") return;
    setSettlementNotice(null);
    if (!privyAvailable) {
      setSettlementNotice(
        "Privy onboarding isn't configured in this build. Use the Connect wallet button in the header and choose an installed wallet explicitly.",
      );
      return;
    }
    setConnectBusy(true);
    try {
      await connectPrivy();
    } finally {
      setConnectBusy(false);
    }
  }

  return (
    <Container className="py-10 sm:py-14">
      <p className="font-mono text-[11px] font-medium tracking-[0.2em] text-koby-text-muted uppercase">
        Financing / New request
      </p>
      <h1 className="mt-3 max-w-[20ch] text-3xl font-bold tracking-tight text-koby-text sm:text-4xl">
        Create financing request
      </h1>
      <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-koby-text-secondary">
        Submit future receivables for assessment and structure a financing opportunity on Monad.
      </p>
      <div className="mt-8">
        <ProcessRail current={stepIndex} />
      </div>

      {(phase === "input" || phase === "analyzing") && (
        <div className="mt-12 space-y-16 sm:space-y-20">
          <section aria-labelledby="koby-create-business">
            <div id="koby-create-business">
              <StageHead index="01" name="Business" />
            </div>
            <div className="mt-4 grid min-w-0 gap-x-10 sm:grid-cols-12">
              <div className="min-w-0 sm:col-span-7">
                <Field label="Business name">
                  <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Acme Logistics" className={INPUT_CLASS} />
                </Field>
              </div>
              <div className="min-w-0 sm:col-span-5">
                <Field label="Business type">
                  <input value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="Logistics" className={INPUT_CLASS} />
                </Field>
              </div>
              <div className="min-w-0 sm:col-span-7">
                <Field
                  label="Business address"
                  meta={
                    businessAddress.trim() !== ""
                      ? undefined
                      : address
                        ? `Defaults to connected wallet ${truncateHex(address)}`
                        : "No wallet connected — needed only at settlement"
                  }
                >
                  <input value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} placeholder={address ?? "0x…"} className={`${INPUT_CLASS} font-mono`} />
                </Field>
              </div>
              <div className="min-w-0 sm:col-span-5">
                <Field label="Operating history" unit="months">
                  <input value={historyMonths} onChange={(e) => setHistoryMonths(e.target.value)} inputMode="numeric" placeholder="36" className={`${INPUT_CLASS} tabular-nums`} />
                </Field>
              </div>
              <div className="min-w-0 sm:col-span-5">
                <Field label="Historical revenue" unit="USD">
                  <input value={historical} onChange={(e) => setHistorical(e.target.value)} inputMode="decimal" placeholder="300000" className={`${INPUT_CLASS} tabular-nums`} />
                </Field>
              </div>
            </div>
          </section>

          <section aria-labelledby="koby-create-receivables">
            <div id="koby-create-receivables">
              <StageHead index="02" name="Receivables" />
            </div>
            <div className="mt-4 grid min-w-0 gap-x-10 sm:grid-cols-12">
              <div className="min-w-0 sm:col-span-7">
                <Field label="Future receivables" unit="USD">
                  <input value={receivables} onChange={(e) => setReceivables(e.target.value)} inputMode="decimal" placeholder="100000" className={MONEY_INPUT_CLASS} />
                </Field>
              </div>
              <div className="min-w-0 sm:col-span-5">
                <Field label="Avg. monthly revenue" unit="USD">
                  <input value={monthly} onChange={(e) => setMonthly(e.target.value)} inputMode="decimal" placeholder="34000" className={`${INPUT_CLASS} tabular-nums`} />
                </Field>
              </div>
              <div className="min-w-0 sm:col-span-6">
                <Field label="Monthly operating expenses" unit="USD">
                  <input value={opex} onChange={(e) => setOpex(e.target.value)} inputMode="decimal" placeholder="22000" className={`${INPUT_CLASS} tabular-nums`} />
                </Field>
              </div>
              <div className="min-w-0 sm:col-span-6">
                <Field label="Existing obligations" unit="USD">
                  <input value={obligationsInput} onChange={(e) => setObligationsInput(e.target.value)} inputMode="decimal" placeholder="15000" className={`${INPUT_CLASS} tabular-nums`} />
                </Field>
              </div>
              <div className="min-w-0 sm:col-span-6">
                <Field label="Largest-customer share" unit="%">
                  <input value={concentration} onChange={(e) => setConcentration(e.target.value)} inputMode="decimal" placeholder="35" className={`${INPUT_CLASS} tabular-nums`} />
                </Field>
              </div>
              <div className="min-w-0 sm:col-span-6">
                <Field label="Payment terms" unit="days">
                  <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} inputMode="numeric" placeholder="45" className={`${INPUT_CLASS} tabular-nums`} />
                </Field>
              </div>
              <div className="min-w-0 sm:col-span-6">
                <Field label="Repayment period" unit="days" meta="Informational — not enforced onchain">
                  <input value={periodDays} onChange={(e) => setPeriodDays(e.target.value)} inputMode="numeric" placeholder="90" className={`${INPUT_CLASS} tabular-nums`} />
                </Field>
              </div>
            </div>
            <div className="mt-2 min-w-0">
              <Field label="Supporting notes">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={600} placeholder="Two anchor customers on quarterly billing…" className={`${INPUT_CLASS} resize-y`} />
              </Field>
            </div>
          </section>

          <section aria-labelledby="koby-create-financing">
            <div id="koby-create-financing">
              <StageHead index="03" name="Financing" />
            </div>
            <div className="mt-4 grid min-w-0 gap-x-10 sm:grid-cols-2">
              <div className="min-w-0 sm:pr-8">
                <Field label="Requested liquidity" unit="USD">
                  <input value={requested} onChange={(e) => setRequested(e.target.value)} inputMode="decimal" placeholder="70000" className={MONEY_INPUT_CLASS} />
                </Field>
              </div>
              <div className="min-w-0 sm:border-l sm:border-koby-border sm:pl-8">
                <Field
                  label="Repayment obligation"
                  unit="USD"
                  meta={obligationRatio !== null ? `${obligationRatio.toFixed(2)}% of requested liquidity` : undefined}
                >
                  <input value={obligation} onChange={(e) => setObligation(e.target.value)} inputMode="decimal" placeholder="75000" className={MONEY_INPUT_CLASS} />
                </Field>
              </div>
            </div>
          </section>

          <section aria-labelledby="koby-create-assess">
            <div id="koby-create-assess">
              <StageHead name="Assessment" />
            </div>
            <div className="mt-6 max-w-2xl">
              <p className="text-sm font-semibold text-koby-text">Offchain analysis</p>
              <p className="mt-1 text-sm leading-relaxed text-koby-text-secondary">
                Your inputs will be evaluated before any blockchain transaction.
              </p>
              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button onClick={() => void analyze()} disabled={phase === "analyzing"} loading={phase === "analyzing"} size="lg" className="w-full sm:w-auto">
                  {phase === "analyzing" ? "Analyzing cash flow…" : "Analyze cash flow →"}
                </Button>
                <button
                  type="button"
                  onClick={fillDemo}
                  className="font-mono text-xs text-koby-text-muted underline underline-offset-4 transition-colors hover:text-koby-text"
                >
                  Fill example values
                </button>
              </div>
            </div>
          </section>

          {formErrors.length > 0 ? (
            <div role="alert" className="border-t-2 border-koby-error pt-4">
              <p className="text-base font-semibold text-koby-error">Check the following:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-koby-text-secondary">{formErrors.map((e) => <li key={e}>{e}</li>)}</ul>
            </div>
          ) : null}
          {analysisError ? (
            <div role="alert" className="border-t-2 border-koby-error pt-4 text-sm text-koby-text-secondary">{analysisError}</div>
          ) : null}
          {phase === "analyzing" ? <LoadingState message="Analyzing cash flow — running the assessment methodology…" /> : null}
        </div>
      )}

      {phase === "opportunity" && analysis && (
        <div className="mt-10 space-y-14 sm:space-y-20">
          <section aria-labelledby="koby-create-assessment">
            <div id="koby-create-assessment">
              <StageHead index="04" name="Assessment" />
            </div>
            <div className="mt-2">
              <AnalysisCard result={analysis} />
            </div>
          </section>

          <section aria-labelledby="koby-create-opportunity">
            <div id="koby-create-opportunity">
              <StageHead index="05" name="Opportunity" />
            </div>
            <div className="mt-2">
              <ProvenanceTag source="User Provided" />
            </div>
            <div className="mt-6">
              <Figure label="Future receivables" value={`$${formatCentsToUsd(parseUsdToCents(receivables) ?? 0n)}`} caption="Business-submitted estimate" />
              <Figure hero label="Requested liquidity" value={`$${formatCentsToUsd(parseUsdToCents(requested) ?? 0n)}`} caption={`Advisory eligible: $${analysis.eligibleAmountUsd} — guidance, not an offer`} />
              <Figure label="Proposed obligation" value={`$${formatCentsToUsd(parseUsdToCents(obligation) ?? 0n)}`} caption={`Financing ratio: ${(analysis.financingRatioBps / 100).toFixed(2)}% · Repayment period: ${periodDays} days (informational only)`} />
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => setPhase("review")} size="lg" className="w-full sm:w-auto">Review financing terms</Button>
              <Button variant="secondary" onClick={() => setPhase("input")} size="lg" className="w-full sm:w-auto">Back to input</Button>
            </div>
          </section>
        </div>
      )}

      {phase === "review" && (
        <div className="mt-10 space-y-14 sm:space-y-20">
          <section aria-labelledby="koby-create-review">
            <div id="koby-create-review">
              <StageHead index="06" name="Review & settle" />
            </div>
            <div className="mt-6">
              <ReviewCard
                action={`Create ${principalBase !== null ? formatBaseUnits(principalBase, USDC_DECIMALS) : ""} financing`}
                amount={principalBase !== null ? `${formatBaseUnits(principalBase, USDC_DECIMALS)} (testnet USDC)` : "—"}
                contractLabel="Koby financing contract"
                terms={[
                  { label: "Business", value: effectiveBusiness || "—" },
                  { label: "Principal (financing amount)", value: principalBase !== null ? formatBaseUnits(principalBase, USDC_DECIMALS) : "—" },
                  { label: "Repayment obligation", value: obligationBase !== null ? formatBaseUnits(obligationBase, USDC_DECIMALS) : "—" },
                  { label: "Repayment period", value: `${periodDays} days (informational only)` },
                  { label: "Wallet", value: address ?? "Not connected" },
                ]}
              />
            </div>
          </section>

          {!configured ? (
            <ErrorState
              title="Financing contract is not deployed yet"
              message="NEXT_PUBLIC_CONTRACT_ADDRESS is empty, so no transaction can be prepared. Deploy the contract to Monad Testnet (script/Deploy.s.sol), set the address, and retry. The analysis above is preserved — nothing was submitted onchain."
            />
          ) : status !== "connected" ? (
            <div className="border-t-2 border-koby-text pt-6">
              <p className="font-mono text-[11px] font-medium tracking-[0.2em] text-koby-text-muted uppercase">
                Ready to settle
              </p>
              <p className="mt-3 max-w-[40ch] text-2xl font-bold tracking-tight text-koby-text">
                Connect a wallet to continue on Monad.
              </p>
              <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-koby-text-secondary">
                Only the settlement signature needs your wallet — nothing moves until you sign the terms above.
              </p>
              <div className="mt-5">
                <Button
                  onClick={() => void connectForSettlement()}
                  disabled={connectBusy || status === "connecting"}
                  loading={connectBusy || status === "connecting"}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {connectBusy || status === "connecting" ? "Connecting…" : "Connect wallet →"}
                </Button>
              </div>
              {settlementNotice ? (
                <p role="status" className="mt-3 max-w-[58ch] text-sm leading-relaxed text-koby-text-secondary">
                  {settlementNotice}
                </p>
              ) : null}
            </div>
          ) : !isCorrectNetwork ? (
            <ErrorState title="Wrong network" message={`Your wallet is not on ${monadConfig.chainName}. Switch networks to create this financing position. No transaction was prepared.`} />
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => void createOnchain()} disabled={tx.state === "preparing" || tx.state === "awaiting_wallet" || tx.state === "submitted" || tx.state === "confirming"} loading={tx.state !== "idle" && tx.state !== "failed" && tx.state !== "confirmed"} size="lg" className="w-full sm:w-auto">
                {tx.state === "idle" || tx.state === "failed" ? `Create ${principalBase !== null ? formatBaseUnits(principalBase, USDC_DECIMALS) : ""} financing on Monad` : "Creating…"}
              </Button>
              <Button variant="secondary" onClick={() => { reset(); setPhase("opportunity"); }} size="lg" className="w-full sm:w-auto">Back to opportunity</Button>
            </div>
          )}
          <TxProgress tx={tx} label="Create financing" />
          {tx.state === "failed" ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void createOnchain()}>Retry transaction</Button>
            </div>
          ) : null}
        </div>
      )}

      {phase === "settled" && createdId !== null && (
        <section aria-labelledby="koby-create-settled" className="mt-10">
          <div id="koby-create-settled">
            <StageHead index="07" name="Position created" />
          </div>
          <p className="mt-6 text-2xl font-bold tracking-tight text-koby-text">
            Position <span className="font-mono">#{createdId.toString()}</span>
          </p>
          <p className="mt-1 font-mono text-xs text-koby-text-muted">now exists on {monadConfig.chainName}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button href={`/financing/${createdId.toString()}`} size="lg" className="w-full text-center sm:w-auto">Open financing position</Button>
            <Button variant="secondary" href="/marketplace" size="lg" className="w-full text-center sm:w-auto">View marketplace</Button>
          </div>
        </section>
      )}
      {tx.state === "confirmed" && phase === "review" && createdId === null && (
        <section aria-labelledby="koby-create-confirming" className="mt-10">
          <div id="koby-create-confirming">
            <StageHead index="07" name="Settlement confirmed" />
          </div>
          <div className="mt-4">
            <LoadingState message="Settlement confirmed on Monad. Reading the new position from the confirmed transaction…" />
          </div>
          {tx.hash ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button href="/marketplace" variant="secondary">View marketplace</Button>
            </div>
          ) : null}
          <p className="mt-4 text-xs text-koby-text-muted">
            If the position does not resolve, find it in the marketplace or via the transaction on the explorer. <Link href="/marketplace" className="underline">Marketplace</Link>
          </p>
        </section>
      )}
    </Container>
  );
}
