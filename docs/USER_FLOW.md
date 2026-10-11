# KOBY — USER_FLOW.md

Source of truth order: AGENTS.md → docs/PRD.md → docs/ARCHITECTURE.md → docs/MONAD.md → docs/AI.md → docs/SECURITY.md → this document.

This document defines how users move through Koby — journeys, screens, actions, states, and decisions. It does not define implementation, styling, or code.

Koby has no separate login/account layer. It is an open web page: anyone can browse the landing page, the marketplace, and public opportunity details without connecting anything. A wallet connection is the only "sign-in" Koby has, and it's only required at the point a user wants to act (Section 5).

---

## 1. USER FLOW OVERVIEW

```
Discover Koby
  ↓
Understand financing model
  ↓
Connect wallet
  ↓
Business profile
  ↓
Cash-flow information
  ↓
AI analysis
  ↓
Financing opportunity
  ↓
Review financing terms
  ↓
Create financing agreement
  ↓
Financier funds
  ↓
Monad settlement
  ↓
Financing becomes active (Funded)
  ↓
Repayment transaction / trigger
  ↓
Repayment accounting
  ↓
Outstanding balance updates
  ↓
Financing completed
```

Two user types drive this lifecycle: the **business** (left side of the flow, from "Business profile" through "Financing becomes active") and the **financier** (enters at "Financier funds"). A third category — an **observer/read-only user** — can view public marketplace and activity information without connecting a wallet at all, per PRD.md Section 3's note that no additional user types beyond business and financier are invented; "observer" here isn't a distinct role with its own permissions, just the natural state of anyone browsing before they connect and take an action.

---

## 2. USER PERSONAS

### Business

- **Goals:** get visibility into how much of their future receivables can be turned into financing today, on transparent terms, without a slow traditional process.
- **Information provided:** business profile details, future receivables information, requested financing amount.
- **Actions:** create a profile, submit cash-flow information, review an AI assessment, accept financing terms, create a financing agreement, submit repayment transactions.
- **Permissions:** can only create/manage their own financing positions; can only submit repayment against a position where they are the recorded business (SECURITY.md Section 6).
- **Important concerns:** understanding exactly what they're agreeing to (amount, obligation, duration); knowing what's simulated vs. real during a demo; not being shown a guaranteed outcome (PRD.md Section 4).
- **Expected outcome:** receives financing amount as liquidity, repays over time, sees the position marked complete.

### Financier

- **Goals:** find financing opportunities with transparent terms and available risk signals, and fund the ones they choose to.
- **Information viewed:** business info, future receivables, financing terms, AI assessment, risk factors, funding status, onchain evidence.
- **Actions:** browse the marketplace, open opportunity detail, fund a position, monitor repayment progress.
- **Permissions:** can fund any `Created` position; can only be recorded as _the_ financier for a position they've actually funded.
- **Important concerns:** distinguishing real evidence from AI interpretation and demo data (Section 21); not being shown arbitrary rankings without a documented methodology (PRD.md Section 8); understanding this isn't a guaranteed-return product (Section 19).
- **Expected outcome:** funds a position, sees repayment tracked transparently over time, sees the position complete.

### Admin / Operator

Included only minimally, consistent with SECURITY.md Section 20's least-privilege stance and AGENTS.md's instruction not to over-build.

- **Privileged responsibilities:** none required for the MVP's core user-facing flows. If an emergency-pause capability exists at the contract level (SECURITY.md Section 5), an operator may have access to trigger it.
- **What they can observe:** the same public onchain/indexed data any user can see, plus any operational logs (SECURITY.md Section 23).
- **What they can configure:** environment/network configuration (ARCHITECTURE.md Section 22) — not financing terms, not accounting values, not user data.
- **What they must NOT control directly:** they cannot move user funds, alter recorded accounting, or reassign a position's business/financier (SECURITY.md Section 20). No admin dashboard or admin-specific user flow is otherwise defined for the MVP.

---

## 3. FIRST VISIT FLOW

A new visitor should be able to understand, without connecting anything or reading documentation:

1. **What Koby is** — a programmable business-financing marketplace.
2. **What problem it solves** — businesses have future revenue but need capital sooner.
3. **How future cash flow becomes financing** — the lifecycle in Section 1, shown simply.
4. **Where AI fits** — it analyzes and explains, it doesn't decide or execute (AI.md Section 1).
5. **Where Monad fits** — it's where the actual financing transactions settle (MONAD.md Section 1).
6. **How repayment works** — programmable tracking/execution, not autonomous revenue collection (MONAD.md Section 8) — stated honestly even on first visit, not just in fine print.
7. **What's real vs. simulated/testnet** — the demo business and figures are fictional; the underlying transaction mechanics are real testnet mechanics (Section 28).

