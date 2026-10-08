# Koby — Programmable business liquidity

**Koby turns future business cash flow into programmable liquidity.**

Businesses with predictable future receivables can convert a portion of that
expected cash flow into immediate liquidity, financed by a counterparty, with
terms, settlement, and repayment tracked onchain on Monad. AI provides an
explainable cash-flow assessment; it never controls funds.

- Track: Monad Metropolis 2026 — **Onchain Finance & Trading**
- Docs: [`AGENTS.md`](AGENTS.md) (highest source of truth) → [`docs/PRD.md`](docs/PRD.md)
  → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) → [`docs/MONAD.md`](docs/MONAD.md)
  → [`docs/AI.md`](docs/AI.md) → [`docs/SECURITY.md`](docs/SECURITY.md)
  → [`docs/USER_FLOW.md`](docs/USER_FLOW.md) → [`docs/HACKATHON.md`](docs/HACKATHON.md)

## How it works

```
Future revenue → Cash-flow analysis → Financing opportunity → Liquidity
→ Monad settlement → Programmable repayment tracking & execution
→ Completed financing position
```

A business describes expected receivables, reviews a cash-flow assessment,
proposes terms, and records the financing opportunity onchain. A financier
funds it (atomic push straight to the business). Each repayment is a real
transaction validated by the contract, which updates the outstanding balance
and completes the position automatically at zero. Repayment in the MVP is
manually triggered — there is no autonomous revenue collection
(see `docs/MONAD.md` Section 8).

## Architecture

- `web/` — Next.js App Router + TypeScript frontend. Routes only in `app/`,
  presentation in `components/`, chain/AI boundaries in `services/`,
  wallet/transaction state in `hooks/`, pure utilities in `lib/`.
- `src/KobyFinancing.sol` — the financing state machine
  (`Created → Funded → Repaying → Completed`), single immutable stablecoin
  asset, atomic-push funding/repayment, integer base-unit accounting.
- `test/` — Foundry tests (happy path, failure path, security path).
- `script/Deploy.s.sol` — testnet deployment (requires `USDC_ADDRESS`).

## Monad integration

Create, Fund, and Record Repayment are real Monad Testnet transactions
(chain ID `10143`). The contract owns all critical financial state; the
frontend only reads and displays it. Network defaults live in
`web/lib/monad.ts` (MONAD.md-verified, env-overridable); the deployed
contract address arrives via `NEXT_PUBLIC_CONTRACT_ADDRESS`.

Testnet deployment (verified, not claimed): `KobyFinancing` at
`0x7dee1dd04e2a9541202eb37ede56a7395a1dc93a` on chain `10143`, bound at
construction to testnet USDC
`0x534b2f3A21130d7a60830c2Df862319e593943A3` (6 decimals). Deploy
transaction
`0xc1bae0e83ef176bfba18b6a032b6cccc5dc6b90d7d9888b84e9bba60ad77c5f0`
(receipt status success). Evidence: `broadcast/Deploy.s.sol/10143/`
run records, cross-checked against a live RPC receipt and an onchain
`USDC()` read. This is a **testnet** deployment for development and demo
use — not a mainnet or production deployment, and no production hosting
configuration is verified in this repository.

## AI

`POST /api/analyze` is the server-side assessment boundary. It attempts
live providers in order — OpenRouter first, then Kimi (Moonshot,
OpenAI-compatible, keys server-side only) — and serves whichever returns
fully valid output; otherwise it serves the documented, versioned
deterministic methodology (`koby-deterministic-v0`), labeled **Demo AI
Assessment / Simulated**. Which source serves a given request depends on
configured keys and validation, and every response is labeled
accordingly. Both paths return the same `RiskAssessment` core inside a
structured financing-analysis envelope with a mandatory
human/financier-review flag; output is schema/range/content-validated
before use.

## Contracts

```shell
forge build
forge test
# Deploy (re-verify USDC address in docs/MONAD.md Section 11 first):
USDC_ADDRESS=0x... forge script script/Deploy.s.sol:Deploy \
  --rpc-url $MONAD_TESTNET_RPC --broadcast
```

OpenZeppelin Contracts v5.4.0 (`lib/openzeppelin-contracts`) for
`SafeERC20`/`ReentrancyGuard`. No admin role, no pause, no upgrade path —
deliberately no privileged financial override in the MVP.

## Web setup

```shell
cd web
npm install
cp .env.example .env.local  # fill in after verifying values
npm run dev
```

Checks: `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## Demo

Canonical fictional example: Acme Logistics, $100,000 future receivables →
$70,000 financing. The business and figures are **Simulated**; every
transaction, confirmation, and contract state shown is a real Monad Testnet
fact. Nothing fabricated: no fake hashes, addresses, balances, or
confirmations (see `docs/HACKATHON.md` Section 4).

## Known limitations (MVP)

- Contract is deployed on Monad Testnet
  (`0x7dee1dd04e2a9541202eb37ede56a7395a1dc93a`, see above); the address
  is env configuration, never hardcoded, so onchain routes still show an
  honest not-deployed state when `NEXT_PUBLIC_CONTRACT_ADDRESS` is unset.
- History reads contract logs directly (pre-ENVIO); RPC range limits
  surface as "unavailable", never fabricated events.
- Wallet layer is provider-agnostic (`hooks/useWallet`): Privy onboarding
  via `Providers`-gated `PrivyProvider` plus an injected EIP-1193 fallback
  (`lib/wallets.ts` discovery). Injected wallets keep working when Privy is
  unconfigured. Wallet connection is required only at settlement;
  input, analysis, and opportunity review work without a wallet.
- Nansen is not integrated (assessments use submitted data only) and ENVIO
  is not integrated (history reads contract logs directly over RPC). Live
  AI paths (OpenRouter, then Kimi) are implemented in code with labeled
  deterministic fallback — see "AI" above.
- No `Active`/`Defaulted`/`Cancelled` states, no admin controls by design.
