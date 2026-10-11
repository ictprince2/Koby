# KOBY — SECURITY.md

Source of truth order: AGENTS.md → docs/PRD.md → docs/ARCHITECTURE.md → docs/MONAD.md → docs/AI.md → this document.

This is a security specification, not an implementation record. Statements here use "must," "must not," "should," and "future implementation" deliberately — nothing in this document should be read as a claim that a mechanism has already been built, tested, or deployed.

**Core principle, restated:** the frontend is never the source of truth for financial state. The smart contract is authoritative for critical onchain financial state (ARCHITECTURE.md Section 4, MONAD.md Section 5).

```
External Data
  ↓
Validation / Normalization
  ↓
Application
  ↓
User Authorization
  ↓
Smart Contract
  ↓
Monad
  ↓
Onchain Events
  ↓
Indexer / Application
  ↓
UI
```

---

## 1. SECURITY OVERVIEW

Koby moves real value between two independent parties (business, financier) and records the resulting obligation onchain. A security failure here isn't a UX bug — it can mean funds moving incorrectly, a business owing (or being credited as having repaid) the wrong amount, or a financing position showing a state that never actually happened onchain.

**Assets that must be protected:**

- Funds committed to and moving through financing positions
- The integrity of financing agreements (correct parties, correct amounts, correct terms)
- Repayment accounting (amount repaid, outstanding balance)
- Wallet authorization (no transaction happens without the right party's real signature)
- User identity as it relates to which wallet is authorized to act on a given position
- Financial data shown to users (must reflect real state, not a guess or a stale cache)
- The boundary between AI analysis and financial execution
- The boundary between external analytics (Nansen) and financial execution
- Smart-contract state (must only change through valid, authorized transitions)
- Transaction integrity (a transaction must mean what the UI told the user it would mean)

**Security-sensitive financial actions:** creating a financing position, funding a position, submitting a repayment, any transition of financing state (MONAD.md Section 6), and any action that could be mistaken for one of these by a user or by the UI (e.g. a UI bug that shows "funded" before a transaction confirms).

**If a security boundary fails,** the failure mode must be a visibly failed or blocked operation — never a silent success, never a fabricated confirmation, and never state that looks legitimate but didn't actually happen onchain (AGENTS.md section 36, section 50).

---

## 2. SECURITY PRINCIPLES

- **Contract is authoritative** — critical financial state (MONAD.md Section 5) is only ever changed by the contract, enforcing its own rules; nothing else (frontend, backend service, AI, indexer) can produce financial state the contract didn't itself validate and record.
- **Least privilege** — every component and every user role gets only the access it needs. The AI service gets read access to normalized inputs and nothing else (AI.md Section 2). The indexer gets read access to contract events and nothing else. A business's wallet can only repay its own positions; it cannot touch another business's position or the contract's internal accounting directly.
- **Explicit authorization** — every financial transaction requires the relevant party's real wallet signature (MONAD.md Section 10); nothing is authorized on a user's behalf without that signature.
- **No trust by default** — external data (Nansen), AI output, frontend-held state, RPC responses, and indexed data are all treated according to their actual trust level (Section 4), never assumed correct.
- **Validate before use** — any external or user-controlled input that could influence financial logic is validated before it's allowed to (Section 5, Section 6, AI.md Section 12).
- **Fail safely** — a failure (a reverted transaction, an unavailable service, a validation error) must never be converted into an apparent success (Section 22).
- **Transparency** — a user must be able to see exactly what they're authorizing before they sign (Section 8, MONAD.md Section 10).
- **No fabricated onchain state** — simulated or demo data is never displayed as confirmed blockchain state (Section 21, AGENTS.md section 50).

---

## 3. THREAT MODEL

| Threat actor                                                            | Attack surface                                                                                                                                   | Possible impact                                                                                                                                                                                                                                                                                           | Expected mitigation                                                                                                                                                                                                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Malicious user (neither business nor financier on a given position)     | Attempting to call contract functions for a position they have no role in                                                                        | Unauthorized state change, unauthorized fund movement                                                                                                                                                                                                                                                     | Access control on every state-changing function (Section 5)                                                                                                                                                             |
| Malicious business                                                      | Submitting false receivables data, attempting to repay a different position than intended, attempting to claim completion without full repayment | Misleading financing assessment, incorrect accounting                                                                                                                                                                                                                                                     | AI treats submitted data as self-reported, not fact (AI.md Section 3); contract enforces exact accounting (Section 5) regardless of intent                                                                              |
| Malicious financier                                                     | Attempting to fund a position with an incorrect amount, or to interfere with another financier's funding of the same position                    | Broken accounting, race condition on funding                                                                                                                                                                                                                                                              | Contract validates funding amount against principal; only one funding transaction can succeed per position (Section 5, Section 6)                                                                                       |
| Compromised wallet (user's own device/key compromised)                  | An attacker with the user's private key can sign anything that wallet could sign                                                                 | Unauthorized transactions from that wallet                                                                                                                                                                                                                                                                | Outside Koby's direct control — standard wallet hygiene is the user's responsibility; Koby cannot mitigate a fully compromised private key, only ensure that what it asks the wallet to sign is transparent (Section 8) |
| Compromised frontend (e.g. malicious build, dependency compromise, XSS) | Serving altered UI, incorrect transaction parameters, fake confirmation states                                                                   | User signs something other than what they intended; user shown fabricated success                                                                                                                                                                                                                         | Contract-level validation is the backstop even if the frontend is compromised (Section 2); frontend security hygiene (Section 10) reduces likelihood                                                                    |
| Compromised API/backend                                                 | Serving manipulated AI/Nansen responses, leaking secrets                                                                                         | Misleading assessments, credential exposure                                                                                                                                                                                                                                                               | Server-side secret isolation (Section 12); AI/Nansen outputs never directly authorize funds regardless of manipulation (AI.md Section 2, Section 14)                                                                    |
| Malicious external API response (Nansen or AI provider)                 | A provider (or a man-in-the-middle) returns manipulated data                                                                                     | Misleading risk signal                                                                                                                                                                                                                                                                                    | Schema/range/content validation on every external response (AI.md Section 12); no external response can, by itself, move funds                                                                                          |
| Manipulated analytics data                                              | A manipulated Nansen signal designed to inflate a business's apparent creditworthiness                                                           | Skewed financing assessment                                                                                                                                                                                                                                                                               | Assessment is advisory only (AI.md Section 2); the financial terms and the user's own review still gate any transaction                                                                                                 |
| Malicious AI input / prompt injection attacker                          | Business-submitted text crafted to manipulate the AI into a favorable or unsafe output                                                           | Manipulated assessment language, attempted authorization bypass phrased as a data field                                                                                                                                                                                                                   | Untrusted-input handling and structural separation of system instructions from data (AI.md Section 16, Section 17); AI output can never authorize a transaction regardless of what it says (AI.md Section 18)           |
| Malicious RPC provider                                                  | A malicious or compromised RPC returns incorrect chain data (wrong balance, fake confirmation)                                                   | User or app believes a transaction confirmed when it didn't, or vice versa                                                                                                                                                                                                                                | Use of official/reputable public RPC endpoints (MONAD.md Section 12); critical confirmations should be checked against more than one source where feasible; contract state is the ultimate check                        |
| Indexer/data inconsistency                                              | ENVIO indexing lags, misses, or misdecodes an event                                                                                              | Stale or incorrect history/list views                                                                                                                                                                                                                                                                     | Indexer is never authoritative (Section 16); direct contract reads are the fallback for anything critical                                                                                                               |
| Compromised administrator                                               | An attacker gains access to any admin-level credential/account Koby operates                                                                     | Unauthorized configuration change, potential unauthorized privileged contract action if any exists                                                                                                                                                                                                        | Least-privilege admin design (Section 20); MVP should minimize privileged admin functions in the first place                                                                                                            |
| Smart-contract attacker                                                 | Attempting reentrancy, overflow/underflow, access-control bypass, or logic exploitation against the deployed contract                            | Fund loss, incorrect accounting, unauthorized state change                                                                                                                                                                                                                                                | Section 5's full contract-security requirements; Foundry test coverage (Section 24) before any deployment                                                                                                               |
| Transaction frontrunning/ordering                                       | An observer sees a pending transaction and submits a competing one first                                                                         | Relevant primarily if the MVP ever exposes an operation where transaction order changes the outcome (e.g. funding a limited-slot position) — the current single-funder-per-position model limits this, but the exact risk should be re-evaluated once the contract's function-level behavior is finalized | Design functions so that losing a race fails cleanly (a reverted "already funded" attempt) rather than corrupting state                                                                                                 |
| Replay attacker                                                         | Attempting to resubmit a previously valid signed message/transaction                                                                             | Duplicate financial effect                                                                                                                                                                                                                                                                                | Standard EVM nonce/chain-ID protection (Section 5); if any offchain signature scheme is introduced later, explicit nonce/deadline/domain-separation requirements apply (Section 5)                                      |
| Denial-of-service attacker                                              | Flooding the API, AI service, or RPC layer with requests                                                                                         | Service unavailability, potentially demo-day disruption                                                                                                                                                                                                                                                   | Rate limiting (Section 12); graceful degradation to "unavailable" states rather than crashing critical flows (ARCHITECTURE.md Section 16)                                                                               |
| Accidental developer misconfiguration                                   | Wrong network/contract address in an environment, secret committed by mistake, wrong token address used                                          | Transactions sent to the wrong chain/contract/token, secret exposure                                                                                                                                                                                                                                      | Environment/configuration discipline (Section 17, Section 19); pre-deployment checklist (Section 25)                                                                                                                    |

Unrealistic scenarios (e.g. a full Monad consensus attack) are out of scope for this document — Koby's security posture assumes Monad's protocol-level guarantees hold (Section 27) and focuses on what Koby itself controls.

---

## 4. TRUST BOUNDARIES

| Boundary                                           | What crosses it                                                    | What can be assumed                                                                            | What must be validated                                                                                                       | Who decides validity                                                                   |
| -------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| User ↔ Wallet                                      | Transaction signing requests, signed transactions                  | The wallet correctly represents the user's intent once they've reviewed and signed             | The UI must present accurate transaction details before the request is made (Section 8)                                      | The user, via their own review and signature                                           |
| Wallet ↔ Frontend                                  | Connected address, signed transactions, transaction results        | The wallet returns real signatures/results                                                     | The frontend must not assume a signature implies confirmation (Section 9)                                                    | The blockchain (via confirmation), not the frontend                                    |
| Frontend ↔ Backend/API                             | Requests for AI assessment, Nansen-derived data, indexed data      | Nothing — the backend validates every request                                                  | Input validation, auth where applicable (Section 12)                                                                         | The backend service handling the request                                               |
| Backend/API ↔ AI                                   | Normalized business/onchain data in; structured assessment out     | Nothing about the model's output — it's generated content                                      | Full schema/range/content/business-rule validation (AI.md Section 12)                                                        | The backend's validation layer, not the model                                          |
| Backend/API ↔ Nansen                               | Wallet addresses out; observed activity data in                    | Nansen's API responds according to its documented behavior when available                      | Response shape/type checked; treated as observed data, not fact (Section 15)                                                 | The normalization layer (ARCHITECTURE.md Section 10)                                   |
| Backend/API ↔ RPC Provider                         | Read calls, transaction submission                                 | The RPC is reachable and honest most of the time                                               | Chain ID checked on every connection (Section 17); critical reads cross-checked against explorer/alternate RPC when feasible | The application, falling back to alternate RPCs (MONAD.md Section 12) where configured |
| Application ↔ Smart Contracts                      | Transaction calls, event reads                                     | Nothing about correctness until confirmed                                                      | The contract independently validates every call regardless of what the application sent (Section 5)                          | The smart contract                                                                     |
| Smart Contracts ↔ Monad                            | Transaction execution, state persistence                           | Monad's protocol guarantees (finality, ordering within its own rules) hold (Section 27)        | N/A — this is the base trust assumption the rest of the system is built on                                                   | Monad's own consensus                                                                  |
| Smart Contracts ↔ External Tokens                  | Token transfers (approve/transferFrom or equivalent)               | Nothing — a token contract's behavior is not assumed safe by default                           | Verified, specific token address only (Section 5, MONAD.md Section 11); no arbitrary/user-supplied token address accepted    | The financing contract's own transfer-handling logic                                   |
| Monad Events ↔ Indexer                             | Emitted events                                                     | The indexer will eventually catch up                                                           | Indexer data is never treated as more current or more correct than a direct contract read (Section 16)                       | The application, falling back to direct reads when indexed data is stale/unavailable   |
| Indexed Data ↔ Frontend/UI                         | Normalized history/list data                                       | Nothing about current authoritative state for a specific position being actively transacted on | Position detail views for an active transaction should prefer a direct contract read over indexed data                       | The application layer serving the UI                                                   |
| Application ↔ Database/Persistence (offchain data) | Business profile metadata, cached assessments, cached indexed data | Only what the application itself wrote there                                                   | Not treated as financial source of truth under any circumstance (ARCHITECTURE.md Section 4)                                  | The smart contract remains authoritative regardless of what's cached                   |

External data — from Nansen, from the AI provider, from the indexer, from any RPC — is never automatically trusted. Every boundary above has an explicit validation step or an explicit fallback to a more authoritative source.

---

## 5. SMART CONTRACT SECURITY

**Access control:**

- Privileged functions (create, fund, repay) each check the caller against the role required for that specific position (MONAD.md Section 6, PRD.md Section 10) — not a global admin role, but a per-position check: any connected wallet may submit Create specifying any business (open creator); only a funding matching exactly the principal moves `Created → Funded` and records the single financier; only the business address recorded on a position can submit a repayment against it with exact-amount approval and no permit.
- If any contract-level administrator role exists at all in the MVP (e.g. for pausing in an emergency), its permissions must be scoped as narrowly as possible and must not include the ability to alter accounting values, reassign a position's business/financier, or withdraw user funds. Role separation (a pauser role distinct from any funds-related role) should be preferred over a single all-powerful admin key if any admin capability is included.
- Emergency controls (if included at all) should be limited to halting further state transitions, not extracting or redirecting funds — see Section 26 for incident-response principles.
- Any state change from an address other than the one entitled to make it must revert.

**Reentrancy:**

- Functions involving token transfers or other external calls — funding, repayment, and any future withdrawal path — must follow checks-effects-interactions ordering and use standard reentrancy protection (e.g. a reentrancy guard).
- Any function that calls out to a token contract (Section 5, Token handling) must be treated as a potential reentrancy vector, since even a standards-compliant token can be wrapped or proxied in unexpected ways.

**State transitions:**
Per ARCHITECTURE.md Section 5 / MONAD.md Section 6, the MVP state machine is `Created → Funded → Repaying → Completed`. `Active`, `Defaulted`, and `Cancelled` are not implemented in the MVP.

Must be prevented at the contract level:

- Invalid transitions (e.g. `Created → Repaying` without funding, `Completed → anything`)
- Repeated transitions (e.g. funding an already-`Funded` position, repaying a `Completed` position)
- Unauthorized transitions (any second funder; any address other than the recorded business repaying)
- Wrong-amount funding (any amount not exactly equal to principal) and any zero-amount funding or repayment
- Overpayment (any repayment exceeding outstanding reverts outright with no partial cap)
- Completion without sufficient repayment (completion is only ever the automatic consequence in the same repayment transaction that brings `outstanding` to exactly zero — never a separately callable action, per MONAD.md Section 3 and PRD.md Section 10)
- Funding an invalid/nonexistent agreement (funding must reference a real, `Created`-state position)
- Repayment recorded against the wrong financing position (every repayment call must specify and be validated against a specific financing ID)

**Accounting:**

- All values (principal, repayment obligation, amount repaid, outstanding balance) are integers in the financing/repayment token's base units (MONAD.md Section 7) — no floating-point arithmetic anywhere in settlement logic.
- Token decimals are a fixed verified constant (6 for the single testnet USDC per PRD.md Section 14 and MONAD.md Section 11) — not read per-use and not assumed without pre-deploy re-verification.
- `outstanding_balance = repayment_obligation − amount_repaid` must hold after every state-changing operation; the contract must reject any operation that would violate it (e.g. a repayment that would push `amount_repaid` above `repayment_obligation`).
- Basis points, if used for any rate/percentage, are integer values (e.g. 500 = 5.00%), never floats.
- Zero-value inputs (e.g. a zero-amount funding or repayment call) must be explicitly rejected, not silently accepted as a no-op that could confuse state tracking.
- Maximum values and overflow/underflow: use a Solidity version and arithmetic approach where overflow/underflow reverts by default (current Solidity versions do this natively); do not disable this protection for gas savings without an explicit, documented, reviewed reason.

**Token handling:**

- Do not assume every ERC-20 behaves identically. Explicitly consider: tokens that return `false` instead of reverting on failed transfer (check return values, don't assume success); fee-on-transfer tokens (the amount received may be less than the amount sent — if the MVP's financing/repayment token, per MONAD.md Section 11, is not a fee-on-transfer token, this is a lower-priority concern for the MVP but should still be verified against the actual token's behavior); tokens with non-standard decimals (verify, don't hardcode blindly); and the possibility of a malicious or non-standard token contract being substituted if the token address were ever configurable (it must not be arbitrarily configurable — Section 4, Trust Boundaries).
- Unsupported or unverified tokens must not be accepted as the financing/repayment asset without the same verification process MONAD.md Section 11 describes for the MVP's chosen token.

**Unauthorized withdrawals:**

- No function should allow any address to withdraw funds it is not entitled to under the position's recorded state. This includes preventing a business from withdrawing before funding, a financier from withdrawing after funding without a defined mechanism, and any address from withdrawing funds belonging to a position it has no role in.

**Replay protection:**

- The MVP, as currently scoped (MONAD.md Section 3, Section 6), does not require an offchain signature/permit scheme — standard Monad/EVM transaction nonce and chain-ID handling is sufficient.
- If a future version introduces offchain signatures (e.g. a meta-transaction or permit-based flow), it must define: per-signer nonces, an expiration/deadline on each signed message, chain-ID inclusion in the signed payload, EIP-712-style domain separation, and explicit signer-address verification against the expected role. None of this is required for the MVP as currently scoped, and it must not be assumed to already exist.

**External calls:**

- External calls are minimized — limited to the financing/repayment token's transfer functions.
- Any external call the contract makes must have a defined trust and failure model: what the contract assumes about the callee, and what happens (revert, safe fallback) if the call fails or behaves unexpectedly.

---

## 6. FINANCING AGREEMENT SECURITY

Before a financing agreement is created, the contract must validate: a nonzero, sane financing amount; a nonzero repayment obligation (and that it is not less than the financing amount, unless a documented reason for allowing that exists); a valid business address explicitly specified in the call (open creator per PRD.md Section 10 — caller and business may differ; no onchain consent check in the MVP); the token being used matches the verified financing/repayment token (MONAD.md Section 11); and that the operation isn't a duplicate of an already-existing identical agreement being resubmitted unintentionally (e.g. via a UI double-submit — this is more of a UX/idempotency concern than a security one, but it can create confusing duplicate positions if unhandled, especially under open creator).

**Must be prevented:**

- Mismatched parties (a repayment or funding attempt recorded against the wrong business/financier)
- Incorrect amounts (any amount not explicitly validated against the position's recorded terms)
- Duplicate agreements created unintentionally from a single user action
- Unauthorized funding (an address funding a position without going through the intended funding function/flow)
- Unauthorized repayment (any address other than the position's business submitting a repayment)
- Repayment applied to the wrong agreement (every repayment call must be explicit about which financing ID it targets, and the contract validates that ID exists and is in a state that accepts repayment)
- Repayment exceeding valid accounting boundaries (Section 5, Accounting)

---

## 7. REPAYMENT SECURITY

Per MONAD.md Section 8, Koby's MVP uses **programmable repayment tracking & execution** — not autonomous real-world revenue collection. This document does not describe it any other way.

```
Financing Agreement
  ↓
Repayment Terms
  ↓
Repayment Transaction / Trigger
  ↓
Contract Validation
  ↓
Repayment Accounting
  ↓
Outstanding Balance Update
  ↓
Completion
```

**Security requirements at each stage:**

- **Correct financing ID** — every repayment call specifies the exact position it applies to; the contract validates the ID exists and is in a repayable state.
- **Correct payer** — only the address recorded as the position's business may submit a repayment for it.
- **Correct token** — the repayment must be in the position's recorded financing/repayment token; a different token must not be accepted as a valid repayment.
- **Correct amount** — the contract validates the repayment amount is nonzero and does not exceed the current outstanding balance.
- **Duplicate repayment prevention** — accounting is based on the position's current, contract-held outstanding balance at execution time, not a value the caller supplies or that the frontend assumes; two repayment attempts in quick succession are each validated against the actual current state, not a stale cached one.
- **Overpayment handling** — per PRD.md Section 10, a repayment attempt that would exceed the outstanding balance reverts outright with no partial cap and no silent acceptance.
- **Repayment destination** — per PRD.md Section 11, each validated repayment pulls from the business and pushes straight to the recorded financier in the same transaction; the contract never holds repayment balances and there is no claim step.
- **Approval** — exact-amount approval per repayment as a distinct step; no unlimited approvals and no permit signatures in the MVP.
- **Outstanding balance integrity** — recomputed/re-validated on every repayment, never trusted from a prior read.
- **Completion conditions** — completion happens only as the automatic, contract-enforced consequence of `outstanding_balance` reaching exactly zero (MONAD.md Section 3) — never as an independently callable "mark complete" action that could be invoked prematurely.
- **Invalid repayment rejection** — any repayment call failing any of the above checks reverts cleanly; it must not partially apply.

**Current MVP:** repayment is manual plus, for the demo, a clearly labeled simulated trigger that still submits a real validated transaction as the recorded business (PRD.md Section 11, MONAD.md Section 8). Only the recorded business address may submit a valid repayment. This is what "programmable repayment tracking & execution" means in practice for the MVP.

**Future automation:** true revenue-triggered repayment would require a trusted payment-rail integration, verified external data or an oracle, and/or scheduled execution infrastructure, each with its own security review (MONAD.md Section 8). None of this infrastructure exists in the MVP, and this document does not treat it as if it does.

---

## 8. WALLET SECURITY

Before a user signs any transaction, the UI must clearly show: the action, the amount, the token, the destination/contract, the network, the relevant financing terms, and the expected consequence of signing (MONAD.md Section 10). Ambiguous buttons ("Continue") are not used for financial actions; buttons state the action plainly ("Fund $70,000 Financing", "Repay $5,000").

**Must be handled:**

- **Wrong network** — the app checks the connected wallet's chain ID against the expected value (MONAD.md Section 12) before allowing transaction construction, and blocks/prompts a switch if mismatched.
- **Wrong contract** — the app only ever constructs calls against the recorded, verified Koby contract address for the current environment (MONAD.md Section 19); it never accepts an arbitrary contract address from unverified configuration.
- **Wrong token** — the app only ever references the verified financing/repayment token address (MONAD.md Section 11).
- **Malicious transaction parameters** — parameters are constructed by the application from validated inputs, never taken directly from unvalidated user input or URL/route parameters (Section 10) without validation first.
- **Transaction replacement** (a user speeds up or cancels a pending transaction via their wallet) — the app must correctly reflect the outcome of whichever transaction actually confirms, not the one it was originally tracking, if they diverge.
- **Rejected signatures** — treated as a clean return to `idle`/`failed`, not an error state that implies something went wrong on Koby's side.
- **Failed transactions** — shown as failed, with available failure information (Section 22), never as success.
- **Pending transactions** — shown in a `confirming` state, never assumed confirmed.
- **Confirmation handling** — success is only shown once the required confirmation depth is actually observed (MONAD.md Section 9).
- **Wallet disconnects** — mid-flow disconnects return the UI to a state that requires reconnection before any further signing, rather than assuming a stale connection is still valid.
- **Account switching** — if the connected account changes mid-flow, the app must re-validate that the newly connected account is actually entitled to perform the action in progress (e.g. still the business associated with the position being repaid), not silently continue with a flow set up for a different address.

A transaction is never claimed to have succeeded before confirmed evidence exists on Monad.

---

## 9. TRANSACTION SECURITY

Using the lifecycle from ARCHITECTURE.md Section 8 / MONAD.md Section 9: `idle → preparing → awaiting_wallet → submitted → confirming → confirmed → failed`.

| State             | Security requirement                                                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `idle`            | No transaction parameters are held from a previous, unrelated flow.                                                                                                                                               |
| `preparing`       | All parameters are validated (Section 6, Section 7) before calldata is constructed.                                                                                                                               |
| `awaiting_wallet` | The exact parameters shown to the user in the confirmation UI (Section 8) match what's actually being sent to the wallet — no discrepancy between displayed and submitted values.                                 |
| `submitted`       | The transaction hash is recorded and displayed; the app does not yet treat any financial state as changed.                                                                                                        |
| `confirming`      | The app polls for actual confirmation; it does not treat elapsed time alone as a proxy for confirmation.                                                                                                          |
| `confirmed`       | Only now does the UI reflect the transaction's effect on financing state, and only based on an actual read of the resulting state (or a trusted, validated event), not an assumption based on what was submitted. |
| `failed`          | The UI reflects failure and does not apply any of the transaction's intended effects to displayed state.                                                                                                          |

The core rule this section exists to enforce: a button click, a wallet approval, and a transaction submission are each a _different_ thing from a blockchain confirmation, and the frontend must not conflate any of them with actual confirmed financial state.

---

## 10. FRONTEND SECURITY

- **XSS / unsafe HTML rendering** — no user-submitted or externally-fetched text (business descriptions, AI output, Nansen-derived labels) is rendered as raw HTML; standard framework-level escaping is relied on, and any place that would need `dangerouslySetInnerHTML` or equivalent should be avoided or, if unavoidable, sanitized explicitly.
- **Malicious user input** — all form input (business information, requested amounts) is validated both client-side (for UX) and, more importantly, server-side/contract-side (for actual security) before it can influence a financial outcome.
- **URL parameters / route parameters** — a financing ID or address taken from the URL (e.g. `/financing/[id]`) is validated and used only to fetch/display data, never trusted as an authorization signal (e.g. the URL containing a financing ID does not itself grant any privileged action on that position — the wallet's own address does).
- **Client-side authorization assumptions** — hiding a button in the UI is a UX convenience, not a security control; the contract independently enforces who can call what (Section 5), regardless of what the UI shows or hides.
- **Exposed environment variables** — only variables explicitly meant to be public (ARCHITECTURE.md Section 22, `NEXT_PUBLIC_*`) are ever exposed client-side; secrets (API keys) are never included in client-shipped code or bundled configuration.
- **Unsafe transaction construction** — transaction parameters are built from validated application state, not directly from raw, unvalidated form or URL input.
- **Stale financial state** — the UI should indicate when displayed financial data might be stale (e.g. mid-transaction, or when relying on indexed data — Section 16) rather than presenting a cached number with the same confidence as a freshly confirmed one.
- **Fake transaction state** — under no circumstance does the frontend construct a hash, confirmation, or balance that didn't come from an actual RPC/indexer response (MONAD.md Section 9).
- **Phishing-like UI patterns** — transaction confirmation UI (Section 8) must be unambiguous and must not be designed in a way that could train users to sign without reading (e.g. no dark patterns that de-emphasize the amount or destination of a financial transaction).

The frontend is never trusted to enforce authorization or financial rules on its own — it is a presentation and orchestration layer in front of contract-enforced rules (Section 2).

---

## 11. AUTHENTICATION AND AUTHORIZATION

**Authentication** answers "who is this user?" **Authorization** answers "what is this user allowed to do?" These are handled as distinct concerns, never conflated.

- Koby's MVP has no separate login/account layer (no email/password, no OAuth identity provider) — a connected wallet address is the only identity Koby establishes (docs/USER_FLOW.md Section 5). That address answers "who is this user?" for both offchain profile purposes (e.g. business profile ownership, ARCHITECTURE.md Section 4) and onchain action purposes.
- Wallet connection alone does not authorize any onchain financial action — that authorization always comes from the wallet's own transaction signature (Section 8).
- Offchain profile data, where it exists, is associated with and only editable by the connected wallet address it belongs to; there is no separate account system to keep in sync with it.
- Admin access (Section 20), if any exists, is a separate, more restricted tier from ordinary wallet-based identity, and is not established merely by connecting a wallet.
- If a future version introduces a separate identity-provider layer for offchain features unrelated to financing, it would establish identity for those offchain purposes only, and would still never substitute for a wallet's own signature in authorizing an onchain financial action. No such layer exists in the MVP.
- Privileged operations (anything affecting financing state or funds) are never gated by frontend-only checks — the contract enforces the actual authorization (Section 5, Section 10).

---

## 12. API AND BACKEND SECURITY

- **Server-side secrets** (AI provider keys, Nansen API keys, any RPC provider key requiring one) live only in server-side environment configuration, never in client-shipped code (ARCHITECTURE.md Section 22).
- **Environment variables** are separated into public (`NEXT_PUBLIC_*`) and server-only categories, and this separation is never violated for convenience.
- **Authentication/authorization** on backend routes: any route that touches a specific business's or financier's data validates that the requester is entitled to see/act on it, not just that they're logged in generally.
- **Input validation** — every backend route validates its inputs (types, ranges, required fields) before processing, independent of any client-side validation that may also exist.
- **Rate limiting** — applied to routes that call external paid/rate-limited services (AI, Nansen) and to any route that could otherwise be abused for denial-of-service.
- **Abuse prevention** — repeated or automated abuse patterns (e.g. spamming financing-creation requests) should be detectable and throttleable, even if full anti-abuse infrastructure isn't built for a hackathon-scale MVP.
- **Request size limits** — reasonable limits on submitted business information/text to prevent oversized payloads from reaching the AI service or being stored.
- **Logging** — see Section 23.
- **Error handling** — errors returned to the client do not include stack traces, internal paths, or secrets (Section 22).
- **Sensitive data exposure** — API responses only include what the requesting client is entitled to see.
- **API key protection** — third-party API keys (AI provider, Nansen) are never included in any response sent to the client, never logged in full, and never exposed via client-visible network requests.

Private keys or any privileged signing credential are never exposed to the client under any circumstance — the client's wallet holds and uses the user's own key; Koby's backend does not hold user private keys.

---

## 13. AI SECURITY

This section preserves, and does not weaken, the boundaries in `docs/AI.md`.

Security requirements: prompt injection resistance (Section 14); rejection of malicious business descriptions and malicious external data as if they were instructions (AI.md Section 17); treating all analytics (Nansen) as unverified input (Section 15); validating financial inputs before they reach the model (AI.md Section 5); validating model output before it's used anywhere (AI.md Section 12); and treating any AI recommendation, however confidently phrased, as advisory only.

**The AI must never:**

- Sign transactions
- Control wallets
- Move funds
- Bypass contract rules
- Override authorization
- Directly approve financing
- Guarantee repayment
- Guarantee profit
- Fabricate evidence (present a claim as verified when it is only observed, derived, or inferred — AI.md Section 3, Section 4)

The security boundary, restated from AI.md Section 28:

```
AI analyzes
  ↓
Application validates/orchestrates
  ↓
User authorizes
  ↓
Smart contract enforces
  ↓
Monad executes
```

No implementation detail introduced by this document may create a shortcut around this chain.

---

## 14. PROMPT INJECTION PROTECTION

External text — business descriptions, other user-submitted information, external analytics metadata, indexed text, project names, URLs, notes, or any AI-generated content that might later be re-fed into another AI call — is never interpreted as a system instruction, regardless of how it's phrased or what it claims to be.

This is enforced structurally (AI.md Section 16): system instructions and untrusted data occupy clearly separated roles in any prompt, and the model's fixed instructions are not overridable by content that arrives in the data portion. AI output is validated against an explicit schema (AI.md Section 12) before use, which also means a successful injection attempt that produces off-schema or nonsensical output is caught and rejected rather than silently accepted.

---

## 15. NANSEN / EXTERNAL ANALYTICS SECURITY

Nansen data is an analytical input, never unquestionable truth (ARCHITECTURE.md Section 10, AI.md Section 4):

```
Observed activity
  ↓
Derived signal
  ↓
AI interpretation
  ↓
Financing decision
```

No analytics data — however specific or confident-looking — can directly authorize the movement of funds. It can only ever influence an assessment that a human then reviews before any transaction is signed.

**Must be handled:**

- API failures — treated as "unavailable," with a clearly labeled fallback where the architecture permits one (ARCHITECTURE.md Section 16), never silently ignored in a way that produces a misleadingly confident assessment.
- Stale data — if Nansen's response includes an observable timestamp/freshness indicator, it should inform how the data is presented (labeled as potentially outdated where relevant).
- Malformed data — validated and rejected by the normalization layer (ARCHITECTURE.md Section 10, AI.md Section 5) before reaching the AI.
- Unexpected responses — handled as a failure case (Section 22), not assumed to fit the expected shape.
- Rate limits — respected; the application should back off/queue rather than hammering the API and risking a broader outage of the integration.
- API key exposure — Section 12.
- Inconsistent results (e.g. two calls for the same wallet returning meaningfully different data) — not silently averaged or picked arbitrarily; if this is detected, it should be treated as a data-quality signal that could lower assessment confidence (AI.md Section 8), not hidden.
- Manipulated/misleading signals — Koby cannot fully prevent a sophisticated actor from generating onchain activity designed to look like a favorable pattern; the mitigation is that Nansen data only ever feeds an advisory assessment, never a financial authorization, so the ceiling on damage from a manipulated signal is a misleading recommendation, not a fraudulent fund movement.

No Nansen-specific security guarantee is invented here beyond what's implied by treating its data as an untrusted, validated input — Nansen's own service-level guarantees are outside this document's scope.

---

## 16. ENVIO / INDEXING SECURITY

The indexer is a data access layer, not the financial authority:

```
Smart Contract  >  Indexed Representation  >  Frontend Display
```

**Must be handled:**

- Missed events — the app must be able to detect a gap (e.g. a position whose expected event history seems incomplete) and fall back to a direct contract read rather than presenting incomplete history as complete.
- Duplicate events — the indexed representation must de-duplicate correctly; the application should not double-count a repayment because an event was indexed twice.
- Delayed indexing — the UI indicates that recent activity may not yet be reflected, rather than implying the indexed view is instantaneous.
- Stale data — same as above; detectable staleness should be surfaced, not hidden.
- Reorg/finality considerations — where relevant to Monad's actual finality characteristics (to be confirmed empirically per MONAD.md Section 9's note on confirmation depth), the indexer/application should not treat a transaction as final before Koby's own required confirmation depth is reached, even if the indexer picked up the event earlier.
- Incorrect event decoding — indexer configuration must match the actual deployed contract's ABI exactly; a mismatch here is a deployment-process failure to catch before go-live (Section 25), not something the application can detect and correct for at runtime.
- Malformed indexed records — validated before being trusted for display, same principle as any other external data source (Section 4).
- Synchronization failures — surfaced as an "indexer unavailable" state (ARCHITECTURE.md Section 16), with direct contract reads as the fallback for anything the user needs to act on right now.

For any critical financial state a user is about to act on (funding, repaying), the application must be able to distinguish "this is what the indexer last saw" from "this is the contract's current state" — and should prefer the latter at the moment of a financial decision.

---

## 17. RPC AND NETWORK SECURITY

- **Incorrect chain configuration / wrong RPC** — the application's RPC configuration is set per-environment (Section 19) and validated against the expected chain ID (MONAD.md Section 12) at connection time, not assumed correct.
- **Malicious/misconfigured RPC** — the application should not treat a single RPC response as unconditionally authoritative for anything security-critical if a cheap cross-check (e.g. against the block explorer, or an alternate public RPC from MONAD.md Section 12) is feasible.
- **Stale reads** — a read that returns unexpectedly old-looking data (e.g. a block number far behind expected) should be treated with suspicion rather than trusted at face value.
- **Transaction submission failures** — handled explicitly (Section 20 of MONAD.md's failure-mode table) rather than assumed successful if no immediate error is returned.
- **Chain mismatch** — see wallet security (Section 8) — the app checks the connected wallet's chain against the expected one before allowing transaction construction.
- **Contract address mismatch** — the application only uses the contract address from verified, per-environment configuration (Section 19), never a value that could be altered by an unauthorized change to unvalidated config.
- **Testnet/mainnet confusion** — the two are never mixed (MONAD.md Section 12); the application's environment configuration makes it structurally difficult to point a testnet build at mainnet values or vice versa (e.g. distinct, clearly named environment files/variables per network).

Network values are never hard-coded without verification (MONAD.md Section 12's verification note) — configuration boundaries (ARCHITECTURE.md Section 22) are how network-specific values enter the application, not values typed directly into application logic.

---

## 18. EXTERNAL SERVICE SECURITY

For Nansen, ENVIO, Privy, Chainlink (if ever used), RPC providers, and the AI provider, the general principle:

**External integrations must be isolated behind service boundaries (ARCHITECTURE.md Section 11) and must not silently become trusted financial authorities.**

No provider-specific security guarantee is invented in this document — each provider's actual documented capabilities and guarantees should be verified against their own current documentation at implementation time (the same discipline MONAD.md Section 12/25 applied to Monad's own network details). What this document does specify is Koby's own responsibility regardless of provider: isolate the integration, validate what comes back from it, and never let it directly authorize a financial transaction (Section 4).

---

## 19. DATA SECURITY AND PRIVACY

- **Personal information** (if collected as part of business/financier profiles) is stored only as needed for the product to function, and access to it is scoped to its owner (Section 11).
- **Business financial information** (submitted revenue estimates, descriptions) is treated as sensitive, self-reported business data — stored only as needed, and never presented elsewhere as independently verified (AI.md Section 3).
- **Wallet addresses** are public onchain identifiers by nature, but any offchain linkage between a wallet address and other personal/profile information should be protected with the same care as other personal data.
- **Authentication information** — handled via standard secure practices for whatever auth provider is used (Section 11); Koby does not independently store passwords if a third-party identity provider is used.
- **API responses** (from Nansen, the AI provider) may contain data that shouldn't be re-exposed beyond what the UI needs to show — the backend shapes responses down to what's necessary (Section 12).
- **AI inputs** — minimized per AI.md Section 22; never includes private keys, seed phrases, or credentials.
- **Logs** — see Section 23.
- **Analytics** (Koby's own product analytics, if any) should not capture financial transaction details beyond what's needed for the product to function, and should never capture wallet-signing material.

**Never committed to the repository, under any circumstance:** private keys, seed phrases, API secrets, authentication secrets, production credentials, or any sensitive environment variable (AGENTS.md section 39). `.env.example` documents required variable names only.

---

## 20. ADMIN SECURITY

If the MVP includes any administrative capability at all (e.g. a pause function), it is designed under least privilege: the smallest set of people have access, the access is scoped to the narrowest capability that serves an actual operational need (Section 5), and it is authenticated at least as strongly as any other privileged action in the system.

**Must never be assumed:** that an administrator is automatically trusted with unrestricted financial control. No admin function should be able to directly move user funds, alter recorded accounting values, or reassign a position's business/financier.

Configuration changes (network values, contract addresses — Section 17) should go through a controlled process, not an ad hoc edit with no record of who changed what. Emergency controls (Section 26) are limited to containment (e.g. pausing new operations), not fund extraction. Audit logging (Section 23) should capture admin actions specifically, given their sensitivity. Separation of responsibilities (e.g. the person who can pause the contract isn't necessarily the same person with server/infrastructure access) is preferable where team size allows it, though this document does not assume Koby's actual team structure.

---

## 21. DEMO AND MOCK SECURITY

Simulated data is always labeled — **Demo**, **Simulated**, **Testnet**, **Mock**, or **Placeholder** — wherever it appears (AGENTS.md section 38, PRD.md Section 21).

**Never fabricated, under any circumstance, including for demo purposes:** transaction hashes, contract addresses, wallet balances, confirmations, repayment events, settlement results, or any other blockchain activity. If something can't be shown as real (e.g. Nansen is down), the correct behavior is a labeled simulated fallback or an "unavailable" state (Section 15, ARCHITECTURE.md Section 16) — never a fabricated-but-unlabeled substitute.

The demo must let a viewer tell, at every point, which parts are real testnet actions (an actual signed transaction, an actual confirmed contract state) and which parts are simulated UI data (a fictional business, a fictional receivables figure) — MONAD.md Section 22's REAL vs. SIMULATED table is the reference for this distinction and should be kept current through implementation.

---

## 22. ERROR HANDLING

Security-sensitive errors fail closed: an error must never be silently converted into an apparent success.

- A failed transaction is never shown or treated as a successful financing action.
- An unavailable indexer is never shown or treated as a confirmed repayment.
- An AI failure is never shown or treated as an approved financing recommendation (AI.md Section 19).
- Stale data is never shown with the same confidence as current data (Section 10, Section 16).
- An RPC failure is never shown or treated as a successful transaction.

Error messages given to users are informative enough to be useful (what was attempted, what happened, what the consequence was — PRD.md Section 20) without exposing secrets, internal paths, stack traces, or implementation details that could aid an attacker (Section 12).

---

## 23. LOGGING AND MONITORING

**Logged:** authentication events; authorization failures (an attempt to act on a position the caller isn't entitled to); transaction failures (with hash and failure reason where available); contract interaction failures; API failures (Nansen, AI provider, RPC); abnormal request patterns (potential abuse); admin actions; and integration failures (indexer sync issues, provider outages).

**Never logged, under any circumstance:** private keys, seed phrases, authentication secrets, API secrets, or unnecessary sensitive financial information beyond what's needed to debug an issue (e.g. logging a transaction hash and a revert reason is appropriate; logging a user's full raw submitted business description alongside every request may not be, if it contains information beyond what's needed for debugging).

Logs support both debugging and security review (e.g. spotting a pattern of unauthorized-access attempts); they are not a substitute for the actual access-control mechanisms described elsewhere in this document.

---

## 24. TESTING STRATEGY

**Smart contract tests (Foundry, per AGENTS.md section 42):** authorization (every access-control check in Section 5); state transitions (every valid and invalid transition in Section 5/MONAD.md Section 6); accounting (the invariant in Section 5, including edge cases like exact-completion repayment and attempted overpayment); repayment and funding happy/failure paths; invalid inputs (zero amounts, wrong token, wrong caller); malicious/non-standard token behavior where feasible to simulate; reentrancy attempts; and general edge cases (maximum values, minimum nonzero values).

**Integration tests:** wallet-to-contract flow; contract-to-Monad transaction lifecycle (Section 9); token transfer interactions; indexer behavior against real emitted events; external API (Nansen, AI) integration including failure-mode handling (Section 15, AI.md Section 27).

**Frontend tests:** transaction-state handling (Section 9) under both success and failure; malicious/malformed input handling (Section 10); verification that no privileged action is gated only by frontend visibility (Section 5, Section 10); error-state rendering (Section 22); and network-mismatch handling (Section 8, Section 17).

**AI tests:** as specified in AI.md Section 27 — schema validation, malformed output, prompt injection, missing/contradictory data, hallucination, and unsafe-recommendation detection, with explicit verification that no AI output path leads to a signed transaction without human review (AI.md Section 27's stated invariant).

**End-to-end tests:** the core lifecycle — `Create financing → Fund → Repay → Update outstanding balance → Complete` — exercised against a real Monad testnet deployment (MONAD.md Section 23's "minimum critical path"), not only against mocks.

Functionality is only marked complete when actual tests have proven it — this document does not consider any of the above satisfied merely because it's specified here (AGENTS.md section 42).

---

## 25. SECURITY CHECKLIST

**Before contract deployment:**

```
[ ] All Section 5 contract-security requirements reviewed against the actual implementation
[ ] Foundry test suite covers authorization, state transitions, accounting, and reentrancy
[ ] All Foundry tests passing
[ ] Token handling verified against the actual chosen token's real behavior (MONAD.md Section 11)
[ ] No admin function can move user funds or alter accounting directly
```

**Before testnet demo:**

```
[ ] Transaction confirmation UX reviewed (Section 8, Section 9)
[ ] Environment variables checked — correct network, correct contract address, no secrets present client-side
[ ] External integrations (Nansen, AI, indexer) verified to fail gracefully, not silently
[ ] AI output validated end-to-end against AI.md Section 12
[ ] All simulated/demo data clearly labeled (Section 21)
[ ] Network configuration verified against MONAD.md Section 12 (re-verified, not assumed from memory)
[ ] Contract address in app configuration matches the actual deployed address
```

**Before mainnet deployment (not required for the hackathon MVP, included for completeness):**

```
[ ] Independent security review/audit of contract code
[ ] All MVP security requirements re-verified against mainnet-specific configuration
[ ] Incident response plan (Section 26) reviewed and ready
[ ] Real funds exposure understood and explicitly accepted by the team
```

**Before hackathon submission:**

```
[ ] At least one real, independently-confirmable Monad testnet transaction demonstrated
[ ] Indexing behavior checked against the actual deployed contract's events
[ ] Failure states (Section 20 of MONAD.md) tested, not just implemented
[ ] Documentation (AGENTS.md, PRD, ARCHITECTURE, MONAD, AI, this document) synchronized with what was actually built
[ ] No secrets present anywhere in the submitted repository
```

No item on this checklist is marked complete by virtue of appearing in this document — these are requirements for later phases to satisfy and verify.

---

## 26. INCIDENT AND EMERGENCY HANDLING

If a contract vulnerability is discovered: contain first (pause new operations if a pause mechanism exists and the vulnerability is exploitable in-flight), assess the actual exposure (which positions/funds are affected), and avoid taking any action that could destroy evidence needed to understand what happened.

If an incorrect transaction occurs: do not attempt to silently "correct" displayed state to hide it — investigate the actual onchain cause, and communicate what happened plainly, consistent with Section 22's fail-closed principle applied to communication as well as code.

If an external provider (Nansen, AI, RPC) is compromised or behaves unexpectedly: isolate the integration (the service-boundary design in ARCHITECTURE.md Section 11 exists partly for this reason — an isolated integration can be disabled without taking down the rest of the app), and fall back to the appropriate "unavailable"/simulated-labeled state (Section 21) rather than continuing to trust its output.

If API credentials leak: rotate the affected credential immediately, and review logs (Section 23) for any activity that occurred using the leaked credential during the exposure window.

If AI behavior becomes unsafe (e.g. producing outputs that pass validation but are substantively misleading): the AI-analysis feature should be disabled or fall back to "assessment unavailable" (AI.md Section 19) while the issue is investigated, rather than continuing to serve output known to be unreliable.

If indexing becomes inconsistent: rely on direct contract reads for anything the user needs to act on (Section 16) while the indexer is repaired or resynced.

If RPC configuration is compromised (e.g. pointed at a malicious endpoint): revert to a known-good, verified RPC endpoint (MONAD.md Section 12) immediately.

If unauthorized admin activity occurs: revoke the compromised credential/access immediately, and review the audit log (Section 23) for the actions taken during the compromise.

**General principles across all of the above:** contain the issue before doing anything else; preserve logs/evidence rather than deleting them in a rush to "clean up"; communicate clearly and honestly about what happened and what is and isn't affected, rather than minimizing; rotate any credential that may have been exposed; investigate affected transactions/positions specifically rather than assuming the blast radius; and only resume normal operation once the underlying cause is actually addressed, not just once the immediate symptom stops.

This document does not assume Koby has, or needs to invent for a hackathon MVP, a formal incident-response team or organization — these are principles a small team can and should still follow.

---

## 27. SECURITY ASSUMPTIONS

Explicitly documented, not presented as guarantees:

- Users control their own wallets and private keys; Koby cannot protect a user whose own key is compromised outside of Koby's systems.
- The Monad network behaves according to its own protocol guarantees (finality, ordering, correct execution) — Koby's security model is built on top of this assumption, not a replacement for it.
- Deployed contract bytecode matches the reviewed source code (i.e. the deployment/verification process, MONAD.md Section 14, was followed correctly).
- External providers (Nansen, the AI provider, RPC providers) can fail, return incorrect data, or become temporarily unavailable — Koby's design assumes this will happen at some point, not that it might.
- AI can produce incorrect, incomplete, or misleading output even when it passes schema validation — validation catches malformed output, not necessarily wrong-but-well-formed output (AI.md Section 12).
- Indexed data can become stale or temporarily inconsistent with actual contract state.
- RPC providers can return errors, stale data, or be temporarily unreachable.
- User-provided data (business descriptions, submitted figures) can be inaccurate or intentionally misleading, and Koby's AI/assessment layer treats it accordingly (self-reported, not verified — AI.md Section 3).

None of the above is a guarantee that a failure won't happen — they are the conditions this document's mitigations are designed around.

---

## 28. SECURITY VS PRODUCT SCOPE

**MVP security requirements** (this document, as scoped to what PRD.md/ARCHITECTURE.md/MONAD.md/AI.md actually define): everything in Sections 5–24 above, scoped to the `Created → Funded → Repaying → Completed` state machine, the single financing/repayment token, manual/demo-triggered repayment, and the AI-as-analysis-layer boundary.

**Future security improvements** (not required for the MVP, and not to be treated as already addressed): a formal third-party contract audit; offchain signature/permit infrastructure (Section 5's replay-protection section) if a future feature needs it; more sophisticated admin role separation if the team or feature set grows; security requirements for any future payment-rail/oracle integration (MONAD.md Section 8's future automation); and mainnet-specific hardening (Section 25's mainnet checklist) once/if Koby moves beyond testnet.

Security requirements in this document protect the actual Koby MVP as scoped — they do not require building infrastructure the MVP doesn't need (e.g. no signature/permit system is required here, because nothing in the MVP's design needs one yet).

---

## 29. RELEASE SECURITY GATE

Koby is not ready for a real testnet financial demo until:

- Critical contract behavior (Section 5, Section 6, Section 7) is tested and passing, not just implemented.
- Financial accounting (Section 5's invariant) is verified against real test transactions, not just reasoned about.
- Transaction handling (Section 9) is reliable across the full lifecycle, including failure paths.
- Wallet authorization (Section 8) is explicit — every financial action shows the user exactly what they're signing before they sign it.
- External data (Nansen, RPC, indexer) is validated at every boundary (Section 4) and every failure mode has a defined, non-fabricating fallback.
- AI boundaries (Section 13, AI.md throughout) are enforced — no path exists from AI output to a signed transaction without human review.
- Simulated/demo data is clearly and consistently labeled everywhere it appears (Section 21).
- No secrets are exposed anywhere in the client, the repository, or logs (Section 12, Section 19, Section 23).
- Network and contract configuration is verified against the actual deployed environment (Section 17, MONAD.md Section 12), not assumed from an earlier stage of development.
- Failure paths (Section 20 of MONAD.md, Section 22 of this document) have been actually tested, not just described.

This section defines the gate — it does not claim the gate has been passed. That determination happens during implementation and testing (Section 24, Section 25), against this document.