No blockchain knowledge is required to follow points 1–3 and 6; points 4–5 and 7 are where the product's technical honesty becomes visible without requiring the visitor to already understand what a smart contract or testnet is. None of this requires the visitor to connect a wallet, let alone log in — the entire first visit is browsable.

---

## 4. LANDING PAGE FLOW

Conceptual section order (no visual styling implied). The landing route is
a condensed category page, not the full lifecycle lecture — detail lives in
the product flows (Sections 6–8, 12–13, 15–16), not on first visit:

```
Hero (category + promise + two CTAs)
  ↓
How It Works (Submit → Finance → Repay, one line each)
  ↓
Product plate (what a financier inspects: the comparable fields)
  ↓
Monad Settlement (create / fund / repay as real transactions)
  ↓
Trust / Transparency (real-vs-simulated distinction)
  ↓
Call to Action
```

- **Hero** — the canonical positioning statement (PRD.md Section 1), led by
  the product category.
- **How It Works** — a simplified version of Section 1's lifecycle in three
  moves. The problem statement is folded into its one-line framing
  ("Businesses earn later and need capital now") rather than standing as
  its own section, and the seven-stage detail is folded into the settlement
  operations, the opportunity plate, and the financing flows.
- **Product plate** — a glimpse of a demo opportunity with the same
  comparable fields the marketplace shows (PRD.md Section 8), browsable
  with no wallet connected. The AI assessment structure is summarized by
  its risk-signals row here; the full assessment UI lives in the financing
  creation flow (Section 7).
- **Monad Settlement** — why Monad, stated the way MONAD.md Section 2 states it, not as an unsupported speed claim.
- **Trust / Transparency** — the real-vs-simulated distinction (Section 21), stated plainly before anyone connects a wallet. Retains the
  plain-language repayment note (Section 16): programmable tracking and
  execution, not autonomous revenue collection.
- **Call to Action** — connect wallet / explore, branching toward business or financier paths.

---

## 5. WALLET CONNECTION FLOW

Koby has no separate login or account layer — there is no email/password, no OAuth provider, and no application-level "authentication" step distinct from connecting a wallet. The page is open: anyone can browse the landing page, the marketplace, and public opportunity details without connecting anything. Connecting a wallet is the only "sign-in" Koby has, and it's required only at the point a user actually wants to act — create a financing request, fund one, or submit a repayment.

```
Open Web Page (browsable with no wallet connected)
  ↓
User initiates a wallet-requiring action
  ↓
Connect Wallet
  ↓
Wallet Connected — address visible, any existing profile tied to that address loads
```

This keeps two things distinct (MONAD.md Section 10):

```
Wallet Connected  ≠  Transaction Authorized
```

Being connected means Koby knows which address is present. It does not mean any specific transaction has been authorized — every transaction still requires its own explicit signature.

- **Connect wallet** — the user initiates connection (directly or via Privy, per MONAD.md Section 10); on success, the connected address becomes visible in the UI and any existing profile tied to that address is loaded.
- **Wallet already connected** — returning to the app with a previously connected wallet/browser session reconnects without requiring the user to repeat the full flow, where the underlying wallet session allows it.
- **No wallet connected yet** — the user can still browse the landing page, marketplace, and public opportunity detail pages (Section 10). Any action requiring a signature (create, fund, repay) prompts a wallet connection first if none exists.
- **Wrong network** — if the connected wallet's chain isn't Monad Testnet (chain ID `10143`, MONAD.md Section 12), the UI blocks transaction-related actions and prompts a network switch (SECURITY.md Section 8).
- **Account/address changed** — if the connected address changes mid-session, the app re-validates that the new address is actually entitled to whatever action was in progress (SECURITY.md Section 8) rather than silently continuing.
- **Wallet disconnected** — mid-flow disconnects return the UI to a state requiring reconnection before any further signing; browsing (non-signing) activity is unaffected.
- **Unsupported wallet** — the user sees a clear message about which wallets/connection methods are supported.
- **Wallet rejected** (the user declines a connection or signature request) — returns cleanly to the prior state; not treated as an application error.
- **Network switch** — where the wallet supports a programmatic switch prompt, the app offers it; otherwise it explains what to do manually.
- **Transaction authorization** — before any transaction request, the UI shows action, amount, token, target contract, network, and relevant financing terms (MONAD.md Section 10) — the user always understands what they're about to sign before they sign it.

A business or financier profile, where one exists, is associated with a wallet address, not a separate account — there is no username/password, no email verification, and no identity provider in the loop. If a lightweight offchain profile (e.g. a business name or description, per ARCHITECTURE.md Section 4) is ever collected, it's collected the first time that wallet address takes a profile-requiring action, not through a separate signup flow.

---

## 6. BUSINESS ONBOARDING FLOW

```
Business
  ↓
Create Profile
  ↓
Provide Business Information
  ↓
Provide Future Receivable / Cash-Flow Information
  ↓
Validate Inputs
  ↓
Submit for Analysis
```

