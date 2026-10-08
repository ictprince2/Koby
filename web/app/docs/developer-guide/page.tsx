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
  title: "Developer Guide — Koby Docs",
  description:
    "Run Koby locally: prerequisites, install, environment variables, tests, repository structure, and safe deployment configuration.",
};

export default function DocsDeveloperGuidePage() {
  return (
    <>
      <DocHeader
        eyebrow="Documentation · Developer Guide"
        title="Developer guide"
        intro="Everything needed to run Koby locally and configure a deployment safely. Commands below are the project's actual scripts and workflows — nothing invented."
      />

      <DocSection id="prerequisites" title="Prerequisites">
        <DocParagraph>
          Node.js with npm for the web application (the repository ships a{" "}
          <Code>package-lock.json</Code>), and Foundry for the smart contracts and their tests. A
          development wallet with Monad Testnet configured, plus testnet MON for gas and testnet
          USDC for financing amounts, is needed for any onchain exercise.
        </DocParagraph>
      </DocSection>

      <DocSection id="install" title="Installing dependencies">
        <CodeBlock
          caption="Web application"
          code={["cd web", "npm install", "npm run dev"].join("\n")}
        />
        <DocParagraph>
          Available web scripts are <Code>dev</Code> (local development server),{" "}
          <Code>build</Code> (production build), <Code>start</Code> (serve the production build),
          and <Code>lint</Code> (ESLint). There is no web test script; contract tests run under
          Foundry from the repository root.
        </DocParagraph>
        <CodeBlock caption="Contracts" code={["forge build", "forge test"].join("\n")} />
      </DocSection>

      <DocSection id="environment" title="Environment variables">
        <DocParagraph>
          Public client configuration uses <Code>NEXT_PUBLIC_*</Code> names; everything secret stays
          server-only and is never prefixed with <Code>NEXT_PUBLIC_</Code>. Values below are
          placeholders — copy <Code>web/.env.example</Code>, which documents every name with no real
          values, and never commit populated files.
        </DocParagraph>
        <DocTable>
          <thead>
            <tr>
              <DocTh>Variable</DocTh>
              <DocTh>Scope</DocTh>
              <DocTh>Placeholder</DocTh>
            </tr>
          </thead>
          <tbody>
            <tr>
              <DocTd mono>NEXT_PUBLIC_CHAIN_NAME</DocTd>
              <DocTd>Public</DocTd>
              <DocTd mono>empty (default: Monad Testnet)</DocTd>
            </tr>
            <tr>
              <DocTd mono>NEXT_PUBLIC_CHAIN_ID</DocTd>
              <DocTd>Public</DocTd>
              <DocTd mono>empty (default: 10143)</DocTd>
            </tr>
            <tr>
              <DocTd mono>NEXT_PUBLIC_RPC_URL</DocTd>
              <DocTd>Public</DocTd>
              <DocTd mono>empty (default: testnet RPC)</DocTd>
            </tr>
            <tr>
              <DocTd mono>NEXT_PUBLIC_CONTRACT_ADDRESS</DocTd>
              <DocTd>Public</DocTd>
              <DocTd mono>empty until deployed</DocTd>
            </tr>
            <tr>
              <DocTd mono>NEXT_PUBLIC_EXPLORER_URL</DocTd>
              <DocTd>Public</DocTd>
              <DocTd mono>empty (default: MonadVision testnet)</DocTd>
            </tr>
            <tr>
              <DocTd mono>NEXT_PUBLIC_USDC_ADDRESS</DocTd>
              <DocTd>Public</DocTd>
              <DocTd mono>empty (default: verified testnet USDC; local testing only)</DocTd>
            </tr>
            <tr>
              <DocTd mono>NEXT_PUBLIC_PRIVY_APP_ID</DocTd>
              <DocTd>Public</DocTd>
              <DocTd mono>empty (Privy onboarding disabled; injected wallets still work)</DocTd>
            </tr>
            <tr>
              <DocTd mono>KIMI_API_KEY / OPENROUTER_API_KEY</DocTd>
              <DocTd>Server-only</DocTd>
              <DocTd mono>empty (deterministic Demo fallback served)</DocTd>
            </tr>
            <tr>
              <DocTd mono>KIMI_MODEL / OPENROUTER_MODEL / KIMI_BASE_URL</DocTd>
              <DocTd>Server-only</DocTd>
              <DocTd mono>documented defaults; OpenRouter model must be set explicitly</DocTd>
            </tr>
          </tbody>
        </DocTable>
        <Callout tone="caution" title="Never commit secrets">
          <p>
            <Code>.env</Code>, <Code>.env.local</Code>, private keys, seed phrases, and API keys are
            never committed. An address is deployment configuration, not a secret — but it still
            belongs in the environment, never hardcoded.
          </p>
        </Callout>
      </DocSection>

      <DocSection id="running" title="Running the application locally">
        <DocParagraph>
          With dependencies installed and environment in place, <Code>npm run dev</Code> inside{" "}
          <Code>web/</Code> starts the application: landing page, dashboard, marketplace, financing
          creation and detail, activity history, and this documentation. Without a configured
          contract address the financing flows show their honest not-deployed state; reads and
          history activate once <Code>NEXT_PUBLIC_CONTRACT_ADDRESS</Code> points at a deployment.
          Verify behavior with <Code>tsc</Code>-backed builds (<Code>npm run build</Code>) and{" "}
          <Code>npm run lint</Code> before submitting changes.
        </DocParagraph>
      </DocSection>

      <DocSection id="tests" title="Running relevant tests">
        <DocParagraph>
          Contract behavior — create, fund, repay, completion, unauthorized callers, invalid
          amounts, invalid states, over- and double repayment, and access-control bypass — is
          covered by Foundry tests in <Code>test/KobyFinancing.t.sol</Code> and run with{" "}
          <Code>forge test</Code> from the repository root. Do not proceed to deployment with
          failing tests, and never report tests as passing unless they actually ran.
        </DocParagraph>
      </DocSection>

      <DocSection id="structure" title="Repository structure">
        <CodeBlock
          caption="Top-level layout"
          code={[
            "AGENTS.md            Project source of truth",
            "docs/                Canonical internal docs (PRD, architecture, Monad, AI, ...)",
            "web/                 Next.js application",
            "  app/               Routes, including app/docs/* (this documentation)",
            "  components/        Reusable UI (layout, docs, financing, wallet, ...)",
            "  hooks/             Wallet and transaction state",
            "  lib/               Pure utilities, types, network constants",
            "  services/          External boundaries (chain, AI providers)",
            "src/                 Financing contracts (KobyFinancing.sol)",
            "test/                Foundry contract tests",
            "script/              Deployment scripts (Deploy.s.sol)",
          ].join("\n")}
        />
        <DocParagraph>
          Route components compose UI and call services; business and blockchain logic lives in{" "}
          <Code>services/</Code> and <Code>lib/</Code>, never inline in pages. The canonical
          internal documents in <Code>docs/</Code> remain the planning source of truth and are
          intentionally separate from this public-facing documentation.
        </DocParagraph>
      </DocSection>

      <DocSection id="deployment" title="Configuring a deployment safely">
        <DocParagraph>
          A deployment already exists on Monad Testnet (see “Monad Integration” for the
          address and verification); run records live in{" "}
          <Code>broadcast/Deploy.s.sol/10143/</Code>. A fresh deployment is only needed
          for a new environment or contract change: re-verify the network values and token
          address first, then compile, pass <Code>forge test</Code>, and broadcast with{" "}
          <Code>script/Deploy.s.sol</Code> — noting that redeploying produces a new contract
          address that must be set as <Code>NEXT_PUBLIC_CONTRACT_ADDRESS</Code> in the
          hosting environment, never in a committed file. Exercise create, fund, repay, and
          completion against the live testnet deployment, confirm each emitted event, and
          check that displayed state matches direct contract reads before demonstrating
          anything.
        </DocParagraph>
      </DocSection>

      <RelatedDocs
        links={[
          { href: "/docs", label: "Overview" },
          { href: "/docs/monad", label: "Monad Integration" },
          { href: "/docs/security", label: "Smart Contracts & Security" },
        ]}
      />
    </>
  );
}
