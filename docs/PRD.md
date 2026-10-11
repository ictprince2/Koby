# KOBY — PRODUCT REQUIREMENTS DOCUMENT

Source of truth: AGENTS.md. Where anything here appears to conflict with AGENTS.md, AGENTS.md wins and this document should be corrected.

---

## 1. PRODUCT OVERVIEW

Koby is a programmable business-financing marketplace. It allows businesses with predictable future receivables to convert a portion of that expected cash flow into immediate liquidity, financed by a counterparty (a financier), with terms, settlement, and repayment tracked onchain on Monad.

**The problem Koby solves:** businesses often have visibility into future revenue but no fast, transparent way to access capital against it today. Traditional financing against receivables is slow, opaque, and manual.

**Canonical positioning:** "Koby turns future business cash flow into programmable liquidity."

**Why Koby exists:** to give businesses a faster, more transparent path from expected future revenue to usable capital, and to give financiers a transparent, programmatically enforced way to fund and track that financing.

**What Koby is NOT:**

- Not a generic lending protocol
- Not primarily a trading application
- Not an AI chatbot
- Not a system that autonomously collects real-world business revenue in the MVP

---

## 2. PRODUCT VISION

In practical terms: a business knows it has revenue coming — a contract, a subscription base, recurring orders — but that revenue arrives later than the business needs capital. Koby lets the business describe that expected revenue, get an assessment of how much of it can responsibly be financed, and receive funding today from a financier who takes on that financing position. The relationship between the two parties — how much was financed, how much has been repaid, what's outstanding — is tracked transparently and enforced by a smart contract rather than a private ledger.

---

## 3. TARGET USERS

**Business** — has predictable future receivables and wants liquidity now. Can: create a business profile, submit revenue/business information, view a cash-flow assessment, view financing eligibility, review and accept financing terms, receive funded liquidity, trigger/monitor repayment, view outstanding balance and completion status.

**Financier** — has capital and wants to fund financing opportunities with transparent terms and risk signals. Can: browse the marketplace, inspect a business's future receivables and risk signals, review terms, fund a financing position, monitor repayment, view completion.

No additional user types are defined for the MVP. Anything requiring a third role (e.g. an underwriter, an auditor) is out of scope unless explicitly added to AGENTS.md first.

---

## 4. CORE PROBLEM

- Businesses can have predictable future receivables, but capital needs often arrive before that revenue does.
- Traditional receivables financing can be slow, opaque, and hard to access, especially for smaller or newer businesses.
- Koby creates a programmable financing mechanism built around eligible future receivables, with transparent terms and onchain enforcement.

Koby does not claim guaranteed revenue, guaranteed repayment, or guaranteed financing at any point in the product.

---

## 5. CORE SOLUTION

The Koby lifecycle:

```
Future Business Revenue
        ↓
Cash-Flow Analysis
        ↓
Financing Opportunity
        ↓
Liquidity
        ↓
Monad Settlement
        ↓
Programmable Repayment Tracking & Execution
        ↓
Completed Financing Position
```

- **Future Business Revenue** — the business describes expected future receivables.
- **Cash-Flow Analysis** — an AI-assisted analysis layer evaluates the business's submitted data (and, where available, onchain signals) to produce a risk/financing assessment.
- **Financing Opportunity** — based on that assessment, an eligible financing amount and terms are proposed.
- **Liquidity** — a financier funds the opportunity.
- **Monad Settlement** — the funding transaction settles onchain on Monad.
- **Programmable Repayment Tracking & Execution** — repayment terms are encoded onchain; each repayment transaction is validated by the contract, which updates the outstanding balance.
- **Completed Financing Position** — once the repayment obligation is satisfied, the contract marks the position complete.

---

## 6. MVP SCOPE

The MVP is the smallest complete product that can demonstrate, end to end:

```
Business → Future Receivables → Cash-Flow Analysis → Financing Opportunity
→ Financing Terms → Financier Funding → Monad Settlement → Repayment
→ Onchain Accounting → Financing Completion
```