**Required (conceptually):** enough business identity information to display in the marketplace and dashboard, and enough future-receivable/cash-flow information for the AI assessment (AI.md Section 3) to have something to work with.

**Optional:** additional descriptive information that helps a financier understand the business but isn't required for the assessment to run.

No KYC requirement is invented here — nothing in AGENTS.md, PRD.md, or SECURITY.md specifies identity verification beyond wallet address and whatever profile information the business chooses to provide.

- **Invalid input** — client-side validation catches obvious issues (wrong type, missing required field) before submission; the user sees exactly what needs fixing.
- **Incomplete information** — the user can save progress and return, where the app supports it, rather than losing entered data.
- **Unsupported information** — e.g. a file type or format the app doesn't handle; clearly communicated, not silently dropped.
- **Insufficient data** — if what's provided is too thin for a meaningful assessment, this is communicated at the analysis stage (Section 8), not hidden until later.
- **User cancellation** — the user can back out of onboarding at any point; nothing is submitted for analysis until they explicitly submit.
- **Resubmission** — a business can update their information and request a new assessment; prior assessments remain traceable (AI.md Section 13) rather than being silently overwritten with no record.

---

## 7. CASH-FLOW ANALYSIS FLOW

```
Business Data
  +
Cash-Flow Data
  +
Available Onchain Signals
  ↓
Normalization
  ↓
AI Analysis
  ↓
Risk Assessment
  ↓
Validation
  ↓
User Presentation
```

The user sees an explainable assessment structured as:

```ts
RiskAssessment {
  score
  confidence
  factors
  recommendation
}
```

presented per AI.md Section 24's UX pattern — score/assessment, confidence, key factors, recommendation — never as an unexplained number.

The AI score is never treated as absolute truth (AI.md Section 2). The UI keeps these categories visibly distinct (AI.md Section 25):

- **Observed data** — what was actually seen (e.g. Nansen-reported activity).
- **Derived signals** — what Koby computed from observed data.
- **AI interpretation** — what the model concluded.
- **Financing decision** — what terms are actually proposed, which the business/financier still has to review and accept (AI.md Section 14).

AI never directly approves or executes a financing transaction — the flow from assessment to actual transaction always passes through Section 12's human-authorized creation flow.

---

## 8. INSUFFICIENT DATA FLOW

Triggers: incomplete cash-flow history, unavailable analytics (Nansen down), insufficient onchain activity for the wallet in question, invalid business information, unavailable AI provider, or internally conflicting data.

The UI explains, per AI.md Section 11:

- **What's missing** — specifically (e.g. "limited transaction history available"), not a generic "error."
- **Why it matters** — briefly, in plain terms (a shorter observation period means lower confidence, not a bad score).
- **What the user can do next** — provide more information, wait and retry, or proceed with an assessment explicitly marked as low-confidence/insufficient-data.

No assessment is fabricated just to keep the flow moving (AI.md Section 11, Section 19) — `AI_ANALYSIS_INSUFFICIENT_DATA` is a valid, honestly presented end state, not something the UI works around.

---

## 9. AI FAILURE FLOW

```
Analyzing
  ↓
AI Unavailable
```

On AI service failure (provider error, timeout, or output failing validation — AI.md Section 12, Section 19):

- The user's already-submitted data is preserved — nothing is lost because the AI call failed.
- A clear message is shown: "Cash-flow assessment is temporarily unavailable."
- The flow never claims analysis succeeded when it didn't.
- A retry path is offered where appropriate.
- A clearly labeled simulated/demo fallback may be shown only where the architecture explicitly permits it (ARCHITECTURE.md Section 16) and only when visibly marked Demo/Simulated/Testnet (AI.md Section 19) — never presented as if it were a real result.

---

## 10. FINANCING MARKETPLACE FLOW

Each opportunity conceptually displays: business, future receivables, financing requested, financing amount, repayment obligation, repayment terms, duration, risk signals, funding status, and relevant evidence (PRD.md Section 8). The marketplace is browsable with no wallet connected — a wallet is only required to fund an opportunity.

No arbitrary ranking ("Best," "Safest," "#1") is used without a documented, disclosed methodology (PRD.md Section 8) — since no such methodology exists yet (per PRD.md/AI.md), the MVP marketplace presents opportunities without ranking claims, sortable only by neutral, non-judgmental criteria (e.g. amount, duration, date created) if sorting is offered at all.

The marketplace's job is to make the underlying financing information legible at a glance, not to tell the financier which opportunity is "best."

---

## 11. OPPORTUNITY DETAILS FLOW

Opening a specific opportunity — also browsable without a wallet connected — the user can inspect: business information, receivables information, financing amount, repayment terms, duration, AI assessment, confidence, risk factors, relevant onchain evidence, financing state, contract information when available, and testnet/demo status when applicable (PRD.md Section 8). A wallet is only prompted once the user chooses to act (fund).

