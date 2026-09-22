import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";

const PROBLEM_POINTS = [
  {
    title: "Revenue arrives later than capital is needed",
    body: "A business can see contracted orders, subscriptions, or recurring work on the horizon while payroll, inventory, and growth cannot wait.",
  },
  {
    title: "Traditional receivables financing is slow and opaque",
    body: "Manual review, private ledgers, and unclear terms keep smaller businesses waiting and leave financiers with little verifiable evidence.",
  },
] as const;

/**
 * ProblemSection — editorial stack. Type hierarchy carries the section;
 * no imagery, no cards-as-decoration.
 */
export function ProblemSection() {
  return (
    <section aria-labelledby="koby-problem-heading">
      <Container className="py-12 sm:py-16">
        <Reveal>
          <div id="koby-problem-heading">
            <SectionHeading
              title="Businesses earn later. They need capital now."
              description="Koby exists for the gap between predictable future revenue and present capital needs."
            />
          </div>
        </Reveal>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {PROBLEM_POINTS.map((point, index) => (
            <Reveal key={point.title} delay={index * 90}>
              <div className="border-t border-koby-border-strong pt-5">
                <h3 className="text-lg font-semibold text-koby-text">{point.title}</h3>
                <p className="mt-2 max-w-[65ch] text-base leading-relaxed text-koby-text-secondary">
                  {point.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
