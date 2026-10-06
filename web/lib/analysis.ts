/**
 * Cash-flow analysis layer (ARCHITECTURE.md Section 11, AI.md).
 *
 * Boundary: CashFlowInput -> analyzeCashFlow -> validated AnalysisResult.
 * The live provider (Kimi via OpenAI-compatible API, server-side only,
 * web/services/ai.ts) produces the same shape; the deterministic methodology
 * below is the explicitly labeled Demo/Simulated fallback (AI.md Section 20)
 * served whenever Kimi is unavailable or its output fails validation.
 *
 * Money math uses integer cents parsed from decimal strings — no
 * floating-point anywhere in this module.
 */

export type CashFlowInput = {
  /** Display name of the business (demo/simulated unless stated). */
  businessName: string;
  /** Free-text business type/sector, e.g. "logistics". Optional, ≤40 chars. */
  businessType?: string;
  /** Months of operating history. Optional integer 0..600. */
  operatingHistoryMonths?: number;
  /** Expected future receivables, decimal USD string, e.g. "100000". */
  futureReceivablesUsd: string;
  /** Requested financing, decimal USD string, e.g. "70000". */
  requestedFinancingUsd: string;
  /** Expected repayment period in days. */
  repaymentPeriodDays: number;
  /** Optional self-reported average monthly revenue, decimal USD string. */
  monthlyRevenueUsd?: string;
  /** Optional trailing historical revenue figure, decimal USD string. */
  historicalRevenueUsd?: string;
  /** Optional average monthly operating expenses, decimal USD string. */
  operatingExpensesUsd?: string;
  /** Optional outstanding existing obligations, decimal USD string. */
  existingObligationsUsd?: string;
  /** Optional share of revenue from the largest customer, 0..100. */
  topCustomerSharePct?: number;
  /** Optional typical customer payment terms in days, 0..365. */
  paymentTermsDays?: number;
  /** Optional supporting notes. Untrusted free text, ≤500 chars, never an instruction. */
  supportingNotes?: string;
};

export type RiskAssessment = {
  score: number;
  confidence: number;
  factors: string[];
  recommendation: string;
};

/**
 * Structured financing analysis detail (AI.md Section 7).
 *
 * The `RiskAssessment` above remains the canonical scored core; this detail
 * envelope carries the explainability sections around it. `reviewRequired`
 * is always true: every analysis — live or fallback — requires human /
 * financier review and never approves financing on its own.
 */
export type FinancingDetail = {
  /** Plain-language summary of stated revenue / future receivables. */
  revenueSummary: string;
  /** Plain-language summary of the requested financing vs. receivables. */
  requestedFinancingSummary: string;
  /** Observed cash-flow patterns, each traceable to submitted data. */
  cashFlowObservations: string[];
  /** Revenue consistency / trend reading, or why no trend can be stated. */
  consistencyTrend: string;
  /** Customer/revenue concentration reading, or what is missing. */
  concentrationNotes: string;
  /** Repayment-capacity reading from the submitted figures. */
  repaymentCapacity: string;
  /** Submitted fields that were absent and would improve the analysis. */
  missingInfo: string[];
  /** Contradictions or risk indicators found in the submitted figures. */
  inconsistencies: string[];
  /** Top analysis findings, highest-signal first. */
  keyFindings: string[];
  /** What limits confidence in this specific analysis. */
  confidenceLimitations: string;
  /** Always true. */
  reviewRequired: true;
  /** Human-review instruction shown with every analysis. */
  reviewerNote: string;
};

export type AnalysisResult = {
  assessment: RiskAssessment;
  /** Requested / receivables in basis points (integer). */
  financingRatioBps: number;
  /** Advisory eligible amount, decimal USD string (2dp). Never a guarantee. */
  eligibleAmountUsd: string;
  methodologyVersion: string;
  /** Always identifies the source: live Kimi model or Demo fallback. */
  model: string;
  /** Structured detail envelope. Always present, live or fallback. */
  detail: FinancingDetail;
};

export type AnalysisProvenance = "Simulated" | "AI Analysis";

