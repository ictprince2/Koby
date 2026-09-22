/**
 * Cash-flow analysis layer (ARCHITECTURE.md Section 11, AI.md).
 *
 * Boundary: CashFlowInput -> analyzeCashFlow -> validated AnalysisResult.
 * The real provider (Kimi via OpenAI-compatible API, server-side) plugs in
 * behind this same interface later; the deterministic methodology below is
 * the explicitly labeled Demo/Simulated fallback (AI.md Section 20).
 *
 * Money math uses integer cents parsed from decimal strings — no
 * floating-point anywhere in this module.
 */

export type CashFlowInput = {
  /** Display name of the business (demo/simulated unless stated). */
  businessName: string;
  /** Expected future receivables, decimal USD string, e.g. "100000". */
  futureReceivablesUsd: string;
  /** Requested financing, decimal USD string, e.g. "70000". */
  requestedFinancingUsd: string;
  /** Expected repayment period in days. */
  repaymentPeriodDays: number;
  /** Optional self-reported average monthly revenue, decimal USD string. */
  monthlyRevenueUsd?: string;
};

export type RiskAssessment = {
  score: number;
  confidence: number;
  factors: string[];
  recommendation: string;
};

export type AnalysisResult = {
  assessment: RiskAssessment;
  /** Requested / receivables in basis points (integer). */
  financingRatioBps: number;
  /** Advisory eligible amount, decimal USD string (2dp). Never a guarantee. */
  eligibleAmountUsd: string;
  methodologyVersion: string;
  /** Always identifies the fallback: "Demo AI Assessment". */
  model: string;
};

export const ANALYSIS_METHODOLOGY_VERSION = "koby-deterministic-v0";
export const ANALYSIS_MODEL_LABEL = "deterministic-fallback-v0 (Demo AI Assessment)";

export type InputError = { field: string; message: string };

/** Parse a decimal USD string to integer cents. Returns null if invalid. */
export function parseUsdToCents(value: string): bigint | null {
  const trimmed = value.trim().replace(/[$,]/g, "");
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(trimmed);
  if (!match) return null;
  const whole = BigInt(match[1]);
  const frac = BigInt((match[2] ?? "").padEnd(2, "0"));
  return whole * 100n + frac;
}

