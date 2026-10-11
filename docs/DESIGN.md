# KOBY — DESIGN.md

Documentation hierarchy: AGENTS.md → PRD.md (canonical product-level source) → ARCHITECTURE.md (+ DESIGN.md presentation-only below ARCHITECTURE.md) → MONAD.md → AI.md → SECURITY.md → USER_FLOW.md → HACKATHON.md. Routes are frozen to ARCHITECTURE.md Section 3; value provenance follows USER_FLOW.md Section 21 with system categories per ARCHITECTURE.md Section 16 and simulated tags per PRD.md Section 21.

DESIGN.md defines how Koby looks, feels, communicates, and behaves visually. It never overrides financial correctness, security, or the product definition established upstream — where this document and any of those disagree, they win and this document is wrong. TasteSkill and external references are non-binding inspiration only.

**On TasteSkill:** Koby's implementation phase uses TasteSkill v2 (`npx skills add Leonxlnx/taste-skill --skill design-taste-frontend`), an open-source anti-slop frontend skill compatible with OpenCode. This document is written to work _with_ TasteSkill's workflow (brief inference, reference synthesis, component-by-component build, pre-flight check) — it is Koby's own brief, not a copy of TasteSkill's internal rules. TasteSkill supplies design-quality discipline; this document supplies Koby's actual identity.

---

## 1. PROJECT CONTEXT (READ, NOT RESTATED)

This document was written after reading AGENTS.md, PRD.md, ARCHITECTURE.md, MONAD.md, AI.md, SECURITY.md, USER_FLOW.md, and HACKATHON.md. Nothing below introduces product behavior not already defined there — where a design decision touches product logic (e.g. what a transaction state means, what "programmable repayment" is), it defers to those documents and links back rather than redefining it.

---

## 2. CORE DESIGN OBJECTIVE

Koby must not look like a generic crypto dashboard, AI SaaS, DeFi app, lending protocol, Web3 landing page, hackathon template, futuristic neon website, or generic fintech admin panel.

The visual identity communicates: **serious financial infrastructure for programmable business liquidity.**

The product should feel premium, mature, trustworthy, technical, precise, restrained, information-rich, intelligent, institutional without becoming boring, modern without looking like a crypto toy, and sophisticated without unnecessary visual complexity.

The visual system reinforces the actual product lifecycle (PRD.md Section 5):

```
Future revenue → Analysis → Financing opportunity → Liquidity
→ Monad settlement → Programmable repayment → Completed financing
```

Every major surface in the product should make a viewer feel closer to this lifecycle, not further from it.

---

## 3. DESIGN PHILOSOPHY

**Meaning first. Visuals second.**

Every major visual decision answers: who is this for, what problem is being communicated, what should the user understand, what should the user feel, and what action should the interface make clear. If a visual element can't answer at least the first four, it doesn't belong.

**Explicitly avoided:** decoration without meaning, arbitrary gradients, random glowing effects, excessive animation, unnecessary cards, excessive rounded containers, giant meaningless statistics, fake charts, decorative blockchain imagery, random 3D objects, excessive icons, visual noise.

---

## 4. TASTESKILL INTEGRATION

Koby uses TasteSkill v2's workflow as a design-quality framework, not as Koby's identity: define meaning first, establish visual direction before implementation, gather references, combine inspiration instead of copying, build a coherent design system, build component-by-component, use intentional layout variation, run anti-slop checks (Section 34), review before implementing, use deliberate visual hierarchy, create custom visual assets where they earn their place (Section 36).

TasteSkill's own brief-inference step (its §0) should be pointed at _this_ document as Koby's brief, not asked to infer Koby's identity from scratch — the identity is already decided here (Section 6). TasteSkill's dark-mode protocol (its §8) applies directly (Section 7 defines both modes). Its redesign protocol (§11) doesn't apply yet, since Koby has no existing UI to audit. Its hard pre-flight check (§14) is a good gate to run before shipping any page — Section 37 defines Koby's own equivalent sequence, which is compatible with it.

---

## 5. INITIAL TASTESKILL DIALS

```
DESIGN_VARIANCE: 6/10
MOTION_INTENSITY: 4/10
VISUAL_DENSITY: 7/10
```

- **DESIGN_VARIANCE 6/10** — Koby should not look like every page was stamped from one rigid template, but it also isn't an experimental, wildly varied product. A financing detail page and a dashboard should feel like the same product family while having genuinely different layouts suited to their job (Section 33). Variance lives in layout and content structure, not in inventing a new color language per page.
- **MOTION_INTENSITY 4/10** — restrained. Motion supports state changes and data updates (Section 29); it is never the point of a screen, especially not on transaction/financial-action screens, where clarity always outranks spectacle.
- **VISUAL_DENSITY 7/10** — Koby is an information-rich financial product by nature (PRD.md Section 17-18); most screens should read as dense-but-organized, not sparse. This is a default, not a mandate — see the per-page variation below.

These are defaults, not absolute restrictions:

