import { NextResponse } from "next/server";
import {
  analyzeCashFlow,
  isValidAssessment,
  validateCashFlowInput,
  type CashFlowInput,
} from "@/lib/analysis";
import { getKimiAnalysis, getOpenRouterAnalysis, KIMI_METHODOLOGY_VERSION, OPENROUTER_METHODOLOGY_VERSION } from "@/services/ai";

/** Node.js runtime: provider fetches use AbortController timeouts. */
export const runtime = "nodejs";

/**
 * POST /api/analyze — server-side cash-flow assessment boundary
 * (ARCHITECTURE.md Sections 2/11, AI.md).
 *
 * Provider precedence: OpenRouter (current active live provider) first,
 * then Kimi/Moonshot (preserved option), then the deterministic fallback.
 * Keys never leave the server; raw model output goes through
 * isValidAssessment + isValidFinancingDetail before anything is returned,
 * and a single invalid field rejects the whole response. Live and fallback
 * outputs are never mixed.
 */

function isCashFlowInput(value: unknown): value is CashFlowInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.businessName === "string" &&
    (v.businessType === undefined || typeof v.businessType === "string") &&
    (v.operatingHistoryMonths === undefined || typeof v.operatingHistoryMonths === "number") &&
    typeof v.futureReceivablesUsd === "string" &&
    typeof v.requestedFinancingUsd === "string" &&
    typeof v.repaymentPeriodDays === "number" &&
    (v.monthlyRevenueUsd === undefined || typeof v.monthlyRevenueUsd === "string") &&
    (v.historicalRevenueUsd === undefined || typeof v.historicalRevenueUsd === "string") &&
    (v.operatingExpensesUsd === undefined || typeof v.operatingExpensesUsd === "string") &&
    (v.existingObligationsUsd === undefined || typeof v.existingObligationsUsd === "string") &&
    (v.topCustomerSharePct === undefined || typeof v.topCustomerSharePct === "number") &&
    (v.paymentTermsDays === undefined || typeof v.paymentTermsDays === "number") &&
    (v.supportingNotes === undefined || typeof v.supportingNotes === "string")
  );
}

function optionalUsd(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.slice(0, 32).trim();
  return trimmed === "" ? undefined : trimmed;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!isCashFlowInput(body)) {
    return NextResponse.json({ error: "Request body has an invalid shape." }, { status: 400 });
  }
  // Treat free text as untrusted content: truncate before use, never as
  // instructions (AI.md Section 17).
  const input: CashFlowInput = {
    businessName: body.businessName.slice(0, 80),
    futureReceivablesUsd: body.futureReceivablesUsd.slice(0, 32),
    requestedFinancingUsd: body.requestedFinancingUsd.slice(0, 32),
    repaymentPeriodDays: body.repaymentPeriodDays,
    monthlyRevenueUsd: optionalUsd(body.monthlyRevenueUsd),
  };
  if (body.businessType !== undefined) input.businessType = body.businessType.slice(0, 40);
  if (body.operatingHistoryMonths !== undefined) input.operatingHistoryMonths = body.operatingHistoryMonths;
  if (body.historicalRevenueUsd !== undefined) input.historicalRevenueUsd = optionalUsd(body.historicalRevenueUsd);
  if (body.operatingExpensesUsd !== undefined) input.operatingExpensesUsd = optionalUsd(body.operatingExpensesUsd);
  if (body.existingObligationsUsd !== undefined)
    input.existingObligationsUsd = optionalUsd(body.existingObligationsUsd);
  if (body.topCustomerSharePct !== undefined) input.topCustomerSharePct = body.topCustomerSharePct;
  if (body.paymentTermsDays !== undefined) input.paymentTermsDays = body.paymentTermsDays;
  if (body.supportingNotes !== undefined) {
    const notes = body.supportingNotes.slice(0, 500).trim();
    if (notes !== "") input.supportingNotes = notes;
  }

  const errors = validateCashFlowInput(input);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  // Live paths first (OpenRouter, then Kimi); any failure degrades to the
  // labeled fallback below. The financing ratio and advisory eligible amount
  // stay deterministic (integer math in analyzeCashFlow); only the assessment
  // and detail come from a model — and only as a validated whole.
  //
  // Both providers are attempted concurrently with a tight per-provider
  // budget (services/ai.ts): the OpenRouter result is still preferred when
  // both succeed, but a slow provider can no longer push the route past
  // serverless execution limits on hosted deployments.
  const [openrouter, kimi] = await Promise.all([
    getOpenRouterAnalysis(input).catch(() => null),
    getKimiAnalysis(input).catch(() => null),
  ]);
  if (openrouter !== null) {
    const fallback = analyzeCashFlow(input);
    return NextResponse.json({
      assessment: openrouter.assessment,
      financingRatioBps: fallback.financingRatioBps,
      eligibleAmountUsd: fallback.eligibleAmountUsd,
      methodologyVersion: OPENROUTER_METHODOLOGY_VERSION,
      model: `${openrouter.model} (OpenRouter AI Assessment)`,
      detail: openrouter.detail,
      provenance: "AI Analysis" as const,
      source: "openrouter" as const,
      label: "OpenRouter AI Assessment" as const,
    });
  }
  if (kimi !== null) {
    const fallback = analyzeCashFlow(input);
    return NextResponse.json({
      assessment: kimi.assessment,
      financingRatioBps: fallback.financingRatioBps,
      eligibleAmountUsd: fallback.eligibleAmountUsd,
      methodologyVersion: KIMI_METHODOLOGY_VERSION,
      model: `${kimi.model} (Kimi AI Assessment)`,
      detail: kimi.detail,
      provenance: "AI Analysis" as const,
      source: "kimi" as const,
      label: "Kimi AI Assessment" as const,
    });
  }

  const result = analyzeCashFlow(input);
  if (!isValidAssessment(result.assessment)) {
    // Never ship an invalid assessment; surface unavailability instead.
    return NextResponse.json(
      { error: "Cash-flow assessment is temporarily unavailable." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ...result,
    provenance: "Simulated" as const,
    source: "deterministic-fallback" as const,
    label: "Demo AI Assessment" as const,
  });
}
