/**
 * Display-only number formatting.
 *
 * SAFETY: formatting happens at the UI boundary from integer base-unit
 * values (bigint) only. This module never computes validity, balances, or
 * completion — the contract owns accounting (ARCHITECTURE.md Section 6).
 * No floating-point arithmetic is used anywhere here.
 */

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function splitBaseUnits(value: bigint, decimals: number): { whole: string; frac: string } {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
    throw new RangeError("decimals must be an integer between 0 and 36");
  }
  const zero = BigInt(0);
  const negative = value < zero;
  const abs = negative ? -value : value;
  const raw = abs.toString().padStart(decimals + 1, "0");
  const whole = raw.slice(0, raw.length - decimals);
  const frac = decimals === 0 ? "" : raw.slice(raw.length - decimals);
  return { whole: (negative ? "-" : "") + groupThousands(whole), frac };
}

/**
 * Format an integer base-unit amount for display, e.g. 7000000n @ 6
 * decimals → "$70,000.00". The `symbol` is presentation only.
 */
export function formatBaseUnits(value: bigint, decimals: number, symbol = "$"): string {
  const { whole, frac } = splitBaseUnits(value, decimals);
  return frac === "" ? `${symbol}${whole}` : `${symbol}${whole}.${frac}`;
}

/** Format a plain integer count for display (e.g. "1,024"). */
export function formatCount(value: bigint | number): string {
  const raw = typeof value === "bigint" ? value.toString() : String(Math.trunc(value));
  const negative = raw.startsWith("-");
  const digits = negative ? raw.slice(1) : raw;
  return (negative ? "-" : "") + groupThousands(digits);
}

/**
 * Truncate a hex address/hash for display (`0x8DCa…4f21`).
 * Always pair with a full-value affordance (copy / explorer link).
 */
export function truncateHex(value: string, leading = 6, trailing = 4): string {
  if (value.length <= leading + trailing + 1) return value;
  return `${value.slice(0, leading)}…${value.slice(-trailing)}`;
}
