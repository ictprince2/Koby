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
  title: "How It Works — Koby Docs",
  description:
    "The Koby financing lifecycle: receivables input, cash-flow assessment, opportunity review, onchain settlement, and repayment.",
};

export default function DocsHowItWorksPage() {
  return (
    <>
      <DocHeader
        eyebrow="Documentation · How It Works"
        title="How Koby works"
        intro="Five stages take a business from expected receivables to a completed financing position. The first three are offchain analysis and review; the last two are onchain execution where real value moves."
      />

      <DocSection id="input" title="1. Business and receivables input">
        <DocParagraph>
          The business submits identifying information and financing figures: business name and
          type, operating history, expected future receivables, requested financing amount, and
          repayment period. Optional supporting figures — monthly revenue, historical revenue,
          operating expenses, existing obligations, customer concentration, payment terms, and free-
          text notes — improve the assessment but are never required to proceed.
        </DocParagraph>
        <DocParagraph>
          Every submitted figure is self-reported and unverified. Input is validated for shape and
          range (positive amounts, a 7–365 day repayment period, bounded text lengths) before
          anything else happens. Validation rejects malformed input; it does not verify truth.
        </DocParagraph>
      </DocSection>

      <DocSection id="assessment" title="2. Cash-flow assessment">
        <DocParagraph>
          Validated input is sent to the server-side assessment route, which returns a structured{" "}
          <Code>RiskAssessment</Code> — a score, a confidence value, supporting factors, and a
          recommendation — inside a wider analysis envelope with revenue and capacity summaries.
          Score and confidence answer different questions: the score describes how the opportunity
          looks given the data, while confidence describes how much data the model had to work with.
          High confidence never means low risk.
        </DocParagraph>
        <DocParagraph>
          When a live AI provider is configured, the assessment comes from the model; otherwise a
          deterministic, versioned fallback methodology produces it, labeled as a Demo AI
          Assessment. Either way the output is schema- and language-validated before use, and every
          analysis carries a mandatory review flag. The assessment is advisory: it informs the
          financing review and nothing else.
        </DocParagraph>
      </DocSection>

      <DocSection id="review" title="3. Financing opportunity review">
        <DocParagraph>
          The business proposes its own terms — financing amount, repayment obligation, and duration
          — and reviews them alongside the assessment. The AI never sets terms: in the deterministic
          fallback, the advisory eligible figure is simply the lower of the requested amount and 70%
          of stated receivables, presented as guidance, not an offer. Nothing is created onchain
          until the business explicitly accepts and signs.
        </DocParagraph>
        <DocParagraph>
          Financiers see the same opportunity in the marketplace: business information, receivables,
          requested and offered amounts, repayment terms, duration, risk signals, and funding
          status. Opportunities carry provenance labels so submitted figures are never mistaken for
          verified ones, and the marketplace shows no rankings — only neutral, comparable fields.
        </DocParagraph>
      </DocSection>

      <DocSection id="settlement" title="4. Onchain financing and settlement">
        <DocParagraph>
          Acceptance becomes a real Monad transaction. Creating the position records its terms
          onchain (<Code>Created</Code>). Funding is atomic settlement in a single transaction: the
          contract pulls exactly the principal from the financier and pushes it straight to the
          business, recording the financier and moving the position to <Code>Funded</Code>. The
          contract never holds funding balances, and there is no separate escrow-release or claim
          step.
        </DocParagraph>
        <DocParagraph>
          Before any signature, the UI shows the action, amount, token, target, network, and terms
          in plain language — for example, “Fund $70,000 financing” — and every transaction moves
          through explicit states (preparing, awaiting wallet, submitted, confirming, confirmed, or
          failed). Success is shown only after confirmation, with the transaction hash.
        </DocParagraph>
      </DocSection>

      <DocSection id="repayment" title="5. Repayment and position state">
        <DocParagraph>
          Repayment terms are encoded onchain at creation. Each repayment is a transaction submitted
          by the recorded business address; the contract validates it against the current
          outstanding balance, pulls the amount from the business, and pushes it straight to the
          financier in the same transaction. The first valid repayment moves the position to{" "}
          <Code>Repaying</Code>; the repayment that brings the outstanding balance to exactly zero
          completes it automatically — completion is never a separate callable action.
        </DocParagraph>
        <CodeBlock
          caption="Accounting invariant, enforced by the contract"
          code="outstanding_balance = repayment_obligation − amount_repaid"
        />
        <DocParagraph>
          Over-repayment reverts outright with no partial cap, zero amounts revert, and repayments
          from any address other than the recorded business revert. This is programmable repayment
          tracking and execution: the contract validates every repayment it receives. It is not
          autonomous revenue collection — each repayment transaction is submitted manually (or, in
          demos, through a clearly labeled simulated trigger that still submits a real validated
          transaction), because no payment-rail integration exists that could detect real-world
          revenue and repay without human submission.
        </DocParagraph>
      </DocSection>

      <DocSection id="states" title="Position states at a glance">
        <DocTable>
          <thead>
            <tr>
              <DocTh>State</DocTh>
              <DocTh>Meaning</DocTh>
              <DocTh>Reached by</DocTh>
            </tr>
          </thead>
          <tbody>
            <tr>
              <DocTd>Created</DocTd>
              <DocTd>Terms recorded onchain, not yet funded</DocTd>
              <DocTd>Create transaction</DocTd>
            </tr>
            <tr>
              <DocTd>Funded</DocTd>
              <DocTd>Financier funded exactly the principal</DocTd>
              <DocTd>Fund transaction</DocTd>
            </tr>
            <tr>
              <DocTd>Repaying</DocTd>
              <DocTd>At least one repayment recorded, obligation unsatisfied</DocTd>
              <DocTd>First valid repayment transaction</DocTd>
            </tr>
            <tr>
              <DocTd>Completed</DocTd>
              <DocTd>Outstanding balance is zero</DocTd>
              <DocTd>The qualifying repayment itself, automatically</DocTd>
            </tr>
          </tbody>
        </DocTable>
        <Callout tone="note" title="No default, cancel, or active states">
          <p>
            Duration is informational only in this version: it is displayed, never enforced onchain,
            and triggers no default or state change. There is no cancellation path and no admin
            override — the four states above are the complete state machine.
          </p>
        </Callout>
      </DocSection>

      <RelatedDocs
        links={[
          { href: "/docs/architecture", label: "Architecture" },
          { href: "/docs/monad", label: "Monad Integration" },
          { href: "/docs/ai-assessment", label: "AI Assessment" },
        ]}
      />
    </>
  );
}
