"use client";

/**
 * /financing/[id] — full state of one position. All financial values are
 * contract reads (Onchain/Testnet). Funding and repayment each use an
 * exact-amount approval shown as a distinct step, then the value-moving
 * transaction (PRD.md Section 19). History comes from direct log reads
 * until ENVIO is wired up; an unavailable log read never blocks the
 * actionable state above it.
 */

import { use, useCallback, useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateBlocks";
import { AddressDisplay } from "@/components/ui/AddressDisplay";
import { PositionCard } from "@/components/financing/PositionCard";
import { ReviewCard } from "@/components/financing/ReviewCard";
import { TxProgress } from "@/components/financing/TxProgress";
import { useWallet } from "@/hooks/useWallet";
import { useTx } from "@/hooks/useTx";
import {
  encodeApprove,
  encodeFund,
  encodeRepay,
  isFinancingConfigured,
  readAllowance,
  readPosition,
  readPositionEvents,
  sendViaWallet,
  usdToBaseUnits,
  waitForConfirmation,
  type FinancingEvent,
  type Position,
} from "@/services/financing";
import { USDC_DECIMALS, explorerAddressUrl, explorerTxUrl, monadConfig } from "@/lib/monad";
import { formatBaseUnits } from "@/lib/format";


export default function FinancingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = use(params);
  const { address, isCorrectNetwork, provider, status } = useWallet();
  const approveTx = useTx();
  const actionTx = useTx();

  const [position, setPosition] = useState<Position | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<FinancingEvent[] | null>(null);
  const [eventsError, setEventsError] = useState(false);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayError, setRepayError] = useState<string | null>(null);
  const [allowance, setAllowance] = useState<bigint | null>(null);

  const parsedId = /^\d+$/.test(idParam) ? BigInt(idParam) : null;
  const configured = isFinancingConfigured();
  const connected = status === "connected" && address !== null;

  // Pure chain read: returns data, never touches state (callers set state
  // in async callbacks or event handlers, never synchronously in effects).
  const load = useCallback(async () => {
    if (parsedId === null || !configured) return null;
    const p = await readPosition(parsedId);
    let al: bigint | null = null;
    if (address && monadConfig.contractAddress) {
      try {
        al = await readAllowance(address, monadConfig.contractAddress, monadConfig.usdcAddress);
      } catch {
        al = null;
      }
    }
    return { p, al };
  }, [parsedId, configured, address]);

  const applyLoaded = useCallback(
    (result: { p: Position; al: bigint | null } | null, failed: boolean) => {
      if (failed || result === null) {
        setPosition(null);
        setLoadError(
          "This position could not be read from the contract. It may not exist, or the network may be unreachable.",
        );
      } else {
        setPosition(result.p);
        setAllowance(result.al);
        setLoadError(null);
      }
      setLoading(false);
    },
    [],
  );

  // Event handlers may set state synchronously; effects below only use callbacks.
  const refreshNow = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    load().then(
      (result) => applyLoaded(result, result === null),
      () => applyLoaded(null, true),
    );
  }, [load, applyLoaded]);

  useEffect(() => {
    let cancelled = false;
    load().then(
      (result) => {
        if (!cancelled) applyLoaded(result, result === null);
      },
      () => {
        if (!cancelled) applyLoaded(null, true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [load, applyLoaded]);

  useEffect(() => {
    if (parsedId === null || !configured) return;
    readPositionEvents(parsedId)
      .then((all) => setEvents(all))
      .catch(() => setEventsError(true));
  }, [parsedId, configured, position?.repaid]);

  if (parsedId === null) {
    return (
      <Container className="py-10">
        <ErrorState title="Invalid financing id" message={`"${idParam}" is not a valid position id. Position ids are non-negative integers assigned onchain at creation.`} />
      </Container>
    );
  }

  if (!configured) {
    return (
      <Container className="py-10">
        <h1 className="text-3xl font-bold tracking-tight text-koby-text">Financing position #{idParam}</h1>
        <div className="mt-6">
          <ErrorState title="Financing contract is not deployed yet" message="NEXT_PUBLIC_CONTRACT_ADDRESS is empty, so no position can be read. Deploy the contract to Monad Testnet and configure the address." />
        </div>
      </Container>
    );
  }

  const needsApprovalFor = (amount: bigint | null): boolean =>
    amount !== null && amount > 0n && (allowance === null || allowance < amount);

  async function approveExact(amount: bigint) {
    if (!provider || !address || !monadConfig.contractAddress) return;
    approveTx.reset();
    try {
      await approveTx.run({
        prepare: async () => ({ to: monadConfig.usdcAddress, data: encodeApprove(monadConfig.contractAddress as string, amount) }),
        send: (p) => sendViaWallet(provider, address, p.to, p.data as `0x${string}`),
        confirm: (hash) => waitForConfirmation(hash),
      });
      setAllowance(amount);
    } catch {
      // Rendered from approveTx state.
    }
  }

  async function fund() {
    if (!provider || !address || !position || !monadConfig.contractAddress) return;
    actionTx.reset();
    try {
      await actionTx.run({
        prepare: async () => ({ to: monadConfig.contractAddress as string, data: encodeFund(position.id) }),
        send: (p) => sendViaWallet(provider, address, p.to, p.data as `0x${string}`),
        confirm: (hash) => waitForConfirmation(hash),
      });
      refreshNow();
    } catch {
      // Rendered from actionTx state.
    }
  }

  async function repay() {
    setRepayError(null);
    if (!provider || !address || !position) return;
    const amount = usdToBaseUnits(repayAmount);
    if (amount === null || amount <= 0n) {
      setRepayError("Enter a positive repayment amount in USD.");
      return;
    }
    if (amount > position.outstanding) {
      setRepayError("This amount exceeds the outstanding balance. The contract would reject it, so it was not submitted.");
      return;
    }
    actionTx.reset();
    try {
      await actionTx.run({
        prepare: async () => ({ to: monadConfig.contractAddress as string, data: encodeRepay(position.id, amount) }),
        send: (p) => sendViaWallet(provider, address, p.to, p.data as `0x${string}`),
        confirm: (hash) => waitForConfirmation(hash),
      });
      setRepayAmount("");
      refreshNow();
    } catch {
      // Rendered from actionTx state.
    }
  }

  const isBusiness = connected && position !== null && address?.toLowerCase() === position.business.toLowerCase();
  const canFund = position?.status === "Created";
  const canRepay = position !== null && (position.status === "Funded" || position.status === "Repaying");

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-koby-text">Financing position #{idParam}</h1>
        <Button variant="secondary" size="sm" onClick={() => refreshNow()}>Refresh from chain</Button>
      </div>

      <div className="mt-6 space-y-6">
        {loading ? <LoadingState message="Reading position from the contract…" /> : null}
        {loadError ? <ErrorState title="Position unavailable" message={loadError} action={<Button variant="secondary" onClick={() => refreshNow()}>Retry</Button>} /> : null}
        {position ? <PositionCard position={position} /> : null}

        {position && canFund ? (
          <Card title="Fund this financing" description="Atomic settlement: your funding moves straight to the business in the same transaction. The contract never holds balances.">
            <ReviewCard
              action={`Fund ${formatBaseUnits(position.principal, USDC_DECIMALS)} financing`}
              amount={`${formatBaseUnits(position.principal, USDC_DECIMALS)} (testnet USDC)`}
              contractLabel="Koby financing contract"
              terms={[
                { label: "Business receives", value: position.business },
                { label: "Repayment obligation", value: formatBaseUnits(position.obligation, USDC_DECIMALS) },
                { label: "Wallet", value: address ?? "Not connected" },
              ]}
            />
            {!connected ? (
              <EmptyState title="Connect a wallet to fund" description="Funding requires your signature on Monad Testnet." className="mt-4" />
            ) : !isCorrectNetwork ? (
              <ErrorState title="Wrong network" message={`Switch your wallet to ${monadConfig.chainName} before funding.`} className="mt-4" />
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-koby-text-muted">Step 1 — token approval (exact amount, distinct transaction). Step 2 — funding.</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => void approveExact(position.principal)} disabled={approveTx.tx.state === "confirming" || approveTx.tx.state === "awaiting_wallet"}>
                    Step 1: Approve {formatBaseUnits(position.principal, USDC_DECIMALS)}
                  </Button>
                  <Button onClick={() => void fund()} disabled={needsApprovalFor(position.principal)}>
                    Step 2: Fund {formatBaseUnits(position.principal, USDC_DECIMALS)} financing
                  </Button>
                </div>
                {needsApprovalFor(position.principal) ? (
                  <p className="text-xs text-koby-text-secondary">Approve the exact funding amount first — funding is enabled once the approval confirms.</p>
                ) : null}
              </div>
            )}
            <div className="mt-3 space-y-3">
              <TxProgress tx={approveTx.tx} label="Approve funding" />
              <TxProgress tx={actionTx.tx} label="Fund financing" />
            </div>
          </Card>
        ) : null}

        {position && canRepay ? (
          <Card title="Record repayment" description="Programmable repayment tracking and execution: each repayment is a real transaction validated by the contract, which updates the outstanding balance. Manual business-signed trigger in the MVP — no automatic revenue collection exists.">
            {!connected ? (
              <EmptyState title="Connect a wallet to repay" description="Only the recorded business address can submit a valid repayment." className="mt-4" />
            ) : !isBusiness ? (
              <ErrorState title="Wrong wallet for repayment" message="The connected wallet is not this position's recorded business. Only the business address shown above can submit repayment; the contract rejects anyone else." className="mt-4" />
            ) : !isCorrectNetwork ? (
              <ErrorState title="Wrong network" message={`Switch your wallet to ${monadConfig.chainName} before repaying.`} className="mt-4" />
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-koby-text-secondary">
                  Outstanding: <span className="font-semibold tabular-nums text-koby-text">{formatBaseUnits(position.outstanding, USDC_DECIMALS)}</span>
                </p>
                <label className="block max-w-xs text-sm">
                  <span className="font-medium text-koby-text">Repayment amount (USD)</span>
                  <input value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} inputMode="decimal" placeholder="5000" className="mt-1 block w-full rounded-koby-sm border border-koby-border bg-koby-bg px-3 py-2 tabular-nums text-koby-text" />
                </label>
                {repayError ? <p role="alert" className="text-sm text-koby-error">{repayError}</p> : null}
                {(() => {
                  const amt = usdToBaseUnits(repayAmount);
                  return (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => amt !== null && void approveExact(amt)} disabled={amt === null || amt <= 0n}>
                        Step 1: Approve{amt !== null && amt > 0n ? ` ${formatBaseUnits(amt, USDC_DECIMALS)}` : ""}
                      </Button>
                      <Button onClick={() => void repay()} disabled={amt === null || amt <= 0n || needsApprovalFor(amt)}>
                        Step 2: Repay{amt !== null && amt > 0n ? ` ${formatBaseUnits(amt, USDC_DECIMALS)}` : ""}
                      </Button>
                    </div>
                  );
                })()}
                <p className="text-xs text-koby-text-muted">Overpayment reverts outright with no partial cap; repayments exceeding the outstanding balance are blocked before submission as well.</p>
              </div>
            )}
            <div className="mt-3 space-y-3">
              <TxProgress tx={approveTx.tx} label="Approve repayment" />
              <TxProgress tx={actionTx.tx} label="Record repayment" />
            </div>
          </Card>
        ) : null}

        {position && position.status === "Completed" ? (
          <Card title="Financing completed" description="The outstanding balance reached zero and the contract marked the position complete automatically.">
            <p className="text-sm text-koby-text-secondary">Total repaid: <span className="font-semibold tabular-nums text-koby-text">{formatBaseUnits(position.repaid, USDC_DECIMALS)}</span></p>
          </Card>
        ) : null}

        <Card title="Onchain activity" description="Direct contract-event reads for this position. History may lag the confirmed state above right after a transaction.">
          {eventsError ? (
            <ErrorState title="Activity history unavailable" message="Event reads failed (the RPC may limit log ranges). The position state above is a direct contract read and remains authoritative." />
          ) : events === null ? (
            <LoadingState message="Reading contract events…" />
          ) : events.length === 0 ? (
            <EmptyState title="No events found" description="No indexed events for this position yet. The position state above is still read directly from the contract." />
          ) : (
            <ol className="space-y-3">
              {events.map((e, i) => (
                <li key={`${e.txHash}-${i}`} className="rounded-koby-sm border border-koby-border p-3 text-sm">
                  <p className="font-semibold text-koby-text">{e.name} <span className="font-normal text-koby-text-muted">· block {e.blockNumber.toString()}</span></p>
                  <dl className="mt-1 grid gap-1 text-koby-text-secondary sm:grid-cols-2">
                    {Object.entries(e.args).filter(([k]) => k !== "id" && k !== "timestamp").map(([k, v]) => (
                      <div key={k} className="min-w-0"><dt className="inline font-medium">{k}: </dt><dd className="inline font-mono text-[13px] break-all">{typeof v === "bigint" ? v.toString() : v}</dd></div>
                    ))}
                  </dl>
                  {e.txHash ? (
                    <p className="mt-1"><a href={explorerTxUrl(e.txHash)} target="_blank" rel="noreferrer" className="underline underline-offset-2">View transaction</a> <AddressDisplay value={e.txHash} label="Transaction hash" /></p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </Card>

        {monadConfig.contractAddress ? (
          <p className="text-xs text-koby-text-muted">
            Contract: <a href={explorerAddressUrl(monadConfig.contractAddress)} target="_blank" rel="noreferrer" className="underline underline-offset-2"><AddressDisplay value={monadConfig.contractAddress} label="Koby financing contract" /></a>
          </p>
        ) : null}
      </div>
    </Container>
  );
}
