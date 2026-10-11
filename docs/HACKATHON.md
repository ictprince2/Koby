# KOBY — HACKATHON.md

Source of truth order: AGENTS.md → docs/PRD.md → docs/ARCHITECTURE.md → docs/MONAD.md → docs/AI.md → docs/SECURITY.md → docs/USER_FLOW.md → this document.

**Verification note:** all hackathon-specific facts in this document (dates, prizes, tracks, sponsor bounties, submission requirements) were verified against the official Metropolis page at `monad.xyz/developers/hackathons/metropolis` and the live banner on `monad.xyz`, on **September 21, 2026**. Where the official source doesn't specify something (exact submission-portal fields, team size limits, precise country eligibility list), this document says so explicitly rather than guessing. **Re-verify before final submission** — six weeks is enough time for details to be added or clarified on the official platform.

---

## 1. HACKATHON OVERVIEW

- **Name:** Metropolis (a Monad hackathon)
- **Organizer:** Monad Foundation
- **Format:** six-week global online hackathon, with one-day in-person "activation" meetups in several cities (not required for participation)
- **Build window:** September 1 – October 13, 2026
- **Submission deadline:** October 13, 2026
- **Judging period:** October 14 – October 27, 2026, per track
- **Winners announced:** November 3, 2026
- **Total prize pool:** $250,000+ USD across four tracks, a grand champion prize, and sponsor bounties
- **Eligibility:** open globally, online. The official page states "any eligibility restrictions are listed in the official rules on the application platform" — **Verification required**: the exact eligibility rules (e.g. any excluded countries, individual vs. entity requirements) are not stated on the public marketing page and must be checked on the actual application platform (`hackathon.monad.xyz`) before submission.
- **Team/solo participation:** both solo builders and teams are explicitly welcome. Existing teams/context may be brought in, but what's submitted on October 13 must have been built during the six-week build window.
- **Open source:** encouraged, not required — judges need to be able to verify what was built during the window, which doesn't strictly require a public repo, but "a link to the code" is part of what's submitted (Section 19).
- **Official links:** application/registration — `hackathon.monad.xyz`; program page — `monad.xyz/developers/hackathons/metropolis`.

---

## 2. KOBY'S TARGET TRACK

Koby's intended track: **Onchain Finance & Trading** ($30,000 prize pool for this track, split evenly between 3 teams, per the official page).

The track's own description: "Fast settlement makes new financial instruments and fully onchain markets more practical," best-fit for teams who have shipped a trading, lending, or market-making product before.

Evidence supporting Koby's fit, based on what's already documented (not a claim that Koby automatically qualifies):

- Koby is financing infrastructure — turning future receivables into funded, onchain-tracked financing positions (PRD.md Section 1).
- It depends on programmable financial agreements enforced by a smart contract (ARCHITECTURE.md Section 5).
- Settlement and repayment accounting happen through real onchain transactions on Monad (MONAD.md Section 3–7).
- It operates a financing marketplace with transparent terms (PRD.md Section 8).
- Its core financial state (principal, obligation, amount repaid, outstanding balance) is smart-contract-owned (ARCHITECTURE.md Section 4).

This document does not compare Koby against other Onchain Finance & Trading submissions or claim any ranking advantage — it only documents why the product characteristics already defined in PRD.md/ARCHITECTURE.md/MONAD.md align with the track's stated focus.

---

## 3. KOBY HACKATHON POSITIONING

**"Koby turns future business cash flow into programmable liquidity."**

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

- **Problem** — businesses can have predictable future revenue while needing capital today.
- **Solution** — Koby converts qualifying future receivables/cash-flow opportunities into financing agreements that can be funded and settled through programmable onchain infrastructure.
- **AI** — analyzes cash-flow information and available signals to produce an explainable assessment (AI.md); it does not decide or execute.
- **Monad** — provides the blockchain execution layer for the core financial operations (create, fund, repay — MONAD.md Section 3).
- **Repayment** — terms and accounting are represented through programmable onchain mechanisms (MONAD.md Section 8) — this positioning statement never describes Koby as autonomous real-world revenue collection, because that mechanism doesn't exist in the MVP.

---

## 4. WHAT MUST BE REAL