**Explicitly out of scope for the MVP:**

- Governance
- A Koby token
- NFTs
- Unnecessary cross-chain functionality
- Perpetual trading
- Generic DEX aggregation
- Unrelated social features
- Unnecessary Chainlink functionality
- Sponsor integrations without genuine product utility

---

## 7. BUSINESS EXPERIENCE

1. Connect / onboard
2. Create business profile
3. Provide business/revenue information
4. Review cash-flow assessment
5. View financing eligibility / opportunity
6. Review financing terms
7. Receive financing
8. Monitor repayment
9. View outstanding balance
10. View completed financing

Every screen in this flow must clearly distinguish simulated/demo data from real onchain data (see Section 21).

---

## 8. FINANCIER EXPERIENCE

1. Connect / onboard
2. Browse financing opportunities
3. Inspect business information
4. Inspect future receivables
5. Inspect financing amount
6. Inspect repayment obligation
7. Inspect duration
8. Inspect risk signals
9. Review terms
10. Fund financing
11. Monitor repayment
12. View completion

The marketplace must not present arbitrary rankings such as "Best business," "Safest borrower," or "#1 investment" unless a documented, disclosed methodology backs the ranking. No such methodology is defined for the MVP, so no rankings are shown.

---

## 9. FINANCING MODEL

Core concepts the product must consistently distinguish:

- **Future Receivables** — the business's estimated/expected future revenue. Not guaranteed revenue.
- **Financing Amount** — the amount actually offered/funded against those receivables.
- **Repayment Obligation** — the total amount the business is obligated to repay under the financing terms.
- **Amount Repaid** — cumulative repayment recorded onchain to date.
- **Outstanding Balance** — Repayment Obligation minus Amount Repaid.
- **Financing Status** — the position's current state (see Section 10).
- **Duration** — the agreed timeframe of the financing, displayed as information only in the MVP; not enforced onchain and triggers no default or state change (see Section 10).
- **Financing Terms** — the full set of agreed conditions (amount, obligation, duration, and any other agreed terms), proposed by the business; the AI assessment is advisory only and does not set terms (see Section 12).

**Canonical demo values:**

- Future receivables: $100,000
- Financing amount: $70,000

Future receivables must always be presented as estimates/expected receivables — never as guaranteed revenue.

---

## 10. FINANCING STATE MACHINE

MVP states: `Created`, `Funded`, `Repaying`, `Completed`. `Active`, `Defaulted`, and `Cancelled` are not implemented in the MVP; duration is informational only and there is no default or cancellation policy.

- **Created** — a financing opportunity exists with terms, not yet funded. Any connected wallet may submit Create specifying any business address (open creator).
- **Funded** — a single financier has funded exactly the principal; second fundings and wrong amounts revert. Persists until the first valid repayment.
- **Repaying** — entered only on the first valid repayment from the recorded business; further valid repayments stay in `Repaying`. Repayments exceeding outstanding revert outright (no partial cap); zero amounts revert.
- **Completed** — entered automatically in the same repayment transaction that brings outstanding to exactly zero; never separately callable.

The contract is the source of truth for which state a position is in. The frontend must never imply a state the contract has not recorded.

---

## 11. REPAYMENT MODEL

This section is intentionally strict, per AGENTS.md.

The MVP must **not** be described or presented as having autonomous real-world revenue collection unless that mechanism is actually implemented.

The MVP repayment flow is:

```
Financing Agreement
        ↓
Repayment Terms Encoded Onchain
        ↓
Repayment Transaction/Trigger
        ↓
Contract Validates Repayment
        ↓
Outstanding Balance Updated
        ↓
Financing Completed
```

This is **programmable repayment tracking and execution** — the contract enforces validity and accounting of each repayment transaction it receives — not **true autonomous revenue-triggered repayment**, where the system itself would detect and redirect real business revenue without a manual or simulated trigger.

**Repayment destination (MVP):** each validated repayment pulls the repayment token from the business and pushes it straight to the recorded financier in the same transaction (atomic push). The contract never holds repayment balances and there is no separate claim step.

