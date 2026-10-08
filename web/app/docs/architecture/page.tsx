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
  title: "Architecture — Koby Docs",
  description:
    "Koby's actual architecture: Next.js routes, services, AI provider integration, wallet abstraction, contract interactions, and event handling.",
};

export default function DocsArchitecturePage() {
  return (
    <>
      <DocHeader
        eyebrow="Documentation · Architecture"
        title="Architecture"
        intro="Eight layers with clean boundaries: the frontend presents, services orchestrate, the contract enforces, and Monad executes. What follows matches the implementation — no invented services or data flows."
      />

      <DocSection id="layers" title="System layers">
        <CodeBlock
          caption="Request and settlement paths"
          code={[
            "User",
            "  → Koby frontend (Next.js App Router)",
            "  → Application services (financing, AI, wallet)",
            "  → Wallet (signature) → Koby contracts → Monad",
            "  → Contract events → RPC log reads → Koby UI",
            "",
            "AI path (analysis only, never touches funds):",
            "Business input → POST /api/analyze → provider or fallback",
            "  → validated RiskAssessment → UI",
          ].join("\n")}
        />
        <DocParagraph>
          Layers that are planned but not yet built keep their boundaries reserved: the external-data
          layer (Nansen) has no code path yet, and the indexing layer is currently direct RPC log
          reads rather than a dedicated indexer. Reserving the boundary means adding either later
          touches one service module, not the whole app.
        </DocParagraph>
      </DocSection>

      <DocSection id="routes" title="Application routes">
        <DocTable>
          <thead>
            <tr>
              <DocTh>Route</DocTh>
              <DocTh>Purpose</DocTh>
              <DocTh>Onchain interaction</DocTh>
            </tr>
          </thead>
          <tbody>
            <tr>
              <DocTd mono>/</DocTd>
              <DocTd>Explain Koby, drive connection</DocTd>
              <DocTd>None</DocTd>
            </tr>
            <tr>
              <DocTd mono>/dashboard</DocTd>
              <DocTd>Business&apos;s own financing state</DocTd>
              <DocTd>Read</DocTd>
            </tr>
            <tr>
              <DocTd mono>/marketplace</DocTd>
              <DocTd>Browse financing opportunities</DocTd>
              <DocTd>Read</DocTd>
            </tr>
            <tr>
              <DocTd mono>/financing/create</DocTd>
              <DocTd>Submit business info, receive terms</DocTd>
              <DocTd>Read, then write (create)</DocTd>
            </tr>
            <tr>
              <DocTd mono>/financing/[id]</DocTd>
              <DocTd>Full state of one position</DocTd>
              <DocTd>Read + write (fund / repay)</DocTd>
            </tr>
            <tr>
              <DocTd mono>/activity</DocTd>
              <DocTd>Transaction and repayment history</DocTd>
              <DocTd>Read (contract logs)</DocTd>
            </tr>
            <tr>
              <DocTd mono>/docs/*</DocTd>
              <DocTd>This documentation</DocTd>
              <DocTd>None</DocTd>
            </tr>
          </tbody>
        </DocTable>
        <DocParagraph>
          Every route is browsable without a wallet. A wallet connection is required only at the
          point of action — creating, funding, or repaying — and connection alone never authorizes a
          transaction; each transaction needs its own signature.
        </DocParagraph>
      </DocSection>

      <DocSection id="ownership" title="Data ownership">
        <DocParagraph>
          The contract is the source of truth for financial facts: status, principal, repayment
          obligation, amount repaid, outstanding balance, financier and business addresses, and
          timestamps. Everything else is application data — business profile metadata, descriptive
          input, AI assessment records, and cached reads — which informs decisions but is never
          treated as a financial obligation.
        </DocParagraph>
        <DocParagraph>
          The constraint is strict: any number representing an actual obligation that is shown to
          the user must trace back to a contract read or an emitted contract event, never to a
          locally computed value treated as authoritative. The frontend may format a number for
          display, but it never computes validity, balances, or completion.
        </DocParagraph>
      </DocSection>

      <DocSection id="services" title="Services and boundaries">
        <DocParagraph>
          All external access lives behind typed service modules. Components and hooks call
          functions like <Code>fundFinancing</Code> or request an assessment; they never construct
          calldata, call provider SDKs, or hold API keys.
        </DocParagraph>
        <DocTable>
          <thead>
            <tr>
              <DocTh>Module</DocTh>
              <DocTh>Boundary</DocTh>
            </tr>
          </thead>
          <tbody>
            <tr>
              <DocTd mono>services/financing.ts</DocTd>
              <DocTd>The only layer that talks to the chain (viem reads, wallet-submitted writes)</DocTd>
            </tr>
            <tr>
              <DocTd mono>services/ai.ts</DocTd>
              <DocTd>Server-only provider calls (OpenRouter, Kimi); never imported by client code</DocTd>
            </tr>
            <tr>
              <DocTd mono>app/api/analyze/route.ts</DocTd>
              <DocTd>Validation, provider precedence, and fallback for assessments</DocTd>
            </tr>
            <tr>
              <DocTd mono>hooks/useWallet</DocTd>
              <DocTd>Provider-agnostic wallet abstraction (connect, address, sign-and-send)</DocTd>
            </tr>
            <tr>
              <DocTd mono>hooks/useTx</DocTd>
              <DocTd>Transaction lifecycle state from preparing through confirmed or failed</DocTd>
            </tr>
            <tr>
              <DocTd mono>lib/</DocTd>
              <DocTd>Pure utilities: integer-safe formatting, validation, network constants, types</DocTd>
            </tr>
          </tbody>
        </DocTable>
        <Callout tone="note" title="Secrets stay server-side">
          <p>
            AI provider keys live in server-only environment variables and are never exposed through{" "}
            <Code>NEXT_PUBLIC_*</Code> configuration. Only public network values (chain name and ID,
            RPC URL, explorer URL, contract and token addresses) are client-visible — and an address
            is deployment configuration, not a secret.
          </p>
        </Callout>
      </DocSection>

      <DocSection id="wallet" title="Wallet abstraction">
        <DocParagraph>
          The application talks to a provider-agnostic wallet interface — connect, current address,
          and sign-and-send — rather than to any specific wallet SDK. Privy is the primary provider
          for connection and signing friction reduction, active only when its app ID is configured;
          installed EIP-1193 wallets discovered in the browser serve as fallback. Privy creates no
          separate account layer and holds no financial truth: the transaction it produces is an
          ordinary Monad transaction either way.
        </DocParagraph>
      </DocSection>

      <DocSection id="events" title="Onchain state and event handling">
        <DocParagraph>
          Actionable state always comes from direct contract reads (<Code>getPosition</Code>,{" "}
          <Code>positionCount</Code>, <Code>outstanding</Code>). History and listings read the four
          contract events — <Code>FinancingCreated</Code>, <Code>FinancingFunded</Code>,{" "}
          <Code>RepaymentRecorded</Code>, <Code>FinancingCompleted</Code> — directly from RPC logs.
          Reads are chunked into small block ranges to stay under the public RPC&apos;s log-range
          limits, and any log failure surfaces as an honest “activity unavailable” state with a
          direct-read fallback for the position in view. If indexed data and a direct contract read
          ever disagree, the contract read wins.
        </DocParagraph>
      </DocSection>

      <DocSection id="accounting" title="Financial accounting">
        <DocParagraph>
          All monetary values are integers in token base units — 6 decimals for the testnet USDC
          asset — with percentages in basis points where used. There is no floating-point arithmetic
          anywhere in settlement, repayment, or assessment math; unit conversion happens only at the
          UI display boundary, after reading the authoritative base-unit value. The outstanding
          balance is computed, never stored independently: obligation minus amount repaid.
        </DocParagraph>
      </DocSection>

      <RelatedDocs
        links={[
          { href: "/docs/how-it-works", label: "How It Works" },
          { href: "/docs/monad", label: "Monad Integration" },
          { href: "/docs/security", label: "Smart Contracts & Security" },
        ]}
      />
    </>
  );
}