The provenance of every value is visible and distinct (Section 21):

```
Verified Onchain Data  vs  Indexed Data  vs  External Analytics
  vs  AI Interpretation  vs  User-Provided Data  vs  Demo/Simulated Data
```

This distinction is what lets a financier trust the page — a number labeled "onchain" carries different weight than one labeled "business-submitted," and the UI never blurs that difference (AI.md Section 25, MONAD.md Section 22).

---

## 12. FINANCING CREATION FLOW

```
Business Dashboard
  ↓
Create Financing Request
  ↓
Enter Future Receivable
  ↓
Propose Financing Terms (business-proposed)
  ↓
AI Analysis (advisory only)
  ↓
Review Terms / Result
  ↓
Create Agreement
  ↓
Wallet Authorization
  ↓
Transaction Submitted
  ↓
Transaction Confirmed
  ↓
Financing Created
```

Every state matters and is shown distinctly:

- **Propose Financing Terms** — the business proposes amount, obligation, and duration; duration is informational only in the MVP (PRD.md Section 9).
- **Review Terms / Result** — the business sees the AI-informed proposed terms and can accept or decline; nothing is created onchain yet. Per PRD.md Section 10, the contract permits open creator: any connected wallet may submit Create specifying any business address; this UI flow is the primary business path.
- **Create Agreement** — the business's explicit action to proceed to a transaction.
- **Wallet Authorization** — the confirmation UI (Section 5) shows exactly what's being created before the wallet is asked to sign.
- **Transaction Submitted / Confirmed** — per Section 14's transaction states; these are not the same moment.

**The financing does not exist onchain, and is not shown as existing, until the transaction is confirmed** — a submitted-but-unconfirmed create transaction is shown as pending, not as an existing `Created` position (MONAD.md Section 9, SECURITY.md Section 9).

---

## 13. FINANCIER FUNDING FLOW

```
Marketplace
  ↓
Select Financing
  ↓
Review Financing
  ↓
Review Terms
  ↓
Review Risk Signals
  ↓
Connect Wallet
  ↓
Choose Fund
  ↓
Wallet Confirmation
  ↓
Transaction Submitted
  ↓
Transaction Confirming
  ↓
Transaction Confirmed
  ↓
Financing Funded
```

The UI keeps these visually and logically distinct at every step:

