import {
  Callout,
  Code,
  CodeBlock,
  DocHeader,
  DocList,
  DocParagraph,
  DocSection,
  DocTable,
  DocTd,
  DocTh,
  RelatedDocs,
} from "@/components/docs/DocComponents";

export const metadata = {
  title: "Overview — Koby Docs",
  description:
    "What Koby is, the receivables-financing problem it addresses, how the product works, and what is currently implemented.",
};

export default function DocsOverviewPage() {
  return (
    <>
      <DocHeader
        eyebrow="Documentation · Overview"
        title="Koby documentation"
        intro="Koby turns future business cash flow into programmable liquidity. Businesses with predictable receivables get financing today; financiers get transparent, onchain-enforced terms. This documentation describes the product, the financing lifecycle, and the actual implementation."
      />

      <Callout tone="note" title="How to read status labels in these docs">
        <p>
          <strong>Implemented</strong> means the behavior exists in the codebase described here.{" "}
          <strong>Testnet</strong> means it runs against Monad Testnet with real transactions.{" "}
          <strong>Simulated / Demo</strong> means fictional or fallback data, always labeled where
          shown. <strong>Planned</strong> means designed but not yet built. Anything that cannot be
          verified is omitted rather than claimed.
        </p>
      </Callout>

      <DocSection id="what-koby-is" title="What Koby is">
        <DocParagraph>
          Koby is programmable onchain receivables-financing infrastructure. A business describes
          expected future receivables, receives an explainable cash-flow assessment, and — once
          terms are accepted — a financing position is created, funded, and repaid through a smart
          contract on Monad. The contract owns the financial state: principal, repayment
          obligation, amount repaid, outstanding balance, and position status.
        </DocParagraph>
        <DocParagraph>
          Koby is not a generic lending protocol, not a trading application, and not an AI chatbot.
          AI is strictly an analysis layer: it produces risk signals and a financing assessment, and
          it never controls funds, signs transactions, or writes contract state.
        </DocParagraph>
      </DocSection>

      <DocSection id="problem" title="The problem">
        <DocParagraph>
          Businesses often have visibility into future revenue — contracts, subscriptions, recurring
          orders — but need capital before that revenue arrives. Traditional receivables financing
          is slow, opaque, and manual: terms live in private ledgers, repayment tracking is
          bilateral, and neither party can independently verify the position.
        </DocParagraph>
        <DocParagraph>
          Koby replaces the private ledger with a shared, tamper-evident record. Funding moves as a
          real token transfer, each repayment is a validated onchain transaction, and both parties
          read the same contract state instead of reconciling two versions of the truth.
        </DocParagraph>
      </DocSection>

      <DocSection id="how-it-works" title="How it works">
        <DocParagraph>
          The lifecycle runs from expected revenue to a completed financing position:
        </DocParagraph>
        <CodeBlock
          caption="Financing lifecycle"
          code={[
            "Future receivables",
            "  → Cash-flow assessment (offchain, AI-assisted)",
            "  → Financing opportunity (terms proposed by the business)",
            "  → Onchain financing (create transaction)",
            "  → Monad settlement (fund transaction, financier → business)",
            "  → Programmable repayment (each repayment validated onchain)",
            "  → Completed position (outstanding balance reaches zero)",
          ].join("\n")}
        />
        <DocParagraph>
          The canonical example used across the product and demos is a fictional business with{" "}
          <Code>$100,000</Code> in expected receivables and a <Code>$70,000</Code> financing. Demo
          businesses and receivables are always fictional; transactions and contract state shown
          against them on testnet are real. See <Code>How It Works</Code> for each stage in detail.
        </DocParagraph>
      </DocSection>

      <DocSection id="offchain-vs-onchain" title="Offchain assessment vs onchain execution">
        <DocParagraph>
          The single most important distinction in Koby: analysis informs, the chain decides. The
          table below shows where each step runs and what it can and cannot change.
        </DocParagraph>
        <DocTable>
          <thead>
            <tr>
              <DocTh>Step</DocTh>
              <DocTh>Runs</DocTh>
              <DocTh>Effect</DocTh>
            </tr>
          </thead>
          <tbody>
            <tr>
              <DocTd>Business and receivables input</DocTd>
              <DocTd>Offchain (form → API validation)</DocTd>
              <DocTd>Self-reported data; verifies nothing by itself</DocTd>
            </tr>
            <tr>
              <DocTd>Cash-flow assessment</DocTd>
              <DocTd>Offchain (server route, AI provider or deterministic fallback)</DocTd>
              <DocTd>Advisory score, confidence, factors, recommendation</DocTd>
            </tr>
            <tr>
              <DocTd>Terms review</DocTd>
              <DocTd>Offchain (UI)</DocTd>
              <DocTd>Human decision; nothing exists onchain yet</DocTd>
            </tr>
            <tr>
              <DocTd>Create, fund, repay</DocTd>
              <DocTd>Onchain (Monad transactions)</DocTd>
              <DocTd>The only operations that change financing state</DocTd>
            </tr>
            <tr>
              <DocTd>History and listings</DocTd>
              <DocTd>Offchain reads of onchain data (RPC log reads)</DocTd>
              <DocTd>Display only; never authoritative over a contract read</DocTd>
            </tr>
          </tbody>
        </DocTable>
        <DocParagraph>
          If a position status can change without a corresponding Monad transaction, that is a bug.
          The frontend reads financial state from the contract or from events the contract emitted —
          it never invents it.
        </DocParagraph>
      </DocSection>

      <DocSection id="implementation-status" title="What is implemented">
        <DocTable>
          <thead>
            <tr>
              <DocTh>Area</DocTh>
              <DocTh>Status</DocTh>
              <DocTh>Notes</DocTh>
            </tr>
          </thead>
          <tbody>
            <tr>
              <DocTd>App routes (dashboard, marketplace, financing, activity)</DocTd>
              <DocTd>Implemented</DocTd>
              <DocTd>Next.js App Router with wallet-gated actions; browsing needs no wallet</DocTd>
            </tr>
            <tr>
              <DocTd>Financing contract (create, fund, repay)</DocTd>
              <DocTd>Implemented</DocTd>
              <DocTd>
                <Code>KobyFinancing.sol</Code> with Foundry tests; single testnet USDC asset
              </DocTd>
            </tr>
            <tr>
              <DocTd>Testnet deployment</DocTd>
              <DocTd>Configured at deploy time</DocTd>
              <DocTd>
                Address comes from <Code>NEXT_PUBLIC_CONTRACT_ADDRESS</Code>; the app shows an
                honest not-deployed state until it is set
              </DocTd>
            </tr>
            <tr>
              <DocTd>AI cash-flow assessment</DocTd>
              <DocTd>Implemented</DocTd>
              <DocTd>
                Live providers with a labeled deterministic fallback; advisory only, always requires
                review
              </DocTd>
            </tr>
            <tr>
              <DocTd>Wallet onboarding (Privy + injected wallets)</DocTd>
              <DocTd>Implemented</DocTd>
              <DocTd>Provider-agnostic abstraction; Privy gated on its app ID</DocTd>
            </tr>
            <tr>
              <DocTd>Demo business and figures</DocTd>
              <DocTd>Simulated</DocTd>
              <DocTd>Fictional business and receivables, always labeled where shown</DocTd>
            </tr>
            <tr>
              <DocTd>Nansen onchain signals</DocTd>
              <DocTd>Planned</DocTd>
              <DocTd>No Nansen code path exists yet; assessments use submitted data only</DocTd>
            </tr>
            <tr>
              <DocTd>ENVIO event indexing</DocTd>
              <DocTd>Planned</DocTd>
              <DocTd>History currently reads contract logs directly over RPC</DocTd>
            </tr>
            <tr>
              <DocTd>Mainnet deployment</DocTd>
              <DocTd>Planned</DocTd>
              <DocTd>MVP targets Monad Testnet exclusively</DocTd>
            </tr>
          </tbody>
        </DocTable>
      </DocSection>

      <DocSection id="start" title="Where to go next">
        <DocList>
          <li>How It Works — the five-stage lifecycle in detail.</li>
          <li>Architecture — routes, services, and data ownership as built.</li>
          <li>Monad Integration — network, contract, and transaction behavior.</li>
          <li>AI Assessment — inputs, outputs, fallback, and limitations.</li>
          <li>Smart Contracts &amp; Security — state machine and trust boundaries.</li>
          <li>Developer Guide — setup, environment, tests, and deployment.</li>
        </DocList>
      </DocSection>

      <RelatedDocs
        links={[
          { href: "/docs/how-it-works", label: "How It Works" },
          { href: "/docs/architecture", label: "Architecture" },
          { href: "/docs/developer-guide", label: "Developer Guide" },
        ]}
      />
    </>
  );
}