| Component                                    | Status for final demo                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Koby frontend                                | REAL — deployed, working application                                                                                                  |
| Financing opportunity (terms, AI assessment) | SIMULATED inputs (fictional business), REAL onchain representation once created                                                       |
| Financing agreement (Create Financing)       | REAL — Monad Testnet transaction                                                                                                      |
| Smart contract                               | REAL — deployed to Monad Testnet                                                                                                      |
| Monad testnet interaction                    | REAL                                                                                                                                  |
| Wallet authorization                         | REAL — actual wallet signature for every transaction                                                                                  |
| Transaction                                  | REAL — actual broadcast Monad Testnet transaction                                                                                     |
| Transaction confirmation                     | REAL — actual confirmation depth reached before UI shows success                                                                      |
| Contract state update                        | REAL — read from the actual deployed contract                                                                                         |
| Repayment transaction/trigger                | REAL transaction; manual plus labeled simulated trigger both sending real validated transactions as the recorded business per PRD.md Section 11 and MONAD.md Section 8 — the trigger reason may be simulated, the transaction itself is not; atomic push straight to the financier with exact-amount approval |
| Repayment accounting                         | REAL — contract-enforced with fixed decimals constant and strict revert on overpayment (SECURITY.md Section 7)                                                                                      |
| Completion state                             | REAL — automatic transition in the same repayment transaction that zeroes outstanding; never separately callable                                                                                               |
| Relevant events                              | REAL, if the contract emits them as designed (MONAD.md Section 15)                                                                                     |
| Indexed data                                 | REAL — ENVIO for history and list views with direct contract reads for actionable state and labeled staleness plus direct-read fallback (PRD.md Section 15) |
| Funding custody                              | REAL — atomic push straight to the business in the funding transaction with exact-amount approval; contract never holds balances (PRD.md Section 14) |

The exact demo repayment trigger and stand-in signer identity must be named here once built; no placeholder hashes, addresses, or confirmations are ever pre-populated (Section 9).

**FUTURE, explicitly not claimed for this demo:** autonomous revenue-triggered repayment, real payment-rail integration, mainnet deployment (MONAD.md Section 23).

---

## 5. NO FAKE ONCHAIN RULE

**Koby must never fabricate:** transaction hashes, contract addresses, balances, settlement, repayment, confirmations, block numbers, token transfers, financing completion, or wallet state.

- If something is simulated, it is visibly labeled (Demo / Simulated).
- If something is testnet, it is labeled testnet.
- If something is unavailable, the UI communicates the limitation plainly rather than filling the gap.
- A failed external service is never converted into fake success — this applies to the AI provider, Nansen, ENVIO, RPC, and the wallet, without exception (SECURITY.md Section 22).

This rule is not negotiable for demo polish — a compelling but fabricated demo is a worse outcome for Koby than an honest, smaller one, both ethically and because judges specifically need to verify what was actually built (Section 1).

---

## 6. CORE HACKATHON DEMO

```
Acme Logistics
  ↓
$100,000 future receivables               — SIMULATED
  ↓
AI cash-flow analysis                      — REAL model call if live, else labeled Demo AI Assessment
  ↓
$70,000 financing opportunity              — SIMULATED terms derived from the above
  ↓
Financing terms reviewed                   — UI review step, no transaction yet
  ↓
Financing agreement created                — REAL Monad Testnet transaction
  ↓
Financier funds                            — REAL Monad Testnet transaction
  ↓
Monad transaction                          — REAL confirmation
  ↓
Business receives/records financing settlement — REAL contract state
  ↓
Repayment action / trigger                 — REAL transaction; manually/demo-triggered
  ↓
Repayment accounting                       — REAL contract state
  ↓
Outstanding balance decreases              — REAL contract state
  ↓
Financing completed                        — REAL contract state transition
```

Acme Logistics is a fictional/demo entity — no real-world business relationship is implied or should be implied in any submission material, unless actual external evidence is explicitly available (none is, as of this document).

---

## 7. DEMO TIMELINE

```
00:00 — Problem: businesses have future revenue, need capital now
00:20 — Koby explanation: turns future cash flow into programmable liquidity
00:40 — Business cash-flow opportunity: Acme Logistics, $100K future receivables
01:00 — AI analysis: risk signals, confidence, recommendation shown
01:20 — Financing creation: $70K opportunity created onchain (real tx)
01:40 — Financier funding: real Monad Testnet transaction
02:00 — Monad transaction: show the actual confirmed tx / explorer link
02:20 — Repayment: real repayment transaction, outstanding balance updates
02:40 — Indexed/onchain activity: history view reflecting real events
03:00 — Result: completed financing position, full lifecycle recap
```

These are Koby's own target timings, not an official Metropolis requirement — no demo-length requirement was found on the official page (Section 19 flags what actually is required). Keep the demo focused on this single lifecycle; do not attempt to showcase every UI screen or every sponsor integration in the same pass.

---

## 8. MONAD REQUIREMENT

At least one core financial operation must execute on Monad — per MONAD.md Section 3, the MVP goes further than the minimum and executes **three**: Create Financing, Fund Financing, and Record Repayment, each as a real Monad Testnet transaction.

The demo must be able to show actual blockchain evidence for at least the funding transaction (the clearest "money moved" moment) and ideally all three. Displaying "Monad" in the UI is not integration — the requirement is satisfied only by real, independently verifiable transactions against the deployed contract (MONAD.md Section 1).

---

## 9. MONAD DEMO EVIDENCE

Verified deployment (Monad Testnet, chain ID `10143`):