export function formatCentsToUsd(cents: bigint): string {
  const negative = cents < 0n;
  const abs = negative ? -cents : cents;
  const whole = (abs / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const frac = (abs % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole}.${frac}`;
}

/** Client/server-shared input validation. Returns errors, empty when valid. */
export function validateCashFlowInput(input: CashFlowInput): InputError[] {
  const errors: InputError[] = [];
  if (input.businessName.trim().length === 0 || input.businessName.trim().length > 80) {
    errors.push({ field: "businessName", message: "Business name is required (up to 80 characters)." });
  }
  const receivables = parseUsdToCents(input.futureReceivablesUsd);
  if (receivables === null || receivables <= 0n) {
    errors.push({ field: "futureReceivablesUsd", message: "Future receivables must be a positive USD amount." });
  } else if (receivables > 1_000_000_000_00n) {
    errors.push({ field: "futureReceivablesUsd", message: "Future receivables above $1,000,000,000 are not supported in the MVP." });
  }
  const requested = parseUsdToCents(input.requestedFinancingUsd);
  if (requested === null || requested <= 0n) {
    errors.push({ field: "requestedFinancingUsd", message: "Requested financing must be a positive USD amount." });
  }
  if (!Number.isInteger(input.repaymentPeriodDays) || input.repaymentPeriodDays < 7 || input.repaymentPeriodDays > 365) {
    errors.push({ field: "repaymentPeriodDays", message: "Repayment period must be between 7 and 365 days." });
  }
  if (input.monthlyRevenueUsd !== undefined && input.monthlyRevenueUsd.trim() !== "") {
    const monthly = parseUsdToCents(input.monthlyRevenueUsd);
    if (monthly === null || monthly <= 0n) {
      errors.push({ field: "monthlyRevenueUsd", message: "Monthly revenue must be a positive USD amount when provided." });
    }
  }
  return errors;
}

/**
 * Deterministic MVP methodology (documented, versioned, tested):
 * - Base score 72. Financing ratio >80% -> -18; 60-80% -> -6; <50% -> +6.
 * - Repayment period >180d -> -5; <30d -> +2 (duration is informational only).
 * - Monthly revenue consistent with receivables (within 25% of the
 *   prorated figure) -> +5; missing or inconsistent -> -4 (limited history).
 * - Clamp score 5..95, confidence 20..90.
 * - Advisory eligible amount: min(requested, 70% of receivables).
 *
 * Language follows AI.md Section 9: assessment language only, no
 * guarantees of approval, repayment, return, or risk-free financing.
 */
export function analyzeCashFlow(input: CashFlowInput): AnalysisResult {
  const receivables = parseUsdToCents(input.futureReceivablesUsd) ?? 0n;
  const requested = parseUsdToCents(input.requestedFinancingUsd) ?? 0n;

  const ratioBps =
    receivables > 0n ? Number((requested * 10_000n) / receivables) : 0;

  let score = 72;
  const factors: string[] = [];

  if (ratioBps > 8000) {
    score -= 18;
    factors.push(
      "Requested financing exceeds 80% of stated future receivables, which leaves limited headroom in the submitted figures.",
    );
  } else if (ratioBps > 6000) {
    score -= 6;
    factors.push(
      "Requested financing is a material share (60–80%) of stated future receivables, based on the submitted data.",
    );
  } else if (ratioBps < 5000) {
    score += 6;
    factors.push(
      "Requested financing is below half of stated future receivables, based on the submitted data.",
    );
  } else {
    factors.push(
      "Requested financing sits within a moderate band of stated future receivables, based on the submitted data.",
    );
  }

  if (input.repaymentPeriodDays > 180) {
    score -= 5;
    factors.push("The requested repayment period exceeds 180 days, which extends the assessment horizon.");
  } else if (input.repaymentPeriodDays < 30) {
    score += 2;
    factors.push("The requested repayment period is short, which narrows the assessment horizon.");
  }

  let confidence = 70;
  const monthlyRaw = input.monthlyRevenueUsd?.trim() ?? "";
  if (monthlyRaw !== "") {
    const monthly = parseUsdToCents(monthlyRaw) ?? 0n;
    // Prorated expectation: monthly * days / 30, compared within 25%.
    const expected = (monthly * BigInt(input.repaymentPeriodDays)) / 30n;
    const lower = (expected * 75n) / 100n;
    const upper = (expected * 125n) / 100n;
    if (receivables >= lower && receivables <= upper) {
      score += 5;
      factors.push("Self-reported monthly revenue is consistent with stated receivables over the requested period.");
    } else {
      score -= 4;
      confidence -= 5;
      factors.push(
        "Self-reported monthly revenue differs from stated receivables over the requested period; figures may need review.",
      );
    }
  } else {
    score -= 4;
    confidence -= 15;
    factors.push("No monthly revenue breakdown was provided, so the assessment relies on limited submitted data.");
  }

  if (receivables > 1_000_000_00n) {
    confidence -= 10;
    factors.push("The stated receivables figure is large relative to typical demo-scale inputs and is unverified.");
  }

  score = Math.min(95, Math.max(5, score));
  confidence = Math.min(90, Math.max(20, confidence));

  const cap = (receivables * 70n) / 100n;
  const eligible = requested < cap ? requested : cap;

  const recommendation =
    ratioBps > 9000
      ? "Assessment suggests review: the requested amount is close to or above stated receivables. Consider a lower request based on the submitted data."
      : score >= 70
        ? "Observed signals support further financing review based on the submitted data. No approval is guaranteed."
        : "Observed signals suggest caution based on the submitted data. Review terms carefully before proceeding.";

  return {
    assessment: { score, confidence, factors, recommendation },
    financingRatioBps: ratioBps,
    eligibleAmountUsd: formatCentsToUsd(eligible),
    methodologyVersion: ANALYSIS_METHODOLOGY_VERSION,
    model: ANALYSIS_MODEL_LABEL,
  };
}

/** Validate a RiskAssessment-shaped value (AI.md Section 12). */
export function isValidAssessment(value: unknown): value is RiskAssessment {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (
    typeof v.score !== "number" ||
    !Number.isFinite(v.score) ||
    v.score < 0 ||
    v.score > 100 ||
    typeof v.confidence !== "number" ||
    !Number.isFinite(v.confidence) ||
    v.confidence < 0 ||
    v.confidence > 100 ||
    !Array.isArray(v.factors) ||
    !v.factors.every((f) => typeof f === "string" && f.length > 0) ||
    typeof v.recommendation !== "string" ||
    v.recommendation.length === 0
  ) {
    return false;
  }
  // Guarantee language is rejected unless explicitly negated ("no ... is
  // guaranteed"). The methodology's own careful wording must pass, while a
  // model claiming "guaranteed returns" still fails.
  const negatedRemoved = v.recommendation
    .toLowerCase()
    .replace(/no [^.]*?(guarantee|risk-free|risk free|assured return|certain profit)[^.]*/g, "");
  return !/guarantee|risk-free|risk free|assured return|certain profit/i.test(negatedRemoved);
}
