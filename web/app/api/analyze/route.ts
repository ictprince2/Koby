import { NextResponse } from "next/server";
import {
  analyzeCashFlow,
  isValidAssessment,
  validateCashFlowInput,
  type CashFlowInput,
} from "@/lib/analysis";

/**
 * POST /api/analyze — server-side cash-flow assessment boundary
 * (ARCHITECTURE.md Sections 2/11, AI.md).
 *
 * MVP: runs the deterministic, versioned methodology and labels it as the
 * Demo/Simulated fallback. The live provider call (Kimi via its
 * OpenAI-compatible API, server-side only) plugs in here later behind the
 * same response shape — raw model output will go through isValidAssessment
 * before anything is returned.
 */

function isCashFlowInput(value: unknown): value is CashFlowInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.businessName === "string" &&
    typeof v.futureReceivablesUsd === "string" &&
    typeof v.requestedFinancingUsd === "string" &&
    typeof v.repaymentPeriodDays === "number" &&
    (v.monthlyRevenueUsd === undefined || typeof v.monthlyRevenueUsd === "string")
  );
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
  // Treat overlong free text as untrusted content: truncate before use.
  const input: CashFlowInput = {
    businessName: body.businessName.slice(0, 80),
    futureReceivablesUsd: body.futureReceivablesUsd.slice(0, 32),
    requestedFinancingUsd: body.requestedFinancingUsd.slice(0, 32),
    repaymentPeriodDays: body.repaymentPeriodDays,
    monthlyRevenueUsd:
      body.monthlyRevenueUsd === undefined ? undefined : body.monthlyRevenueUsd.slice(0, 32),
  };

  const errors = validateCashFlowInput(input);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
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
