KOBY — AGENTS.md

0. MISSION

You are building Koby for the Monad Metropolis Hackathon 2026.

Koby is a programmable business-financing marketplace that allows businesses to turn predictable future receivables/cash flow into immediate liquidity.

Core concept:

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

Koby is not a generic lending protocol.

Koby is not primarily a trading application.

Koby is not an AI chatbot.

Koby is onchain receivables-financing infrastructure.

---

1. HACKATHON CONTEXT

Koby is being built specifically for:

Monad Metropolis 2026

Metropolis has four tracks:

1. Onchain Finance & Trading
2. Consumer Products & Payments
3. Social, Attention & Culture
4. Trust, Identity & AI Infrastructure

Koby's primary track is:

«ONCHAIN FINANCE & TRADING»

The finance track emphasizes financial infrastructure and asset primitives that benefit from fast settlement.

Koby must therefore demonstrate why Monad is materially useful to the product.

Do not build Koby as a normal Web2 financing application and merely deploy one contract on Monad.

Monad must be part of the actual financial execution flow.

---

2. PRIMARY PRODUCT POSITIONING

The canonical Koby description is:

«Koby turns future business cash flow into programmable liquidity.»

Supporting explanation:

«Businesses can have predictable future revenue while needing capital today. Koby allows eligible future receivables to become financing opportunities, with transparent terms, onchain settlement, and automated repayment.»

Monad provides:

- fast settlement
- programmable execution
- transparent state
- onchain financial infrastructure

AI provides:

- cash-flow analysis
- risk signals
- financing assessment
- explainable recommendations

Smart contracts provide:

- financing state
- funding
- settlement
- repayment accounting
- position completion

---

3. PRODUCT PRINCIPLE

Every feature must answer:

«Does this make Koby better at turning future business cash flow into programmable liquidity?»

If not, it probably does not belong in the MVP.

Do not add features merely because they are technically impressive.

---

4. METROPOLIS STRATEGY

Koby must optimize for:

1. Working product
2. Strong finance use case
3. Real Monad integration
4. Clear business value
5. Demonstrable smart-contract behavior
6. Useful AI
7. Strong security
8. Excellent UX
9. Sponsor integrations that naturally strengthen Koby
10. A short, understandable demo

Do not optimize for the number of technologies used.

One deeply integrated technology is better than five superficial integrations.

---

5. TARGET BOUNTIES

PRIMARY SPONSOR TARGET — NANSEN

Target:

«Nansen API / MCP / CLI data bounty»

Nansen data should be used to improve Koby's understanding of onchain business activity where appropriate.

Potential use:

Business Wallet
↓
Nansen Onchain Data
↓
Transaction / Activity Signals
↓
Koby Cash-Flow Analysis
↓
AI Assessment
↓
Financing Opportunity

Nansen integration must have actual product utility.

Do not simply display Nansen data on a dashboard to claim the bounty.

Possible signals:

- transaction activity
- wallet history
- asset balances
- stablecoin activity
- historical cash-flow patterns
- relevant wallet/entity signals

All data must be clearly attributed and interpreted correctly.

---

6. INDEXING TARGET — ENVIO

Use ENVIO/HyperIndex where it materially improves Koby's event-driven data layer.

Index events such as:

FinancingCreated
FinancingFunded
LiquiditySettled
RepaymentRecorded
FinancingCompleted
FinancingDefaulted

The frontend should be able to show:

Financing activity
Transaction history
Repayment history
Position state
Business activity

Do not implement a custom indexing system unnecessarily if ENVIO can solve the requirement cleanly.

---

7. WALLET / ONBOARDING TARGET — PRIVY

Privy may be used to reduce onboarding friction if its current Metropolis bounty requirements align with Koby.

The product should make sense to a business owner who does not think in terms of:

- RPCs
- gas
- chain IDs
- contract addresses
- transaction hashes

The user experience should focus on:

Connect
Create business profile
Review financing
Approve
Receive liquidity
Track repayment

Wallet infrastructure should remain invisible where possible without hiding important transaction information.

Do not sacrifice security for onboarding simplicity.

---

8. CHAINLINK

Chainlink should only be integrated where it solves a real Koby requirement.

Potential future uses may include:

