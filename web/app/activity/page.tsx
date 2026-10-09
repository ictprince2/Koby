"use client";

/**
 * /activity — chronological contract-event history across all positions.
 * Direct log reads (pre-ENVIO path). Entries link to real transactions only;
 * a failed read shows the honest unavailable state with a direct-read note.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateBlocks";
import { AddressDisplay } from "@/components/ui/AddressDisplay";
import { isFinancingConfigured, readFinancingEvents, type FinancingEvent } from "@/services/financing";
import { explorerTxUrl } from "@/lib/monad";

export default function ActivityPage() {
  const [events, setEvents] = useState<FinancingEvent[] | null>(null);
  const [error, setError] = useState(false);
  const configured = isFinancingConfigured();

  useEffect(() => {
    if (!configured) return;
    readFinancingEvents()
      .then((all) => setEvents([...all].reverse()))
      .catch(() => setError(true));
  }, [configured]);

  return (
    <Container className="py-10 sm:py-14">
      <p className="font-mono text-[11px] font-medium tracking-[0.2em] text-koby-text-muted uppercase">
        Onchain / Activity
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-koby-text sm:text-4xl">Onchain activity</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-koby-text-secondary sm:text-base">
        Financing creation, funding, repayment, and completion events with transaction references.
      </p>
      <div className="mt-6">
        {!configured ? (
          <ErrorState title="Financing contract is not deployed yet" message="NEXT_PUBLIC_CONTRACT_ADDRESS is empty, so no activity can be read." />
        ) : error ? (
          <ErrorState
            title="Activity history unavailable"
            message="Event reads failed (the RPC may limit log ranges). Individual position pages still read state directly from the contract."
            action={<Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>}
          />
        ) : events === null ? (
          <LoadingState message="Reading contract events…" />
        ) : events.length === 0 ? (
          <EmptyState title="No onchain activity yet" description="Activity appears here after a financing transaction confirms on Monad Testnet." action={<Button href="/financing/create" variant="secondary">Create financing request</Button>} />
        ) : (
          <ol className="space-y-3">
            {events.map((e, i) => (
              <li key={`${e.txHash}-${i}`} className="rounded-koby-md border border-koby-border bg-koby-surface p-4 text-sm">
                <p className="font-semibold text-koby-text">
                  {e.name}{" "}
                  <Link href={`/financing/${e.positionId.toString()}`} className="font-normal underline underline-offset-2">
                    Position #{e.positionId.toString()}
                  </Link>{" "}
                  <span className="font-normal text-koby-text-muted">· block {e.blockNumber.toString()}</span>
                </p>
                {e.txHash ? (
                  <p className="mt-1 text-koby-text-secondary">
                    <a href={explorerTxUrl(e.txHash)} target="_blank" rel="noreferrer" className="underline underline-offset-2">View transaction</a>{" "}
                    <AddressDisplay value={e.txHash} label="Transaction hash" />
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </Container>
  );
}
