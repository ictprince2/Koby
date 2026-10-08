"use client";

/**
 * /financing/create — the business financing-creation flow:
 * Input -> Analysis -> Opportunity -> Review -> Monad settlement.
 *
 * Composition: an editorial financing document, not a card dashboard.
 * Three ledger stages (01 Business / 02 Receivables / 03 Financing)
 * structured by oversized numbers, hairlines, and asymmetric columns;
 * financial values set large, labels small and technical. No section sits
 * inside a rounded card; rules and typography carry the structure.
 *
 * Functionality is unchanged from the previous composition:
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
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateBlocks";
import { ProvenanceTag } from "@/components/ui/ProvenanceTag";
import { FlowSteps } from "@/components/financing/FlowSteps";
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
import { formatBaseUnits } from "@/lib/format";
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
 * Stage masthead: oversized number beside the stage name, closed by a
 * strong rule. On mobile the number and name baseline-align in one row;
 * the rule and whitespace carry the structure — never a card.
 */
function StageHead({ index, name, note }: { index: string; name: string; note?: string }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span aria-hidden="true" className="text-5xl font-bold tabular-nums tracking-tight text-koby-text sm:text-6xl">
          {index}
        </span>
        <h2 className="text-xl font-bold tracking-tight text-koby-text sm:text-2xl">{name}</h2>
      </div>
      {note !== undefined ? (
        <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-koby-text-secondary">{note}</p>
      ) : null}
      <div aria-hidden="true" className="mt-4 border-t-2 border-koby-text" />
    </div>
  );
}