- external data
- verified data feeds
- automation
- cross-chain infrastructure
- other supported primitives

Do not add Chainlink simply for a bounty.

If a Chainlink integration does not materially improve Koby, do not force it.

---

9. RPC / INFRASTRUCTURE

A dedicated Monad RPC provider may be used where appropriate.

Infrastructure choices must prioritize:

- reliability
- low latency
- predictable reads
- stable transaction submission

Do not architect Koby around a sponsor merely to claim infrastructure credits.

---

10. BOUNTIES WE DO NOT FORCE

Do not distort Koby to target unrelated bounties.

Especially avoid redesigning Koby around:

- perpetual trading
- consumer trading interfaces
- generic DEX aggregation
- unrelated social products
- NFTs
- meme tokens
- unnecessary cross-chain features

Kuru's current published Metropolis bounties focus on trading experiences and bringing new asset classes/markets to Kuru.

Those are not Koby's core problem.

Perpl's current bounties focus on its API and analytics/risk tooling for its perpetual trading ecosystem.

Do not transform Koby into a trading product merely to pursue these bounties.

---

11. SOURCE OF TRUTH

Before implementing a feature, inspect:

AGENTS.md
docs/PRD.md
docs/ARCHITECTURE.md
docs/DESIGN.md (presentation-only, below ARCHITECTURE.md)
docs/MONAD.md
docs/AI.md
docs/SECURITY.md
docs/USER_FLOW.md
docs/HACKATHON.md

Documentation describes product intent.

Code describes current implementation.

If they conflict:

1. AGENTS.md
2. PRD
3. Architecture
4. Security
5. Monad
6. AI
7. User Flow
8. Hackathon
9. Existing code

docs/DESIGN.md is presentation-only below Architecture and never overrides product, financial, or security decisions; PRD.md remains the canonical product-level source.

When changing architecture, update the appropriate documentation.

---

12. REPOSITORY STRUCTURE

Expected structure:

koby/
├── AGENTS.md
├── README.md
├── docs/
│ ├── PRD.md
│ ├── ARCHITECTURE.md
│ ├── DESIGN.md
│ ├── MONAD.md
│ ├── AI.md
│ ├── SECURITY.md
│ ├── USER_FLOW.md
│ └── HACKATHON.md
├── .opencode/
├── app/
├── components/
├── contracts/
└── public/

Additional folders may be introduced when architecturally justified.

Do not create random directories.

---

13. DEVELOPMENT RULE

Never build the entire project in one uncontrolled operation.

Work in phases.

Recommended order:

Phase 1 — Foundation
Phase 2 — Design system
Phase 3 — Landing / product explanation
Phase 4 — Business dashboard
Phase 5 — Financing marketplace
Phase 6 — Financing creation
Phase 7 — Smart contracts
Phase 8 — Monad integration
Phase 9 — Nansen integration
Phase 10 — AI underwriting
Phase 11 — ENVIO/indexing
Phase 12 — Programmable repayment tracking & execution
Phase 13 — Wallet/onboarding
Phase 14 — Security review
Phase 15 — Demo polish
Phase 16 — Metropolis submission

The exact order may change when dependencies require it.

---

14. CORE DEMO

The final demo should communicate this flow:

BUSINESS
↓
Future Revenue: $100,000
↓
KOBY ANALYSIS
↓
Eligible Financing: $70,000
↓
FINANCING TERMS
↓
FINANCIER FUNDS POSITION
↓
MONAD SETTLEMENT
↓
BUSINESS RECEIVES LIQUIDITY
↓
REPAYMENT STREAM
↓
ONCHAIN REPAYMENT EVENTS
↓
POSITION COMPLETED

The demo must be understandable without explaining blockchain architecture for five minutes.

---

15. DEMO SCENARIO

Use a realistic fictional business.

Example:

Business:
Acme Logistics

Expected future receivables:
$100,000

Requested liquidity:
$70,000

Financing:
$70,000

Repayment:
Defined by financing terms

Status:
Active

All demo data must be explicitly fictional/simulated unless backed by real data.

Never present simulated revenue as real revenue.

---

16. FINANCING MODEL

Koby must distinguish:

Future Receivables
Financing Amount
Repayment Obligation
Amount Repaid
Outstanding Balance
Financing Status

Example:

