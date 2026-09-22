"use client";

import { useState } from "react";
import { truncateHex } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * AddressDisplay — monospaced, truncated, full value on demand
 * (DESIGN.md Section 8). Renders only; never sources addresses.
 */
export function AddressDisplay({
  value,
  label,
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <code
        title={value}
        aria-label={label !== undefined ? `${label}: ${value}` : value}
        className="rounded-koby-sm bg-koby-bg-secondary px-1.5 py-0.5 font-mono text-[13px] text-koby-text"
      >
        {truncateHex(value)}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-live="polite"
        className="min-h-[44px] px-2 text-xs font-medium text-koby-text-secondary underline-offset-2 hover:text-koby-text hover:underline"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </span>
  );
}