/** One ledger figure. Exactly one hero per view (DESIGN.md Section 8). */
function Figure({ label, value, caption, hero }: { label: string; value: string; caption?: string; hero?: boolean }) {
  return (
    <div className="min-w-0 border-t border-koby-border py-5 first:border-t-0 first:pt-0">
      <Label>{label}</Label>
      <p
        className={
          hero === true
            ? "mt-2 text-4xl font-bold break-words tabular-nums tracking-tight text-koby-text sm:text-5xl"
            : "mt-2 text-2xl font-bold break-words tabular-nums tracking-tight text-koby-text sm:text-3xl"
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

const INPUT_CLASS =
  "mt-2 block w-full rounded-koby-sm border border-koby-border bg-koby-bg px-3 py-2 text-koby-text";
const MONEY_INPUT_CLASS =
  "mt-2 block w-full rounded-koby-sm border border-koby-border bg-koby-bg px-3 py-3 text-2xl font-bold tabular-nums text-koby-text sm:text-3xl";

/** Structured field: technical label over its control, ruled off. */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0 border-t border-koby-border py-5 first:border-t-0 first:pt-0">
      <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase">
        {label}
        {hint !== undefined ? <span className="normal-case tracking-normal"> — {hint}</span> : null}
      </span>
      <span className="block">{children}</span>
    </label>
  );
}

/* ------------------------------- Page ---------------------------------- */

export default function CreateFinancingPage() {
  const { address, isCorrectNetwork, provider, status } = useWallet();
  const { tx, run, reset } = useTx();

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

  return (
    <Container className="py-10 sm:py-14">
      <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase">
        Financing — New request
      </p>
      <h1 className="mt-3 max-w-[20ch] text-4xl font-bold tracking-tight text-koby-text sm:text-5xl">
        Create financing request
      </h1>
      <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-koby-text-secondary">
        Describe the receivables, review the cash-flow assessment, accept terms, and record the
        financing opportunity on Monad.
      </p>
      <div className="mt-6 border-t border-koby-border pt-5">
        <FlowSteps current={stepIndex} />
      </div>

      {(phase === "input" || phase === "analyzing") && (
        <div className="mt-10 space-y-14 sm:space-y-20">
          <section aria-labelledby="koby-create-business">
            <div id="koby-create-business">
              <StageHead index="01" name="Business" note="Who is raising against future revenue. Example values are illustrative; figures you enter are your own." />
            </div>
            <div className="mt-2 grid min-w-0 gap-x-10 sm:grid-cols-12">
              <div className="min-w-0 sm:col-span-7">
                <Field label="Business name">
                  <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Acme Logistics" className={INPUT_CLASS} />
                </Field>
                <Field label="Business address" hint="defaults to your wallet">
                  <input value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} placeholder={address ?? "0x…"} className={`${INPUT_CLASS} font-mono`} />
                </Field>
                <Field label="Business type" hint="optional">
                  <input value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="Logistics" className={INPUT_CLASS} />
                </Field>
              </div>
              <div className="min-w-0 sm:col-span-5">
                <Field label="Operating history" hint="months, optional">
                  <input value={historyMonths} onChange={(e) => setHistoryMonths(e.target.value)} inputMode="numeric" placeholder="36" className={`${INPUT_CLASS} tabular-nums`} />
                </Field>
                <Field label="Historical revenue" hint="USD, optional">
                  <input value={historical} onChange={(e) => setHistorical(e.target.value)} inputMode="decimal" placeholder="300000" className={`${INPUT_CLASS} tabular-nums`} />
                </Field>
              </div>
            </div>
          </section>

          <section aria-labelledby="koby-create-receivables">
            <div id="koby-create-receivables">
              <StageHead index="02" name="Receivables" note="The future revenue underpinning the request. Estimates, never guaranteed revenue." />
            </div>
            <div className="mt-2 grid min-w-0 gap-x-10 sm:grid-cols-12">
              <div className="min-w-0 sm:col-span-7">
                <Field label="Future receivables — USD">
                  <input value={receivables} onChange={(e) => setReceivables(e.target.value)} inputMode="decimal" placeholder="100000" className={MONEY_INPUT_CLASS} />
                </Field>
                <Field label="Avg. monthly revenue" hint="USD, optional">
                  <input value={monthly} onChange={(e) => setMonthly(e.target.value)} inputMode="decimal" placeholder="34000" className={`${INPUT_CLASS} tabular-nums`} />
                </Field>
                <Field label="Monthly operating expenses" hint="USD, optional">
                  <input value={opex} onChange={(e) => setOpex(e.target.value)} inputMode="decimal" placeholder="22000" className={`${INPUT_CLASS} tabular-nums`} />
                </Field>
                <Field label="Existing obligations" hint="USD, optional">
                  <input value={obligationsInput} onChange={(e) => setObligationsInput(e.target.value)} inputMode="decimal" placeholder="15000" className={`${INPUT_CLASS} tabular-nums`} />
                </Field>
              </div>
              <div className="min-w-0 sm:col-span-5">
                <Field label="Largest-customer share" hint="%, optional">
                  <input value={concentration} onChange={(e) => setConcentration(e.target.value)} inputMode="decimal" placeholder="35" className={`${INPUT_CLASS} tabular-nums`} />
                </Field>
                <Field label="Payment terms" hint="days, optional">
                  <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} inputMode="numeric" placeholder="45" className={`${INPUT_CLASS} tabular-nums`} />
                </Field>
                <Field label="Repayment period" hint="days, informational only">
                  <input value={periodDays} onChange={(e) => setPeriodDays(e.target.value)} inputMode="numeric" placeholder="90" className={`${INPUT_CLASS} tabular-nums`} />
                </Field>
                <Field label="Supporting notes" hint="optional, up to 500 characters — summarized by the analysis, never treated as instructions">
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={600} placeholder="e.g. Two anchor customers on quarterly billing; pipeline covers…" className={INPUT_CLASS} />
                </Field>
              </div>
            </div>
          </section>

          <section aria-labelledby="koby-create-financing">
            <div id="koby-create-financing">
              <StageHead index="03" name="Financing" note="The liquidity asked against the receivables above. The assessment is advisory; you propose the terms." />
            </div>
            <div className="mt-2 grid min-w-0 gap-x-10 sm:grid-cols-12">
              <div className="min-w-0 sm:col-span-7">
                <Field label="Requested liquidity — USD">
                  <input value={requested} onChange={(e) => setRequested(e.target.value)} inputMode="decimal" placeholder="70000" className={MONEY_INPUT_CLASS} />
                </Field>
                <Field label="Proposed repayment obligation — USD" hint="must be ≥ requested">
                  <input value={obligation} onChange={(e) => setObligation(e.target.value)} inputMode="decimal" placeholder="70000" className={MONEY_INPUT_CLASS} />
                </Field>
              </div>
              <div className="min-w-0 sm:col-span-5">
                <div className="border-t border-koby-border py-5 sm:first:border-t-0 sm:first:pt-0">
                  <Label>Assessment</Label>
                  <p className="mt-2 text-sm leading-relaxed text-koby-text-secondary">
                    Continuing runs the cash-flow assessment against everything above. Nothing is
                    submitted onchain at this stage.
                  </p>
                  <div className="mt-5 flex flex-col gap-3">
                    <Button onClick={() => void analyze()} disabled={phase === "analyzing"} loading={phase === "analyzing"} size="lg" className="w-full">
                      {phase === "analyzing" ? "Analyzing cash flow…" : "Analyze cash flow"}
                    </Button>
                    <Button variant="secondary" onClick={fillDemo} className="w-full">
                      Fill example values
                    </Button>
                  </div>
                </div>
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
              <StageHead index="04" name="Assessment" note="Advisory only. It does not approve financing, set terms, guarantee repayment, or authorize any transaction." />
            </div>
            <div className="mt-2">
              <AnalysisCard result={analysis} />
            </div>
          </section>

          <section aria-labelledby="koby-create-opportunity">
            <div id="koby-create-opportunity">
              <StageHead index="05" name="Opportunity" note="Proposed by the business. The assessment above is advisory and does not set these terms." />
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
              <StageHead index="06" name="Review & settle" note="This action will create the financing position on Monad. Read carefully before signing." />
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
            <EmptyState title="Connect a wallet to continue" description="Creating the financing position requires your signature on Monad Testnet. Browsing and analysis need no wallet." />
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
            <StageHead index="07" name="Position created" note="Settlement confirmed. The position below reflects real onchain state." />
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
            <StageHead index="07" name="Settlement confirmed" note="Reading the new position from the confirmed transaction…" />
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