A future version could integrate real revenue streams or payment rails (e.g. a payment processor webhook, an oracle-fed trigger, or a scheduled execution mechanism) to make repayment genuinely autonomous. The MVP does not claim this capability. `docs/MONAD.md` must document exactly what triggers a repayment transaction in the current build.

**Repayment trigger (MVP):** manual business-signed transactions plus, for the demo, a clearly labeled simulated trigger that still submits a real validated transaction; the funds reason may be simulated, the transaction and validation are real. Never described as automatic or autonomous. Only the recorded business address may repay; approvals are exact-amount per action as a distinct step (see Section 19).

---

## 12. AI / CASH-FLOW ASSESSMENT

AI is an analysis layer only. Financing terms are proposed by the business; the AI assessment informs but never sets terms, and no financing is created until the business reviews the assessment and accepts the proposed terms.

**AI may evaluate:** revenue consistency, transaction activity, cash-flow volatility, repayment capacity, historical activity, concentration risk, requested financing amount, other approved business signals.

**AI produces:** risk signals, explanations, a confidence value, and a financing assessment, structured as:

```ts
type RiskAssessment = {
  score: number;
  confidence: number;
  factors: string[];
  recommendation: string;
};
```

**AI must NOT:**

- Directly control funds
- Execute financial transactions
- Guarantee approval
- Guarantee repayment
- Claim risk-free financing
- Fabricate financial data

All AI output must be validated before being consumed by the rest of the application — raw model output is never trusted directly.

---

## 13. NANSEN

Nansen is the MVP live onchain data source for a small defined signal set feeding the cash-flow assessment (e.g. stablecoin inflow count, frequency, and recency for the business wallet), normalized to observed activity and derived signals before AI interpretation. Exact signal list and endpoints are finalized during implementation verification; current bounty and API/MCP requirements must be re-verified at that time. Fallback is clearly labeled demo data with unavailable states, never fabricated signals.

Potential flow:

```
Business Wallet → Nansen Data → Observed Activity → Derived Signals
→ AI Interpretation → Financing Assessment
```

The product must clearly distinguish, at every point Nansen data is used:

- Observed onchain activity (what Nansen actually reported)
- Derived signal (what was computed from that observation)
- AI interpretation (what the AI concluded from the signal)
- Financing decision (what the product ultimately did with that conclusion)

Nansen data is never displayed solely to satisfy a bounty requirement — it must inform an actual assessment shown to the user.

---

## 14. MONAD

At least one core financial operation must execute on Monad. Candidates: create financing, fund financing, settle financing, record repayment, complete financing. `docs/ARCHITECTURE.md` and `docs/MONAD.md` define exactly which operations execute onchain.

Monad's role must be tied to concrete product needs, not asserted generically:

- **Settlement** — funding and repayment transactions settle onchain.
- **Programmable execution** — the financing state machine is enforced by contract logic, not a private database.
- **Transparent state** — financing status, amounts, and history are publicly verifiable.
- **Financial transaction lifecycle** — the create → fund → settle → repay → complete sequence is the actual execution path, not a UI simulation layered over an off-chain database.

**Funding custody (MVP):** funding is atomic settlement in a single transaction that pulls the financing token from the financier and pushes it straight to the business (atomic push). The contract never holds funding balances and there is no separate escrow-release or claim step.

**MVP asset binding:** the financing/repayment asset is a single testnet stablecoin (USDC per MONAD.md Section 11), bound once as an immutable constructor parameter set at deploy to the re-verified address. Decimals are a fixed verified constant (6). No other token is accepted in the MVP; mainnet assets are out of scope. The address and decimals must be re-verified immediately before deployment.

The PRD does not claim "Monad is fast so we use it" as a justification on its own; the justification is what the application actually does with the chain.

---

## 15. ENVIO / INDEXING

Event-driven indexing supports the product's need to show financing history, transaction history, repayment history, position state, and business activity without relying entirely on ad hoc frontend reads.

