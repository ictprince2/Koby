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
  title: "AI Assessment — Koby Docs",
  description:
    "How Koby's cash-flow assessment works: inputs, structured outputs, live providers versus deterministic fallback, and limitations.",
};

export default function DocsAiAssessmentPage() {
  return (
    <>
      <DocHeader
        eyebrow="Documentation · AI Assessment"
        title="AI assessment"
        intro="AI in Koby is an analysis layer: it reads submitted business figures and produces an explainable financing assessment. It advises the humans who decide; it never approves, guarantees, funds, or executes anything."
      />

      <DocSection id="inputs" title="What the assessment receives">
        <DocParagraph>
          The assessment receives only structured, validated business input — required figures
          (business name, future receivables, requested financing, repayment period) plus optional
          supporting figures (business type, operating history, monthly and historical revenue,
          operating expenses, existing obligations, customer concentration, payment terms, and short
          supporting notes). Free-text notes are treated as untrusted content: summarized, never
          followed as instructions.
        </DocParagraph>
        <DocParagraph>
          All figures are self-reported and unverified unless labeled observed. No onchain signals
          feed the assessment in the current implementation — there is no Nansen code path yet — so
          the model works purely from what the business submitted, and its explanations say so.
        </DocParagraph>
      </DocSection>

      <DocSection id="outputs" title="What the assessment produces">
        <CodeBlock
          caption="Structured output core"
          code={[
            "type RiskAssessment = {",
            "  score: number;        // 0–100, how the opportunity looks given the data",
            "  confidence: number;   // 0–100, how much data the model had",
            "  factors: string[];    // traceable reasons behind the score",
            "  recommendation: string; // financing assessment, non-guaranteeing language",
            "};",
          ].join("\n")}
        />
        <DocParagraph>
          The scored core travels inside a wider analysis envelope: revenue and financing summaries,
          cash-flow observations, a consistency trend, concentration and repayment-capacity notes,
          missing information, inconsistencies, key findings, and confidence limitations — plus a
          mandatory review flag stating that human or financier review is required. The route also
          returns deterministic figures computed with integer math: the requested-to-receivables
          ratio in basis points and an advisory eligible amount (the lower of the request and 70% of
          receivables).
        </DocParagraph>
      </DocSection>

      <DocSection id="review" title="How results inform financing review">
        <DocParagraph>
          The assessment is presented with score and confidence visually separated, factors as a
          scannable list, and the recommendation set apart — never as an unexplained number, and
          never styled as an approval. The business proposes its own terms and reviews them against
          the assessment; the financier reviews the same assessment on the opportunity. Financing
          terms are set by that human review, informed by the assessment, and nothing is created
          onchain until the business signs.
        </DocParagraph>
      </DocSection>

      <DocSection id="live-vs-fallback" title="Live response vs deterministic fallback">
        <DocTable>
          <thead>
            <tr>
              <DocTh>Source</DocTh>
              <DocTh>Label shown</DocTh>
              <DocTh>When served</DocTh>
            </tr>
          </thead>
          <tbody>
            <tr>
              <DocTd>OpenRouter (active live provider)</DocTd>
              <DocTd>OpenRouter AI Assessment</DocTd>
              <DocTd>Configured model responds with fully valid output</DocTd>
            </tr>
            <tr>
              <DocTd>Kimi / Moonshot (fallback live provider)</DocTd>
              <DocTd>Kimi AI Assessment</DocTd>
              <DocTd>OpenRouter unavailable or invalid; Kimi responds validly</DocTd>
            </tr>
            <tr>
              <DocTd>Deterministic methodology</DocTd>
              <DocTd>Demo AI Assessment</DocTd>
              <DocTd>No provider configured, unreachable, slow, or any output fails validation</DocTd>
            </tr>
          </tbody>
        </DocTable>
        <DocParagraph>
          Provider precedence is OpenRouter first, then Kimi, then the fallback; both live attempts
          run concurrently under a tight per-provider timeout so a slow provider degrades to the
          labeled fallback instead of timing out the request. Validation is all-or-nothing: a single
          invalid field rejects the entire provider response, and live and fallback outputs are
          never mixed. Methodology versions (<Code>koby-openrouter-v0</Code>,{" "}
          <Code>koby-kimi-v0</Code>, <Code>koby-deterministic-v0</Code>) keep assessments traceable
          across provider and methodology changes.
        </DocParagraph>
        <Callout tone="demo" title="Demo AI Assessment is simulated analysis">
          <p>
            The deterministic fallback derives its score from fixed, documented rules over the
            submitted figures — it is not a model judgment. Wherever it appears it is labeled Demo
            AI Assessment with Simulated provenance, so it can never be mistaken for a live result.
          </p>
        </Callout>
      </DocSection>

      <DocSection id="limitations" title="Limitations">
        <DocParagraph>
          The assessment analyzes only what it was given: self-reported figures with no independent
          verification and, currently, no onchain signals. It cannot detect false input — a
          fictional business with coherent numbers assesses coherently, which is why demo businesses
          are always labeled fictional. Confidence reflects data completeness and consistency, never
          a guarantee of outcome, and the language rules are strict: no guaranteed approval,
          repayment, return, or profit, and no risk-free or certain-revenue claims appear in any
          output.
        </DocParagraph>
        <DocParagraph>
          Structurally, the AI service has no signer, no wallet access, and no contract permission.
          A hallucinated or manipulated output can produce a bad recommendation — which validation
          and human review exist to catch — but it cannot move funds or change contract state by
          itself, under any circumstance.
        </DocParagraph>
      </DocSection>

      <RelatedDocs
        links={[
          { href: "/docs/how-it-works", label: "How It Works" },
          { href: "/docs/architecture", label: "Architecture" },
          { href: "/docs/security", label: "Smart Contracts & Security" },
        ]}
      />
    </>
  );
}
