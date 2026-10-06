"use client";

/**
 * /dashboard — the business's own financing state: active financing, repaid,
 * outstanding, and positions. Totals are display aggregations of direct
 * contract reads (Onchain), never locally invented state.
 */

import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateBlocks";
import { Metric } from "@/components/ui/Metric";
import { PositionCard } from "@/components/financing/PositionCard";
import { useWallet } from "@/hooks/useWallet";
import { isFinancingConfigured, listPositions, type Position } from "@/services/financing";
import { formatBaseUnits } from "@/lib/format";
import { USDC_DECIMALS } from "@/lib/monad";

export default function DashboardPage() {
  const { address, status } = useWallet();
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const configured = isFinancingConfigured();
  const connected = status === "connected" && address !== null;

  useEffect(() => {
    if (!configured || !connected || !address) return;
    const owner = address;
    let cancelled = false;
    // State updates land in the callbacks below, never in the effect body.
    listPositions()
      .then((all) => {
        if (cancelled) return;
        setPositions(all.filter((p) => p.business.toLowerCase() === owner.toLowerCase()));
        setLoadedFor(owner);
        setError(false);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [configured, connected, address]);

  // While the wallet changes, stale positions are hidden behind loading.
  const showingFor = loadedFor !== null && loadedFor.toLowerCase() === (address ?? "").toLowerCase();
  const visible = showingFor ? positions : null;

  const active = visible?.filter((p) => p.status !== "Completed") ?? [];
  const financed = active.reduce((sum, p) => sum + p.principal, 0n);
  const repaid = (visible ?? []).reduce((sum, p) => sum + p.repaid, 0n);
  const outstanding = active.reduce((sum, p) => sum + p.outstanding, 0n);

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-koby-text">Business dashboard</h1>
      <p className="mt-2 max-w-2xl text-sm text-koby-text-secondary">
        Active financing, amounts repaid, outstanding balances, and onchain activity for your connected wallet.
      </p>
      <div className="mt-6 space-y-6">
        {!configured ? (
          <ErrorState title="Financing contract is not deployed yet" message="NEXT_PUBLIC_CONTRACT_ADDRESS is empty, so no positions can be read." />
        ) : !connected ? (
          <EmptyState title="Connect a wallet to see your dashboard" description="Your positions are tied to your wallet address — the only sign-in Koby has. Browsing the marketplace needs no wallet." />
        ) : error ? (
          <ErrorState title="Dashboard unavailable" message="Your positions could not be read from the contract. Check your connection and retry." action={<Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>} />
        ) : visible === null ? (
          <LoadingState message="Reading your positions from the contract…" />
        ) : visible.length === 0 ? (
          <EmptyState
            title="No financing to show yet"
            description="This wallet has no financing positions onchain. Create a request to turn future receivables into a financing opportunity."
            action={<Button href="/financing/create" variant="secondary">Create financing request</Button>}
          />
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              <Metric label="Active financing" value={formatBaseUnits(financed, USDC_DECIMALS)} provenance="Onchain" />
              <Metric label="Repaid" value={formatBaseUnits(repaid, USDC_DECIMALS)} provenance="Onchain" />
              <Metric label="Outstanding" value={formatBaseUnits(outstanding, USDC_DECIMALS)} provenance="Onchain" />
            </dl>
            <div className="space-y-4">
              {visible.map((p) => <PositionCard key={p.id.toString()} position={p} link />)}
            </div>
            <div>
              <Button href="/financing/create" variant="secondary">Create financing request</Button>
            </div>
          </>
        )}
      </div>
    </Container>
  );
}