- Contract: `KobyFinancing` at `0x7dee1dd04e2a9541202eb37ede56a7395a1dc93a`, bound at construction to testnet USDC `0x534b2f3A21130d7a60830c2Df862319e593943A3` (6 decimals)
- Deployment transaction `0xc1bae0e83ef176bfba18b6a032b6cccc5dc6b90d7d9888b84e9bba60ad77c5f0` (receipt status success; evidence: `broadcast/Deploy.s.sol/10143/` run records)

Still to capture before submission — **not claimed to exist yet; never pre-populate with placeholders:**

- Transaction hash for at least: Create Financing, Fund Financing, Record Repayment
- Block explorer links (MonadVision or Monadscan — MONAD.md Section 12) for each transaction
- Transaction status (confirmed) for each
- The relevant contract event for each transaction (MONAD.md Section 15)
- Resulting contract state after each transaction (readable independently of the app's own UI)
- Indexed event view, if ENVIO is implemented

Never pre-populate any of the above with placeholder values that could be mistaken for real evidence.

---

## 10. SMART CONTRACT DEMO REQUIREMENTS

Minimum contract behavior for the demo, consistent with ARCHITECTURE.md Section 5 / MONAD.md Section 6 / SECURITY.md Section 5:

- Financing creation (`Created` state; open creator per PRD.md Section 10)
- Funding (`Created → Funded` for exactly the principal, single funder; atomic push straight to the business per PRD.md Section 14)
- Repayment (`Funded → Repaying` on first valid repayment only, and further repayments; atomic push straight to the financier per PRD.md Section 11; manual plus labeled simulated trigger both sending real transactions)
- Outstanding balance accounting (SECURITY.md Section 5's invariant; fixed decimals constant; strict revert on overpayment and zero amounts)
- Completion (`Repaying → Completed` automatically in the same repayment transaction that zeroes outstanding; never separately callable)
- Relevant events (`FinancingCreated`, `FinancingFunded`, `RepaymentRecorded`, `FinancingCompleted`)
- Access control (any wallet may Create specifying any business; only exact-principal funding records the single financier; only the recorded business may repay; exact-amount approvals, no permits)
- Accounting correctness (no floating point, no double repayment, no overpayment)

No `Active`/`Defaulted`/`Cancelled` state, no admin-controlled financial override, and no unnecessary contract complexity is added purely to make the demo look more sophisticated — this would contradict AGENTS.md section 49 (no feature theatre) and the state-machine decision already made in ARCHITECTURE.md Section 5.

---

## 11. AI DEMO REQUIREMENTS

The AI demo must show: cash-flow analysis, risk factors, confidence, recommendation, and explainability — the full `RiskAssessment` structure (AI.md Section 7):

```ts
RiskAssessment {
  score
  confidence
  factors
  recommendation
}
```

AI remains an analysis layer throughout the demo. It must not control funds, sign transactions, approve transactions, override the contract, or guarantee financing, repayment, or profit (AI.md Section 2). If the AI assessment shown in the demo is simulated rather than a live model call, it is explicitly labeled (AI.md Section 20).

**Provider precedence (as implemented in `web/services/ai.ts`, invoked only from `POST /api/analyze`): OpenRouter first, then Kimi (Moonshot AI) as a fallback live option, then the deterministic fallback (`koby-deterministic-v0`, labeled Demo AI Assessment).** Whether a live provider actually serves a given request depends on configured keys and validation at request time and is not claimed here — every response carries its source label (`OpenRouter AI Assessment` / `Kimi AI Assessment` / `Demo AI Assessment`), so fallback output is never presented as a live result. Kimi was evaluated against the two other AI-model-credit bounty sponsors (Section 16): Alibaba Cloud/Qwen offers a larger credit ($5,000 vs. Kimi's $3,000) but typically requires a verified Alibaba Cloud account and, for non-China-based teams, added payment/access friction; Tencent Hunyuan's credit is smaller with no offsetting advantage. All three are equally easy to integrate technically (OpenAI-compatible, structured-output/tool-calling support), so the deciding factor was time-to-first-working-request on a six-week build, not raw credit value. This precedence does not change any boundary or validation requirement in AI.md — each provider's output still goes through the same schema/range/content validation (AI.md Section 12) as any other provider would. No sponsor-bounty eligibility is claimed without evidence (Section 17).

---

## 12. NANSEN STRATEGY

Nansen ($5,000 bounty — "Best use of Nansen," verified Section 16) is Koby's primary sponsor target, per AGENTS.md section 5.

```
Onchain Business Activity
  ↓
Nansen Data
  ↓
Normalized Signal
  ↓
AI Analysis
  ↓
Financing Context
```

The integration must answer a meaningful product question — e.g. relevant wallet activity, historical activity patterns, or business-linked onchain behavior feeding the cash-flow assessment (AI.md Section 4) — not merely display a Nansen widget. No specific Nansen API capability is assumed here beyond what MONAD.md Section 25/AI.md already established; **current bounty and API/MCP requirements should be re-verified against Nansen's own documentation and the bounty page at implementation time**, since this document verified the bounty's existence and prize amount, not its full technical requirements.

---

## 13. ENVIO STRATEGY

Envio has two relevant listings (verified Section 16): a **$1,000 "Best Use of Envio" bounty**, and a separate **$5,000 sponsored prize** (free Envio Cloud hosting, awarded automatically to winning teams rather than requiring a separate submission).

```
Koby Contract Event
  ↓
ENVIO / HyperIndex
  ↓
Normalized Financing Event
  ↓
Application
  ↓
Dashboard
```

Potential indexed events, per MONAD.md Section 15: `FinancingCreated`, `FinancingFunded`, `RepaymentRecorded`, `FinancingCompleted`. The indexer is never a substitute for contract authority (SECURITY.md Section 16) — it's a read/history layer. **Current ENVIO bounty requirements should be re-verified** against Envio's own documentation before implementation.

---

## 14. PRIVY STRATEGY

Privy has a **$5,000 bounty** ("Privy!" — verified Section 16, no further detail given on the public page about specific judging criteria for it).

**Decision: Privy is Koby's chosen wallet/onboarding provider for the MVP.**

Privy's role: wallet onboarding, wallet UX, reducing friction, account/wallet interaction (MONAD.md Section 10, USER_FLOW.md Section 5) — never as a source of financial truth (MONAD.md Section 10).

Privy was evaluated against Mera (Category Labs' passkey-based account library, closely tied to Monad Foundation, also carrying its own $2,500 x2 bounty — Section 16). Mera is philosophically the better fit for Koby's no-account-layer model (USER_FLOW.md Section 5) — it derives a wallet straight from a passkey with no third party in the signing path. But Mera is new in 2026, and its own documentation flags a common failure mode: on desktop Chrome, a passkey not saved to Google Password Manager causes a `PRF_UNAVAILABLE` error. Against HACKATHON.md Section 24's requirement that the demo be deterministic, a known, documented failure mode on a likely demo browser is an unacceptable risk for a six-week build. Privy is more established, has an active Metropolis mentor (Kenny Zhang, Privy Crypto GTM Lead), and reduces demo-day risk accordingly.

Mera remains a good candidate for a future version, or for this one if the team has time to thoroughly test its passkey flow across the exact devices/browsers the demo will run on, well before demo day. **Current Privy bounty requirements should still be re-verified** at implementation time, since the public listing doesn't specify judging criteria beyond the bounty's existence.

---

## 15. CHAINLINK STRATEGY

Chainlink has a **$3,000 bounty** ("Best workflow with CRE" — Chainlink Runtime Environment, verified Section 16).

Per AGENTS.md section 8, Chainlink is used only if Koby has a genuine requirement for it — potential future requirements (trusted external data, automation, payment-related triggers) are exactly the kind of infrastructure MONAD.md Section 8 says would be needed for true revenue-triggered repayment automation, which is explicitly future scope, not MVP scope. **No Chainlink integration is planned for the MVP** unless a genuine requirement is identified before implementation — it is not forced in to chase the bounty. **Current Chainlink/CRE bounty requirements should be re-verified** before any decision to integrate.

---

## 16. OTHER SPONSOR BOUNTIES

Verified against the official Metropolis page (`monad.xyz/developers/hackathons/metropolis`) on September 21, 2026. This is the full "Sponsor prizes" list (bounties requiring a specific integration to win) plus relevant "Sponsored prizes" (awarded automatically to overall winning teams, not separately pursued):

| Sponsor                                                                                           | Bounty (verified)                                                                                                                                                             | Potential Koby use                                                                                                                                                         | Required integration                                                  | Decision                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nansen AI                                                                                         | $5,000 — Best use of Nansen                                                                                                                                                   | Cash-flow/onchain-activity signals for AI assessment                                                                                                                       | Nansen API/MCP/CLI                                                    | **Use** — already Koby's primary sponsor target (AGENTS.md section 5)                                                                                                                                     |
| Envio                                                                                             | $1,000 — Best Use of Envio (+ $5,000 sponsored hosting prize, automatic)                                                                                                      | Event indexing for financing/repayment history                                                                                                                             | ENVIO/HyperIndex                                                      | **Use** — already Koby's indexing target (AGENTS.md section 6)                                                                                                                                            |
| Privy                                                                                             | $5,000 — "Privy!"                                                                                                                                                             | Wallet onboarding friction reduction                                                                                                                                       | Privy SDK                                                             | **Use** — chosen wallet/onboarding provider, evaluated against Mera and selected for demo reliability (see Section 14)                                                                                    |
| Chainlink                                                                                         | $3,000 — Best workflow with CRE                                                                                                                                               | Only if a genuine external-data/automation need is identified                                                                                                              | Chainlink CRE                                                         | **Do not use** for MVP — no genuine requirement identified (Section 15); revisit only if one emerges                                                                                                      |
| Kuru                                                                                              | $5,000 x2 — consumer trading app / new assets & markets on Kuru                                                                                                               | None — Kuru's bounties are trading-product-focused                                                                                                                         | Kuru integration                                                      | **Do not use** — explicitly out of scope per AGENTS.md section 10                                                                                                                                         |
| Perpl                                                                                             | $5,000 (API) + $3,000 (analytics/risk tool)                                                                                                                                   | None — Perpl's bounties are perpetual-trading-ecosystem-focused                                                                                                            | Perpl API                                                             | **Do not use** — explicitly out of scope per AGENTS.md section 10                                                                                                                                         |
| Alchemy                                                                                           | $1,000 in credits — Best Projects using Alchemy                                                                                                                               | Possible RPC/infra provider (MONAD.md Section 12 lists alternate RPCs)                                                                                                     | Alchemy as RPC/infra provider                                         | **Evaluate** — only if Alchemy is actually chosen as an RPC provider for real infra reasons, not to claim the bounty                                                                                      |
| Dynamic                                                                                           | $5,000 — Best Use of Dynamic                                                                                                                                                  | Alternative wallet/onboarding provider — overlaps with Privy's role                                                                                                        | Dynamic SDK                                                           | **Do not use** — redundant with the already-chosen Privy evaluation; avoid running two competing onboarding integrations                                                                                  |
| Agora                                                                                             | $10,000 x2 — mobile trading app / cross-border payments app                                                                                                                   | Not a fit — Agora's bounties target trading and cross-border payments products, not receivables financing                                                                  | Agora integration                                                     | **Do not use** — product mismatch, would distort Koby's architecture (AGENTS.md section 10)                                                                                                               |
| Cleanverse                                                                                        | $2,000 — Best Integration of CVI/CVA                                                                                                                                          | No identified fit — carbon/environmental data product                                                                                                                      | Cleanverse integration                                                | **Do not use** — no product connection                                                                                                                                                                    |
| Aurora Intents                                                                                    | $5,000 — Bring Any-Chain Liquidity to Monad                                                                                                                                   | No identified fit — cross-chain liquidity is explicitly out of MVP scope                                                                                                   | Aurora Intents integration                                            | **Do not use** — AGENTS.md section 10 explicitly avoids unnecessary cross-chain features                                                                                                                  |
| MetaMask                                                                                          | $2,500 — Best Agent Wallet Plugin                                                                                                                                             | No identified fit — agent-wallet-plugin focused, not Koby's product                                                                                                        | MetaMask plugin work                                                  | **Do not use** — no product connection                                                                                                                                                                    |
| Kepler Plan by Tencent                                                                            | $2,000 in credits — Build with Hunyuan                                                                                                                                        | AI-model credit source for the cash-flow assessment layer (AI.md)                                                                                                          | Hunyuan as AI provider                                                | **Do not use** — Kimi selected instead for the MVP (see Section 11)                                                                                                                                       |
| Kimi                                                                                              | $3,000 in credits — Best Builds Powered by KIMI                                                                                                                               | AI-model provider for the `RiskAssessment` pipeline (AI.md Section 7)                                                                                                      | Kimi as AI provider, via its OpenAI-compatible API                    | **Use** — chosen provider for Koby's AI cash-flow analysis layer (see Section 11)                                                                                                                         |
| Alibaba Cloud                                                                                     | $5,000 in credits — Best Builds with Qwen 3.8 Max                                                                                                                             | AI-model credit source for the cash-flow assessment layer (AI.md)                                                                                                          | Qwen as AI provider                                                   | **Do not use** — Kimi selected instead for the MVP (see Section 11); larger credit didn't offset Alibaba Cloud's higher account-access friction for a six-week build                                      |
| Monad Foundation                                                                                  | $2,500 x2 (Mera-powered UX, Mera passkey) + $5,000 (Best Community Team Project)                                                                                              | Evaluated as an alternative to Privy for the wallet layer                                                                                                                  | Mera SDK                                                              | **Do not use for the MVP** — Privy selected instead for demo reliability (see Section 14); the $5,000 Best Community Team Project prize is unrelated to Mera and remains open regardless of this decision |
| ack3, Chainstack, Crouton Digital, Mercuryo, Zerion, Spectrum Nodes, Quicknode, Tenderly, Dwellir | "Sponsored prizes" / participant resources — infra credits, security scans, RPC/API access, mostly awarded automatically to winning teams or offered free to all participants | Some (Quicknode, Tenderly, Zerion, Dwellir, Spectrum Nodes, Chainstack) are plausible **infrastructure** choices already compatible with MONAD.md Section 12's RPC options | Using them as infra (not a "bounty integration" in the feature sense) | **Evaluate as infrastructure only** — free RPC/monitoring tooling is useful regardless of bounty eligibility; none require product changes                                                                |

No sponsor above is ranked or scored against another — this table records fit and a decision, not a competitive ordering.

---

## 17. BOUNTY INTEGRATION PRINCIPLE

**Never distort Koby's product architecture to chase a bounty.**

A sponsor integration is justified only when: it solves a real Koby requirement; it provides genuine user/product value; it can be implemented reliably in the time available; it can actually be demonstrated; its current bounty requirements have been verified; and it does not weaken security (SECURITY.md).

```
Bounty → Forced integration → Feature theatre         ← avoided
Real Koby requirement → Useful infrastructure → Sponsor integration → Bounty eligibility   ← preferred
```

Section 16's table is built on this principle — Kuru, Perpl, Agora, Cleanverse, Aurora Intents, and MetaMask are marked "Do not use" specifically because no real Koby requirement justifies them, regardless of bounty size.

---

## 18. HACKATHON TECHNICAL REQUIREMENTS

**Frontend:** deployed, working application; usable on mobile (USER_FLOW.md Section 29); core flows (onboarding, marketplace, financing creation, funding, repayment) functional; clear transaction states (USER_FLOW.md Section 14); clear errors (USER_FLOW.md Section 27).

**Smart contracts:** deployed to Monad Testnet; tested state transitions, accounting, access control, and repayment (SECURITY.md Section 24).

**Monad:** correct network (chain ID `10143`); at least one, ideally three, real transaction types demonstrated (Section 8); transaction evidence captured (Section 9); reliable RPC (MONAD.md Section 12 lists more than one public option).

**AI:** structured output (`RiskAssessment`); validated (AI.md Section 12); explainable result (AI.md Section 10); safe failure behavior (AI.md Section 19).

**External integrations:** only list what's actually implemented by submission time — Section 16's "Use"/"Evaluate" decisions are intentions, not a claim that any integration currently exists.

---

## 19. SUBMISSION REQUIREMENTS

Per the official FAQ (verified Section 1): **"A working product with a public project profile: a demo, a short write-up, and a link to the code."** This is the only explicitly stated submission requirement found on the public program page.

| Category                                                                                  | Status                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A working product                                                                         | Confirmed required                                                                                                                                                                                                            |
| A demo                                                                                    | Confirmed required (format not specified — live, video, or both; **verification required**)                                                                                                                                   |
| A short write-up                                                                          | Confirmed required                                                                                                                                                                                                            |
| A link to the code                                                                        | Confirmed required (does not explicitly require the repo to be public/open-source — Section 1 notes open-sourcing is "encouraged, not required" — but the code must be accessible enough for judges to verify what was built) |
| Track selection                                                                           | Confirmed — chosen at application time                                                                                                                                                                                        |
| Team members / solo status                                                                | Not detailed on the public page beyond "teams and solo builders both welcome" — **Verification required** on the application platform                                                                                         |
| Sponsor bounty selection                                                                  | Not detailed — whether bounty eligibility is a separate opt-in step on the submission portal is **Verification required**                                                                                                     |
| Specific technical description fields, video length limits, submission portal form fields | Not detailed on the public marketing page — **Verification required before submission**, on `hackathon.monad.xyz` directly                                                                                                    |

Nothing beyond the four bolded items above should be assumed as officially required until confirmed on the actual submission portal.

---

## 20. DEMO VIDEO REQUIREMENTS

No official demo-video-specific requirement (length, format, hosting) was found on the public Metropolis page — the FAQ only says "a demo" is required, without specifying it must be a video versus a live/interactive demo. **Verification required** on the submission portal.

Koby's internal recommended structure, absent an official spec:

```
Problem → Product → AI → Financing → Monad → Repayment → Result
```

This mirrors the demo timeline in Section 7. The video (if one is made) shows only actual functionality — no fabricated blockchain evidence (Section 5), consistent throughout.

---

## 21. REPOSITORY REQUIREMENTS

Expected state before submission: a clean README (Section 22); setup instructions; an architecture overview (pointing to `docs/ARCHITECTURE.md` rather than duplicating it); environment variable documentation (`.env.example`, never real secrets); test instructions; contract information (address, network, once deployed); demo instructions; known limitations; and a clear real-vs-simulated functionality summary (Section 4's table, kept current).

No secrets are ever committed (AGENTS.md section 39, SECURITY.md Section 19).

---

## 22. README REQUIREMENTS

Recommended structure — an entry point, not a duplicate of the full `docs/` system:

```
Koby
  ↓
What it does
  ↓
Why it matters
  ↓
How it works
  ↓
Architecture
  ↓
Monad integration
  ↓
AI
  ↓
Nansen / ENVIO / other integrations (only those actually implemented)
  ↓
Demo
  ↓
Setup
  ↓
Contracts
  ↓
Testing
  ↓
Known limitations
  ↓
Hackathon information
```

Each section should be a few sentences to a short paragraph, linking to the relevant `docs/*.md` file for depth rather than reproducing it.

---

## 23. JUDGE EXPERIENCE

Within roughly 30 seconds, the project should communicate: **"Businesses have future revenue but need capital today. Koby turns future receivables into financing opportunities, uses AI to analyze cash flow, settles financing through Monad, and tracks/executes repayment through programmable onchain mechanisms."**

This statement is written to match Koby's actual documented model (PRD.md Section 2, MONAD.md Section 8) — it does not overclaim autonomy or guarantees. Whatever is actually demonstrated at submission time should match this statement exactly; if a feature described here isn't actually working, the submission materials say so rather than implying it is (Section 5).

---

## 24. DEMO RELIABILITY

The demo must be deterministic. Fallback behavior, consistent with ARCHITECTURE.md Section 16:

| Failure           | Acceptable fallback                                               | Forbidden                               |
| ----------------- | ----------------------------------------------------------------- | --------------------------------------- |
| AI failure        | Clearly labeled demo/fallback assessment                          | Fabricated real-looking assessment      |
| Nansen failure    | Clearly labeled demo analytics                                    | Fabricated real-looking onchain signals |
| ENVIO failure     | "Unavailable" indicator, direct contract reads for critical state | Fabricated indexed events               |
| RPC failure       | Retry, fallback to an alternate public RPC (MONAD.md Section 12)  | Fabricated confirmation                 |
| Wallet rejection  | Clean return to idle, retry offered                               | Silently proceeding as if signed        |
| Slow confirmation | "Confirming…" state, explorer link offered                        | Assuming success before confirmation    |
| API timeout       | "Unavailable" / retry state                                       | Assuming success                        |
| Indexer delay     | "Activity may be incomplete" label                                | Presenting stale data as current        |

Example: _"External analytics unavailable → show clearly labeled demo analytics"_ is acceptable. _"Transaction failed → display fake successful transaction"_ is forbidden, without exception.

---

## 25. REAL VS SIMULATED MATRIX

| Feature            | Target state                          | Current state (2026-10-11 audit update) | Evidence required   |
| ------------------ | ------------------------------------- | ------------------------------------------ | ------------------- |
| Landing page       | Real                                  | Real (pre-existing)                        | Deployed UI         |
| AI analysis        | Real / clearly simulated              | Providers implemented in code (OpenRouter → Kimi → deterministic fallback, labeled per response); whether a live provider serves production traffic is unverified — fallback is `koby-deterministic-v0`, labeled Demo AI Assessment | Analysis output     |
| Financing creation | Real testnet                          | Deployed (`KobyFinancing` at `0x7dee1dd04e2a9541202eb37ede56a7395a1dc93a` on chain `10143`, deploy tx `0xc1bae0e83ef176bfba18b6a032b6cccc5dc6b90d7d9888b84e9bba60ad77c5f0`; 20 Foundry tests pass; UI shows honest not-deployed state until `NEXT_PUBLIC_CONTRACT_ADDRESS` is set) | Transaction         |
| Funding            | Real testnet                          | Deployed (same contract; atomic push straight to the business) | Transaction         |
| Monad settlement   | Real testnet                          | Deployed (same contract and network)       | Tx hash             |
| Repayment          | Real testnet / defined demo mechanism | Deployed (manual business-signed trigger + exact-amount approval UI; no autonomy claimed) | Contract state      |
| Indexing           | Real if implemented                   | Not implemented (direct log reads with honest unavailable state; ENVIO later — planned, no eligibility claimed) | Indexed event       |
| Nansen             | Real if implemented                   | Not implemented (planned, no code path; assessments use submitted data only — no eligibility claimed) | API/data evidence   |
| Privy              | Real (decided provider — Section 14)  | Implemented behind the provider-agnostic abstraction (`Providers` gates `PrivyProvider` on `NEXT_PUBLIC_PRIVY_APP_ID`; `PrivyWalletBridge` surfaces the Privy-session wallet into `useWallet`; injected EIP-1193 wallets keep working when unconfigured) | Working wallet flow |

The table above distinguishes what is verified from what is not: the testnet
deployment (contract address, deploy transaction, 20 passing Foundry tests) is
verified; per-transaction demo evidence (create/fund/repay hashes), live AI
provider behavior in production, and any sponsor-bounty eligibility are not
claimed and remain to be demonstrated. "Deployed" means the contract exists on
Monad Testnet and the UI reads it — not production readiness, traction, users,
or partnerships, none of which is claimed here.

---

## 26. FINAL DEMO CHECKLIST

**Product**

```
[ ] Problem is obvious
[ ] Koby's value proposition is clear
[ ] Financing flow works
[ ] Business flow works
[ ] Financier flow works
[ ] Repayment flow works
```

**Blockchain**

```
[ ] Contract deployed
[ ] Network verified
[ ] Real testnet transaction
[ ] Transaction confirmation verified
[ ] Contract state verified
[ ] No fake hashes
[ ] No fake addresses
```

**AI**

```
[ ] Structured output
[ ] Explainable factors
[ ] Confidence shown
[ ] Failure path tested
[ ] No financial guarantees
```

**Integrations**

```
[ ] Nansen verified
[ ] ENVIO verified
[ ] Privy verified if used
[ ] Chainlink verified if used
[ ] Other sponsor integrations verified
```

**Security**

```
[ ] Contract security review
[ ] Access control tested
[ ] Accounting tested
[ ] Repayment tested
[ ] Secrets removed
[ ] Wallet UX reviewed
[ ] Failure states tested
```

**Submission**

```
[ ] README complete
[ ] Repository public if required
[ ] Demo URL working
[ ] Demo video complete if required
[ ] Contract information included
[ ] Transaction evidence available
[ ] Sponsor bounties selected correctly
[ ] Submission form verified
[ ] Deadline verified (October 13, 2026)
```

No item above is marked complete in this document — these are requirements for later phases to satisfy and check off.

---

## 27. IMPLEMENTATION PRIORITY AFTER DOCUMENTATION

Once all documentation is complete, implementation follows AGENTS.md section 13's phases:

```
Foundation → Design System → Landing/Product Explanation → Business Dashboard
→ Financing Marketplace → Financing Creation → Smart Contracts → Monad Integration
→ Nansen → AI Underwriting → ENVIO → Programmable Repayment → Wallet/Onboarding
→ Security Review → Demo Polish → Submission
```

Not every sponsor integration is built immediately — Section 16's "Use" items (Nansen, ENVIO, Privy, Kimi) come after the core financing lifecycle works; "Evaluate" items (Alchemy-as-RPC and other infra sponsors) are decided once the core is stable, not built speculatively first.

At each phase: read AGENTS.md; read the relevant documentation; implement only the current phase; verify functionality; avoid unrelated changes; keep future integrations behind clean boundaries (ARCHITECTURE.md Section 15); never fabricate missing functionality (Section 5).

---

## 28. FINAL DOCUMENTATION STATE

```
AGENTS.md
  ↓
PRD.md (canonical product-level source)
  ↓
ARCHITECTURE.md (+ DESIGN.md presentation-only below ARCHITECTURE.md)
  ↓
MONAD.md
  ↓
AI.md
  ↓
SECURITY.md
  ↓
USER_FLOW.md
  ↓
HACKATHON.md
```

This chain forms the complete planning/documentation foundation for implementation. **AGENTS.md remains the highest-level project source of truth** — every document below it, including this one, defers to it where any conflict is found, and none of them authorizes contradicting it. PRD.md remains the canonical product-level source; DESIGN.md never overrides product, financial, or security decisions.

---

## VERIFIED SOURCES

Consulted on September 21, 2026:

- `https://monad.xyz/developers/hackathons/metropolis` — full program page: dates, prize structure ($250,000+ total, $30,000 per track split between 3 teams, $25,000 grand champion), the four tracks and their descriptions, the complete sponsor bounty/sponsored-prize/participant-resource lists with exact dollar amounts, the FAQ (eligibility, solo/team, existing-project rules, open-source policy, submission requirements, judging process, post-hackathon program).
- `https://monad.xyz/` (live site banner) — independent confirmation of "Metropolis — $250,000 USD global online hackathon · 1 Sep–13 Oct · Live now."
- `https://hackathon.monad.xyz/` — the official application/submission portal (linked from the program page; its internal form fields were not accessible for verification and are flagged as "Verification required" throughout this document).

Everything in Sections 2–3, 6–15, and 17–28 that is not a directly verified fact (Koby's own positioning, strategy decisions, checklists, and internal recommendations) is Koby's own documentation, not an official Metropolis requirement — this distinction is preserved throughout rather than implied to be official where it isn't.

---

## FINAL VALIDATION NOTES

- Checked against AGENTS.md, PRD.md, ARCHITECTURE.md, MONAD.md, AI.md, SECURITY.md, and USER_FLOW.md; no contradictions found.
- Current Metropolis information (Section 1), the target track (Section 2), the submission deadline (Section 1, October 13, 2026), and sponsor bounty information (Section 16) are all independently verified against the official program page, not assumed from earlier conversation context.
- Official requirements (Section 19's four bolded items) are kept explicitly separate from Koby's internal recommendations (demo timeline, checklist, README structure) throughout.
- Uncertain/unverified information is explicitly marked "Verification required" wherever the official page didn't specify (Sections 1, 12–15, 19–20).
- No sponsor requirement, judging criterion, or submission requirement is invented beyond what the official page states.
- No blockchain configuration is invented here — Section 8/9 defer entirely to MONAD.md Section 12.
- No integration is claimed to exist — Section 4, Section 18, and Section 25 all state current status as TBD/not yet implemented.
- The no-fake-onchain rule (Section 5) is preserved and restated as a first-class hackathon rule, not softened for demo purposes.
- The programmable-repayment model (Section 3, Section 6, Section 8) is preserved exactly as MONAD.md Section 8 defines it — never described as autonomous.
- AI's analysis-only boundary (Section 11, Section 23) is preserved exactly as AI.md defines it.
- The smart contract is preserved as financial authority throughout (Section 4, Section 10, Section 25).
