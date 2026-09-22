import { AddressDisplay } from "@/components/ui/AddressDisplay";
import { Card } from "@/components/ui/Card";
import { monadConfig } from "@/lib/monad";

/**
 * ReviewCard — pre-signature disclosure (SECURITY.md Section 8, PRD.md 19):
 * action, amount, token, target, network, terms. Rendered before every
 * financial transaction is requested from the wallet.
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
    <Card title="Review before settlement" description="This action will create/settle the financing position on Monad. Read carefully before signing.">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-koby-text-secondary">Action</dt>
          <dd className="mt-0.5 font-semibold text-koby-text">{action}</dd>
        </div>
        <div>
          <dt className="font-medium text-koby-text-secondary">Amount</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-koby-text">{amount}</dd>
        </div>
        <div>
          <dt className="font-medium text-koby-text-secondary">Token</dt>
          <dd className="mt-0.5 text-koby-text">Testnet USDC (6 decimals)</dd>
        </div>
        <div>
          <dt className="font-medium text-koby-text-secondary">Network</dt>
          <dd className="mt-0.5 text-koby-text">
            {monadConfig.chainName} · chain ID {monadConfig.chainId}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-koby-text-secondary">Target contract</dt>
          <dd className="mt-0.5">
            {monadConfig.contractAddress ? (
              <AddressDisplay value={monadConfig.contractAddress} label={contractLabel} />
            ) : (
              <span className="text-koby-error">Contract not configured</span>
            )}
          </dd>
        </div>
        {terms.map((term) => (
          <div key={term.label}>
            <dt className="font-medium text-koby-text-secondary">{term.label}</dt>
            <dd className="mt-0.5 tabular-nums text-koby-text">{term.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