- **Landing page** → lower density (closer to 4-5/10), stronger visual storytelling, can use more of the 6/10 variance budget.
- **Dashboard** → higher density (7-8/10), the default holds closely.
- **Marketplace** → high information density (8/10) — this page's job is comparison across opportunities.
- **Financing detail** → structured analytical density (7/10) — dense but organized into clear sections (Section 17).
- **Transaction screens** → density drops deliberately (3-4/10) — clarity over decoration, minimal variance, minimal motion (Section 21).
- **Mobile** → density reduces across the board relative to desktop, but hierarchy (what's most important) is preserved, never just shrunk (Section 30).

The whole application must not become visually identical just because it shares one design system — a shared system means shared tokens and components, not identical layouts everywhere.

---

## 6. VISUAL IDENTITY

**Brand personality:** financial infrastructure, programmable, precise, intelligent, confident, quietly technical, institutional, transparent, modern, reliable.

**Explicitly not:** gambling, speculative, meme-driven, overly futuristic, cyberpunk, gaming-like, aggressively DeFi.

The mental model to design toward: Koby should read the way a well-designed institutional trading terminal or a modern banking-infrastructure dashboard reads — not the way a token-launch site or a yield-farming app reads. A financier should feel like they're looking at real financial infrastructure with a technical, transparent backbone (Monad, onchain evidence — MONAD.md), not at a speculative product dressed up to look serious.

---

## 7. COLOR SYSTEM

Dual-mode by default (light and dark), with contrast and hierarchy parity across both — neither mode is an afterthought.

**Structural:**

- Primary background — the base canvas; near-neutral, not pure black/white, to avoid harsh contrast and to give surfaces (Section 10) room to read as elevated.
- Secondary background — a subtly distinct tone for large content regions (e.g. a dashboard's main content area vs. its sidebar).
- Elevated surface — cards, panels, modals; one clear step above the background, achieved with tone and border rather than heavy shadow (Section 11).
- Borders — low-contrast dividers that organize without competing with content.
- Primary text — the main reading color, high contrast against both backgrounds.
- Secondary text — supporting copy, labels, descriptions.
- Muted text — timestamps, metadata, least-important text; still meets contrast minimums (Section 31).

**Semantic:**

- Accent — one restrained brand accent, used deliberately for primary actions and key emphasis, not scattered across the UI.
- Success — confirmed, completed, positive financial outcomes (a `confirmed` transaction, a `Completed` position).
- Warning — attention-needed states that aren't failures (e.g. low confidence, insufficient data, pending too long).
- Error — failed transactions, rejected signatures, invalid input.
- Informational — neutral system messages, tooltips, help text.

**Transaction states** (USER_FLOW.md Section 14) each get a distinguishable treatment — `idle`/`preparing`/`awaiting_wallet` read as neutral/in-progress, `submitted`/`confirming` read as an active/pending tone (not success, not failure — a third visual language, since MONAD.md Section 9 is explicit that submission isn't confirmation), `confirmed` reads as success, `failed` reads as error.

**AI states** get their own restrained, analytical tone — visually distinct from both "success" and "error," since an AI assessment is neither (AI.md Section 8) — see Section 15.

**Simulated/demo states** get a single, consistent, clearly-labeled treatment (Section 25) applied everywhere demo data appears — not reusing the warning or error colors, since simulated data isn't a problem, it's a labeled fact.

**Financial-value color distinctions** (never color alone — see below): incoming liquidity, financing amount, amount repaid, and outstanding balance are typographically distinguished (Section 8) first, with color reinforcing rather than carrying the distinction. Future receivables get a visually softer/lighter treatment than confirmed onchain amounts, reinforcing PRD.md Section 9's "estimate, not guaranteed" framing without needing a written caveat next to every number.

**Explicitly avoided as a dependency:** neon green, neon purple, cyberpunk blue, rainbow gradients — none of these carry Koby's semantic meaning; a controlled, restrained accent may still land in a blue or green family, but never as a glowing/neon treatment.

**Accessibility:** every semantic color pairs with a non-color signal (icon, label, shape — Section 31) so meaning survives for color-blind users and in any context where color rendering degrades.

---

## 8. TYPOGRAPHY

- **Display** — used sparingly, for the landing page's hero statement and comparable single-moment emphasis; not used for routine headings.
- **Heading hierarchy** — a small number of clear steps (page title, section title, subsection title); consistent weight/size relationships across the app, not reinvented per page.
- **Body** — the default reading typeface for descriptions, explanations, AI factors (Section 15), and copy.
- **Metadata** — smaller, muted-text-colored, for timestamps, labels, source/provenance tags (Section 14).
- **Financial-number typography** — this gets its own deliberate treatment, distinct from body text: tabular/monospaced-leaning figures so columns of numbers align, a heavier weight for primary values, consistent thousands-separator and currency-symbol formatting. Large numbers (PRD.md Section 18's hierarchy — $70,000 financing, $100,000 receivables) use size and weight to establish which number matters most on a given screen, never more than one "hero number" per view.
- **Table typography** — smaller than body, optimized for scanning and alignment (numeric columns right-aligned, consistent decimal handling).
- **Code/address typography** — a monospaced treatment for wallet addresses, transaction hashes, block numbers, and contract addresses, always truncated with a consistent pattern (e.g. `0x8DCa…4f21`) and always offering the full value on demand (copy, tooltip, or explorer link — MONAD.md Section 12) rather than only ever showing the truncated form.
- **Button typography** — clear, action-stating labels (USER_FLOW.md Section 6/Section 30 — "Fund $70,000 Financing," never "Continue" alone), sized and weighted to stand apart from body text.

Example treatment intent (not exact values): `$100,000` and `$70,000` as large, tabular, high-contrast hero figures where they're the primary value on screen; `82%` (AI confidence) as a secondary but still emphasized figure next to its label; `14 days` as body-weight metadata; `0x8DCa...` as monospaced, truncated, with a copy affordance.

---

## 9. SPACING + GRID

A single spacing scale (e.g. a consistent multiplier system) used everywhere — no page invents its own spacing values. Page margins scale with viewport (tighter on mobile, generous on large desktop, never edge-to-edge content on wide screens). Content width caps on very large desktops so tables and dashboards don't stretch into unreadable long lines.

Grid behavior: a consistent column system for desktop (dashboard cards, marketplace listings), collapsing predictably at defined breakpoints rather than each page defining its own breakpoints. Section spacing is generous enough to separate distinct concerns (e.g. "financing summary" vs. "AI assessment" vs. "onchain activity" on a detail page) without resorting to heavy dividers or cards for every subsection. Card spacing, table row spacing, and dashboard density all derive from the same base scale, scaled by the density target for that page/component (Section 5).

The system remains coherent across desktop, tablet, and mobile — mobile is not simply a shrunk desktop layout (Section 30); it's the same spacing _system_ applied with mobile-appropriate values and, where needed, restructured content order.

---

## 10. SURFACES

**Border radius philosophy** — small, consistent, restrained. Enough to soften edges, not enough to read as "bubbly" or toy-like. One radius scale (e.g. 2-3 steps) used consistently, not a different radius per component.

- **Cards** — used for genuinely discrete, comparable items (a financing opportunity in the marketplace, a KPI on the dashboard) — not wrapped around everything by default.
- **Panels** — larger content groupings (e.g. the AI assessment panel on a detail page) — flatter than cards, using tonal contrast more than borders.
- **Tables** — the default for structured, comparable, multi-row data (activity history, repayment history) — preferred over a list of cards when the data is genuinely tabular.
- **Drawers/sheets** — for supplementary detail that doesn't need a full page (e.g. inspecting one activity item in more depth), especially on mobile where a modal would feel cramped.
- **Modals** — reserved for focused, blocking decisions (a transaction confirmation, per Section 21) — not used for general navigation or browsing.
- **Tooltips** — for short clarifying text (e.g. explaining a provenance label — Section 14) triggered on hover/focus, never carrying essential information a user can't otherwise get (accessibility, Section 31).
- **Navigation** — a persistent, low-decoration structural element (Section 20), not styled as a floating card.
- **Inputs** — clear boundaries, clear focus states, consistent sizing across the app.
- **Buttons** — a small set of variants (primary, secondary, destructive/failure-adjacent, disabled) reused everywhere, never invented per screen.

Hierarchy is built through spacing, typography, borders, tonal contrast, grouping, and alignment — not by wrapping every element in its own rounded floating card. A page with too many nested cards is a sign the layout needs restructuring, not more container styling.

---

## 11. SHADOWS + DEPTH

Depth is restrained and used only where it communicates hierarchy — a modal sitting above the page, a dropdown above its trigger, a sticky header separating from scrolled content. Avoided: giant shadows, glowing cards, floating glass panels, excessive blur, glassmorphism as a default treatment anywhere in the product. A card sitting at rest on a dashboard does not need a shadow to justify its existence — tonal contrast against the background is usually enough.

---

## 12. ICONOGRAPHY

A single icon style (stroke-based, consistent weight) used throughout — no mixing of filled and outlined styles, no mixing icon libraries. Icon size scales with its text context (inline with body text vs. standalone status icon). Icon-to-text spacing is consistent across the component library.

- **Status icons** — pair with the transaction/state colors in Section 7 (a checkmark for `confirmed`, a clock/spinner for `confirming`, an X or alert for `failed`) so status is never color-only (Section 31).
- **Financial icons** — used sparingly for categories (e.g. distinguishing "financing" from "repayment" in an activity list), not decoratively next to every number.
- **Blockchain icons** — used functionally (a network indicator, an explorer-link icon), never as generic decorative "crypto" imagery (Section 34).
- **AI icons** — a single, restrained icon (not a sparkle/magic-wand cliché — Section 15) marking AI-sourced content, consistent with the analytical, non-magical AI experience.

Icons support understanding; they are never added purely as visual filler.

---

## 13. DATA VISUALIZATION

Charts represent meaningful, real data only. Never decorative or fake.

- **Cash-flow / receivables timeline** — shows the business's submitted/observed activity over time, clearly labeled with its provenance (Section 14).
- **Financing amount vs. outstanding balance** — a simple, readable progress representation (e.g. a bar showing repaid vs. outstanding, not an elaborate chart for what's fundamentally two numbers — PRD.md Section 18).
- **Repayment progress** — a timeline or progress indicator tied to actual repayment events (MONAD.md Section 15), never implying a schedule that doesn't exist in the MVP's manual/demo-triggered model (USER_FLOW.md Section 16).
- **Risk factors** — represented as the structured list AI.md Section 10 describes, not forced into an artificial chart just to look more "data-driven" than the underlying `RiskAssessment` actually is.
- **Financing lifecycle** — a diagrammatic, non-data visualization (more illustrative — Section 36) showing the stage a position is in, distinct from actual data charts.
- **Transaction/onchain activity** — a real, chronological list/table (Section 24), not a decorative graph.

Every chart or visualization showing data must be labeled with its state — **Demo, Simulated, Mock, Testnet, or Live** — wherever the underlying data isn't unambiguously real, confirmed activity (Section 25). A chart is never used to imply financial activity that didn't actually happen.

---

## 14. DATA PROVENANCE

This is one of Koby's most important visual patterns, directly implementing USER_FLOW.md Section 21's provenance model.

Distinguished categories: **Observed onchain data, Derived analytics, AI interpretation, User-provided information, Simulated/demo data, Testnet activity.**

Visual pattern: a small, consistent source label/tag attached to any value where provenance isn't otherwise obvious from context — e.g. a figure on an opportunity card carrying a small "Business-submitted" or "Observed onchain" tag. This should be lightweight (a small label, not a badge that competes with the value itself) but always present when ambiguity is possible. Values that are unambiguously onchain-confirmed within a clearly "onchain activity" context (Section 24) don't need to repeat the label on every row — the section itself establishes provenance; but a business-submitted receivables figure sitting near an onchain financing amount always needs its own label, since that's exactly the pairing most likely to be misread (ARCHITECTURE.md Section 4).

Example label set: **Source: Observed · Derived · AI Analysis · Demo · Testnet** (plus "User-provided," not shown in the task's shorter example but equally required per Section 3's full list).

---

## 15. AI EXPERIENCE

The AI interface reads as analytical, not magical. Avoided entirely: "AI says this business is amazing" — any phrasing implying a verdict or certainty (AI.md Section 9).

Preferred pattern (matches AI.md Section 24's structure):

```
Risk Assessment

Score            Confidence

Observed factors:
• Revenue consistency
• Receivables concentration
• Historical cash-flow pattern

Recommendation:
...
```

UI patterns required:

- **Score** and **confidence** are visually distinct from each other (different position/weight — AI.md Section 8's warning that a high confidence score doesn't mean low risk, and the two must never be visually merged into one implied "grade").
- **Factors** — a clear, scannable list, each traceable to a provenance category (Section 14).
- **Recommendation** — set apart typographically (e.g. as a labeled callout), phrased per AI.md Section 9's approved language.
- **Insufficient data** — a distinct, honest state (not a low score — AI.md Section 11), visually different from a completed assessment, not just a completed assessment with empty fields.
- **Analysis pending** — a loading state that describes what's happening (Section 26), not a generic spinner with no context.
- **Analysis failed** — a clear failure state (Section 28), preserving whatever input the user already provided.
- **Simulated AI analysis** — carries the same Demo/Simulated treatment as any other simulated data (Section 25), placed prominently enough that it can't be mistaken for a live assessment.

AI content never visually implies certainty or a guarantee — no checkmarks, no "approved" styling, no green-means-go treatment applied to an AI recommendation the way it's applied to a confirmed transaction.

---

## 16. FINANCING MARKETPLACE

Displays, per PRD.md Section 8: business, future receivables, requested financing, financing amount, repayment terms, duration, risk signals, status, provenance, funding progress.

No arbitrary ranking language — "#1 Business," "Best Deal," "Safest," "Top Investment," "Guaranteed" — anywhere in the marketplace, consistent with PRD.md Section 8 and USER_FLOW.md Section 10's explicit rule against unranked-methodology labels. If sorting exists, it's by neutral criteria (amount, duration, date) with visible labels for the sort itself, never implied quality judgments.

The marketplace should read like a financial market/infrastructure interface — closer to a bond or receivables-financing listing screen — rather than a token marketplace or NFT-style grid. This favors structured rows/cards with consistent, comparable fields over large decorative imagery per listing.

---

## 17. FINANCING DETAIL PAGE

The user should quickly answer: what's being financed, how much, why, what supports it, what are the repayment terms, what's the current state, what evidence exists, and what happens next.

Visual hierarchy, top to bottom or in clear primary/secondary zones: **financing amount** and **future receivables** as the dominant figures (PRD.md Section 18's hierarchy — largest, most prominent); **repayment obligation** and **duration** as clearly secondary but still prominent; **status** as a persistent, always-visible indicator (not buried); **AI analysis** as its own clearly bounded section (Section 15); **evidence** (onchain activity, Section 24) as a distinct, inspectable section; **actions** (fund, repay) as clearly primary, unambiguous calls to action (Section 21), placed where they're reachable without excessive scrolling on both desktop and mobile.

---

## 18. DASHBOARD DESIGN

Answers quickly: how much liquidity is active, what financing positions exist, how much has been repaid, what remains outstanding, what opportunities exist, what the AI analysis found, what happened onchain (PRD.md Section 7/ARCHITECTURE.md Section 3).

- **Overview structure** — a top zone with the 3-4 most important figures (PRD.md Section 18's KPI hierarchy: financing, future receivables, repaid, outstanding), each unambiguous at a glance.
- **KPI hierarchy** — one visually dominant figure per KPI, consistent typography treatment (Section 8) across all of them so they read as a set.
- **Activity feed** — a compact, real (never fabricated) recent-activity list, linking into the full history (Section 24).
- **Financing cards/rows** — consistent with the marketplace's item treatment (Section 16) where the same data appears, so a user doesn't have to re-learn a layout between pages.
- **Charts** — used only where Section 13 justifies them, not decoratively filling space.
- **Tables** — for anything genuinely tabular (multiple positions, repayment history).
- **Status indicators** — consistent with Section 7/Section 12's transaction-state visual language.
- **Alerts** — reserved for things that actually need attention (a failed transaction, insufficient data), not routine informational content.
- **Responsive behavior** — per Section 30; density reduces, hierarchy (which KPI matters most) is preserved.

No meaningless statistics — every number on the dashboard should trace back to something PRD.md Section 7 actually asks the dashboard to answer.

---

## 19. LANDING PAGE

Communicates, quickly: **"Koby turns future business cash flow into programmable liquidity."**

Visual narrative, following PRD.md Section 5's lifecycle:

```
Future revenue → Koby analysis → Financing → Monad settlement → Programmable repayment
```

Layered visual storytelling is appropriate here specifically (lower density, Section 5) — smooth section transitions, structured narrative pacing, and changing visual composition as the page scrolls through the lifecycle stages, in the spirit of what Alethia (a Midnight-network privacy/eligibility product, unrelated to Koby's own product or chain) does well: transitions and layered graphics that make a technical product's story easy to follow without a wall of text. This is used as inspiration for _storytelling pacing and quality_ only — Koby does not reproduce Alethia's layout, branding, color system, graphics, or specific visual treatment; Koby's own identity (Section 6) governs everything actually shown.

The landing page also carries USER_FLOW.md Section 3's first-visit requirements: what Koby is, the problem, how the lifecycle works, where AI fits, where Monad fits, how repayment actually works (stated honestly — MONAD.md Section 8), and the real-vs-simulated distinction (Section 25) — all before anyone connects a wallet, since the page is fully browsable without one (USER_FLOW.md Section 5).

---

## 20. NAVIGATION

- **Desktop** — a persistent, low-decoration primary navigation exposing only the actual product areas from ARCHITECTURE.md Section 3: Overview (dashboard), Marketplace, Financing (detail/create), Activity. AI analysis is embedded in the financing-creation and detail flows per PRD.md Section 12, never a separate route. No invented sections beyond what ARCHITECTURE.md Section 3 defines.
- **Mobile** — a compact navigation pattern (e.g. bottom nav or a collapsible menu) covering the same set of destinations, sized for touch (Section 30/31).
- **Sidebar** — if used on desktop for the dashboard/marketplace context, kept minimal — structural wayfinding, not another dumping ground for decoration.
- **Breadcrumbs** — used where nesting is genuinely deep (e.g. Marketplace → Financing Detail), not added reflexively to shallow pages.
- **Page titles** — clear, consistent placement, matching the page's actual purpose.
- **Contextual actions** — the primary action for a given page (fund, create financing request) is visually prominent within that page's content, not buried only in navigation.
- **Account/wallet area** — shows connection state (USER_FLOW.md Section 5): connect prompt when disconnected, truncated address + status when connected, consistent with Section 22's wallet UX.

Navigation should make Koby's actual structure obvious — a user should never wonder "is there more to this product than what I'm looking at."

---

## 21. TRANSACTION UX

Transactions are the highest-trust moments in the product (SECURITY.md Section 8).

Visual states, matching USER_FLOW.md Section 14 exactly: `idle`, `preparing`, `awaiting_wallet`, `submitted`, `confirming`, `confirmed`, `failed` — each with its own distinct visual treatment (Section 7), never collapsed into fewer states for simplicity.

Before and during any transaction, the UI shows: action, amount, asset, destination, network, relevant financing terms, current state, and next action (MONAD.md Section 10). This is the one place in the product where density (Section 5) deliberately drops — a transaction confirmation should feel uncluttered and unambiguous, with nothing competing for attention against the actual decision being made.

**Never** ambiguous buttons like "Continue," "Proceed," or "Confirm" when the user can't tell what they're confirming from the button alone — buttons state the action explicitly ("Fund $70,000 Financing," "Repay $5,000," per USER_FLOW.md Section 6/Section 30).

---

## 22. WALLET UX

- **Wallet connection** — a clear, single primary action; Privy (HACKATHON.md Section 14) may present its own connection UI, but the surrounding Koby chrome (Section 20's account area) stays visually consistent with the rest of the product.
- **Wallet address** — truncated per Section 8's pattern, with full value available on demand.
- **Connected state** — persistently visible (Section 20), never something the user has to hunt for.
- **Wrong network** — a clear, non-alarming but unmistakable prompt to switch (USER_FLOW.md Section 5), using the warning/error color language (Section 7) appropriately — this blocks a transaction, so it should read as blocking, not as a passive notice.
- **Insufficient balance** — clear, specific messaging (which asset, roughly how much is needed), not a generic failure.
- **Transaction request** — see Section 21.
- **Transaction confirmation** — see Section 21.
- **Disconnect** — a clear, discoverable action; disconnecting doesn't feel destructive or hidden behind extra steps.

Wallet UX should feel safe and understandable throughout — a user should never feel like they've lost track of whether they're connected or what a pending action will do.

---

## 23. REPAYMENT UX

The MVP does not claim Koby autonomously collects real-world business revenue (MONAD.md Section 8).

Visual flow, matching MONAD.md's own diagram:

```
Repayment terms encoded → Repayment transaction/trigger → Contract validates
→ Outstanding balance updates → Financing completes
```

UI states: repayment scheduled/expected (informational, not a promise), repayment initiated, repayment submitted, repayment confirmed, partial repayment (clearly distinguished from full/completing repayment), remaining balance (always visible alongside any repayment action), completed (a clear, final-feeling state — visually distinct from "repaying"), failed (Section 7's failure treatment), and simulated repayment (Section 25's demo treatment, used only where MONAD.md Section 8's demo-trigger mechanism is in play, and always labeled as such).

**Future automated revenue-triggered repayment** — if ever shown even conceptually (e.g. in marketing/roadmap content), it must be visually and textually distinguishable from the MVP's actual manual/demo-triggered mechanism — different section, different labeling, never implying it's active today.

---

## 24. ONCHAIN ACTIVITY

Displayed: transaction hash, block, network, timestamp, event type, contract, amount, status (MONAD.md Section 15).

Readable representations by default (e.g. "Repayment · $5,000 · 2 hours ago · Confirmed") with the full technical detail (hash, block, contract address) available on inspection — a table row expands or links to full detail rather than cramming every raw value into the primary view.

**Never fabricated:** transaction hashes, contract addresses, balances, confirmations, settlement, or repayment events (AGENTS.md section 50). If an activity item is simulated, it carries Section 25's treatment, applied at the row level, not just as a page-level disclaimer easy to miss.

---

## 25. REAL VS SIMULATED VISUAL LANGUAGE

Consistent labels: **LIVE, TESTNET, DEMO, SIMULATED, MOCK, AI-GENERATED, OBSERVED, DERIVED.**

These labels are visually noticeable — enough contrast/weight that they're not missed — but not visually overwhelming; a small, consistently-placed, consistently-styled tag (not a giant banner repeated obnoxiously across every element). The rule this all serves (AGENTS.md section 50, MONAD.md Section 22): the interface must never make simulated data look indistinguishable from confirmed onchain activity. Where there's any doubt whether a label is needed, it's included — this system errs toward over-labeling, not under-labeling.

---

## 26. LOADING STATES

Defined for: pages, tables, charts, AI analysis, wallet state, transaction state, onchain activity, Nansen data, indexed (ENVIO) data.

Loading states describe what's actually loading ("Analyzing cash flow…," "Confirming transaction…," "Loading activity…") rather than a generic spinner with no context (USER_FLOW.md Section 26). Skeleton screens are used sparingly and only where they accurately preview the eventual content's shape — never shaped like populated content when the real result might be empty (an empty dashboard shouldn't flash a skeleton implying data is coming when there's genuinely none to load).

---

## 27. EMPTY STATES

**No active financing, no financing opportunities, no repayment history, no onchain activity, no AI analysis available, insufficient data** — each gets a distinct, informative treatment explaining what the user can do next where appropriate (USER_FLOW.md Section 25), styled neutrally — never like an error (different color language, Section 7).

---

## 28. ERROR STATES

Defined for: RPC failure, wallet rejection, wrong network, failed transaction, AI failure, Nansen unavailable, ENVIO/indexer delay, API failure, invalid data, insufficient balance — each following USER_FLOW.md Section 27's consistent philosophy (what happened, what's known, what the user can do), styled with Section 7's error language.

Errors never visually resemble success — no reuse of success color, iconography, or layout patterns for an error state. A transaction is never shown as succeeded before confirmation (USER_FLOW.md Section 15/MONAD.md Section 9) — this is enforced by keeping `confirming` and `confirmed` visually distinct enough that a quick glance can't confuse them (Section 7/Section 21).

---

## 29. MOTION SYSTEM

Target: `MOTION_INTENSITY = 4/10`.

Motion is intentional, smooth, subtle, informative, and premium — never decorative for its own sake. Used for: transitions between views, state changes (Section 21's transaction states in particular benefit from smooth, clear transitions between states), progress indication, data updates (a number updating after confirmation, animated in a restrained way rather than an abrupt jump — but never so smooth it obscures that a real change happened), navigation, and emphasis (drawing attention to a genuinely important change, sparingly).

**Avoided:** random floating elements, excessive parallax, constant/idle movement, distracting hover effects, animation applied to every component reflexively.

The landing page (Section 19) may use more expressive motion than the rest of the product, consistent with its storytelling role — but transaction and financial-action screens (Section 21) prioritize clarity over spectacle without exception; motion there is limited to clear state-transition feedback, nothing more.

---

## 30. RESPONSIVE DESIGN

Koby is mobile-first (ARCHITECTURE.md Section 20, USER_FLOW.md Section 30). Defined explicitly for mobile, tablet, desktop, and large desktop — not just "mobile" and "desktop" as two extremes.

- **Navigation** — Section 20's mobile pattern.
- **Tables** — restructure into a stacked/card-like readable format at narrow widths rather than relying on horizontal scroll as the only strategy (AGENTS.md section 43); horizontal scroll is acceptable as a _secondary_ affordance for genuinely wide tabular data, not the primary mobile solution.
- **Charts** — simplify/resize rather than shrinking into illegibility; a chart that can't stay meaningful at mobile width is replaced with a simpler representation of the same data at that breakpoint.
- **Cards** — reflow from multi-column to single-column, preserving the same internal hierarchy (most important figure still most prominent).
- **Modals/sheets** — modals on desktop often become full-height sheets on mobile, per Section 10.
- **Financial-number scaling** — large "hero" figures (Section 8) stay large and legible at mobile width; secondary detail is what compresses, never the primary number.
- **Touch targets** — meet standard minimum sizes throughout, especially for transaction-related buttons (Section 21).
- **Transaction UX** — Section 21's requirements hold fully at mobile width; nothing about the confirmation information is dropped for space.
- **Marketplace UX** — single-column, scrollable opportunity list at mobile width.
- **Dashboard density** — reduces from the 7/10 default toward something more scannable on a small screen, without hiding any of PRD.md Section 7's required information — it reorganizes, it doesn't omit.

Desktop layouts are never simply stacked vertically and called "mobile" — each major page gets deliberate mobile-specific layout decisions.

---

## 31. ACCESSIBILITY

- **Contrast** — meets standard minimums for text and status indicators against their backgrounds, in both light and dark mode (Section 7).
- **Focus states** — visible, consistent keyboard-focus styling on every interactive element.
- **Keyboard navigation** — the full product, including wallet-connect and transaction-confirm actions, is operable via keyboard where the underlying platform allows it (USER_FLOW.md Section 30).
- **Screen-reader semantics** — meaningful labels on interactive elements and status regions, not icon-only or color-only meaning.
- **Button labels** — descriptive and unambiguous (Section 21), which also happens to be an accessibility win, not just a trust one.
- **Status communication** — never color-only (Section 7/Section 12) — icon + text + color together.
- **Reduced motion** — the app respects a user's reduced-motion preference; Section 29's already-restrained motion system degrades further (near-instant transitions) rather than ignoring the setting.
- **Touch target size** — Section 30.

Accessibility is part of the design system from the start, not a pass applied after the fact.

---

## 32. COMPONENT DESIGN SYSTEM

For each component below, define purpose, visual hierarchy, variants, states, usage rules, responsive behavior, and accessibility considerations at implementation time, following this document's principles. Summary of intent per component:

- **Button** — primary/secondary/destructive/disabled variants; states include loading (for in-flight actions); always action-labeled (Section 21).
- **Input** — text/numeric variants; clear error/valid states; used in onboarding (USER_FLOW.md Section 6) and financing creation (Section 12) forms.
- **Select** — for the marketplace's neutral sort options (Section 16) and similar non-financial choices.
- **Tabs** — for switching between related views within one page (e.g. a financing detail page's "Overview" vs. "Activity" tabs), not for primary navigation (Section 20).
- **Badge** — small, restrained status/category markers; not overused as decoration (Section 34).
- **Status** — the shared transaction/financing-state indicator (Section 7/Section 21), the single most-reused semantic component in the product.
- **Card** — Section 10's definition; used for marketplace items, dashboard KPIs.
- **Panel** — Section 10's definition; used for AI assessment, grouped detail sections.
- **Table** — Section 10's definition; the default for activity/history data.
- **Data row** — a single table row's internal layout pattern, reused across tables.
- **Metric** — the KPI/hero-number pattern (Section 8/Section 18), reused on dashboard and detail pages.
- **Chart** — Section 13's data-visualization components, each type built only where justified.
- **Timeline** — for the financing lifecycle illustration (Section 36) and repayment progress (Section 13).
- **Activity item** — a single onchain-activity entry (Section 24).
- **Transaction status** — Section 21's inline state indicator, usable both during an active transaction and historically in Activity.
- **AI assessment** — Section 15's full risk-assessment component.
- **Risk factor** — a single factor line within the AI assessment component.
- **Financing opportunity** — the marketplace item component (Section 16).
- **Financing summary** — the compact financing-position representation used on the dashboard (Section 18) and elsewhere.
- **Wallet display** — the connected-account UI (Section 22).
- **Address display** — the truncated-address-with-copy pattern (Section 8).
- **Modal** — Section 10's definition; used for transaction confirmation (Section 21).
- **Drawer** — Section 10's definition; used for supplementary detail, especially on mobile.
- **Toast** — brief, non-blocking confirmations/notices; never used for anything requiring the user's explicit decision (that's a modal's job).
- **Tooltip** — Section 10's definition.
- **Empty state** — Section 27's component.
- **Error state** — Section 28's component.
- **Loading state** — Section 26's component.

Components exist because they represent a genuinely repeated pattern (per this list, each one appears in more than one place in the product) — new components aren't created merely for the sake of abstraction.

---

## 33. PAGE-SPECIFIC DESIGN DIRECTIONS

| Page                               | Purpose                            | Primary question                                  | Density             | Dominant patterns                              | Motion                                                          |
| ---------------------------------- | ---------------------------------- | ------------------------------------------------- | ------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| Landing                            | Explain Koby, convert to connect   | "What is this and should I care?"                 | Low (4-5/10)        | Storytelling sections, lifecycle diagram       | Higher than default — expressive, scroll-driven                 |
| Dashboard                          | Business's own status              | "Where do I stand?"                               | High (7-8/10)       | KPI/Metric, financing summary, activity feed   | Default (4/10)                                                  |
| Marketplace                        | Financier discovery                | "What can I fund?"                                | High (8/10)         | Financing opportunity cards/rows, filters/sort | Default (4/10)                                                  |
| Financing detail                   | Full position state                | "What exactly is this, and what's its status?"    | Structured (7/10)   | Metric, AI assessment panel, activity table    | Default (4/10)                                                  |
| Create financing                   | Business submits a request         | "What do I need to provide, and what will I get?" | Moderate (5-6/10)   | Input forms, AI assessment reveal              | Default, slightly more on the assessment-reveal moment          |
| AI analysis (if a standalone view) | Understand the assessment          | "Why does Koby think this?"                       | Structured (6-7/10) | AI assessment component, risk factor list      | Default (4/10)                                                  |
| Activity                           | Full transaction/repayment history | "What actually happened onchain?"                 | High (8/10)         | Table, activity item, provenance labels        | Low (2-3/10) — this is a reference view, not a storytelling one |
| Wallet/transaction flows           | Authorize a specific action        | "What exactly am I about to sign?"                | Low (3/10)          | Modal, transaction status                      | Low (2-3/10) — clarity over motion                              |

No page is forced into an identical layout with another — consistency comes from shared components and tokens (Section 32), not from forcing every page through the same template.

---

## 34. ANTI-SLOP RULES

Koby explicitly rejects: generic SaaS gradients, random purple/blue neon, excessive glassmorphism, glowing borders, excessive pill buttons, excessive rounded cards, giant meaningless hero text, generic AI sparkle icons, random 3D coins, floating crypto coins, generic blockchain illustrations, fake terminal windows, meaningless charts, decorative dashboards, excessive animations, template-like sections, copied layouts, visual noise, unnecessary badges, fake metrics, and fake onchain evidence.

A visual element must have a reason to exist, traceable back to Section 3's five questions. This list is a checklist to run against any new page or component before it ships (Section 37) — if a page contains any item from this list, that's a defect, not a style choice.

---

## 35. REFERENCE STRATEGY

References may come from Mobbin, Awwwards, Pinterest, Cosmos, Webflow, Craftwork, Component Gallery, Savee, Lummi, high-quality financial products, and high-quality infrastructure products.

**Never copy a reference directly.** Instead: Reference A → a layout idea; Reference B → a typography idea; Reference C → an interaction idea; Reference D → a data-visualization idea — synthesized into Koby's own identity (Section 6), never assembled as a visible patchwork of "this section looks like site X, that section looks like site Y."

---

## 36. CUSTOM VISUAL ASSETS

Custom visuals are used where they explain the product, not as generic decoration:

- **Financing lifecycle graphic** — the core diagram (Section 2/Section 19), used on the landing page and potentially condensed on the dashboard/detail page as a status indicator.
- **Receivables flow visualization** — illustrating how future receivables become financing (used in onboarding/creation, Section 33).
- **Onchain settlement visualization** — a simplified, accurate (not technically misleading) illustration of MONAD.md Section 4's lifecycle, for the landing page and possibly an "how it works" explainer.
- **Cash-flow diagrams** — supporting the AI assessment's explanation (Section 15), where a visual genuinely clarifies a pattern better than the factors list alone.
- **AI analysis visualization** — restrained, analytical in tone (Section 15) — never a "magic AI" visual trope.
- **Repayment lifecycle** — Section 23's diagram, illustrated for onboarding/education contexts.
- **Landing-page storytelling assets** — supporting Section 19's narrative, original to Koby.

Avoided: generic stock crypto artwork of any kind. Every custom asset should make the product easier to understand, not just more decorated.

---

## 37. DESIGN REVIEW PROTOCOL

Before implementing a major page:

1. Read DESIGN.md.
2. Understand the page's purpose (Section 33).
3. Identify the required information (trace back to PRD.md/USER_FLOW.md — never invent new data requirements at the design stage).
4. Establish visual hierarchy (what's the one most important thing on this page).
5. Select relevant components from Section 32 — reuse before inventing.
6. Define layout, respecting the page's density/motion targets (Section 5/Section 33).
7. Check responsive behavior (Section 30).
8. Check accessibility (Section 31).
9. Check real-vs-simulated data labeling (Section 25) — does every value on this page have clear provenance?
10. Check anti-slop rules (Section 34).
11. Review visual consistency against already-built pages.
12. Implement.
13. Review the implementation against this document.
14. Refine.

Koby is developed component-by-component and page-by-page — never generated as a whole application in one blind pass. This protocol is compatible with, and can be run alongside, TasteSkill v2's own pre-flight check (its §14) at implementation time.

---

## 38. DESIGN QUALITY CHECKLIST

**Brand**

```
[ ] Does this feel like Koby?
[ ] Does it feel like financial infrastructure?
[ ] Is it distinct from generic Web3?
```

**Hierarchy**

```
[ ] Is the most important information immediately obvious?
[ ] Are financial values readable?
[ ] Are actions clear?
```

**Trust**

```
[ ] Can users distinguish real, testnet, demo, and simulated data?
[ ] Are transaction states accurate?
[ ] Is provenance visible?
```

**Visual quality**

```
[ ] Is the layout intentional?
[ ] Is there enough variation across pages?
[ ] Is there unnecessary decoration?
[ ] Does anything look AI-generated or templated (Section 34)?
```

**Motion**

```
[ ] Does animation serve a purpose?
[ ] Does it distract from financial actions?
```

**Responsive**

```
[ ] Does the design work on mobile?
[ ] Are tables and charts usable at narrow widths?
[ ] Are transaction actions safe and unambiguous on small screens?
```

**Accessibility**

```
[ ] Sufficient contrast in both light and dark mode?
[ ] Visible focus states?
[ ] Status communicated without relying on color alone?
[ ] Touch targets sized appropriately?
```

No item on this checklist is marked complete in this document — it is the standard every implemented page is checked against, not a claim about current implementation state (none exists yet).

---

## FINAL VALIDATION NOTES

- Checked against AGENTS.md, PRD.md, ARCHITECTURE.md, MONAD.md, AI.md, SECURITY.md, USER_FLOW.md, and HACKATHON.md; no contradictions found — this document introduces no new product behavior, only how existing, already-defined behavior is presented visually.
- The MVP state machine, repayment model, AI boundary, wallet-only identity model, and no-fake-onchain rule are all reflected here exactly as those documents define them (Section 23, Section 24, Section 25).
- TasteSkill v2 is treated as a design-quality workflow layered onto Koby's own identity (Section 4, Section 6), not as a source of Koby's identity itself.
- The Alethia reference (Section 19) is used narrowly for storytelling-pacing inspiration only, with an explicit statement that its layout, branding, and visual treatment are not reproduced.
- No application code, components, or packages were created — this document is prose and structural specification only.