Future receivables = $100,000
Financing amount = $70,000

Do not imply that these values represent guaranteed future revenue.

---

17. SMART CONTRACTS

Contracts should enforce the financial state machine.

Possible states:

Created
Funded
Active
Repaying
Completed
Defaulted
Cancelled

Only implement states actually required by the product.

The contract should be the source of truth for critical onchain financial state.

The frontend must not be able to fabricate:

amount repaid
outstanding balance
funding status
completion status

---

18. CONTRACT STATE

A financing position should contain the minimum required information.

Potential fields:

id
business
financier
principal
repayment obligation
amount repaid
outstanding balance
createdAt
status

Avoid storing unnecessary data onchain.

---

19. CONTRACT SECURITY

Every financial contract must be reviewed for:

- reentrancy
- access control
- incorrect accounting
- token approval problems
- rounding
- integer behavior
- unauthorized withdrawals
- unauthorized repayment
- replay attacks
- signature validation
- unsafe external calls
- state-transition bugs
- denial of service
- emergency behavior
- oracle/data manipulation

Use established OpenZeppelin implementations where appropriate.

Do not assume an OpenZeppelin component is appropriate without checking the current installed/versioned API and documentation. Contract interfaces, inheritance patterns, and constructor signatures change between major versions — verify against the actual installed version before generating code against it.

Do not write custom cryptographic primitives unnecessarily.

---

20. ACCOUNTING

Financial calculations must be deterministic.

Use integer/base-unit representations.

Examples:

USDC → token base units
MON → wei
percentage → basis points

Avoid floating-point arithmetic in financial settlement logic.

Never calculate critical repayment values using frontend JavaScript floating-point numbers.

---

21. AI ROLE

AI is an analysis layer.

AI may analyze:

- revenue consistency
- transaction activity
- cash-flow volatility
- repayment capacity
- historical activity
- concentration risk
- requested financing
- other approved business signals

AI produces:

risk signals
explanations
confidence
financing assessment

AI does NOT directly control funds.

---

22. AI OUTPUT

AI output should be structured.

Example:

type RiskAssessment = {
score: number;
confidence: number;
factors: string[];
recommendation: string;
};

AI outputs must be validated before being consumed by the application.

Never trust raw model output.

---

23. AI LANGUAGE

Never display:

Guaranteed approval
Guaranteed repayment
Risk-free
Guaranteed return
Guaranteed profit

Prefer:

AI assessment
Risk signal
Estimated
Model confidence
Based on submitted data

AI is an assessment tool, not a financial guarantee.

---

24. NANSEN DATA

Nansen data must be treated as an input to analysis, not absolute truth.

Clearly distinguish:

Observed onchain activity
Derived signal
AI interpretation
Financing decision

Do not allow an AI model to silently convert uncertain blockchain observations into guaranteed financial conclusions.

---

25. MONAD

Monad must be a genuine execution layer.

At least one core financial operation should execute on Monad.

Examples:

Create financing
Fund financing
Settle financing
Record repayment
Complete financing

The final demo should show a real Monad transaction wherever possible.

WHAT "AUTOMATED" ACTUALLY MEANS

Do not build a repayment system that merely changes a stored number when someone clicks a button and call it "automated."

Unless the MVP has a real mechanism that receives or redirects actual business revenue, repayment is not automatic in the real-world sense — it is programmable and contract-validated, not autonomously revenue-triggered.

The MVP's legitimate repayment flow is:

Financing Agreement
↓
Repayment terms encoded onchain
↓
Repayment transaction/trigger
↓
Contract validates repayment
↓
Outstanding balance updated
↓
Financing completed

This is "programmable repayment tracking and execution," not "automated repayment."

A future version may integrate real revenue streams/payment rails to make repayment genuinely autonomous — do not imply that capability exists in the MVP.

This distinction must be documented explicitly in docs/MONAD.md: what triggers a repayment transaction today (manual/simulated trigger) versus what would need to exist for revenue-triggered automation (e.g. a payment-rail integration, an oracle, a scheduled job) in a future version.

---

26. WHY MONAD

The product explanation must be:

«Koby uses Monad because financing infrastructure benefits from fast, inexpensive, programmable settlement and high-throughput onchain activity.»

Do not make unsupported performance claims.

