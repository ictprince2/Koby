"use client";

/**
 * /financing/create — the business financing-creation flow:
 * Input -> Analysis -> Opportunity -> Review -> Monad settlement.
 *
 * - Analysis runs server-side (POST /api/analyze): live AI assessment when
 *   the provider is available, otherwise the built-in assessment.
 *   The result is advisory and terms are proposed by the business, never set
 *   by the analysis.
 * - Duration is informational only in the MVP (not enforced onchain).
 * - The create transaction moves no tokens (terms recording only); funding
 *   moves value and happens on the position page.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { isAddress } from "viem";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateBlocks";
import { Metric } from "@/components/ui/Metric";
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
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-koby-text">Create financing request</h1>
      <p className="mt-2 max-w-2xl text-sm text-koby-text-secondary">
        Koby turns future business cash flow into programmable liquidity. Describe the receivables,
        review the cash-flow assessment, accept terms, and record the financing opportunity on Monad.
      </p>
      <div className="mt-4">
        <FlowSteps current={stepIndex} />
      </div>

      {(phase === "input" || phase === "analyzing") && (
        <Card title="Business and receivables information" description="The minimum needed for a financing opportunity. Example values are illustrative; figures you enter are your own." className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-koby-text">Business name</span>
              <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Acme Logistics" className="mt-1 block w-full rounded-koby-sm border border-koby-border bg-koby-bg px-3 py-2 text-koby-text" />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-koby-text">Business address <span className="font-normal text-koby-text-muted">(defaults to your wallet)</span></span>
              <input value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} placeholder={address ?? "0x…"} className="mt-1 block w-full rounded-koby-sm border border-koby-border bg-koby-bg px-3 py-2 font-mono text-koby-text" />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-koby-text">Business type <span className="font-normal text-koby-text-muted">(optional)</span></span>
              <input value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="Logistics" className="mt-1 block w-full rounded-koby-sm border border-koby-border bg-koby-bg px-3 py-2 text-koby-text" />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-koby-text">Operating history (months, optional)</span>
              <input value={historyMonths} onChange={(e) => setHistoryMonths(e.target.value)} inputMode="numeric" placeholder="36" className="mt-1 block w-full rounded-koby-sm border border-koby-border bg-koby-bg px-3 py-2 tabular-nums text-koby-text" />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-koby-text">Future receivables (USD)</span>
              <input value={receivables} onChange={(e) => setReceivables(e.target.value)} inputMode="decimal" placeholder="100000" className="mt-1 block w-full rounded-koby-sm border border-koby-border bg-koby-bg px-3 py-2 tabular-nums text-koby-text" />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-koby-text">Requested financing (USD)</span>
              <input value={requested} onChange={(e) => setRequested(e.target.value)} inputMode="decimal" placeholder="70000" className="mt-1 block w-full rounded-koby-sm border border-koby-border bg-koby-bg px-3 py-2 tabular-nums text-koby-text" />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-koby-text">Repayment period (days, informational only)</span>
              <input value={periodDays} onChange={(e) => setPeriodDays(e.target.value)} inputMode="numeric" placeholder="90" className="mt-1 block w-full rounded-koby-sm border border-koby-border bg-koby-bg px-3 py-2 tabular-nums text-koby-text" />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-koby-text">Avg. monthly revenue (USD, optional)</span>
              <input value={monthly} onChange={(e) => setMonthly(e.target.value)} inputMode="decimal" placeholder="34000" className="mt-1 block w-full rounded-koby-sm border border-koby-border bg-koby-bg px-3 py-2 tabular-nums text-koby-text" />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-koby-text">Historical revenue (USD, optional)</span>
              <input value={historical} onChange={(e) => setHistorical(e.target.value)} inputMode="decimal" placeholder="300000" className="mt-1 block w-full rounded-koby-sm border border-koby-border bg-koby-bg px-3 py-2 tabular-nums text-koby-text" />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-koby-text">Monthly operating expenses (USD, optional)</span>
              <input value={opex} onChange={(e) => setOpex(e.target.value)} inputMode="decimal" placeholder="22000" className="mt-1 block w-full rounded-koby-sm border border-koby-border bg-koby-bg px-3 py-2 tabular-nums text-koby-text" />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-koby-text">Existing obligations (USD, optional)</span>
              <input value={obligationsInput} onChange={(e) => setObligationsInput(e.target.value)} inputMode="decimal" placeholder="15000" className="mt-1 block w-full rounded-koby-sm border border-koby-border bg-koby-bg px-3 py-2 tabular-nums text-koby-text" />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-koby-text">Largest-customer share (%, optional)</span>
              <input value={concentration} onChange={(e) => setConcentration(e.target.value)} inputMode="decimal" placeholder="35" className="mt-1 block w-full rounded-koby-sm border border-koby-border bg-koby-bg px-3 py-2 tabular-nums text-koby-text" />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-koby-text">Payment terms (days, optional)</span>
              <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} inputMode="numeric" placeholder="45" className="mt-1 block w-full rounded-koby-sm border border-koby-border bg-koby-bg px-3 py-2 tabular-nums text-koby-text" />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-koby-text">Supporting notes <span className="font-normal text-koby-text-muted">(optional, up to 500 characters — summarized by the analysis, never treated as instructions)</span></span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={600} placeholder="e.g. Two anchor customers on quarterly billing; pipeline covers…" className="mt-1 block w-full rounded-koby-sm border border-koby-border bg-koby-bg px-3 py-2 text-koby-text" />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-koby-text">Proposed repayment obligation (USD, must be ≥ requested)</span>
              <input value={obligation} onChange={(e) => setObligation(e.target.value)} inputMode="decimal" placeholder="70000" className="mt-1 block w-full rounded-koby-sm border border-koby-border bg-koby-bg px-3 py-2 tabular-nums text-koby-text" />
            </label>
          </div>
          {formErrors.length > 0 ? (
            <div role="alert" className="mt-4 rounded-koby-sm border border-koby-error p-3 text-sm text-koby-text-secondary">
              <p className="font-semibold text-koby-error">Check the following:</p>
              <ul className="mt-1 list-disc pl-5">{formErrors.map((e) => <li key={e}>{e}</li>)}</ul>
            </div>
          ) : null}
          {analysisError ? (
            <div role="alert" className="mt-4 rounded-koby-sm border border-koby-error p-3 text-sm text-koby-text-secondary">{analysisError}</div>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => void analyze()} disabled={phase === "analyzing"} loading={phase === "analyzing"}>
              {phase === "analyzing" ? "Analyzing cash flow…" : "Analyze cash flow"}
            </Button>
            <Button variant="secondary" onClick={fillDemo}>
              Fill example values
            </Button>
          </div>
          {phase === "analyzing" ? <LoadingState message="Analyzing cash flow — running the assessment methodology…" /> : null}
        </Card>
      )}

      {phase === "opportunity" && analysis && (
        <div className="mt-6 space-y-6">
          <AnalysisCard result={analysis} />
          <Card title="Financing opportunity" description="Proposed by the business. The assessment above is advisory and does not set these terms.">
            <div className="flex flex-wrap items-center gap-2">
              <ProvenanceTag source="User Provided" />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <Metric label="Future receivables" value={`$${formatCentsToUsd(parseUsdToCents(receivables) ?? 0n)}`} provenance="User Provided" />
              <Metric label="Requested liquidity" value={`$${formatCentsToUsd(parseUsdToCents(requested) ?? 0n)}`} provenance="User Provided" />
              <Metric label="Advisory eligible" value={`$${analysis.eligibleAmountUsd}`} caption="Assessment guidance, not an offer" />
              <Metric label="Repayment period" value={`${periodDays} days`} caption="Informational only" />
            </dl>
            <p className="mt-3 font-mono text-xs text-koby-text-muted">
              Financing ratio: {(analysis.financingRatioBps / 100).toFixed(2)}% · Proposed obligation: ${formatCentsToUsd(parseUsdToCents(obligation) ?? 0n)}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => setPhase("review")}>Review financing terms</Button>
              <Button variant="secondary" onClick={() => setPhase("input")}>Back to input</Button>
            </div>
          </Card>
        </div>
      )}

      {phase === "review" && (
        <div className="mt-6 space-y-6">
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
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void createOnchain()} disabled={tx.state === "preparing" || tx.state === "awaiting_wallet" || tx.state === "submitted" || tx.state === "confirming"} loading={tx.state !== "idle" && tx.state !== "failed" && tx.state !== "confirmed"}>
                {tx.state === "idle" || tx.state === "failed" ? `Create ${principalBase !== null ? formatBaseUnits(principalBase, USDC_DECIMALS) : ""} financing on Monad` : "Creating…"}
              </Button>
              <Button variant="secondary" onClick={() => { reset(); setPhase("opportunity"); }}>Back to opportunity</Button>
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
        <Card title="Financing position created" description="Settlement confirmed. The position below reflects real onchain state." className="mt-6">
          <p className="text-sm text-koby-text-secondary">
            Position <span className="font-mono font-semibold text-koby-text">#{createdId.toString()}</span> now exists on {monadConfig.chainName}.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button href={`/financing/${createdId.toString()}`}>Open financing position</Button>
            <Button variant="secondary" href="/marketplace">View marketplace</Button>
          </div>
        </Card>
      )}
      {tx.state === "confirmed" && phase === "review" && createdId === null && (
        <Card title="Settlement confirmed" description="Reading the new position from the confirmed transaction…" className="mt-6">
          <LoadingState message="Settlement confirmed on Monad. Reading the new position from the confirmed transaction…" />
          {tx.hash ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button href="/marketplace" variant="secondary">View marketplace</Button>
            </div>
          ) : null}
          <p className="mt-2 text-xs text-koby-text-muted">
            If the position does not resolve, find it in the marketplace or via the transaction on the explorer. <Link href="/marketplace" className="underline">Marketplace</Link>
          </p>
        </Card>
      )}
    </Container>
  );
}
