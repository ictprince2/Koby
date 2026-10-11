# KOBY — MONAD.md

Source of truth order: AGENTS.md → docs/PRD.md → docs/ARCHITECTURE.md → this document.

**Verification note:** all network values in this document (chain IDs, RPC URLs, explorers, faucet, the testnet USDC address) were verified against official Monad documentation (docs.monad.xyz) and, for the USDC address, cross-checked against Circle's own developer documentation, on **September 19, 2026**. Monad testnet has been reset from genesis before (most recently 2025-12-16, per official docs) and network details can change. **Before deployment, re-verify every value in Section 12 and Section 11 against docs.monad.xyz directly** — do not treat this document as a live source once time has passed since the date above.

---

## 1. PURPOSE

Koby does not merely deploy a contract on Monad and call that "using Monad." Monad is where Koby's actual financial events happen:

- A financing opportunity becomes real when its terms are recorded in a Monad transaction.
- Capital moves from financier to business through a Monad transaction.
- Every repayment is a Monad transaction, validated by the contract, not a database write.
- The financing state a business or financier sees (funded, repaying, completed, outstanding balance) is Monad contract state, read directly or via an indexer that mirrors Monad events — never a value the frontend invents.

If a Koby financing position's status can change without a corresponding Monad transaction, that is a bug relative to this document.

---

## 2. WHY MONAD

Koby's product need is: two independent parties (a business and a financier) need a shared, tamper-evident record of a financial obligation, updated frequently (funding, then potentially multiple repayments) and settled with enough speed that the product feels usable rather than bureaucratic.

Monad is used because:

- **Financing settlement** — funding a position is a real transfer of value; it needs finality the counterparty can trust without trusting Koby.
- **Programmable financial state** — the financing state machine (Section 6) is enforced by contract logic, not by a backend team's judgment call.
- **Transparent transaction history** — both parties, and anyone else, can independently verify what was funded and what has been repaid.
- **Repayment execution** — each repayment is a discrete, validated transaction rather than an edit to a row in a database.
- **Onchain event generation** — funding and repayment events are what the indexing layer (Section 16, ARCHITECTURE.md Section 12) and the UI's activity history are built from.
- **High-frequency financial state updates where applicable** — a financing position with multiple repayment installments means multiple state-changing transactions over the position's lifetime; this benefits from a chain where routine transactions are inexpensive enough that frequent repayment doesn't become a cost burden.

This document does not claim a specific numeric performance figure as a Koby guarantee. Monad's own materials describe target figures (e.g. sub-second block time and finality — see Section 25 for the source), but those are Monad network characteristics, not something Koby is claiming to deliver or benchmarking itself against. Koby's justification for Monad is what Koby actually executes there (above), not an unqualified "Monad is fast."

---

## 3. CORE ONCHAIN OPERATIONS

| Operation          | MVP status                                          | Notes                                                                                                                                                                                                                                                      |
| ------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create Financing   | **Required**                                        | Records a financing opportunity's terms onchain; the position exists onchain from this point. Per PRD.md Section 10, any connected wallet may submit Create specifying any business address (open creator).                                                                                                                                                              |
| Fund Financing     | **Required**                                        | The financier's capital commitment; moves state `Created → Funded`. Per PRD.md Section 14, atomic push in the same transaction from financier straight to the business; contract never holds funding balances.                                                                                                                                                                                        |
| Record Repayment   | **Required**                                        | Each repayment transaction; moves state toward `Completed` (Section 6). Per PRD.md Section 11, atomic push in the same transaction from the business straight to the recorded financier; contract never holds repayment balances.                                                                                                                    |
| Complete Financing | **Required, but not a separate manual transaction** | Completion is a state transition the contract applies automatically when a repayment transaction brings outstanding balance to zero — not a distinct operation someone separately triggers.                                                                |
| Settle Financing   | **Not a distinct operation in the MVP**             | "Settlement" is not modeled as its own transaction separate from Funding — funding a position _is_ its settlement event. If a future version needs a distinct settlement step (e.g. an escrow release separate from funding), it would be introduced then. |

At minimum, **Create, Fund, and Record Repayment are real Monad transactions in the MVP** — this satisfies the requirement that Koby have at least one (in fact, three) meaningful core financial operations executing on Monad.

**Optional/future:** a distinct `Cancel` or `Default` operation — not part of the MVP (ARCHITECTURE.md Section 5 explains why).

---

## 4. KOBY ONCHAIN LIFECYCLE

