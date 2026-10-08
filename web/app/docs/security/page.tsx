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
  title: "Smart Contracts & Security — Koby Docs",
  description:
    "The Koby financing contract's responsibilities, state transitions, funding and repayment flow, authorization, and known limitations.",
};

export default function DocsSecurityPage() {
  return (
    <>
      <DocHeader
        eyebrow="Documentation · Smart Contracts & Security"
        title="Smart contracts & security"
        intro="One contract enforces the financing state machine, the accounting, and who may act. Everything below describes the implemented contract — audited status, admin powers, and guarantees it does not have are stated explicitly."
      />

      <Callout tone="caution" title="Not audited">
        <p>
          The financing contract has Foundry test coverage for its happy paths, failure paths, and
          access control, but it has not been independently audited. Do not treat this page as an
          audit report, and do not deploy mainnet value against the contract on the strength of
          these docs.
        </p>
      </Callout>

      <DocSection id="responsibilities" title="Contract responsibilities">
        <DocParagraph>
          <Code>KobyFinancing</Code> records financing terms, settles funding, validates each
          repayment, tracks amount repaid and the outstanding balance, and transitions position
          state. It stores only what financial enforcement needs — business and financier addresses,
          principal, repayment obligation, amount repaid, timestamps, and status — and holds no
          token balances at any point. AI assessments, business metadata, and analytics never touch
          the contract.
        </DocParagraph>
      </DocSection>

      <DocSection id="states" title="State transitions">
        <DocTable>
          <thead>
            <tr>
              <DocTh>Transition</DocTh>
              <DocTh>Trigger</DocTh>
              <DocTh>Who</DocTh>
              <DocTh>Condition</DocTh>
            </tr>
          </thead>
          <tbody>
            <tr>
              <DocTd mono>→ Created</DocTd>
              <DocTd>Create transaction</DocTd>
              <DocTd>Any connected wallet (open creator)</DocTd>
              <DocTd>Nonzero principal and obligation; obligation ≥ principal; valid business address</DocTd>
            </tr>
            <tr>
              <DocTd mono>Created → Funded</DocTd>
              <DocTd>Fund transaction</DocTd>
              <DocTd>Any address (becomes the single financier)</DocTd>
              <DocTd>Position is Created; amount equals principal exactly</DocTd>
            </tr>
            <tr>
              <DocTd mono>Funded → Repaying</DocTd>
              <DocTd>First valid repayment</DocTd>
              <DocTd>Recorded business only</DocTd>
              <DocTd>Amount above zero and within outstanding balance</DocTd>
            </tr>
            <tr>
              <DocTd mono>Repaying → Repaying</DocTd>
              <DocTd>Further repayments</DocTd>
              <DocTd>Recorded business only</DocTd>
              <DocTd>Same amount conditions, re-checked against current balance</DocTd>
            </tr>
            <tr>
              <DocTd mono>Repaying → Completed</DocTd>
              <DocTd>The qualifying repayment itself</DocTd>
              <DocTd>Recorded business (same call)</DocTd>
              <DocTd>Resulting outstanding balance is exactly zero</DocTd>
            </tr>
          </tbody>
        </DocTable>
        <DocParagraph>
          Every other transition reverts: funding an already-funded position, funding with any
          amount other than the principal, repaying a Created or Completed position, zero-amount
          calls, over-repayment (rejected outright, never partially capped), and any state-changing
          call from an unauthorized address. Each transition emits its event —{" "}
          <Code>FinancingCreated</Code>, <Code>FinancingFunded</Code>,{" "}
          <Code>RepaymentRecorded</Code>, and <Code>FinancingCompleted</Code> on the qualifying
          repayment.
        </DocParagraph>
      </DocSection>

      <DocSection id="funding-repayment" title="How funding and repayment move value">
        <DocParagraph>
          Funding is one atomic transaction: the contract pulls exactly the principal from the
          financier and pushes it straight to the business. Repayment is symmetric: each validated
          repayment pulls from the business and pushes straight to the recorded financier in the
          same transaction. Checks take effect before any external token call, token transfers use
          hardened transfer handling, and reentrancy protection guards every function that moves
          funds.
        </DocParagraph>
        <CodeBlock
          caption="Accounting invariant"
          code="outstanding = obligation − repaid, with repaid ≤ obligation always"
        />
        <DocParagraph>
          The outstanding balance is computed from obligation and amount repaid, never stored as an
          independent value that could drift. Amount repaid increases only through validated
          repayments, and the contract rejects anything that would break the invariant — no
          floating-point arithmetic, no rounding ambiguity, no double repayment, no unauthorized
          balance changes, and no admin override path of any kind.
        </DocParagraph>
      </DocSection>

      <DocSection id="authorization" title="Wallet authorization and signing">
        <DocParagraph>
          Every financial action requires the relevant party&apos;s own wallet signature: any wallet
          may create (specifying any business address), only an exact-principal funder records
          itself as financier, and only the recorded business may repay. The UI shows action,
          amount, token, target, network, and terms before requesting a signature, uses explicit
          button labels (“Fund $70,000 financing”, never “Continue”), and treats connection as
          identity only — never as authorization for a transaction.
        </DocParagraph>
        <DocParagraph>
          Token approvals are exact-amount per action and presented as a distinct step. There are no
          unlimited approvals and no permit signatures. If the connected account changes mid-flow,
          the app re-validates that the new account is entitled to the in-progress action rather
          than continuing silently.
        </DocParagraph>
      </DocSection>

      <DocSection id="limitations" title="Known limitations">
        <DocParagraph>
          Single testnet asset: only the USDC bound immutably at deployment is accepted, with
          decimals fixed as a constant — a different or malicious token address cannot be
          substituted. Duration is display-only with no enforcement. There is no default,
          cancellation, pause, or emergency-withdrawal mechanism; a compromised private key is
          outside what the application can mitigate, beyond showing exactly what is being signed.
          External data (RPC responses, log reads, AI output) is never trusted implicitly: failures
          surface as failed or unavailable states, never as fabricated success.
        </DocParagraph>
        <DocParagraph>
          No private keys, seed phrases, API keys, credentials, or environment values are published
          in these docs or anywhere in the repository. Environment documentation uses variable names
          with placeholder values only.
        </DocParagraph>
      </DocSection>

      <RelatedDocs
        links={[
          { href: "/docs/monad", label: "Monad Integration" },
          { href: "/docs/architecture", label: "Architecture" },
          { href: "/docs/developer-guide", label: "Developer Guide" },
        ]}
      />
    </>
  );
}
