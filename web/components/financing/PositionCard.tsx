import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Metric } from "@/components/ui/Metric";
import { FinancingStatusBadge } from "@/components/ui/Status";
import { ProvenanceTag } from "@/components/ui/ProvenanceTag";
import { AddressDisplay } from "@/components/ui/AddressDisplay";
import { formatBaseUnits } from "@/lib/format";
import { USDC_DECIMALS } from "@/services/financing";
import type { Position } from "@/services/financing";

/**
 * PositionCard — one financing position with the PRD.md Section 18 value
 * hierarchy. Amounts come from contract reads (Onchain/Testnet), never
 * local math: outstanding is read from the contract via the service.
 */
export function PositionCard({ position, link }: { position: Position; link?: boolean }) {
  const body = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <FinancingStatusBadge status={position.status} />
        <ProvenanceTag source="Testnet" />
        <ProvenanceTag source="Onchain" />
        <span className="font-mono text-xs text-koby-text-muted">#{position.id.toString()}</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Metric label="Financing" value={formatBaseUnits(position.principal, USDC_DECIMALS)} provenance="Onchain" />
        <Metric label="Obligation" value={formatBaseUnits(position.obligation, USDC_DECIMALS)} provenance="Onchain" />
        <Metric label="Repaid" value={formatBaseUnits(position.repaid, USDC_DECIMALS)} provenance="Onchain" />
        <Metric label="Outstanding" value={formatBaseUnits(position.outstanding, USDC_DECIMALS)} provenance="Onchain" />
      </dl>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-koby-text-secondary">Business</dt>
          <dd><AddressDisplay value={position.business} label="Business address" /></dd>
        </div>
        <div>
          <dt className="font-medium text-koby-text-secondary">Financier</dt>
          <dd>
            {position.financier === "0x0000000000000000000000000000000000000000" ? (
              <span className="text-koby-text-muted">Not yet funded</span>
            ) : (
              <AddressDisplay value={position.financier} label="Financier address" />
            )}
          </dd>
        </div>
      </dl>
    </>
  );

  return (
    <Card>
      {link ? (
        <Link href={`/financing/${position.id.toString()}`} className="block" aria-label={`Open financing position ${position.id.toString()}`}>
          {body}
        </Link>
      ) : (
        body
      )}
    </Card>
  );
}