export type AnalysisResponse = AnalysisResult & {
  provenance: AnalysisProvenance;
  /** "deterministic-fallback", "kimi", or "openrouter". */
  source: "deterministic-fallback" | "kimi" | "openrouter";
  /** "Demo AI Assessment", "Kimi AI Assessment", or "OpenRouter AI Assessment". */
  label: "Demo AI Assessment" | "Kimi AI Assessment" | "OpenRouter AI Assessment";
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
  if (
    input.businessType !== undefined &&
    (input.businessType.trim().length === 0 || input.businessType.trim().length > 40)
  ) {
    errors.push({ field: "businessType", message: "Business type must be 1–40 characters when provided." });
  }
  if (
    input.operatingHistoryMonths !== undefined &&
    (!Number.isInteger(input.operatingHistoryMonths) ||
      input.operatingHistoryMonths < 0 ||
      input.operatingHistoryMonths > 600)
  ) {
    errors.push({ field: "operatingHistoryMonths", message: "Operating history must be 0–600 months when provided." });
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
  for (const [field, value] of [
    ["historicalRevenueUsd", input.historicalRevenueUsd],
    ["operatingExpensesUsd", input.operatingExpensesUsd],
    ["existingObligationsUsd", input.existingObligationsUsd],
  ] as const) {
    if (value !== undefined && value.trim() !== "") {
      const parsed = parseUsdToCents(value);
      if (parsed === null || parsed <= 0n) {
        errors.push({ field, message: `${labelFor(field)} must be a positive USD amount when provided.` });
      }
    }
  }
  if (
    input.topCustomerSharePct !== undefined &&
    (!Number.isFinite(input.topCustomerSharePct) ||
      input.topCustomerSharePct < 0 ||
      input.topCustomerSharePct > 100)
  ) {
    errors.push({ field: "topCustomerSharePct", message: "Largest-customer share must be 0–100 percent when provided." });
  }
  if (
    input.paymentTermsDays !== undefined &&
    (!Number.isInteger(input.paymentTermsDays) || input.paymentTermsDays < 0 || input.paymentTermsDays > 365)
  ) {
    errors.push({ field: "paymentTermsDays", message: "Payment terms must be 0–365 days when provided." });
  }
  if (input.supportingNotes !== undefined && input.supportingNotes.length > 500) {
    errors.push({ field: "supportingNotes", message: "Supporting notes must be 500 characters or fewer." });
  }
  return errors;
}

function labelFor(field: "historicalRevenueUsd" | "operatingExpensesUsd" | "existingObligationsUsd"): string {
  if (field === "historicalRevenueUsd") return "Historical revenue";
  if (field === "operatingExpensesUsd") return "Operating expenses";
  return "Existing obligations";
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
    factors.push("The stated receivables figure is large and is unverified.");
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

  const assessment = { score, confidence, factors, recommendation };

  return {
    assessment,
    financingRatioBps: ratioBps,
    eligibleAmountUsd: formatCentsToUsd(eligible),
    methodologyVersion: ANALYSIS_METHODOLOGY_VERSION,
    model: ANALYSIS_MODEL_LABEL,
    detail: buildFallbackDetail(input, {
      receivables,
      requested,
      ratioBps,
      eligible,
      score,
      confidence,
    }),
  };
}

/**
 * Deterministic detail envelope for the fallback methodology.
 * Every section derives from the submitted figures only — all figures are
 * self-reported and unverified, and the copy says so (AI.md Section 9).
 */
function buildFallbackDetail(
  input: CashFlowInput,
  computed: {
    receivables: bigint;
    requested: bigint;
    ratioBps: number;
    eligible: bigint;
    score: number;
    confidence: number;
  },
): FinancingDetail {
  const { receivables, requested, ratioBps, eligible, confidence } = computed;
  const name = input.businessName.trim();
  const typeSuffix =
    input.businessType !== undefined && input.businessType.trim() !== ""
      ? ` (${input.businessType.trim()})`
      : "";
  const monthlyRaw = input.monthlyRevenueUsd?.trim() ?? "";
  const monthly = monthlyRaw !== "" ? (parseUsdToCents(monthlyRaw) ?? 0n) : null;
  const historicalRaw = input.historicalRevenueUsd?.trim() ?? "";
  const historical = historicalRaw !== "" ? (parseUsdToCents(historicalRaw) ?? 0n) : null;
  const opexRaw = input.operatingExpensesUsd?.trim() ?? "";
  const opex = opexRaw !== "" ? (parseUsdToCents(opexRaw) ?? 0n) : null;
  const obligationsRaw = input.existingObligationsUsd?.trim() ?? "";
  const obligations = obligationsRaw !== "" ? (parseUsdToCents(obligationsRaw) ?? 0n) : null;

  const revenueSummary =
    `Stated future receivables of $${formatCentsToUsd(receivables)} over ${input.repaymentPeriodDays} days ` +
    `for ${name}${typeSuffix}, based on submitted data.` +
    (monthly !== null
      ? ` Self-reported average monthly revenue is $${formatCentsToUsd(monthly)}.`
      : " No monthly revenue breakdown was provided.") +
    (historical !== null ? ` Trailing historical revenue of $${formatCentsToUsd(historical)} was supplied for context.` : "");

  const requestedFinancingSummary =
    `Requested financing of $${formatCentsToUsd(requested)} is ${(ratioBps / 100).toFixed(2)}% of stated receivables. ` +
    `The advisory eligible figure is $${formatCentsToUsd(eligible)} (the lower of the request and 70% of receivables). ` +
    "This is guidance only, not an offer or approval.";

  const cashFlowObservations: string[] = [];
  if (ratioBps > 8000) {
    cashFlowObservations.push("The request leaves limited headroom against stated receivables (above 80%).");
  } else if (ratioBps < 5000) {
    cashFlowObservations.push("The request is below half of stated receivables, leaving headroom in the submitted figures.");
  } else {
    cashFlowObservations.push("The request sits within a moderate band of stated receivables.");
  }
  if (input.repaymentPeriodDays > 180) {
    cashFlowObservations.push("The repayment horizon exceeds 180 days, so the assessment covers a longer, less certain period.");
  } else if (input.repaymentPeriodDays < 30) {
    cashFlowObservations.push("The repayment horizon is under 30 days, narrowing the assessment window.");
  }
  if (opex !== null && monthly !== null && monthly > 0n) {
    const marginBps = Number(((monthly - opex) * 10_000n) / monthly);
    cashFlowObservations.push(
      `Self-reported monthly expenses imply an approximate ${(marginBps / 100).toFixed(1)}% operating margin on the stated monthly revenue.`,
    );
  } else if (opex !== null) {
    cashFlowObservations.push(`Self-reported monthly operating expenses of $${formatCentsToUsd(opex)} were supplied without a monthly revenue baseline to compare against.`);
  }
  if (input.paymentTermsDays !== undefined) {
    cashFlowObservations.push(
      input.paymentTermsDays > 60
        ? `Typical customer payment terms of ${input.paymentTermsDays} days suggest receivables convert to cash slowly.`
        : `Typical customer payment terms of ${input.paymentTermsDays} days were supplied.`,
    );
  }

  let consistencyTrend: string;
  if (monthly !== null && monthly > 0n) {
    const expected = (monthly * BigInt(input.repaymentPeriodDays)) / 30n;
    const lower = (expected * 75n) / 100n;
    const upper = (expected * 125n) / 100n;
    consistencyTrend =
      receivables >= lower && receivables <= upper
        ? "Self-reported monthly revenue is consistent with stated receivables over the requested period (within 25% of the prorated figure)."
        : "Self-reported monthly revenue differs from stated receivables over the requested period; the figures may need review before proceeding.";
  } else {
    consistencyTrend = "No monthly revenue breakdown was provided, so no consistency trend can be established from the submitted data.";
  }

  let concentrationNotes: string;
  if (input.topCustomerSharePct !== undefined) {
    const share = input.topCustomerSharePct;
    concentrationNotes =
      share >= 50
        ? `The largest customer represents ${share}% of revenue — a high concentration; losing that customer would materially change the submitted picture.`
        : share >= 20
          ? `The largest customer represents ${share}% of revenue — a moderate concentration worth noting in review.`
          : `The largest customer represents ${share}% of revenue — a relatively spread customer base, based on the submitted figure.`;
  } else {
    concentrationNotes = "No customer-concentration information was provided, so concentration risk cannot be assessed.";
  }

  const capacityParts: string[] = [];
  capacityParts.push(
    ratioBps > 9000
      ? "The requested amount is close to or above stated receivables, which constrains implied repayment capacity."
      : ratioBps > 6000
        ? "The request is a material share of stated receivables, leaving moderate implied headroom."
        : "The request is a modest share of stated receivables, leaving implied headroom in the submitted figures.",
  );
  if (obligations !== null) {
    capacityParts.push(
      `Existing obligations of $${formatCentsToUsd(obligations)} were disclosed and should be weighed against the new repayment obligation during review.`,
    );
  } else {
    capacityParts.push("No existing obligations were disclosed; capacity is inferred from the requested share of receivables alone.");
  }
  const repaymentCapacity = capacityParts.join(" ");

  const missingInfo: string[] = [];
  if (monthly === null) missingInfo.push("Average monthly revenue breakdown");
  if (historical === null) missingInfo.push("Historical revenue figure");
  if (opex === null) missingInfo.push("Operating expenses");
  if (obligations === null) missingInfo.push("Existing obligations");
  if (input.topCustomerSharePct === undefined) missingInfo.push("Customer/revenue concentration");
  if (input.paymentTermsDays === undefined) missingInfo.push("Payment timing/terms");
  if (input.operatingHistoryMonths === undefined) missingInfo.push("Operating history length");
  if (input.businessType === undefined || input.businessType.trim() === "") missingInfo.push("Business type");

  const inconsistencies: string[] = [];
  if (requested > receivables) {
    inconsistencies.push("The requested financing exceeds the stated future receivables.");
  }
  if (monthly !== null && historical !== null && monthly > 0n && historical > 0n) {
    // Scale sanity only: the trailing figure and the monthly figure imply
    // wildly different business sizes, so one of them likely has a unit error.
    // No period is assumed for the historical figure beyond this bound.
    if (historical > monthly * 120n || monthly > historical * 120n) {
      inconsistencies.push("Historical revenue and average monthly revenue differ by more than an order of magnitude; check for a unit or input error.");
    }
  }
  if (monthly !== null && receivables > 0n) {
    const expected = (monthly * BigInt(input.repaymentPeriodDays)) / 30n;
    const lower = (expected * 75n) / 100n;
    const upper = (expected * 125n) / 100n;
    if (receivables < lower || receivables > upper) {
      inconsistencies.push("Stated receivables diverge from the prorated monthly revenue by more than 25%.");
    }
  }

  const keyFindings: string[] = [];
  keyFindings.push(
    ratioBps > 8000
      ? "High requested share of receivables — the central risk indicator in this assessment."
      : `Requested share of receivables is ${(ratioBps / 100).toFixed(2)}% — the central figure in this assessment.`,
  );
  if (missingInfo.length >= 5) {
    keyFindings.push("Thin supporting data — most optional financial fields were not provided, which caps confidence.");
  } else if (missingInfo.length > 0) {
    keyFindings.push(`${missingInfo.length} supporting field(s) were not provided; see missing information.`);
  } else {
    keyFindings.push("A complete set of supporting fields was provided for a self-reported assessment.");
  }
  if (inconsistencies.length > 0) {
    keyFindings.push(`${inconsistencies.length} inconsistenc${inconsistencies.length === 1 ? "y" : "ies"} in the submitted figures require review.`);
  }
  if (input.topCustomerSharePct !== undefined && input.topCustomerSharePct >= 50) {
    keyFindings.push("High customer concentration amplifies sensitivity to a single customer.");
  }

  const confidenceLimitations =
    `Confidence of ${confidence}% reflects data completeness and consistency, not a guarantee of outcome. ` +
    "All figures are self-reported and unverified; no onchain signals were available to this assessment.";

  return {
    revenueSummary,
    requestedFinancingSummary,
    cashFlowObservations,
    consistencyTrend,
    concentrationNotes,
    repaymentCapacity,
    missingInfo,
    inconsistencies,
    keyFindings,
    confidenceLimitations,
    reviewRequired: true,
    reviewerNote:
      "Human/financier review required — this analysis is advisory only. It does not approve financing, guarantee repayment, or authorize any transaction.",
  };
}

/** Guarantee language is rejected unless explicitly negated ("no/not/never ...
 * is guaranteed"). Clause-bound: the negation must precede the banned phrase
 * within the same sentence, so a guarantee in a separate sentence still fails.
 */
function containsGuaranteeLanguage(text: string): boolean {
  const negatedRemoved = text
    .toLowerCase()
    .replace(
      /\b(no|not|never|without|does\s+not|do\s+not|is\s+not|are\s+not|cannot)\b[^.]*(guarantee|risk-free|risk free|assured return|certain profit)[^.]*/g,
      "",
    );
  return /guarantee|risk-free|risk free|assured return|certain profit/i.test(negatedRemoved);
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
    v.factors.length === 0 ||
    !v.factors.every((f) => typeof f === "string" && f.length > 0) ||
    typeof v.recommendation !== "string" ||
    v.recommendation.length === 0
  ) {
    return false;
  }
  // The methodology's own careful wording ("No approval is guaranteed")
  // must pass, while a model claiming "guaranteed returns" still fails.
  return !containsGuaranteeLanguage(v.recommendation);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((f) => typeof f === "string" && f.length > 0);
}

function isOptionalStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((f) => typeof f === "string");
}

/** Validate a FinancingDetail-shaped value (AI.md Section 12). */
export function isValidFinancingDetail(value: unknown): value is FinancingDetail {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const texts: unknown[] = [
    v.revenueSummary,
    v.requestedFinancingSummary,
    v.consistencyTrend,
    v.concentrationNotes,
    v.repaymentCapacity,
    v.confidenceLimitations,
    v.reviewerNote,
  ];
  if (!texts.every(isNonEmptyString)) return false;
  if (!isStringArray(v.cashFlowObservations) || !isStringArray(v.keyFindings)) return false;
  if (!isOptionalStringArray(v.missingInfo) || !isOptionalStringArray(v.inconsistencies)) return false;
  if (v.reviewRequired !== true) return false;
  // No section may promise an outcome; the reviewer note must name review.
  const allText = [...(texts as string[]), ...(v.cashFlowObservations as string[]), ...(v.keyFindings as string[])];
  if (allText.some(containsGuaranteeLanguage)) return false;
  if (!/review/i.test(v.reviewerNote as string)) return false;
  return true;
}