Candidate indexed events: `FinancingCreated`, `FinancingFunded`, `RepaymentRecorded`, `FinancingCompleted`. `LiquiditySettled` and `FinancingDefaulted` are not part of the MVP event set.

ENVIO is the MVP indexing layer for history and list views, with direct contract reads for actionable state and labeled staleness plus direct-read fallback on missing, delayed, or unavailable indexed data. Local development may use a simpler approach.

---

## 16. PRIVY / ONBOARDING

The onboarding experience should not require the user to understand RPCs, chain IDs, gas mechanics, or contract addresses to get started.

At the same time, the product must still show important transaction information (action, amount, token, target, network, terms) before any signature is requested — see Section 19. Simplicity in onboarding must not come at the cost of transaction transparency.

Privy is the MVP wallet/onboarding provider behind the provider-agnostic wallet abstraction, used only for connection and signing friction reduction. It creates no separate Koby account layer, holds no financial truth, and never substitutes for per-transaction wallet signatures. Koby remains an open page with wallet as the only sign-in; browsing requires no wallet and no signup flow.

---

## 17. USER INTERFACE REQUIREMENTS

**Landing page**

- Purpose: explain what Koby is in under 30 seconds.
- Displays: product positioning, core lifecycle, primary CTA.
- Actions: connect / learn more.
- States: default. No meaningful error state.

**Business dashboard**

- Purpose: answer "where do I stand?" for a business.
- Displays: active financing, repaid amount, outstanding balance, cash-flow assessment, available opportunities.
- Actions: create financing request, view financing detail.
- States: no active financing (empty state), active financing, error loading position data.

**Financing marketplace**

- Purpose: let financiers browse opportunities.
- Displays: list of financing opportunities with business, receivables, amount requested, terms, risk signals, funding status.
- Actions: open financing detail, fund.
- States: empty marketplace, loading, error.

**Financing creation flow**

- Purpose: let a business submit information and receive a financing offer.
- Displays: business/revenue input form, resulting cash-flow assessment, proposed terms.
- Actions: submit information, review assessment, accept/decline terms.
- States: submitting, assessment pending, assessment ready, terms accepted, error.

**Financing detail page**

- Purpose: show full state of one financing position.
- Displays: amount, obligation, repaid, outstanding, status, business info, cash-flow info, AI assessment, onchain activity, transaction history.
- Actions: fund (financier), repay-trigger (business, per Section 11), view transaction on explorer.
- States: each financing status from Section 10, plus loading/error.

**Transaction / repayment history**

- Purpose: show a chronological record of onchain activity for a position or business.
- Displays: indexed events (Section 15) with timestamps and transaction references.
- Actions: view transaction detail.
- States: empty, loading, error/indexer unavailable.

**Wallet / onboarding experience**

- Purpose: connect a wallet and create a profile with minimal friction.
- Displays: connect action, profile creation form.
- Actions: connect, create profile.
- States: connecting, connected, connection failed.

---

## 18. FINANCIAL UI

Important financial values must be visually dominant — large, unambiguous, and immediately readable. Example hierarchy:

```
$70,000        $100,000        $18,500        $51,500
Financing      Future          Repaid         Outstanding
               receivables
```

A user should be able to understand the financial state of a position at a glance, without reading supporting text.

---

## 19. TRANSACTION UX

Transaction states: `idle`, `preparing`, `awaiting_wallet`, `submitted`, `confirming`, `confirmed`, `failed`.

"Success" is never shown before `confirmed`.

Before any financial transaction is requested, the UI must show: the action being taken, the amount, the token, the target (counterparty/contract), the network, and relevant terms. Ambiguous buttons like "Continue" are not used for financial actions — buttons state the action plainly (e.g. "Fund $70,000 financing").

Token approvals are exact-amount per action and shown as a distinct step with their own disclosure; no unlimited approvals and no permit signatures in the MVP.

---

## 20. ERROR HANDLING

Errors are shown in plain language with a clear statement of what did and did not happen. Example:

> "Financing could not be completed. The transaction was rejected by the financing contract. No funds were transferred."

