# KOBY — ARCHITECTURE

Source of truth order: AGENTS.md → docs/PRD.md → this document. Where anything here appears to conflict with either, AGENTS.md wins, then PRD.md, and this document should be corrected.

This document defines HOW Koby is built. It does not add new product requirements beyond what PRD.md defines.

---

## 1. SYSTEM OVERVIEW

Koby has eight architectural layers:

- **Frontend** — Next.js UI. Presents financing state, collects business input, drives wallet interactions. Never a source of truth for financial state.
- **Application / API layer** — server-side orchestration between the frontend, AI, Nansen, and the contract read/write paths. Owns request validation and secret handling.
- **AI analysis layer** — produces a structured `RiskAssessment` from approved inputs. Analysis only; no fund control.
- **External data layer** — Nansen (and any other approved external data provider), isolated behind a service boundary.
- **Indexing layer** — ENVIO (or equivalent), consumes contract events and produces normalized, queryable history.
- **Wallet layer** — wallet connection and transaction signing, optionally via Privy, abstracted so the rest of the app doesn't depend on a specific provider.
- **Smart-contract layer** — the financing state machine and its accounting. The source of truth for critical financial state.
- **Monad network** — the execution and settlement layer the contracts run on.

```
User
  ↓
Koby Frontend
  ↓
Application Services
  ├── AI Assessment Service
  ├── Nansen Service
  └── Financing Service (reads/writes contract state)
  ↓
Wallet / Transaction Layer
  ↓
Koby Smart Contracts
  ↓
Monad
  ↓
Events
  ↓
ENVIO / Indexer
  ↓
Normalized Data
  ↓
Koby UI
```

Not every layer needs a fully separate deployed service for the MVP — e.g. the AI and Nansen services can be route handlers inside the same Next.js app. What matters is that the _boundaries_ between responsibilities are clean, not that each layer is a separate process.

---

## 2. FRONTEND ARCHITECTURE

Next.js App Router, TypeScript.

- **`app/`** — routes only. Each route composes components and calls services; it does not contain business or blockchain logic inline.
- **`components/`** — presentational and reusable UI. No direct contract calls, no direct external API calls.
- **`hooks/`** — stateful React logic (wallet state, transaction state, form state). Hooks call `services/`, they don't implement business rules themselves.
- **`lib/`** — pure, stateless utilities: formatting (currency, basis points), validation, constants, type definitions shared across the app.
- **`services/`** — the boundary to everything external: contract reads/writes, AI requests, Nansen requests, indexer queries. This is the only layer allowed to know about specific providers.

Separation:

- **UI** (`components/`) renders what `hooks/` and `services/` give it.
- **Business logic** (financing rules, eligibility interpretation) lives in `services/` or dedicated `lib/` modules, not in page components.
- **Blockchain logic** (contract ABI calls, transaction construction) lives in `services/` behind a typed interface — components call functions like `fundFinancing(id, amount)`, they don't construct calldata themselves.
- **API logic** (calls to AI/Nansen/indexer) lives in server-side route handlers under `app/api/` or equivalent, called from `services/`.
- **Data fetching** is done through `services/`, never ad hoc `fetch()` calls scattered in components.

Server-side vs client-side: anything requiring a secret (Nansen API key, AI provider key) must run server-side (route handler or server component). Wallet connection, transaction signing, and read-only contract state relevant to the current view can run client-side. Contract writes are always user-initiated from the client via the wallet, never triggered directly by the server.

---

## 3. PRODUCT ROUTES