```
Business
  ↓
Financing Opportunity  (AI assessment + proposed terms, offchain until accepted)
  ↓
Financing Terms  (business accepts terms)
  ↓
Wallet Approval  (business signs the Create Financing transaction)
  ↓
Transaction Submission
  ↓
Monad
  ↓
Koby Smart Contract  (validates and records the new position)
  ↓
State Update  (Created)
  ↓
Event Emission  (FinancingCreated)
  ↓
Indexer
  ↓
Koby UI  (position now visible in the marketplace)
```

The same shape repeats for Funding (financier signs, `Created → Funded`, `FinancingFunded` emitted) and for each Repayment (business signs, amount repaid/outstanding balance updated, `RepaymentRecorded` emitted, and — on the qualifying repayment — `FinancingCompleted` emitted as the contract's own consequence of that transaction, not a separate signed action).

---

## 5. SMART CONTRACT RESPONSIBILITY

Onchain state (minimum necessary, per ARCHITECTURE.md Section 4):

- Financing ID
- Business address
- Financier address (set at funding; empty/unset before)
- Principal (financing amount)
- Repayment obligation
- Amount repaid
- Outstanding balance (computed, not independently stored — see Section 7)
- Created timestamp
- Status

Explicitly **not** stored onchain: AI assessment reports/explanations, raw Nansen data, business descriptive metadata (name, description, marketing copy), UI preferences. These are offchain/application data (ARCHITECTURE.md Section 4) — storing them onchain would add gas cost and storage bloat with no financial-integrity benefit, since none of it is a value either party needs a tamper-evident, contract-enforced record of.

---

## 6. FINANCING STATE MACHINE

Per ARCHITECTURE.md Section 5, the MVP state machine is:

```
Created
  ↓  (financier funds)
Funded
  ↓  (first repayment transaction recorded)
Repaying
  ↓  (outstanding balance reaches zero)
Completed
```

`Active`, `Defaulted`, and `Cancelled` are **not** implemented in the MVP — ARCHITECTURE.md Section 5 explains why (no distinct meaning yet for `Active`; no PRD-level rules yet for what triggers default or cancellation).

| Transition               | Trigger                                                          | Who can call it                                                             | Condition                                                                               | Event emitted                                  |
| ------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------- |
| — → `Created`            | Create Financing tx                                              | Any connected wallet specifying any business address (open creator per PRD.md Section 10) | Valid terms (nonzero principal, nonzero repayment obligation, valid business address); single testnet USDC only | `FinancingCreated`                             |
| `Created` → `Funded`     | Fund Financing tx                                                | Any address acting as financier (becomes _the_ financier for this position) | Position is in `Created` state; funding amount exactly equals principal; exact-amount approval as distinct step, no permit | `FinancingFunded`                              |
| `Funded` → `Repaying`    | First Repayment tx                                               | The business address associated with the position                           | Position is in `Funded` state; repayment amount > 0 and ≤ outstanding balance           | `RepaymentRecorded`                            |
| `Repaying` → `Repaying`  | Subsequent Repayment tx(s)                                       | The business address                                                        | Position is in `Repaying` state; repayment amount > 0 and ≤ current outstanding balance | `RepaymentRecorded`                            |
| `Repaying` → `Completed` | The repayment tx that brings outstanding balance to exactly zero | The business address (same call as the repayment)                           | Resulting outstanding balance == 0                                                      | `RepaymentRecorded`, then `FinancingCompleted` |

**Invalid transitions** (must be rejected by the contract): funding an already-`Funded` position; funding with an amount not exactly equal to principal; recording repayment against a `Created` (not yet funded) or `Completed` position; any repayment that would push amount repaid above repayment obligation (strict revert, no partial cap); any zero-amount funding or repayment; any state-changing call from an address that isn't the position's business (for repayment) or any second funder (for funding, only when the position is still `Created`).

---

## 7. FINANCIAL ACCOUNTING

Integer/base-unit accounting throughout:

- If the financing/repayment asset is a stablecoin (Section 11), amounts are in that token's base units (e.g. 6 decimals for USDC — 1.00 USDC = `1000000` base units).
- MON (native asset, used for gas in the MVP) is handled in wei where relevant.
- Any rate or percentage used in computing terms is expressed in basis points, not a decimal or float.

Represented values and the accounting invariant:

```
outstanding_balance = repayment_obligation − amount_repaid
```

`amount_repaid` only ever increases, only via a validated repayment transaction, and the contract must reject any repayment that would make `amount_repaid > repayment_obligation`.

**Prevented by contract logic, not by frontend discipline:**

- **Double repayment** — each repayment transaction is validated against the _current_ outstanding balance at execution time, not a value cached by the frontend.
- **Over-repayment** — rejected if it would exceed the repayment obligation.
- **Unauthorized balance changes** — only the repayment function, called by the business address tied to that specific position, can increase `amount_repaid`; there is no other write path to these fields.
- **Rounding inconsistencies** — all arithmetic happens in the token's base units inside the contract; any unit conversion for display happens only in the frontend, after reading the authoritative base-unit value.
- **Floating-point calculations** — none, anywhere in the accounting path. JavaScript's floating-point arithmetic is never used to compute or validate a repayment, outstanding balance, or completion condition; the frontend may format a number for display but must not use frontend arithmetic to decide whether a repayment is valid or a position is complete.
- **Invalid state accounting** — the state transition table in Section 6 and the invariant above are enforced together: a transition to `Completed` can only happen as a consequence of the invariant reaching zero, not as an independently callable action.

---

## 8. REPAYMENT MODEL

This mirrors ARCHITECTURE.md Section 13 and PRD.md Section 11 — restated precisely for the Monad-specific context.

```
Financing Agreement
  ↓
Repayment Terms Encoded Onchain
  ↓
Repayment Transaction / Trigger
  ↓
Contract Validation
  ↓
Amount Repaid Updated
  ↓
Outstanding Balance Updated
  ↓
Completion When Conditions Are Met
```

**What causes the repayment transaction today (MVP per PRD.md Section 11):** manual business-signed transactions plus, for the demo, a clearly labeled simulated trigger that still submits a real validated transaction on Monad testnet as the recorded business (for example a "simulate repayment" action — the transaction and its validation are real; only the reason the business "has" the money is simulated, since no real payment rail exists yet). Only the recorded business address may submit a valid repayment. The exact demo trigger and stand-in signer must be stated plainly in `docs/HACKATHON.md` once built, and whichever path is used, it is never described as "automatic" or "autonomous."

**What Koby does NOT claim in the MVP:** that it detects real-world business revenue arriving and submits a repayment transaction on the business's behalf without the business (or a demo stand-in for the business) initiating it. No such mechanism exists.

**What true revenue-triggered automation would require, in a future version:**

- A payment-rail integration (e.g. a payment processor that can notify Koby when real revenue arrives)
- A trusted mechanism to convert that notification into an authorized onchain repayment transaction (this could be a server-side signer with narrowly scoped permissions, an account-abstraction session key, or an oracle-fed trigger — each has different trust and security tradeoffs that would need their own security review before being built)
- Scheduled/automated execution infrastructure to actually submit the transaction without a human in the loop
- Explicit contract-level permissions scoped to that mechanism, reviewed with the same rigor as any other state-changing access path (AGENTS.md section 19)

None of this exists in the MVP. It is documented here so that "future version" stays a specific, honest roadmap item rather than a vague aspiration that quietly gets treated as already-built.

---

## 9. MONAD TRANSACTION STATES

`idle → preparing → awaiting_wallet → submitted → confirming → confirmed → failed` (ARCHITECTURE.md Section 8), mapped to Monad specifically:

- **`idle`** — no transaction in progress.
- **`preparing`** — the app is building calldata (e.g. converting a display amount into token base units) and estimating gas.
- **`awaiting_wallet`** — the wallet has been asked to sign; waiting on the user.
- **`submitted`** — the signed transaction has been broadcast to Monad; the transaction hash is known and shown to the user immediately.
- **`confirming`** — the transaction has been included in a Monad block but has not yet reached the confirmation depth the app requires before treating it as final.
- **`confirmed`** — the required confirmation depth has been reached; only now does the UI show success.
- **`failed`** — the wallet rejected the request, the transaction reverted, or it was dropped; the failure reason is shown.

How many confirmations count as "confirmed" is an implementation decision to be made and tested against actual Monad testnet behavior during development — this document does not hardcode a confirmation count based on marketing figures for block time or finality, since those should be empirically verified against the live network before being relied on.

Rules restated: never show success before `confirmed`; always preserve and display the transaction hash once known; never fabricate a hash, a confirmation, or a balance under any circumstance, including when an external service (Nansen, the indexer) is slow or unavailable — in that case the correct behavior is an `unavailable`/loading state (ARCHITECTURE.md Section 16), not a guessed value.

---

## 10. WALLET INTERACTION

Before any Monad transaction is requested, the UI shows: action, amount, token, target, network, and the relevant financing terms (AGENTS.md section 28). Example: **"Fund $70,000 Financing"**, not **"Continue."**

```
Koby application
  ↓
Wallet abstraction
  ↓
Privy (or another supported wallet provider)
  ↓
Monad
```

Privy is Koby's MVP wallet/onboarding provider for connection and signing only (docs/HACKATHON.md Section 14 — evaluated against Mera and chosen for hackathon demo reliability) and sits entirely inside the wallet abstraction (ARCHITECTURE.md Section 9, PRD.md Section 16). It simplifies how a user obtains and signs with a wallet, but the transaction it produces is a normal Monad transaction, verifiable the same way regardless of onboarding provider. Privy creates no separate account layer and Koby remains an open page with wallet as the only sign-in. Privy is never the source of financial truth — the contract is (Section 5), and this remains true regardless of which wallet/onboarding provider a user came through.

---

## 11. TOKEN / ASSET MODEL

No Koby token exists or is planned for the MVP.

- **Native MON** — used for gas on Monad testnet/mainnet transactions.
- **Financing/repayment asset** — a single testnet stablecoin (USDC), for the reason that financing amounts and repayment obligations are business-denominated (e.g. "$70,000") and a stablecoin keeps that denomination stable across the financing's lifetime, unlike a volatile asset. Per PRD.md Section 14, bound once as an immutable constructor parameter to the re-verified address; no other token accepted in the MVP. Decimals are a fixed verified constant (6), never read per-use.
- **Business/accounting denomination** — USD, for presentation only; the actual token moved onchain is the stablecoin, not a representation of USD itself.

**Verified as of September 19, 2026:** USDC is available on Monad testnet at `0x534b2f3A21130d7a60830c2Df862319e593943A3` (6 decimals), obtainable via Circle's testnet faucet at `https://faucet.circle.com` (select USDC and "Monad Testnet"; rate-limited to one request per stablecoin/testnet pair per 2 hours) — confirmed independently in both Monad's own developer documentation and Circle's developer documentation (Section 25).

**This address must be re-verified immediately before contract deployment**, not assumed from this document at implementation time — testnet resets have happened before (Section header note) and could affect token deployments. No mainnet USDC address is included here, since the MVP targets testnet only (Section 12); if a future production deployment targets mainnet, the mainnet USDC address must be separately verified at that time.

---

## 12. NETWORK CONFIGURATION

### Development / Testnet (used for the MVP and hackathon demo)

| Field                        | Value                                                             |
| ---------------------------- | ----------------------------------------------------------------- |
| Network name                 | Monad Testnet                                                     |
| Chain ID                     | `10143`                                                           |
| Native currency              | MON                                                               |
| Public RPC (HTTPS)           | `https://testnet-rpc.monad.xyz`                                   |
| Public RPC (WebSocket)       | `wss://testnet-rpc.monad.xyz`                                     |
| Alternate public RPC         | `https://rpc.ankr.com/monad_testnet` (Ankr; no `debug_*` methods) |
| Alternate public RPC         | `https://rpc-testnet.monadinfra.com` (Monad Foundation; 20 rps)   |
| Block explorer (MonadVision) | `https://testnet.monadvision.com`                                 |
| Block explorer (Monadscan)   | `https://testnet.monadscan.com`                                   |
| App hub                      | `https://testnet.monad.xyz`                                       |
| Faucet (MON, gas)            | `https://faucet.monad.xyz`                                        |
| Faucet (testnet USDC)        | `https://faucet.circle.com` (select "Monad Testnet")              |

### Production / Mainnet (not used by the MVP; documented for completeness only)

| Field                        | Value                     |
| ---------------------------- | ------------------------- |
| Network name                 | Monad (Mainnet)           |
| Chain ID                     | `143`                     |
| Native currency              | MON                       |
| Public RPC                   | `https://rpc.monad.xyz`   |
| Block explorer (MonadVision) | `https://monadvision.com` |

**These two networks are never mixed.** The MVP, all testing, and the hackathon demo run entirely on Monad Testnet (chain ID `10143`). No mainnet transaction, address, or configuration value is used anywhere in the MVP. No private keys or secrets are included in this document or any other committed file (AGENTS.md section 39).

---

## 13. TESTNET DEVELOPMENT

- **Wallet setup** — configure a development wallet (e.g. MetaMask) with Monad Testnet using the values in Section 12. Do not use a wallet holding real funds for development.
- **Obtaining testnet funds** — MON for gas from `https://faucet.monad.xyz`; testnet USDC for financing amounts from `https://faucet.circle.com` (Section 11).
- **Configuring the application** — point the app's RPC configuration at a Testnet endpoint from Section 12 (prefer the QuickNode-backed default `https://testnet-rpc.monad.xyz` for development; consider a dedicated/rate-limit-friendly provider if development traffic is high).
- **Deploying contracts** — see Section 14.
- **Verifying transactions** — check the transaction hash on MonadVision or Monadscan (Section 12) to confirm inclusion and status independent of the app's own UI.
- **Checking balances** — read MON and testnet-USDC balances via the block explorer or a direct RPC call, not just the app's cached display.
- **Checking contract state** — read financing position fields directly via the explorer's contract-read interface or a script, to independently confirm what the app is displaying matches actual chain state.

Address types are not interchangeable and must not be confused:

- **EOA / wallet address** — a business's or financier's own wallet (e.g. a MetaMask account or a Privy-managed wallet).
- **Contract address** — the deployed Koby financing contract's address, produced by deployment (Section 14), not chosen in advance.
- **Token contract address** — the testnet USDC address in Section 11, which is neither a wallet nor the Koby contract.

No private keys are requested, stored, or displayed by any part of this process.

---

## 14. DEPLOYMENT STRATEGY

1. Configure Monad Testnet network settings (Section 12) in the deployment tooling.
2. Compile contracts.
3. Run Foundry tests (AGENTS.md section 42) — do not proceed if any fail.
4. Deploy the contract to Monad Testnet.
5. Record the deployment address (this becomes the "Contract address" referenced throughout the app's configuration — see ARCHITECTURE.md Section 22).
6. Verify the contract on the block explorer, if/when explorer contract verification is supported for the deployed compiler version.
7. Configure the application's environment with the network values (Section 12) and the newly deployed contract address.
8. Test each transaction type (create, fund, repay) against the live testnet deployment.
9. Verify each expected event (Section 15) is actually emitted and matches expectations.
10. Connect the indexing layer (Section 16) to the deployed contract's events.
11. Validate that the frontend's displayed state matches direct contract reads for the same position.

No specific deployment commands are prescribed here — those depend on the exact Foundry version and project setup chosen at implementation time, which should be verified against Foundry's own current documentation rather than assumed from this document.

---

## 15. EVENT MODEL

Consistent with ARCHITECTURE.md Section 12 — only events the final contract design actually needs to emit:

| Event                | Emitted when                                          | Key fields                                                                                                  | Indexer uses it for                                           | Frontend can display                                      |
| -------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| `FinancingCreated`   | A new financing position is recorded                  | financing ID, business address, principal, repayment obligation, timestamp                                  | Registers a new position for history/listing                  | New entry in the marketplace and business dashboard       |
| `FinancingFunded`    | A financier funds a `Created` position                | financing ID, financier address, funded amount, timestamp                                                   | Marks the position funded; associates the financier           | Funded status, financier identity (address), funding date |
| `RepaymentRecorded`  | Each valid repayment transaction                      | financing ID, amount repaid (this transaction), new amount repaid total, new outstanding balance, timestamp | Builds the chronological repayment history and running totals | Repayment history list, updated outstanding balance       |
| `FinancingCompleted` | The repayment that brings outstanding balance to zero | financing ID, timestamp                                                                                     | Marks the position complete                                   | Completion badge/state on the position                    |

`LiquiditySettled` and `FinancingDefaulted` are **not** part of the MVP event set — consistent with Section 3 (no distinct settlement operation) and Section 6 (no default state in the MVP state machine).

---

## 16. ENVIO / INDEXING

```
Koby Contract
  ↓
Monad Event
  ↓
ENVIO / Indexer
  ↓
Normalized Financing Data
  ↓
Koby Application
  ↓
Frontend
```

The indexer is a read-optimization layer for history and list views; it is never the source of truth (Section 5, Section 7). If indexed data and a direct contract read for the same position disagree, the contract read is correct and the discrepancy is treated as an indexer sync issue.

- **Delayed indexing** — the UI shows the most recently indexed state with an indication that it may be slightly behind live chain state, rather than blocking on the indexer to show anything.
- **Missing events** — if an event the app expects isn't present in indexed data (e.g. right after a transaction confirms, before the indexer catches up), the app falls back to a direct contract read for that specific position rather than showing incomplete history as if it were complete.
- **Stale indexed data** — the app should be able to detect staleness (e.g. comparing indexed "last updated" against expected freshness) and label the data as potentially stale rather than presenting it with full confidence.
- **Indexer downtime** — history/activity views show an "unavailable" state (ARCHITECTURE.md Section 16); the app does not fabricate historical events to fill the gap, and core flows (funding, repayment) that only need direct contract reads/writes continue to work even if the indexer is down.

---

## 17. MONAD + NANSEN

Different responsibilities, never merged:

```
Nansen:  Observed onchain activity → Derived cash-flow signals → AI analysis

Monad:   Financing transaction → Contract execution → Financial state → Events
```

Nansen informs the _assessment_ that leads to proposed financing terms (PRD.md Section 12, ARCHITECTURE.md Section 10). It has no path to directly change financing state on Monad. Only a validated Monad transaction (create, fund, or repay) changes financing state — Nansen data, however current or detailed, cannot itself mark a position funded, repaid, or completed.

---

## 18. MONAD + AI

```
AI Assessment
  ↓
User Review
  ↓
Transaction
  ↓
Wallet
  ↓
Monad
  ↓
Smart Contract
```

The AI service has no key, no signer, and no contract permission of any kind in the MVP. It cannot submit a transaction, and there is no code path where an AI Assessment output is converted directly into a Monad transaction without a human (business or financier) reviewing and signing. If future automation is introduced (Section 8's future-automation discussion), it must use its own explicit, narrowly scoped, separately security-reviewed contract permissions — it does not inherit any implicit trust from the AI assessment layer.

---

## 19. SECURITY CONSIDERATIONS

Monad-specific concerns (full technical spec belongs in `docs/SECURITY.md`):

- **Contract authorization** — every state-changing function checks the caller against the expected role for that position (only the recorded business for repayment; any address for funding a still-`Created` position with exactly the principal; any connected wallet for Create specifying any business — Section 6).
- **Transaction parameter validation** — the contract validates amounts itself; it does not trust frontend-computed values (Section 7).
- **Token approvals** — the financing/repayment asset (Section 11) uses approve-then-transfer with exact-amount approvals only, never unlimited; the UI shows each approval as its own step with its own clear description (Section 10); no permit signatures in the MVP.
- **Reentrancy** — standard reentrancy protection on any function that moves the financing/repayment token.
- **Replay protection** — standard Monad/EVM transaction nonce and chain-ID handling; no custom signature scheme is introduced that would need its own replay protection in the MVP.
- **State transition validation** — enforced per Section 6's table; any call requesting an invalid transition reverts.
- **Accounting integrity** — enforced per Section 7's invariant.
- **Unsafe external calls** — the contract's interactions with the financing/repayment token contract follow standard safe-transfer patterns; no arbitrary external call is made based on user input.
- **Network misconfiguration** — the app verifies it's connected to Monad Testnet (chain ID `10143`) before allowing a transaction, and warns/blocks if the wallet is on a different network.
- **Wrong-chain transactions** — same protection as above; the app checks chain ID, not just RPC reachability.
- **Wrong-contract transactions** — the app only ever constructs calls against the one recorded, verified Koby contract address (Section 14) for the current environment; it doesn't accept an arbitrary contract address from configuration without that value being explicitly set by the deployment process.
- **Malicious token contracts** — the MVP uses the specific, verified testnet USDC address (Section 11), not an arbitrary or user-supplied token address.
- **RPC reliability** — the app should be resilient to a single RPC endpoint being slow/down, given Section 12 lists more than one public testnet RPC option.
- **Stale indexed data** — see Section 16.

---

## 20. FAILURE MODES

| Failure                                  | What the system detects                                                                 | What the user sees                                                                                                                    | What the application does                                                                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wallet rejection                         | User declined the signature request                                                     | "You declined to sign this transaction."                                                                                              | Returns to `idle`; no transaction submitted.                                                                                                         |
| Transaction reverted                     | Onchain revert (contract rejected the call)                                             | Plain-language reason where derivable (e.g. "This position has already been funded."), otherwise a generic contract-rejection message | State set to `failed`; no financing state changes; hash (if any) still shown.                                                                        |
| Insufficient funds                       | Wallet/RPC reports insufficient balance for the transaction (gas or token amount)       | "You don't have enough [MON / USDC] to complete this."                                                                                | Blocks submission before `awaiting_wallet` where detectable in advance; otherwise surfaces at `failed`.                                              |
| Wrong network                            | Connected wallet's chain ID ≠ `10143` (testnet)                                         | "Please switch your wallet to Monad Testnet."                                                                                         | Blocks transaction construction until corrected; offers a network-switch action if the wallet supports it.                                           |
| RPC unavailable                          | RPC calls timing out/erroring                                                           | "We're having trouble reaching the network. Retrying…"                                                                                | Retries against an alternate public RPC (Section 12) where configured; does not treat this as a failed transaction if none was submitted.            |
| Contract unavailable                     | Contract address misconfigured or contract call reverting unexpectedly at the ABI level | Generic "Something went wrong reaching the Koby contract" message                                                                     | Logs details for debugging; does not fabricate a read result.                                                                                        |
| Indexer unavailable                      | Indexer queries failing/timing out                                                      | History/activity views show an "unavailable" state (Section 16)                                                                       | Falls back to direct contract reads for the specific position in view where feasible.                                                                |
| External service unavailable (Nansen/AI) | Service call fails/times out                                                            | Assessment shown as unavailable/pending, clearly labeled                                                                              | Demo/testnet-labeled fallback where the architecture explicitly permits it (ARCHITECTURE.md Section 16); never silently substituted as if real.      |
| Transaction pending                      | Transaction submitted, not yet at required confirmation depth                           | `confirming` state shown with hash                                                                                                    | Continues polling; does not show success.                                                                                                            |
| Transaction confirmation timeout         | Confirmation not reached within an expected window                                      | "This is taking longer than expected. You can check the transaction here: [explorer link]."                                           | Stays in `confirming` (never silently flips to `confirmed` or `failed` without actual chain evidence); gives the user a way to verify independently. |

An unknown or pending state is never presented as success.

---

## 21. DEMO RELIABILITY

The critical demo path depends on: the Koby frontend, the deployed Koby contract, and Monad Testnet — infrastructure Koby controls or that is Monad's own stable public infrastructure.

- **Nansen unavailable** → use clearly labeled demo/testnet data; continue the financing demonstration.
- **ENVIO unavailable** → do not fabricate indexed events; use a clearly labeled fallback only if the architecture explicitly permits one (ARCHITECTURE.md Section 16), otherwise show the "unavailable" state and rely on direct contract reads for the demo's specific positions.
- **Monad transaction fails** → show the real failure (Section 20); never fabricate success, even during a live demo.

---

## 22. REAL VS SIMULATED

**REAL:**

- The Monad transaction itself (create, fund, repayment)
- The deployed Koby contract and its bytecode
- The contract's resulting state (status, amounts, balances)
- The contract's accounting (Section 7)
- Emitted events, when the indexer/RPC is available

**SIMULATED / DEMO:**

- The fictional demo business (e.g. "Acme Logistics," per PRD.md Section 15)
- The fictional $100,000 future receivables figure
- Simulated business profile/history details used to feed the AI assessment
- Simulated historical cash-flow information, where real Nansen data isn't available or applicable for a fictional demo wallet

**Potentially external (status to be confirmed at implementation time, per Section 22 header note in this document and updated in `docs/HACKATHON.md`):**

- Nansen data (real observed activity for a real wallet vs. unavailable/demo-labeled)
- AI assessment (live model call vs. unavailable/fallback)
- Indexed data (live ENVIO indexing vs. direct-read fallback)

This table must be kept current as implementation proceeds — an item listed as "potentially external" today should move to REAL or SIMULATED/DEMO once its actual implementation status is known, and `docs/HACKATHON.md` is where the final, demo-day-accurate version of this table belongs.

---

## 23. CURRENT VS FUTURE

**MVP (this document, current):**

- Monad Testnet financial execution (create, fund, repay)
- Financing state (Section 6)
- Manual/demo-triggered repayment (Section 8)
- Completion as an automatic consequence of the qualifying repayment
- Event emission (Section 15) for the four retained event types

**Future (explicitly not part of the MVP):**

- True revenue-triggered repayment (Section 8)
- Automated payment-rail integration
- Additional oracle/external-data infrastructure
- Mainnet deployment (Section 12 documents mainnet values for reference only — the MVP does not deploy there)
- Cross-chain settlement, only if a genuine need is identified
- Additional financial primitives beyond the single financing position model

Nothing in this document should be read as implying any future item already exists.

---

## 24. DEVELOPMENT CHECKLIST

```
[ ] Monad network verified (re-verify Section 12 against docs.monad.xyz before deployment)
[ ] Testnet wallet configured
[ ] Testnet MON funds available (faucet.monad.xyz)
[ ] Testnet USDC funds available (faucet.circle.com) — if USDC is confirmed as the MVP asset
[ ] Contract compiled
[ ] Foundry tests passing
[ ] Contract deployed to Monad Testnet
[ ] Deployment address recorded
[ ] Contract verified on block explorer, where supported
[ ] Application network configuration set (chain ID 10143, RPC, contract address)
[ ] Financing creation tested against live testnet contract
[ ] Financing funding tested against live testnet contract
[ ] Repayment tested against live testnet contract
[ ] Completion tested (repayment that zeroes outstanding balance)
[ ] Events verified (FinancingCreated, FinancingFunded, RepaymentRecorded, FinancingCompleted)
[ ] Indexing verified (ENVIO reflects contract events correctly)
[ ] Frontend transaction states verified (Section 9) against real testnet transactions
[ ] Failure states verified (Section 20) against real rejected/reverted transactions
[ ] Demo transaction path confirmed end to end on testnet
[ ] No fake transaction data anywhere in the demo build
[ ] No secrets committed (AGENTS.md section 39)
```

No box here is marked complete in this document — it is a checklist for implementation to work through and check off in the actual repository, not a claim of current status.

---

## 25. VERIFIED EXTERNAL REFERENCES

Consulted on September 19, 2026:

- `https://docs.monad.xyz/developer-essentials/testnets.md` — Monad Testnet chain ID, network name, currency symbol, public RPC endpoints (QuickNode-backed default, Ankr, Monad Foundation), block explorers (MonadVision, Monadscan), faucet, app hub, and the 2025-12-16 genesis reset notice.
- `https://docs.monad.xyz/developer-essentials/network-information` and `https://docs.monad.xyz/ai/current-facts.md` — Mainnet chain ID (143) and Testnet chain ID (10143) cross-check.
- `https://docs.monad.xyz/guides/clear-signing.md` — Independent confirmation of mainnet chain ID 143 / testnet 10143.
- `https://docs.monad.xyz/guides/x402-guide` — Monad Testnet USDC contract address and Circle testnet faucet instructions.
- `https://developers.circle.com/stablecoins/quickstart-setup-transfer-usdc-monad` — Independent corroboration of the same Monad Testnet USDC address and decimals (6), plus example Testnet RPC/explorer values consistent with the above.
- `https://github.com/monad-developers` (official Monad Developers GitHub org page) — Confirms Monad Mainnet is live, mainnet chain ID/RPC/explorer, and Monad's own stated throughput/block-time/finality figures (cited in Section 2 only as Monad's own published characteristics, not as a Koby performance claim).
- `https://luma.com/metropolis-nyc-sep-2026` and `https://luma.com/metropolis-lon-oct-2026` (Monad Foundation / Encode Club event pages) — Confirm Monad Metropolis is a real, currently running hackathon (six weeks, September 1 – October 13, 2026 window), with the same four tracks named in AGENTS.md and a sponsor list that includes Privy, Nansen, and Chainlink, consistent with AGENTS.md's sponsor targets.

Architectural decisions in this document (the state machine resolution, the event set, the repayment-trigger model) are Koby's own design choices, not values sourced from the above references — only the network configuration (Section 12) and the token address (Section 11) are externally verified facts.

---

## FINAL VALIDATION NOTES

- Checked against AGENTS.md, PRD.md, and ARCHITECTURE.md; no contradictions found.
- Monad is treated as a genuine execution layer (Section 3, Section 4) — create, fund, and repayment are real transactions, not a deployment target for a system whose real state lives elsewhere.
- Repayment is described throughout as programmable tracking/execution (Section 8), never as autonomous real-world revenue collection.
- No fake transaction hashes, confirmations, or balances are permitted anywhere in this document's model (Section 9, Section 20).
- Network values (Section 12) and the testnet USDC address (Section 11) were verified against official/current sources before inclusion (Section 25), with an explicit instruction to re-verify before deployment.
- Future functionality (Section 23) is kept clearly separate from MVP scope.
- This document explains Monad-specific implementation requirements without writing Solidity or prescribing exact deployment commands.