Do not simply state:

«"We chose Monad because it is fast."»

Show what the application actually does with the chain.

---

27. TRANSACTION STATES

Every blockchain transaction should support:

idle
preparing
awaiting_wallet
submitted
confirming
confirmed
failed

Never display "Success" before confirmation.

Show transaction hashes when available.

---

28. WALLET SAFETY

Before requesting a signature or transaction:

Show:

Action
Amount
Token
Target
Network
Relevant terms

Never hide a financial transaction behind an ambiguous button.

Bad:

Continue

Better:

Fund $70,000 financing

---

29. FRONTEND

Use Next.js App Router and TypeScript.

Keep page components focused.

Use reusable components.

Separate:

UI
business logic
blockchain logic
API logic
data fetching

Do not put the entire application inside a few page files.

---

30. DESIGN DIRECTION

Koby should feel like:

«serious financial infrastructure»

Visual characteristics:

- premium
- mature
- precise
- clean
- technical
- trustworthy
- restrained
- information-rich

Avoid generic Web3 aesthetics.

Do not overuse:

- neon
- gradients
- glowing borders
- glassmorphism
- excessive rounded cards
- unnecessary 3D
- random animations

---

31. UI HIERARCHY

Important financial values should be visually dominant.

Example:

$70,000
Financing

$100,000
Future receivables

$18,500
Repaid

$51,500
Outstanding

Users should understand financial state immediately.

---

32. DASHBOARD

The business dashboard should answer:

How much liquidity do I have?
How much financing is active?
How much has been repaid?
What remains?
What is my cash-flow assessment?
What financing opportunities exist?
What happened onchain?

Do not fill the dashboard with meaningless metrics.

---

33. MARKETPLACE

The financing marketplace should allow users to inspect:

Business
Future receivables
Financing requested
Financing amount
Repayment terms
Duration
Risk signals
Funding status

Do not create arbitrary rankings such as:

Best business
Safest borrower
#1 investment

unless there is a clearly documented methodology and appropriate disclosure.

---

34. FINANCING DETAIL

The financing detail page should show:

Financing amount
Repayment obligation
Amount repaid
Outstanding balance
Status
Business information
Cash-flow information
AI assessment
Onchain activity
Transaction history

---

35. INDEXING

Onchain activity should not depend entirely on manual frontend transaction state.

Use an appropriate indexer/event system where necessary.

Preferred event flow:

Contract Event
↓
ENVIO / Indexer
↓
Normalized Data
↓
Koby UI

---

36. ERRORS

Never expose confusing raw blockchain errors as the primary user experience.

Instead:

Financing could not be completed.

The transaction was rejected by the financing contract.

No funds were transferred.

Provide useful next steps.

Never claim a failed transaction succeeded.

---

37. LOADING

Use meaningful status messages.

Examples:

Analyzing cash flow...
Preparing financing...
Waiting for wallet approval...
Submitting to Monad...
Confirming settlement...
Recording repayment...

---

38. MOCKS

Mocks are permitted during development.

Clearly identify:

Demo
Simulated
Mock
Testnet
Placeholder

Never disguise mock data as production financial data.

---

39. SECRETS

Never commit:

.env
.env.local
private keys
seed phrases
API secrets
credentials

Use:

.env.example

to document required variables.

---

40. EXTERNAL SERVICES

External services must be isolated behind service abstractions.

Do not scatter Nansen/AI/indexer calls across UI components.

Prefer:

lib/
services/
hooks/

Keep secrets server-side.

---

41. SECURITY REVIEW

Before a significant release, review:

Frontend

- wallet interactions
- transaction parameters
- authentication
- secret exposure
- user input
- API exposure

Contracts

- accounting
- access control
- token handling
- reentrancy
- state transitions
- permissions

AI

- prompt injection
- malicious input
- hallucinated financial conclusions
- unauthorized actions

Infrastructure

- API keys
- RPC configuration
- rate limits
- indexing integrity

---

42. TESTING

Smart contracts should use Foundry tests.

Test:

Happy path

Create
Fund
Settle
Repay
Complete

Failure path

Unauthorized caller
Invalid amount
Insufficient funds
Invalid state
Double repayment
Already completed

Security path