Raw blockchain errors are never the primary user-facing message. A failed transaction is never described as successful.

---

## 21. MOCK / DEMO DATA

All simulated data is explicitly labeled as one of: Demo, Simulated, Mock, Testnet, Placeholder. These are the simulated-data tags. Value provenance for every displayed value follows USER_FLOW.md Section 21 (Onchain, Indexed, External Data, AI Analysis, User Provided, Demo, Simulated, Testnet), and system data categories follow ARCHITECTURE.md Section 16 (REAL, SIMULATED, MOCK, TESTNET, UNAVAILABLE). The three layers are complementary, not competing: this section defines simulated tags, USER_FLOW defines per-value provenance, ARCHITECTURE defines system state.

Fictional revenue is never presented as real revenue. The product never fabricates transaction hashes, contract addresses, balances, confirmations, settlements, or repayments — if something is simulated, it is labeled as simulated everywhere it appears.

---

## 22. DEMO EXPERIENCE

```
00:00 — Problem
00:20 — Koby / $100K future receivables
00:40 — AI assessment
01:00 — $70K financing opportunity
01:20 — Financier funds
01:40 — Real Monad transaction
02:00 — Repayment
02:20 — Indexed activity
02:40 — Result
```

The demo must be understandable at the conceptual level in approximately 30 seconds, without requiring the viewer to understand blockchain architecture first.

---

## 23. MOBILE REQUIREMENTS

Koby must work on mobile. This means:

- Responsive dashboards that don't rely on horizontal scrolling as the only strategy for financial tables
- Usable financing creation and funding flows on small screens
- Financial values that remain readable at mobile widths (Section 18's hierarchy should degrade gracefully, not shrink illegibly)
- Wallet interactions and transaction states (Section 19) that work correctly in a mobile wallet context

---

## 24. SECURITY / TRUST REQUIREMENTS (PRODUCT LEVEL)

This section states product-level expectations only; the full technical specification belongs in `docs/SECURITY.md`.

- The contract is the source of truth for critical financial state (amount repaid, outstanding balance, funding status, completion status).
- The frontend cannot fabricate or override any of that state.
- Transaction information must be shown clearly before signature (Section 19).
- AI cannot control funds or execute transactions (Section 12).
- Secrets are never exposed client-side.
- Financial calculations are deterministic — no floating-point arithmetic in settlement or repayment logic.

---

## 25. OUT OF SCOPE

- Governance
- A Koby token
- NFTs
- Unnecessary cross-chain functionality
- Perpetual trading
- Generic DEX aggregation
- Unrelated social features
- Unnecessary Chainlink integration
- Autonomous real-world revenue collection (unless actually implemented — see Section 11)
- Unsupported financial guarantees of any kind

---

## 26. SUCCESS CRITERIA

The MVP is successful when a user can demonstrate, in one continuous flow:

1. A business profile
2. Future receivables
3. Cash-flow assessment
4. Financing opportunity
5. Financing terms
6. Financier funding
7. A real Monad transaction
8. Onchain financing state
9. A repayment transaction
10. Updated outstanding balance
11. A completion state
12. Transaction/activity history

---

## 27. DEMO ACCEPTANCE CRITERIA

**REAL (must not be faked):**

- The Monad transaction itself
- The resulting smart-contract state
- The contract's accounting (amounts, balances, status)

**SIMULATED / DEMO (must be labeled per Section 21):**

- The fictional business
- The fictional future receivables
- Simulated business history, where used
- Any external analytics data that is unavailable at demo time

This distinction is never blurred in the UI, the narration, or the underlying data.

---

## 28. PRODUCT PRINCIPLES

- Financial state must be truthful.
- Onchain activity must be real when presented as real.
- AI assists analysis but does not control funds.
- Monad must provide actual product value.
- Sponsor integrations must have genuine utility.
- UX should hide unnecessary blockchain complexity without hiding transaction substance.
- Security is more important than feature count.
- The MVP should be understandable quickly.
- Do not build feature theatre.
