import { AddressDisplay } from "@/components/ui/AddressDisplay";
import { monadConfig } from "@/lib/monad";

/**
 * ReviewCard — pre-signature disclosure (SECURITY.md Section 8, PRD.md 19):
 * action, amount, token, target, network, terms. Rendered before every
 * financial transaction is requested from the wallet.
 *
 * Ledger-styled to the editorial financing composition: the action reads
 * as a large statement, terms as ruled monospace rows. Same props and same
 * information as before — only the container changed.
 */
export function ReviewCard({
  action,
  amount,
  terms,
  contractLabel,
}: {
  action: string;
  amount: string;
  terms: { label: string; value: string }[];
  contractLabel: string;
}) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase">
        Action
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-koby-text sm:text-4xl">{action}</p>
      <dl className="mt-6">
        <div className="grid min-w-0 gap-1 border-t border-koby-border py-4 sm:grid-cols-12 sm:gap-4">
          <dt className="font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase sm:col-span-4">
            Amount
          </dt>
          <dd className="min-w-0 font-mono text-sm break-all text-koby-text sm:col-span-8">{amount}</dd>
        </div>
        <div className="grid min-w-0 gap-1 border-t border-koby-border py-4 sm:grid-cols-12 sm:gap-4">
          <dt className="font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase sm:col-span-4">
            Token
          </dt>
          <dd className="min-w-0 font-mono text-sm break-all text-koby-text sm:col-span-8">
            Testnet USDC (6 decimals)
          </dd>
        </div>
        <div className="grid min-w-0 gap-1 border-t border-koby-border py-4 sm:grid-cols-12 sm:gap-4">
          <dt className="font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase sm:col-span-4">
            Network
          </dt>
          <dd className="min-w-0 font-mono text-sm break-all text-koby-text sm:col-span-8">
            {monadConfig.chainName} · chain ID {monadConfig.chainId}
          </dd>
        </div>
        <div className="grid min-w-0 gap-1 border-t border-koby-border py-4 sm:grid-cols-12 sm:gap-4">
          <dt className="font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase sm:col-span-4">
            Target contract
          </dt>
          <dd className="min-w-0 font-mono text-sm break-all text-koby-text sm:col-span-8">
            {monadConfig.contractAddress ? (
              <AddressDisplay value={monadConfig.contractAddress} label={contractLabel} />
            ) : (
              <span className="text-koby-error">Contract not configured</span>
            )}
          </dd>
        </div>
        {terms.map((term) => (
          <div key={term.label} className="grid min-w-0 gap-1 border-t border-koby-border py-4 sm:grid-cols-12 sm:gap-4">
            <dt className="font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase sm:col-span-4">
              {term.label}
            </dt>
            <dd className="min-w-0 font-mono text-sm break-all text-koby-text sm:col-span-8">{term.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