- Viewing an opportunity (no commitment, no wallet needed)
- Intending to fund (has clicked "Fund," hasn't signed yet)
- Wallet approval (has signed, not yet broadcast/confirmed)
- Transaction submission (broadcast, hash known, not yet confirmed)
- Blockchain confirmation (required depth reached)
- Actual funded state (the position is shown as `Funded` only after confirmation)

A financier who has signed but whose transaction hasn't confirmed yet sees a "confirming" state — never "Funded" prematurely (MONAD.md Section 9).

---

## 14. TRANSACTION STATE UX

Using ARCHITECTURE.md Section 8 / MONAD.md Section 9's states:

| State             | User sees                                         | Allowed actions                          | Disabled actions                               | App knows                                                         | App must not claim                              |
| ----------------- | ------------------------------------------------- | ---------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------- |
| `idle`            | Normal screen, no transaction in progress         | Any normal navigation/action             | N/A                                            | Nothing transaction-specific                                      | N/A                                             |
| `preparing`       | A brief "preparing transaction" indicator         | Cancel                                   | Re-submitting the same action twice            | Parameters being validated/constructed                            | That anything has been sent yet                 |
| `awaiting_wallet` | "Check your wallet" prompt                        | Cancel (if the wallet flow allows it)    | Re-submitting                                  | A signature request is outstanding                                | That the user has signed                        |
| `submitted`       | Transaction hash shown, "submitted" status        | View on explorer                         | Re-submitting the same transaction             | The transaction was broadcast                                     | That it succeeded                               |
| `confirming`      | "Confirming…" with hash                           | View on explorer, wait                   | Assuming the position's new state applies yet  | The transaction is included but below required confirmation depth | That the position has reached its new state     |
| `confirmed`       | Success state, updated financial state shown      | Continue to next action                  | N/A                                            | The transaction reached required confirmation depth               | Nothing beyond what's now actually true onchain |
| `failed`          | Clear failure message with reason where available | Retry, view on explorer if a hash exists | Anything assuming the intended effect happened | The transaction was rejected/reverted/dropped                     | That the financing state changed                |

**Wallet approval ≠ transaction confirmation. Transaction submission ≠ successful settlement.** Both distinctions are enforced by never showing `Funded`/`Repaying`/`Completed` state changes before `confirmed`.

---

## 15. MONAD SETTLEMENT FLOW

```
User Action
  ↓
Wallet
  ↓
Monad Transaction
  ↓
Confirmation
  ↓
Contract State Update
  ↓
Event
  ↓
Indexer
  ↓
Koby UI
```

What the user should see at each stage: an initiated action → a wallet prompt → a submitted transaction with hash → a confirming indicator → (once confirmed) updated financial state reflecting the new contract state → the activity feed eventually reflecting the emitted event once indexed.

**Never fabricated:** transaction hash, contract address, block information, confirmation, or settlement result (MONAD.md Section 9, AGENTS.md section 50). If the environment is a simulated/demo one (Section 28), it is explicitly labeled at every point this flow touches the UI.

---

## 16. REPAYMENT FLOW

Using Koby's actual MVP model — **programmable repayment tracking & execution**, not autonomous real-world revenue collection (MONAD.md Section 8):

```
Active Financing (Funded)
  ↓
Repayment Due / Available
  ↓
Repayment Action or Trigger
  ↓
Wallet Authorization if Required
  ↓
Transaction
  ↓
Contract Validation
  ↓
Repayment Accounting
  ↓
Outstanding Balance Updated
  ↓
Repaying / Completed
```

- **Partial repayment** — a valid repayment less than the outstanding balance; position remains `Repaying`.
- **Full repayment** — the repayment that brings outstanding balance to exactly zero; position transitions to `Completed` as an automatic consequence (MONAD.md Section 3), not a separate action.
- **Invalid repayment** — rejected by the contract (SECURITY.md Section 7); the UI explains what was wrong (wrong position, wrong amount, wrong caller).
- **Overpayment** — a repayment attempt exceeding the outstanding balance is rejected outright (SECURITY.md Section 7), not silently capped.
- **Failed transaction** — shown per Section 14's `failed` state; no accounting change implied.
- **Duplicate transaction** — each repayment is validated against the position's current onchain outstanding balance at execution time (SECURITY.md Section 7); a genuinely duplicate submission either fails (already reflected) or is rejected by the user before resubmission via clear UI state.
- **Wrong financing agreement** — every repayment call specifies its financing ID explicitly; the UI never lets a repayment action be ambiguous about which position it targets.
- **Wrong token** — only the verified financing/repayment token (MONAD.md Section 11) is accepted; the UI doesn't offer a token selector for repayment.
- **Wrong wallet** — only the address recorded as the position's business can submit a valid repayment; if a different connected wallet attempts it, the UI should ideally prevent the attempt before submission, and the contract rejects it regardless (SECURITY.md Section 6).
- **Destination and approval** — per PRD.md Section 11 and Section 19, each validated repayment pushes straight to the recorded financier in the same transaction with no claim step, using an exact-amount approval shown as a distinct step; no permit signatures.
- **Trigger** — per PRD.md Section 11, manual business-signed transactions plus, for the demo, a clearly labeled simulated trigger that still submits a real validated transaction; never described as automatic.

Critical repayment state shown to the user is always derived from authoritative onchain state or a clearly identified indexed representation (Section 21) — never from a frontend-computed guess (ARCHITECTURE.md Section 6).

---

## 17. REPAYMENT STATUS FLOW

Per ARCHITECTURE.md Section 5 / MONAD.md Section 6, the MVP implements only: `Created`, `Funded`, `Repaying`, `Completed`. `Active` (as a distinct state from `Funded`), `Defaulted`, and `Cancelled` are **not** implemented — no business/legal definition for default or cancellation has been specified anywhere in the documentation hierarchy, and this document does not invent one.

| State       | Meaning                                                             | User can                                                                                   | User cannot                                                       | Triggered by                                                  |
| ----------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| `Created`   | Terms recorded onchain, not yet funded; any wallet may have submitted Create specifying any business (open creator per PRD.md Section 10) | Business: wait (no cancel path in MVP); Financier: fund it with exactly the principal | Business: repay (nothing to repay yet); anyone: second-fund or wrong-amount fund (both revert) | Create Financing transaction (Section 12)                     |
| `Funded`    | Single financier funded exactly the principal; persists until first valid repayment | Business: submit a repayment                                                               | Financier: "un-fund" or withdraw (no such mechanism exists)       | Fund Financing transaction for exactly the principal (Section 13) |
| `Repaying`  | At least one repayment recorded, obligation not yet fully satisfied | Business: submit further repayments                                                        | Anyone: mark it complete manually (it only happens automatically) | First valid repayment transaction                             |
| `Completed` | Outstanding balance is zero                                         | Both: view final state/history                                                             | Either: submit further repayment or funding against it            | The repayment transaction that zeroes the outstanding balance |

---

## 18. DASHBOARD FLOW

The business dashboard answers: how much liquidity is available, what financing is active, how much has been repaid, what remains outstanding, what the current cash-flow assessment is, what opportunities exist, and what onchain activity has occurred (PRD.md Section 7 / ARCHITECTURE.md Section 3).

**States:**

- **First-time visitor with a connected wallet, no profile yet** — routes toward onboarding (Section 6).
- **No financing** — empty state (Section 24) explaining how to start.
- **Active financing** — current position(s) shown with live-derived values (Section 21).
- **Repayment in progress** — outstanding balance and repayment history visible.
- **Completed financing** — clearly marked complete, with history preserved.
- **Failed transaction** — shown distinctly, without implying the intended state change happened.
- **Unavailable indexer** — history/activity shows an "unavailable" indicator (Section 22); current-position core numbers fall back to direct reads where feasible.
- **Unavailable analytics** — cash-flow assessment shown as unavailable (Section 9), rest of the dashboard unaffected.

---

## 19. FINANCIER DASHBOARD FLOW

Conceptually includes: available financing opportunities, funded positions, active positions, repayment progress, completed positions, and relevant onchain activity (PRD.md Section 8).

**No investment-return guarantee is ever created.** The dashboard shows what has actually been repaid and what remains outstanding — it does not present a projected return, an expected yield, or any forward-looking number as if it were a guaranteed outcome (PRD.md Section 4, AI.md Section 9). If a projection is ever shown at all, it must be clearly labeled as an estimate, not a guarantee — and no such projection is specified as part of the MVP by any source-of-truth document, so none is assumed here.

---

## 20. ACTIVITY / TRANSACTION HISTORY

Includes: financing creation, funding, repayment, completion, and the relevant contract events behind each (MONAD.md Section 15).

Each entry distinguishes **pending**, **confirmed**, and **failed** (Section 14). Where available, the user can inspect blockchain evidence directly (a link to the transaction on a block explorer — MONAD.md Section 12's explorer URLs). No fake transaction link is ever created — a link is only shown once a real transaction hash exists (Section 15).

---

## 21. DATA PROVENANCE IN THE UI

Every important financial/analytical value carries a conceptual source label, one of:

```
Onchain | Indexed | External Data | AI Analysis | User Provided | Demo | Simulated | Testnet
```

This mirrors AI.md Section 25's provenance model, extended to every value in the product, not just AI-related ones. This section is the canonical per-value provenance set. Simulated-data tags follow PRD.md Section 21 and system data categories follow ARCHITECTURE.md Section 16; the three layers are complementary. The user should never have to guess whether a number is a confirmed onchain fact, a possibly-stale indexed read, a Nansen-derived signal, an AI interpretation, something the business typed in, or something fabricated for demo purposes. Where a value could plausibly be mistaken for a more authoritative source than it is (e.g. a business-submitted receivables figure sitting next to a real onchain financing amount), the label is especially important.

---

## 22. INDEXER FAILURE FLOW

```
Indexer unavailable
```

Stale information is never automatically shown as current. Where appropriate: show the last indexed timestamp; visually identify data that may be stale; allow a manual refresh; fall back to direct onchain reads for critical state where the architecture supports it (ARCHITECTURE.md Section 12, SECURITY.md Section 16); and explain the degraded functionality plainly ("Activity history may be incomplete — the indexer is temporarily unavailable"). No indexed event is ever fabricated to fill a gap.

---

## 23. NANSEN FAILURE FLOW

If Nansen is unavailable: explain that external analytics are unavailable; preserve the rest of the product (the business can still submit information, the AI can still analyze what's user-submitted); never invent analytics or fabricate a risk signal; allow retry; and clearly distinguish "we don't have this data" from "this data looks bad."

**The absence of onchain-activity data is not automatically a negative signal** (AI.md Section 11) — a new wallet with no history looks the same, from Nansen's silence, as a wallet Nansen simply couldn't reach; the UI must not let a user infer risk from data that was never actually retrieved.

---

## 24. WALLET / NETWORK ERROR FLOW

| Scenario                                                 | User sees                                                           | Retry possible?              | Did funds move?                                    | Can app determine final state?                               |
| -------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| Wrong chain                                              | Prompt to switch to Monad Testnet                                   | Yes, after switching         | No                                                 | Yes — no transaction was attempted                           |
| Wallet rejected (user declined)                          | "You declined to sign"                                              | Yes, immediately             | No                                                 | Yes                                                          |
| User rejected transaction (mid-flow cancel)              | Same as above                                                       | Yes                          | No                                                 | Yes                                                          |
| Insufficient balance                                     | "Not enough [MON/USDC]"                                             | Yes, after funding wallet    | No                                                 | Yes                                                          |
| Insufficient token allowance (if an approve step exists) | Prompt for approval first                                           | Yes                          | No                                                 | Yes                                                          |
| Transaction reverted                                     | Plain-language reason where derivable                               | Yes                          | No (revert = no state change)                      | Yes                                                          |
| Transaction pending                                      | "Confirming…"                                                       | N/A — waiting                | Unknown until confirmed                            | **No — shown as pending, not failed or succeeded**           |
| Transaction dropped                                      | "This transaction appears to have been dropped. You can try again." | Yes                          | Likely no, but not always certain without checking | Partially — check via explorer/hash before assuming          |
| RPC unavailable                                          | "Having trouble reaching the network, retrying…"                    | Automatic retry, then manual | Unknown if a transaction was mid-flight            | No — treated as uncertain until RPC recovers and can confirm |
| Contract unavailable (misconfiguration)                  | Generic "can't reach the Koby contract" message                     | After configuration is fixed | N/A                                                | N/A                                                          |

**"Transaction failed" is never shown unless the application can actually determine that outcome** (a clear revert, a clear rejection). For genuinely uncertain outcomes (dropped, RPC issues mid-flight), the UI uses a pending/uncertain state and directs the user to check the transaction hash independently, rather than guessing.

---

## 25. EMPTY STATES

- **No financing** — explains how to create a financing request (business) or how to browse the marketplace (financier).
- **No repayment history** — explains that repayment activity will appear here once it happens.
- **No marketplace opportunities** — explains there are currently none available, without implying something is broken.
- **No onchain activity** — explains that activity will appear after a blockchain interaction occurs.

None of these are styled or worded like errors — they are neutral, informative states describing "nothing here yet," not "something went wrong."

---

## 26. LOADING STATES

Defined for: wallet connection, dashboard, AI analysis, marketplace, financing details, transaction preparation, transaction confirmation, and indexed-data loading.

Loading indicators must not imply data exists when it doesn't — a skeleton screen shaped like populated content, shown while a dashboard turns out to have no financing at all, would be misleading; loading states should resolve into the correct empty/populated/error state, not linger in a way that suggests something is about to appear that won't.

---

## 27. ERROR STATES

Consistent philosophy, every time: **what happened + what is known + what the user can do.**

Financial errors are never hidden, and an error is never transformed into a state that looks successful (Section 14, SECURITY.md Section 22). This applies uniformly across wallet errors, transaction errors, AI errors, and data errors — the same three-part explanation pattern, adapted to context.

---

## 28. DEMO FLOW

Deterministic end-to-end demo, using the canonical example (PRD.md Section 15, MONAD.md Section 22):

```
Acme Logistics
  ↓
$100,000 future receivables            — SIMULATED (fictional business)
  ↓
$70,000 financing                      — SIMULATED terms, based on the fictional figures above
  ↓
AI cash-flow analysis                  — REAL model call if the AI provider is live and used;
                                          otherwise a clearly labeled Demo AI Assessment (AI.md Section 20)
  ↓
Financing agreement                    — REAL Monad testnet transaction (Create Financing)
  ↓
Financier funding                      — REAL Monad testnet transaction (Fund Financing)
  ↓
Monad settlement                       — REAL — actual testnet confirmation
  ↓
Repayment transaction / trigger        — REAL Monad testnet transaction; manually/demo-triggered
                                          (MONAD.md Section 8) — never described as autonomous
  ↓
Outstanding balance update             — REAL — read from actual contract state
  ↓
Completion                             — REAL — actual contract state transition
```

The business and its receivables are fictional; every transaction, confirmation, and resulting contract state shown is a real Monad Testnet transaction against the actually deployed Koby contract. Nothing in this flow fabricates onchain evidence — where a real AI or Nansen call isn't available at demo time, the corresponding step is visibly marked Demo/Simulated rather than silently swapped for something that looks real (Section 21).

---

## 29. MOBILE FLOW

- **Wallet connection** — works within a mobile wallet's in-app browser or via a mobile-compatible connection method (e.g. WalletConnect-style flow via Privy — MONAD.md Section 10); connection status is clearly visible on small screens.
- **Transaction approval** — the confirmation details (Section 5) remain fully readable without horizontal scrolling; the signing prompt handoff to the wallet app works smoothly.
- **Financing review** — key terms (amount, obligation, duration) remain legible and prioritized at narrow widths (ARCHITECTURE.md Section 20).
- **Marketplace browsing** — opportunity cards/list adapt to a single-column, scrollable layout rather than a cramped table, browsable with no wallet connected.
- **Dashboard** — the financial-value hierarchy (PRD.md Section 18) degrades gracefully — large numbers stay large and readable, secondary detail can collapse or stack.
- **Repayment** — the repayment action and its confirmation flow are fully usable with touch input, no hover-dependent controls.
- **Errors** — error messages remain fully readable and don't get truncated or hidden off-screen at mobile widths.

No interaction in any of the above relies on hover-only affordances — every action has a tap-accessible equivalent.

---

## 30. ACCESSIBILITY AND UX SAFETY

- **Readable financial numbers** — sufficient size/contrast/formatting (thousands separators, currency symbols) that amounts aren't misread.
- **Explicit transaction actions** — button labels state the action and amount (Section 5, MONAD.md Section 10), never "Continue"/"Confirm" alone for a financial action.
- **Keyboard navigation** — all interactive elements (including wallet-connect and transaction-confirm actions) are reachable and operable via keyboard where the underlying platform supports it.
- **Accessible labels** — form fields, status indicators, and icons carry accessible text equivalents, not icon-only meaning.
- **Clear status indicators** — transaction states (Section 14) are communicated with both visual style and text, not styling alone.
- **Sufficient contrast** — text and status indicators meet standard contrast expectations for readability.
- **Non-color-only status communication** — a failed vs. confirmed vs. pending transaction is distinguishable without relying on color alone (e.g. icon + text label alongside color).
- **Error readability** — error text is legible at the same standard as the rest of the UI, never de-emphasized to the point of being missed.

No specific visual styling is prescribed here — these are requirements the eventual implementation must satisfy, not a design system.

---

## 31. COMPLETE STATE MAP

```
Visitor (browsing, no wallet connected)
  ↓
Wallet Connected
  ↓
Business  /  Financier          ← branches by role, not sequential for every user
  ↓                    ↓
Financing               Financing
Opportunity              Opportunity
Created (business)       Discovered (financier)
  ↓                    ↓
                    Funding
                    Decision
  ↓                    ↓
        Agreement Created (Created state, onchain)
                    ↓
            Funding Pending (submitted, awaiting confirmation)
                    ↓
                 Funded
                    ↓
                 Repaying
                    ↓
                Completed
```

**Failure branches** exist at nearly every arrow: wallet connection can fail or be on the wrong network (Section 5); AI analysis can fail or report insufficient data (Section 8, Section 9); any transaction (create, fund, repay) can fail, be rejected, or remain pending indefinitely (Section 14, Section 24). None of these failure branches are dead ends — each has a defined recovery path (retry, fix input, reconnect, switch network) rather than leaving the user stuck with no explanation.

**Not every user follows every step.** A financier never goes through business onboarding; an observer may never connect a wallet at all; a business may create multiple financing requests over time rather than following this map exactly once. This map shows the _shape_ of the lifecycle, not a mandatory linear path every single user takes start to finish.

---

## 32. USER FLOW RULES

1. Never claim a transaction succeeded before confirmation.
2. Never fabricate blockchain evidence (hashes, confirmations, balances, contract addresses).
3. Never present AI output as guaranteed truth.
4. Never hide whether data is simulated.
5. Never allow the frontend to override contract state.
6. Never make the user guess what they are signing.
7. Never treat wallet connection as transaction authorization.
8. Never treat indexed data as inherently authoritative over a direct contract read.
9. Never treat missing external data as negative evidence.
10. Never make unsupported repayment automation claims.

These rules are restatements of principles already established across AGENTS.md, PRD.md, ARCHITECTURE.md, MONAD.md, AI.md, and SECURITY.md — collected here because they are the rules that govern _user-visible behavior_ specifically, and every flow section above is written to satisfy all ten simultaneously.

---

## 33. MVP VS FUTURE FLOWS

**MVP:** business financing request and onboarding; AI cash-flow analysis; financing creation; financier discovery and funding; Monad settlement; programmable repayment tracking/execution (manual/demo-triggered); repayment accounting; completion; relevant indexing/activity history; wallet connection and transaction-state UX; the demo flow (Section 28).

**Future (not part of the MVP flow):** autonomous revenue-triggered repayment flows (would require the infrastructure described in MONAD.md Section 8's future-automation discussion); additional payment-rail-connected user flows; more advanced automation (e.g. auto-repayment scheduling UX); flows involving additional chains; and flows for more complex financing products (tranching, secondary markets, etc.) not defined anywhere in PRD.md.

No future flow is depicted as available in any of the screens/states described above — where a future capability might naturally be asked about (e.g. "can repayment happen automatically from my revenue?"), the honest MVP answer, reflected in the product's own copy, is no, not yet (MONAD.md Section 8).

---

## FINAL VALIDATION NOTES

- Checked against AGENTS.md, PRD.md, ARCHITECTURE.md, MONAD.md, AI.md, and SECURITY.md; no contradictions found. Koby is treated consistently throughout as an open, browsable page with wallet connection as the only sign-in — no login/account layer is described or implied anywhere in this document.
- Real vs. simulated states are explicit throughout (Section 21, Section 28) and specifically in the demo flow.
- Repayment is never described as unsupported autonomous revenue collection (Section 16, Section 28, Section 32).
- Transaction confirmation is never confused with transaction submission anywhere in this document (Section 14 is the shared reference every other section defers to).
- The frontend is never treated as financial authority — every flow that touches financing state explicitly routes through onchain confirmation (Section 12, Section 13, Section 16).
- No fake blockchain evidence is permitted in any flow (Section 15, Section 20, Section 28).
- This document stays at the level of user/product behavior throughout — no component names, code, or styling decisions are specified.
