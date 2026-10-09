"use client";

/**
 * /marketplace — open financing opportunities for financiers.
 * Browsable with no wallet. Lists real onchain positions in Created state,
 * newest first. No rankings (PRD.md Section 8).
 */

import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateBlocks";
import { PositionCard } from "@/components/financing/PositionCard";
import { isFinancingConfigured, listPositions, type Position } from "@/services/financing";

export default function MarketplacePage() {
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [error, setError] = useState(false);
  const configured = isFinancingConfigured();

  useEffect(() => {
    if (!configured) return;
    listPositions()
      .then((all) => {
        setPositions(all.filter((p) => p.status === "Created"));
      })
      .catch(() => setError(true));
  }, [configured]);

  return (
    <Container className="py-10 sm:py-14">
      <p className="font-mono text-[11px] font-medium tracking-[0.2em] text-koby-text-muted uppercase">
        Financier / Marketplace
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-koby-text sm:text-4xl">Financing marketplace</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-koby-text-secondary sm:text-base">
        Open financing opportunities — business, receivables, terms, and funding status.
        Browsing needs no wallet; funding happens on the position page.
      </p>
      <div className="mt-6 space-y-4">
        {!configured ? (
          <ErrorState title="Financing contract is not deployed yet" message="NEXT_PUBLIC_CONTRACT_ADDRESS is empty, so no opportunities can be listed. Deploy the contract and configure the address." />
        ) : error ? (
          <ErrorState title="Marketplace unavailable" message="Positions could not be read from the contract. Check your connection and retry." action={<Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>} />
        ) : positions === null ? (
          <LoadingState message="Reading open positions from the contract…" />
        ) : positions.length === 0 ? (
          <EmptyState
            title="No financing opportunities yet"
            description="Nothing is listed because no unfunded financing positions exist onchain right now — not because something broke."
            action={<Button href="/financing/create" variant="secondary">Create financing request</Button>}
          />
        ) : (
          positions.map((p) => <PositionCard key={p.id.toString()} position={p} link />)
        )}
      </div>
    </Container>
  );
}