| Route               | Purpose                             | Primary user | Major data required                                  | Key actions                                 | Onchain interaction                                        |
| ------------------- | ----------------------------------- | ------------ | ---------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| `/`                 | Explain Koby, drive connection      | Both         | None                                                 | Connect                                     | No                                                         |
| `/dashboard`        | Business's own financing state      | Business     | Business's financing positions, cash-flow assessment | View position, start new request            | Read                                                       |
| `/marketplace`      | Browse financing opportunities      | Financier    | List of open financing positions                     | Open detail, fund                           | Read                                                       |
| `/financing/create` | Submit business info, receive terms | Business     | Business/revenue input, resulting assessment         | Submit info, accept terms                   | Read (assessment), Write (create financing, per Section 5) |
| `/financing/[id]`   | Full state of one position          | Both         | Position detail, history                             | Fund (financier) / repay-trigger (business) | Read + Write                                               |
| `/activity`         | Transaction/repayment history       | Both         | Indexed events for the user's positions              | View history                                | Read (indexed)                                             |

No routes exist outside this set for the MVP. Anything not traceable to a PRD.md user journey (Sections 7–8) does not get a route.

---

## 4. DATA OWNERSHIP

**Onchain source of truth (contract-owned):**

- Financing state (status)
- Principal / financing amount
- Repayment obligation
- Amount repaid
- Outstanding balance
- Financier address
- Business address
- Relevant timestamps (created, funded, completed)
- Completion state

These are financial facts that determine real obligations between two parties; they must be tamper-evident and independently verifiable, which only the contract can guarantee.

**Offchain / application data:**

