"use client";

import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { toHexChainId, useWallet } from "@/hooks/useWallet";
import { monadConfig } from "@/lib/monad";

/**
 * NetworkNotice — calm wrong-network notice rendered as a compact second
 * row inside the sticky header (below the main navigation row).
 *
 * Replaces the old red in-header "Wrong network" button that crowded the
 * wallet pill, disconnect control, and hamburger into one clipped row on
 * mobile. Restrained Koby warning tokens (amber, never red); red stays
 * reserved for genuine critical errors. In-flow (never an overlay), single
 * instance, no animation loop.
 *
 * Honesty rules: renders only while connected on the wrong chain; the
 * switch action re-reads the actual wallet chain and success is the notice
 * disappearing (isCorrectNetwork true). Rejection, unsupported switching,
 * and failures keep the truthful wrong-network state with manual steps
 * derived from lib/monad.ts (never hardcoded).
 */
export function NetworkNotice() {
  const { status, address, chainId, isCorrectNetwork, error, switchToMonad } = useWallet();
  const [switching, setSwitching] = useState(false);

  if (status !== "connected" || !address || isCorrectNetwork) return null;

  async function onSwitch() {
    if (switching) return;
    setSwitching(true);
    try {
      await switchToMonad();
    } finally {
      setSwitching(false);
    }
  }

  const connectedLabel = chainId === null ? "an unrecognized network" : `chain ${chainId}`;

  return (
    <div className="border-t border-koby-border bg-koby-warning-subtle" role="status" aria-live="polite">
      <Container>
        <div className="flex min-w-0 flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-start gap-2.5">
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mt-0.5 shrink-0 text-koby-warning"
            >
              <circle cx="8" cy="8" r="6.5" />
              <path d="M8 7.2v3.2" strokeLinecap="round" />
              <circle cx="8" cy="4.9" r="0.9" fill="currentColor" stroke="none" />
            </svg>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-koby-text">
                Koby requires {monadConfig.chainName} for onchain actions
              </p>
              <p className="mt-0.5 max-w-[62ch] text-xs leading-relaxed text-koby-text-secondary">
                Your wallet is currently on {connectedLabel}. Switch networks to continue — no
                funds move until you approve a financing transaction.
              </p>
              {error ? (
                <p role="alert" className="mt-1 max-w-[62ch] text-xs leading-relaxed text-koby-text">
                  {error}
                </p>
              ) : null}
              <details className="group mt-1 max-w-[62ch]">
                <summary className="inline-flex min-h-[32px] cursor-pointer items-center text-xs font-medium text-koby-text-secondary underline underline-offset-2 hover:text-koby-text">
                  Manual switch steps
                </summary>
                <div className="mt-1 space-y-0.5 text-xs leading-relaxed text-koby-text-secondary">
                  <p>Open your wallet&rsquo;s network menu and add or select:</p>
                  <dl className="mt-1 space-y-0.5">
                    <div className="flex min-w-0 flex-wrap gap-x-1">
                      <dt className="font-medium text-koby-text">Network:</dt>
                      <dd className="min-w-0 break-words">{monadConfig.chainName}</dd>
                    </div>
                    <div className="flex min-w-0 flex-wrap gap-x-1">
                      <dt className="font-medium text-koby-text">Chain ID:</dt>
                      <dd className="font-mono break-all">
                        {monadConfig.chainId} ({toHexChainId(monadConfig.chainId)})
                      </dd>
                    </div>
                    <div className="flex min-w-0 flex-wrap gap-x-1">
                      <dt className="font-medium text-koby-text">RPC:</dt>
                      <dd className="min-w-0 font-mono break-all">{monadConfig.rpcUrl}</dd>
                    </div>
                    <div className="flex min-w-0 flex-wrap gap-x-1">
                      <dt className="font-medium text-koby-text">Explorer:</dt>
                      <dd className="min-w-0 font-mono break-all">{monadConfig.explorerUrl}</dd>
                    </div>
                  </dl>
                </div>
              </details>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 pl-6 sm:pl-0">
            <button
              type="button"
              onClick={() => void onSwitch()}
              disabled={switching}
              title={`Ask your wallet to switch to ${monadConfig.chainName} (${toHexChainId(monadConfig.chainId)}). You approve the switch in your wallet; nothing else is submitted.`}
              className="inline-flex min-h-[44px] shrink-0 items-center rounded-koby-sm bg-koby-accent px-4 text-sm font-semibold whitespace-nowrap text-koby-accent-text transition-colors hover:bg-koby-accent-hover disabled:opacity-50"
            >
              {switching ? "Switching…" : "Switch network"}
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}
