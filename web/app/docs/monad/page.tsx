import {
  Callout,
  Code,
  CodeBlock,
  DocHeader,
  DocParagraph,
  DocSection,
  DocTable,
  DocTd,
  DocTh,
  RelatedDocs,
} from "@/components/docs/DocComponents";

export const metadata = {
  title: "Monad Integration — Koby Docs",
  description:
    "Why Koby uses Monad, the configured network, the financing contract's responsibilities, and how transactions and position state work.",
};

export default function DocsMonadPage() {
  return (
    <>
      <DocHeader
        eyebrow="Documentation · Monad Integration"
        title="Monad integration"
        intro="Monad is Koby's execution layer, not a deployment badge. Creating, funding, and repaying a financing position are real Monad transactions; the position state users see is contract state read from the chain."
      />

      <DocSection id="why" title="Why Koby uses Monad">
        <DocParagraph>
          Two independent parties — a business and a financier — need a shared, tamper-evident
          record of a financial obligation that updates frequently: once at funding, then
          potentially across many repayments. Koby uses Monad because financing infrastructure
          benefits from fast, inexpensive, programmable settlement and high-throughput onchain
          activity: funding settles with finality neither party must take on trust, the state
          machine is enforced by contract logic rather than a backend, every funding and repayment
          is independently verifiable history, and frequent repayments stay cheap enough to record
          individually.
        </DocParagraph>
        <DocParagraph>
          No numeric performance claim is made here. What the application does with the chain —
          create, fund, repay, complete — is the justification, and each operation is documented
          below.
        </DocParagraph>
      </DocSection>

      <DocSection id="network" title="Configured network">
        <DocParagraph>
          The MVP runs entirely on Monad Testnet. These are the verified defaults applied by the
          application; each can be overridden with the matching <Code>NEXT_PUBLIC_*</Code>{" "}
          variable, and every value should be re-verified against official Monad documentation
          before deployment.
        </DocParagraph>
        <DocTable>
          <thead>
            <tr>
              <DocTh>Field</DocTh>
              <DocTh>Value</DocTh>
            </tr>
          </thead>
          <tbody>
            <tr>
              <DocTd>Network name</DocTd>
              <DocTd mono>Monad Testnet</DocTd>
            </tr>
            <tr>
              <DocTd>Chain ID</DocTd>
              <DocTd mono>10143</DocTd>
            </tr>
            <tr>
              <DocTd>Native currency</DocTd>
              <DocTd mono>MON (gas only)</DocTd>
            </tr>
            <tr>
              <DocTd>Public RPC</DocTd>
              <DocTd mono>https://testnet-rpc.monad.xyz</DocTd>
            </tr>
            <tr>
              <DocTd>Block explorer</DocTd>
              <DocTd mono>https://testnet.monadvision.com</DocTd>
            </tr>
            <tr>
              <DocTd>Financing asset</DocTd>
              <DocTd mono>Testnet USDC · 6 decimals</DocTd>
            </tr>
            <tr>
              <DocTd>Token address</DocTd>
              <DocTd mono>0x534b2f3A21130d7a60830c2Df862319e593943A3</DocTd>
            </tr>
          </tbody>
        </DocTable>
        <Callout tone="caution" title="Re-verify before deployment">
          <p>
            Testnet has been reset from genesis before, which can affect token deployments. Re-verify
            the chain ID, RPC endpoints, explorer, and especially the USDC address immediately before
            deploying — do not treat this page as a live source. The contract binds its asset
            immutably at deploy time, so the deployment must use the re-verified address.
          </p>
        </Callout>
      </DocSection>

      <DocSection id="contract" title="The financing contract">
        <DocParagraph>
          A single contract, <Code>KobyFinancing</Code>, owns the financing state machine
          (Created → Funded → Repaying → Completed), funding and repayment accounting, and access
          control. It holds no token balances: funding pulls exactly the principal from the
          financier straight to the business, and each repayment pulls from the business straight
          to the financier, atomically in the same transaction. Completion is automatic in the
          repayment transaction that zeroes the outstanding balance — never a separate call. There
          is no admin role, no pause, and no upgrade path.
        </DocParagraph>
        <DocTable>
          <thead>
            <tr>
              <DocTh>Function</DocTh>
              <DocTh>Who can call</DocTh>
              <DocTh>Effect</DocTh>
            </tr>
          </thead>
          <tbody>
            <tr>
              <DocTd mono>create(business, principal, obligation)</DocTd>
              <DocTd>Any connected wallet (open creator)</DocTd>
              <DocTd>Records terms; emits FinancingCreated</DocTd>
            </tr>
            <tr>
              <DocTd mono>fund(id)</DocTd>
              <DocTd>Any address, once, with exactly the principal</DocTd>
              <DocTd>Created → Funded; emits FinancingFunded</DocTd>
            </tr>
            <tr>
              <DocTd mono>repay(id, amount)</DocTd>
              <DocTd>Only the recorded business</DocTd>
              <DocTd>Updates repaid / outstanding; emits RepaymentRecorded, then FinancingCompleted when due reaches zero</DocTd>
            </tr>
            <tr>
              <DocTd mono>getPosition / outstanding / positionCount</DocTd>
              <DocTd>Anyone (read-only)</DocTd>
              <DocTd>Returns authoritative state; no state change</DocTd>
            </tr>
          </tbody>
        </DocTable>
        <DocParagraph>
          The contract is deployed on Monad Testnet at{" "}
          <Code>0x7dee1dd04e2a9541202eb37ede56a7395a1dc93a</Code> (chain ID 10143;
          deploy records in <Code>broadcast/Deploy.s.sol/10143/</Code>, verifiable on the
          explorer). The address is environment configuration (
          <Code>NEXT_PUBLIC_CONTRACT_ADDRESS</Code>), never hardcoded: until it is set,
          financing actions show an honest not-deployed state instead of attempting
          transactions. This is a testnet deployment — not mainnet, not production.
        </DocParagraph>
      </DocSection>

      <DocSection id="reads" title="How the frontend reads state">
        <DocParagraph>
          Current position state comes from direct contract reads for the position in view. History
          and marketplace listings decode the four contract events from RPC logs, scanned in small
          bounded block ranges to respect the public RPC&apos;s log-range limits. A failed log read
          never produces fabricated events: the UI shows activity as unavailable and falls back to
          direct reads for the specific position. Success is confirmed at one confirmation of depth
          before the UI reflects any state change.
        </DocParagraph>
      </DocSection>

      <DocSection id="writes" title="Which actions generate transactions">
        <DocTable>
          <thead>
            <tr>
              <DocTh>Action</DocTh>
              <DocTh>Transactions submitted</DocTh>
            </tr>
          </thead>
          <tbody>
            <tr>
              <DocTd>Create financing</DocTd>
              <DocTd>One <Code>create</Code> transaction signed by the business</DocTd>
            </tr>
            <tr>
              <DocTd>Fund financing</DocTd>
              <DocTd>Exact-amount <Code>approve</Code>, then one <Code>fund</Code> transaction signed by the financier</DocTd>
            </tr>
            <tr>
              <DocTd>Repay</DocTd>
              <DocTd>Exact-amount <Code>approve</Code>, then one <Code>repay</Code> transaction signed by the business</DocTd>
            </tr>
          </tbody>
        </DocTable>
        <DocParagraph>
          Token approvals are exact-amount per action and shown as a distinct step — never unlimited
          approvals, and no permit signatures. Every transaction moves through the lifecycle below,
          and the hash is shown from submission onward with an explorer link for independent
          verification.
        </DocParagraph>
        <CodeBlock
          caption="Transaction lifecycle"
          code="idle → preparing → awaiting_wallet → submitted → confirming → confirmed → failed"
        />
        <DocParagraph>
          Awaiting wallet is not submission, and submission is not confirmation. The app verifies it
          is connected to chain ID 10143 before constructing a transaction and blocks with a
          network-switch prompt otherwise; a wallet rejection returns cleanly with no funds moved.
        </DocParagraph>
      </DocSection>

      <RelatedDocs
        links={[
          { href: "/docs/security", label: "Smart Contracts & Security" },
          { href: "/docs/architecture", label: "Architecture" },
          { href: "/docs/how-it-works", label: "How It Works" },
        ]}
      />
    </>
  );
}