- Business profile metadata (name, description, contact info)
- UI preferences
- Descriptive/free-text business information submitted for assessment
- AI assessment records (the `RiskAssessment` output and its inputs, stored for display/audit)
- External analytics results (Nansen-derived signals)
- Cached/indexed data (ENVIO's normalized view of onchain events, used for fast reads)

This data is descriptive or derived, not a financial obligation in itself — it informs decisions but doesn't need contract-level enforcement, and storing it onchain would be wasteful (AGENTS.md section 18: avoid storing unnecessary data onchain).

**Constraint:** the frontend reads offchain data for display and context, but any number that represents an actual financial obligation (amount repaid, outstanding balance, etc.) displayed to the user must ultimately trace back to a contract read or an indexed contract event — never to a locally computed or cached value treated as authoritative.

---

## 5. SMART CONTRACT ARCHITECTURE

**Responsibilities:**

- **Creation** — record a financing opportunity's terms (principal, repayment obligation, duration, business, initially no financier). Per PRD.md Section 10, any connected wallet may submit Create specifying any business address (open creator); the contract records the specified business as-is.
- **Funding** — per PRD.md Section 14, a single atomic settlement transaction pulls the financing token from the financier and pushes it straight to the business; the contract never holds funding balances and there is no separate escrow-release or claim step. The contract records the financier.
- **Repayment** — per PRD.md Section 11, each validated repayment pulls the repayment token from the business and pushes it straight to the recorded financier in the same transaction; the contract never holds repayment balances. Amount repaid increases, validated against the outstanding balance; over-repayment is rejected.
- **Completion** — entered automatically in the same repayment transaction that brings outstanding to exactly zero; never separately callable (per PRD.md Section 10).
- **Access control** — any connected wallet may submit Create specifying any business address (open creator per PRD.md Section 10); only a funding transaction matching exactly the principal can move a position from `Created` to `Funded` and records the single financier; only the recorded business can submit repayments for its position; approvals are exact-amount per action with no permit; no other address can change financing state.
- **Accounting** — all balances are stored and computed in integer base units (Section 6).

**State machine decision for the MVP:**

```
Created
  ↓
Funded
  ↓
Repaying
  ↓
Completed
```

This resolves the ambiguity left open in PRD.md Section 10. Rationale:

- `Active` is merged into `Funded` — funding a position and it becoming eligible for repayment are the same event for the MVP; there's no separate "activation" step with distinct business meaning yet. If a future version needs a delay between funding and repayment eligibility, `Active` can be reintroduced as a distinct state then.
- `Repaying` is retained as a distinct state (rather than merging into `Funded`) because it is a meaningfully different phase for both users — it's the difference between "money moved once" and "an obligation is actively being worked down" — and financier-facing UI (PRD.md Section 8) needs to distinguish funded-but-not-yet-repaying from actively repaying.
- `Defaulted` and `Cancelled` are **not** included in the MVP state machine. Nothing in PRD.md Section 10 defines what triggers a default (e.g. a deadline the contract can independently verify) or a cancellation policy (e.g. who can cancel, before what point, with what consequence to escrowed funds). Adding either without those rules defined would mean inventing product behavior inside the architecture doc, which AGENTS.md Sections 11 and 17 reserve for PRD-level decisions. If default/cancellation handling is wanted, that belongs in a PRD update first.

Valid transitions: `Created → Funded` (single funding matching exactly the principal), `Funded → Repaying` (on the first valid repayment only), `Repaying → Repaying` (further valid repayments), `Repaying → Completed` (in the same repayment transaction that brings outstanding to exactly zero). Overpayment reverts outright and zero amounts revert. No other transitions are valid; the contract must reject any call that would produce a different transition.

**Contract count:** a single financing contract (or a factory + minimal-proxy pattern for gas efficiency, if position volume in the demo warrants it) is sufficient for the MVP. Nothing in the PRD requires a second contract (no separate token, no governance, no vault distinct from the financing logic itself). If a factory pattern is used, that is an implementation detail for gas/deployment efficiency, not a second product-level contract.

---

## 6. FINANCIAL ACCOUNTING ARCHITECTURE

All monetary values are represented in integer base units:

- Stablecoin amounts (USDC) → token base units at a fixed verified constant (6 decimals)
- MON → wei
- Percentages/rates → basis points

**MVP asset (per PRD.md Section 14):** a single testnet USDC bound once as an immutable constructor parameter to the re-verified address; no other token accepted; decimals fixed, never read per-use in the MVP.

Represented values:

- **Principal** — the financing amount, fixed at creation.
- **Repayment obligation** — the total amount owed, fixed at creation (or at funding, per implementation).
- **Amount repaid** — cumulative sum of valid repayment transactions, monotonically increasing.
- **Outstanding balance** — computed, never stored independently in a way that can drift: `outstanding balance = repayment obligation − amount repaid`.

**Invariant:** outstanding balance must always equal repayment obligation minus amount repaid, and amount repaid must never exceed repayment obligation. The contract enforces this by rejecting any repayment transaction that would push amount repaid above repayment obligation.

**Explicitly prevented:**

- Floating-point arithmetic anywhere in settlement or repayment logic (frontend or contract).
- Rounding ambiguity — all conversions between display units and base units happen at the UI boundary only, never inside accounting logic.
- Double repayment — enforced by the contract validating against outstanding balance, not by frontend state.
- Repayment above outstanding balance — rejected at the contract level.
- Unauthorized accounting changes — only the contract's repayment function, called by an authorized address, can change amount repaid; there is no admin override path for financial state in the MVP.

The frontend may compute a _display_ estimate (e.g. "this is roughly what you'll owe") but never presents a frontend-computed number as the authoritative outstanding balance — that value is always read from the contract or the indexer's normalized view of contract state.

---

## 7. MONAD ARCHITECTURE

Monad executes the core financial operations directly — it is not a deployment target for a system whose real state lives elsewhere.

**Operations that execute on Monad (per PRD.md Section 14):** create financing, fund financing, record repayment, and financing completion (a state transition triggered by the qualifying repayment transaction, not a separate manual step). Exactly which of these are separate transactions versus combined into fewer contract calls is a SECURITY.md/implementation decision; the product requirement is that funding and repayment are real onchain transactions, not database writes.

```
Frontend
  ↓
Wallet
  ↓
Transaction
  ↓
Monad
  ↓
Smart Contract
  ↓
Event
  ↓
Indexer
  ↓
Koby UI
```

No RPC URLs, chain IDs, or contract addresses are defined here — those are live configuration values and belong in `docs/MONAD.md`, verified against the actual deployment, not invented in this architecture document.

---

## 8. TRANSACTION ARCHITECTURE

Transaction lifecycle: `idle → preparing → awaiting_wallet → submitted → confirming → confirmed → failed`.

- `idle` — no transaction in progress.
- `preparing` — the app is constructing calldata/parameters (e.g. converting a display amount to base units).
- `awaiting_wallet` — a signature request has been sent to the wallet; waiting on the user.
- `submitted` — the user signed; the transaction has been broadcast, hash is known.
- `confirming` — the transaction is included but not yet at the confirmation depth the app requires.
- `confirmed` — the transaction has reached the required confirmation depth; only now can the UI show success.
- `failed` — the transaction was rejected (by the wallet, the contract, or the network); the UI shows the failure reason.

Internal representation (conceptual, not a code spec):

```
Transaction {
  state: idle | preparing | awaiting_wallet | submitted | confirming | confirmed | failed
  hash: string | null
  failureReason: string | null
  createdAt: timestamp
}
```

Rules: the hash is preserved and shown as soon as it's known (at `submitted`), even before confirmation. No hash, confirmation, or balance is ever fabricated — if a value isn't available yet, the UI shows the corresponding loading/unavailable state (Section 16), not a placeholder that looks real.

---

## 9. WALLET ARCHITECTURE

```
Koby application
  ↓
Wallet abstraction (services/wallet)
  ↓
Privy / supported wallet provider
  ↓
Monad
```

The wallet abstraction exposes a provider-agnostic interface to the rest of the app (`connect()`, `getAddress()`, `signAndSend(tx)`). Privy is the MVP provider behind that interface for connection and signing only (docs/HACKATHON.md Section 14 — chosen over Mera for demo reliability), but the interface stays provider-agnostic on purpose: this keeps Privy an integration layer (AGENTS.md section 7), not a dependency baked into the product's core model, so swapping providers later would not require touching `components/` or `hooks/` beyond the abstraction itself. Privy creates no separate account layer; Koby remains an open page with wallet as the only sign-in per PRD.md Section 16 and SECURITY.md Section 11.

Before any transaction is requested from the wallet, the UI must present: the action, amount, token, target, network, and relevant financing terms (AGENTS.md section 28, PRD.md Section 19). This requirement lives in the transaction-confirmation UI component, not in the wallet abstraction itself, so it applies regardless of which wallet provider is behind the abstraction.

---

## 10. NANSEN ARCHITECTURE

```
Business Wallet
  ↓
Nansen Service (services/nansen, server-side)
  ↓
Normalized Onchain Activity
  ↓
Cash-Flow Signals
  ↓
AI Assessment
```

`services/nansen` is the only place Nansen's API is called from. No UI component calls Nansen directly. The service returns normalized, typed data — not raw provider responses — to the rest of the application.

Distinguish at every stage:

- **Observed data** — what Nansen actually reported (e.g. transaction counts, balance history).
- **Derived signal** — what Koby computed from that observation (e.g. "activity has been consistent over N months").
- **AI interpretation** — what the AI concluded from the signal, as part of the `RiskAssessment`.
- **Financing assessment** — what the product ultimately shows the user, which must trace back through the above, not skip straight from "Nansen said X" to "therefore financing amount is Y."

Nansen is an analytical input; it is never treated as financing state and never written to the contract directly. Per PRD.md Section 13, the MVP uses live Nansen for a small defined signal set; exact signals and endpoints are finalized during implementation verification with current bounty and API/MCP requirements re-verified. No Nansen endpoints or credentials are defined here — those belong in implementation-specific configuration, kept server-side (Section 22).

---

## 11. AI ARCHITECTURE

```
Approved Inputs (business-submitted data + Nansen-derived signals)
  ↓
AI Analysis Service (server-side)
  ↓
Validated Structured Output
  ↓
Application
  ↓
Human-readable Risk Assessment (shown to user)
```

Structured output (per AGENTS.md section 22 / PRD.md Section 12):

```ts
type RiskAssessment = {
  score: number;
  confidence: number;
  factors: string[];
  recommendation: string;
};
```

- **Input validation** — only approved, structured inputs (business-submitted fields, Nansen-derived signals) are passed to the AI service; free-form text intended for display is not passed in a way that could be interpreted as an instruction to the model.
- **Output validation** — the AI service's response is parsed and type-checked against `RiskAssessment` before use; a response that fails validation is treated as an assessment failure (Section 18), not silently accepted or guessed at.
- **Confidence handling** — the `confidence` value is always shown alongside the `score`/`recommendation`; the UI never presents an assessment as more certain than the model reported.
- **Hallucination protection** — the AI service does not have access to write any contract state, so a hallucinated output can produce a bad _recommendation_ but not a bad _transaction_; the human (business or financier) still takes the action.
- **Prompt injection considerations** — any business-submitted free text that is included in the AI prompt is treated as untrusted content, not as instructions; the service's system-level instructions to the model are fixed and not overridable by business input.

The AI service has no write access to the smart contract, the wallet, or any funds-moving path, under any circumstance.

---

## 12. ENVIO / INDEXING ARCHITECTURE

```
Smart Contract
  ↓
Events
  ↓
ENVIO / Indexer
  ↓
Normalized Indexed Data
  ↓
Application
  ↓
Frontend
```

Candidate events, retained only if the final contract design actually emits them: `FinancingCreated`, `FinancingFunded`, `RepaymentRecorded`, `FinancingCompleted`. `LiquiditySettled` and `FinancingDefaulted` are dropped from the MVP indexing set, consistent with the state-machine decision in Section 5 (no default state, and funding/settlement is a single event rather than two).

What each retained event allows the application to reconstruct:

- `FinancingCreated` — the position's initial terms and existence, for marketplace listings.
- `FinancingFunded` — who funded it and when, for the funded-position view and business dashboard.
- `RepaymentRecorded` — a chronological repayment history and running amount-repaid total, for the activity feed.
- `FinancingCompleted` — the position's completion, for both dashboards and the marketplace.

The indexer is a read-optimization layer, not a second source of truth — if indexed data and a direct contract read ever disagree, the contract read wins, and this should be treated as an indexer staleness/sync issue (Section 17), not resolved by trusting the indexer. Per PRD.md Section 15, ENVIO is the MVP indexing layer for history and list views with direct contract reads for actionable state and labeled staleness plus direct-read fallback.

---

## 13. REPAYMENT ARCHITECTURE

```
Financing Agreement
  ↓
Repayment Terms Encoded Onchain
  ↓
Repayment Transaction / Trigger
  ↓
Smart Contract Validation
  ↓
Amount Repaid Updated
  ↓
Outstanding Balance Updated
  ↓
Completion When Conditions Are Met
```

The "Repayment Transaction / Trigger" in the MVP is a transaction the business (or an authorized address acting on the business's behalf) submits manually or via a simulated/demo trigger — it is not detected or initiated by Koby autonomously from real-world revenue. This is programmable repayment tracking and execution, not autonomous real-world revenue collection (AGENTS.md section 25, PRD.md Section 11), and no part of this architecture should be read as implying otherwise.

A future version could connect real payment rails (e.g. a payment processor webhook that constructs and submits the repayment transaction), an oracle, or scheduled execution to make the trigger itself autonomous — that is future architecture (Section 25), not part of the MVP's repayment path.

---

## 14. DATA FLOW

**A. Business onboarding**
Input: wallet connection + profile fields → Processing: wallet abstraction connects, profile saved via application service → Source of truth: offchain (business profile) → Output: business profile associated with a wallet address.

**B. Cash-flow analysis**
Input: business-submitted revenue data + Nansen-derived signals → Processing: AI analysis service → Source of truth: AI service output, validated → Output: `RiskAssessment` shown to business.

**C. Financing creation**
Input: `RiskAssessment` (advisory only) + business-proposed, business-accepted terms → Processing: financing service constructs a creation transaction → Source of truth: the resulting onchain `Created` position → Output: a financing opportunity visible in the marketplace.

**D. Financing funding**
Input: financier's funding transaction → Processing: wallet signs, contract validates and records → Source of truth: onchain `Funded` state → Output: position moves to `Funded`, capital reaches the business.

**E. Monad settlement**
Input: the funding transaction itself → Processing: Monad network execution → Source of truth: confirmed transaction + resulting contract state → Output: transaction hash, confirmation, updated contract state.

**F. Repayment**
Input: a repayment transaction (Section 13) → Processing: contract validates against outstanding balance → Source of truth: onchain amount repaid / outstanding balance → Output: updated balances, possible transition to `Completed`.

**G. Financing completion**
Input: a repayment transaction that brings outstanding balance to zero → Processing: contract transitions state → Source of truth: onchain `Completed` state → Output: position marked complete across all views.

**H. Onchain event indexing**
Input: emitted contract events → Processing: ENVIO indexes and normalizes → Source of truth: still the contract; indexer is a read cache → Output: history views (Section 3's `/activity` route, position detail history).

---

## 15. EXTERNAL SERVICE ABSTRACTION

Services: Nansen, AI provider, ENVIO, Privy, RPC provider. Each lives behind its own module under `services/` (`services/nansen`, `services/ai`, `services/indexer`, `services/wallet`, `services/rpc` or equivalent), with a typed interface consumed by the rest of the app. No component or route handler calls a provider's SDK or REST API directly.

This means replacing, say, the RPC provider or swapping Nansen for another data source should require changes only inside that one service module, not across the app. Secrets required by a service (API keys) stay server-side inside that service's server-only code path — never shipped to the client, never referenced in `NEXT_PUBLIC_*` configuration (Section 22).

---

## 16. DEMO RELIABILITY ARCHITECTURE

Non-critical external services (Nansen, potentially parts of the AI service) may fail during the demo without breaking it:

```
Nansen unavailable
  ↓
Use clearly labeled demo/testnet data
  ↓
Continue financing demonstration
```

Critical financial operations do not get this fallback:

```
Monad transaction failure
  ↓
Show actual failure (failed state, Section 8)
  ↓
Do not fabricate success
```

The application distinguishes, in both data and UI labeling, between: **REAL** (actual onchain state), **SIMULATED** (fictional demo business/receivables, per PRD.md Section 21), **MOCK** (placeholder data used only when nothing else is available), **TESTNET** (real transactions on a test network, not mainnet), and **UNAVAILABLE** (a service didn't respond — shown as unavailable, never silently replaced with something that looks like real data).

---

## 17. SECURITY ARCHITECTURE

Full technical specification belongs in `docs/SECURITY.md`; this section states the boundaries only.

**Frontend:** validate all user input before sending to services; never construct a financial transaction from unvalidated amounts; wallet interactions always show transaction details before signing (Section 9); no secrets in client-side code or `NEXT_PUBLIC_*` variables.

**Backend/services:** API keys server-side only; every service module validates its own inputs and outputs; rate limits respected/handled for external providers.

**Smart contracts:** accounting invariant (Section 6) enforced on every write; access control on every state-changing function; standard reentrancy protection on any function moving funds; no unauthorized withdrawal path; state transitions restricted to the valid set (Section 5).

**AI:** treated as untrusted-output-generating (Section 11) — no direct fund control, no direct contract writes, output always validated.

**Indexing:** the indexer is not authoritative (Section 12); the application must be able to detect and handle a stale or desynced indexer rather than presenting stale data as current.

---

## 18. ERROR ARCHITECTURE

Categories: wallet rejected transaction; contract rejected transaction; insufficient balance; invalid financing state (e.g. attempting to fund an already-funded position); external API unavailable (Nansen); AI assessment unavailable; indexer unavailable; network/RPC failure.

Each category maps to a specific, plain-language user-facing message (PRD.md Section 20 gives the pattern: what was attempted, what happened, what the consequence was). Raw provider/contract revert strings are logged for debugging but are not the primary message shown to the user.

---

## 19. PERFORMANCE ARCHITECTURE

- **Blockchain reads** — minimize direct RPC calls for historical data; use indexed data (Section 12) for history and lists, direct contract reads only for the current state of a specific position the user is actively viewing.
- **Caching** — offchain/derived data (Section 4) can be cached; financial state shown as "current" is either freshly read or clearly timestamped if from cache.
- **API calls** — Nansen/AI calls happen server-side and are not re-triggered unnecessarily on every render.
- **Server/client boundaries** — data fetching and secret-requiring calls happen server-side (Section 2); client-side work is limited to wallet interaction and presentation.
- **Rerenders** — transaction and wallet state changes should not cascade into unrelated component re-renders; keep that state scoped to the components that need it.
- **Large assets / dependencies** — avoid unnecessary heavy client libraries, especially anything duplicating wallet/RPC functionality already provided by the chosen wallet/RPC stack.

No premature optimization — this section defines defaults, not a target to over-engineer against before the MVP works end to end.

---

## 20. MOBILE ARCHITECTURE

Dashboard, marketplace, financing detail, financing creation, transaction confirmation, repayment history, and any tables all need a defined mobile layout — not just a desktop layout that happens to shrink. Financial tables in particular need an intentional responsive pattern (e.g. stacked cards on narrow viewports) rather than relying on horizontal scroll as the only strategy (AGENTS.md section 43). Wallet connection and transaction confirmation flows must work within a mobile wallet's in-app browser context where applicable.

---

## 21. REPOSITORY ARCHITECTURE

```
app/          — routes only (Section 2, Section 3)
components/   — presentational/reusable UI
contracts/    — Foundry project: contracts, tests, deployment scripts
lib/          — pure utilities, types, constants
services/     — external boundaries: contract calls, AI, Nansen, indexer, wallet, RPC
hooks/        — stateful React logic
public/       — static assets
docs/         — PRD, ARCHITECTURE, DESIGN (presentation-only, below ARCHITECTURE.md), MONAD, AI, SECURITY, USER_FLOW, HACKATHON
```

No additional top-level directories are introduced unless a specific, justified need arises (AGENTS.md section 12) — this document does not add any beyond what AGENTS.md already lists.

---

## 22. ENVIRONMENT / CONFIGURATION

Categories, not values:

- **`NEXT_PUBLIC_*`** — safe-to-expose client config only (e.g. public chain name, public contract address once deployed — an address is not a secret, but it is still a real deployment value that belongs in `.env`, not hardcoded).
- **RPC configuration** — server-side by default; a public RPC endpoint may be exposed client-side only if the chosen wallet architecture requires it.
- **AI provider configuration** — API key, server-only.
- **Nansen configuration** — API key, server-only.
- **ENVIO configuration** — indexer endpoint/config; public if the indexer is meant to be queried client-side, server-only if proxied.
- **Privy configuration** — app ID is typically public (client-side), any server-side verification secret is server-only.

No actual keys, URLs, chain IDs, or addresses are defined in this document — `.env.example` documents the required variable names only, and real values are never committed.

---

## 23. TESTING ARCHITECTURE

- **Smart contracts** — Foundry. Happy path (create → fund → repay → complete), failure path (unauthorized caller, invalid amount, invalid state, double repayment, already completed), and security path (reentrancy, access-control bypass, accounting manipulation) per AGENTS.md section 42.
- **Frontend** — component/route/flow tests where appropriate, focused on the financing flow and transaction-state handling rather than exhaustive UI coverage for a hackathon timeline.
- **Integration** — the minimum critical path that must be exercised before the demo is trusted: `Create → Fund → Repay → Complete`, wallet through Monad through event/indexer through UI, end to end.

Tests are never reported as passing unless they actually ran (AGENTS.md section 42).

---

## 24. ARCHITECTURAL DECISIONS

- **Why Monad?** Financing settlement and repayment are the actual financial events being verified; Monad gives fast, low-cost, programmable execution for those events rather than Koby merely deploying a contract nobody's flow depends on.
- **Why smart contracts?** Financial obligations between two independent parties (business, financier) need tamper-evident, independently verifiable state — a private database can't provide that trust property.
- **Why indexed events?** History and list views (marketplace, activity feed) need fast, queryable access to past state without repeatedly re-reading and reconstructing it from raw contract calls.
- **Why service abstractions?** Every external dependency (Nansen, AI provider, wallet provider, RPC) is a hackathon-timeline risk of downtime or API change; isolating them limits the blast radius of any one provider issue and keeps secrets out of the client.
- **Why is AI separated from financial execution?** AI models can be wrong or manipulated; financial execution must be deterministic and auditable, so AI can inform a decision but must never make one unilaterally.
- **Why is Nansen an input rather than a source of truth?** Nansen observes onchain activity; it doesn't know the business's actual obligations or intent — treating its output as a derived signal, not a fact, prevents a bad or incomplete data point from silently becoming an incorrect financial conclusion.
- **Why are sponsor integrations optional/conditional?** AGENTS.md section 10/49 — Koby's core value doesn't depend on any one sponsor tool; each is included only where it has real product utility, not to check a bounty box.
- **Why is MVP repayment programmable rather than claimed autonomous?** No real payment-rail or revenue-detection mechanism exists yet; claiming autonomy the product doesn't have would misrepresent both to judges and to future users (AGENTS.md section 23/25).

---

## 25. MVP ARCHITECTURE VS FUTURE ARCHITECTURE

**MVP (this document):** create → fund → repay (manually/demo-triggered) → complete, on a single financing contract, with AI as an analysis layer, Nansen as an optional signal source, ENVIO for event history, and Privy (or equivalent) for onboarding friction reduction.

**Future possibilities (explicitly not part of the MVP):**

- Real payment-rail integrations that construct/submit repayment transactions from actual business revenue
- Autonomous revenue-triggered repayment (Section 13)
- Additional data providers beyond Nansen
- Chainlink integrations, if a genuine requirement emerges (external data, automation, cross-chain)
- Additional financing primitives (e.g. tranches, secondary market for financing positions)
- Cross-chain functionality, only if a genuine need is identified

None of these are referenced elsewhere in this document as if they already exist.

---

## 26. ARCHITECTURAL CONSTRAINTS

- Monad must perform genuine financial execution, not merely host a deployed contract.
- Smart contracts own critical financial state (Section 4, Section 5).
- Frontend cannot fabricate financial state (Section 4, Section 6).
- AI cannot control funds (Section 11).
- Nansen is an analytical input, not a source of truth (Section 10).
- ENVIO/indexing is a data access layer, not authoritative (Section 12).
- Privy is an onboarding/wallet layer, not a core product dependency (Section 9).
- External services are isolated behind service boundaries (Section 15).
- Financial calculations use deterministic integer accounting (Section 6).
- No fake transaction hashes.
- No fake confirmations.
- No fake balances.
- No fake contract addresses.
- No feature theatre (AGENTS.md section 49).
- No unnecessary architecture complexity.

---

## FINAL VALIDATION NOTES

- Checked against AGENTS.md and PRD.md; no contradictions found. Where PRD.md left the state machine open (its Section 10), this document resolves it (Section 5 here) in a way consistent with AGENTS.md's "only implement states actually required" instruction.
- No new product requirements were introduced — the state-machine resolution, event set, and route list are all implementations of decisions PRD.md already made or explicitly deferred to architecture.
- Future integrations (Section 25) are kept clearly separate from MVP scope throughout.
- Repayment is described as programmable tracking/execution, never autonomous real-world revenue collection (Section 13).
- Monad is treated as a genuine execution layer for create/fund/repay/complete (Section 7), not a deployment target.
- No RPC URLs, chain IDs, contract addresses, or sponsor API credentials were invented anywhere in this document.