Reentrancy
Access-control bypass
Accounting manipulation
Token approval issues
Unexpected token behavior

Frontend should verify:

- routes
- wallet state
- financing flow
- loading states
- errors
- mobile layout

Never claim tests passed unless they actually ran.

---

43. MOBILE

Koby must work on mobile.

Important operations must remain usable on small screens.

Financial tables need intentional responsive behavior.

Do not rely on horizontal overflow as the only mobile solution.

---

44. PERFORMANCE

Avoid unnecessary:

- blockchain reads
- API calls
- client components
- dependencies
- huge assets
- rerenders

Use caching/indexing appropriately.

---

45. DOCUMENTATION

Keep these documents synchronized:

docs/PRD.md
docs/ARCHITECTURE.md
docs/DESIGN.md (presentation-only, below ARCHITECTURE.md)
docs/MONAD.md
docs/AI.md
docs/SECURITY.md
docs/USER_FLOW.md
docs/HACKATHON.md

"HACKATHON.md" must document:

- target Metropolis track
- sponsor targets
- Monad-specific functionality
- demo flow
- what is real
- what is simulated
- bounty integrations
- submission requirements

---

46. README

README must eventually contain:

What is Koby?
Problem
Solution
Why Monad?
Architecture
AI
Smart contracts
Nansen integration
ENVIO/indexing
Wallet/onboarding
Security
Setup
Environment variables
Demo
Deployment
Hackathon track
Sponsor integrations

---

47. GIT

Use focused commits.

Examples:

feat: add financing marketplace
feat: add Monad financing vault
feat: integrate Nansen wallet activity
feat: index financing events
feat: add AI cash-flow assessment

fix: correct repayment accounting
fix: handle rejected financing transaction

security: harden financing authorization

docs: update Metropolis architecture

Never use meaningless commit messages.

---

48. CHANGE SCOPE

When asked to implement one feature, do not automatically redesign the entire application.

For example:

«"Build financing dashboard"»

does NOT authorize:

- changing contracts
- rebuilding landing page
- adding cross-chain
- adding governance
- adding a token
- rewriting the architecture

Keep the change focused.

---

49. NO FEATURE THEATRE

Do not add technology solely to impress judges.

Bad:

AI + Chainlink + Nansen + Kuru + Perpl + cross-chain + NFT

if none of them are necessary.

Good:

Monad

- Nansen
- AI
- smart contracts
- indexing

where every component has a clear job.

---

50. NO FAKE ONCHAIN

Never fake:

- transaction hashes
- contract addresses
- settlement
- repayment
- balances
- confirmations

If a transaction is simulated, label it.

---

51. DEMO RELIABILITY

The hackathon demo must be deterministic.

If an external service fails:

- show a graceful fallback where appropriate
- clearly label simulated data
- never fabricate a successful transaction

The demo should not collapse because one analytics API is temporarily unavailable.

---

52. JUDGE EXPERIENCE

A judge should understand Koby in approximately 30 seconds.

The interface should communicate:

Businesses have future revenue.

They need capital now.

Koby turns future receivables into financing.

AI analyzes the cash flow.

Monad settles the financing.

Repayment is tracked and executed through a programmable onchain mechanism — the contract validates each repayment and updates the outstanding balance.

Do not force judges to read documentation before understanding the product.

---

53. DEMO SCRIPT STRUCTURE

Recommended demo:

00:00 — Problem

Businesses have revenue coming later,
but capital is needed today.

00:20 — Koby

Show a business with $100K in future receivables.

00:40 — AI

Koby analyzes the business cash-flow profile.

01:00 — Financing

Koby creates a $70K financing opportunity.

01:20 — Funding

A financier funds the opportunity.

01:40 — Monad

Show the real Monad transaction.

02:00 — Repayment

Show repayment being recorded.

02:20 — Indexing

Show the onchain activity history.

02:40 — Result

Future revenue has become programmable liquidity.

Keep the demo concise.

---

54. METROPOLIS SUBMISSION

[NOTE: this section was cut off in the original document — fill in before finalizing. Recommended contents based on section 45's HACKATHON.md checklist: target track, sponsor bounty checklist, required submission links (repo, demo video, live URL), what is real vs. simulated in the demo, and any submission-form specific requirements from Monad Metropolis.]
