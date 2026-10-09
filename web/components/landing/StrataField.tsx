import { cn } from "@/lib/cn";

/**
 * Relative deepening tones for strata bands. Static strings so the
 * Tailwind compiler can see them. Translucent ink over whatever surface
 * sits beneath, so every band deepens consistently.
 */
const BAND_TONES = [
  "bg-koby-text/[0.02]",
  "bg-koby-text/[0.035]",
  "bg-koby-text/[0.05]",
  "bg-koby-text/[0.07]",
  "bg-koby-text/[0.09]",
  "bg-koby-text/[0.12]",
  "bg-koby-text/[0.16]",
] as const;

type StrataFieldProps = {
  /** Number of sediment bands. Defaults to 6. */
  bands?: number;
  /** Dense accent seam near the base (the liquidity line). Defaults to true. */
  seam?: boolean;
  /** Settlement fault drawn across the bands. Animates in with its Reveal parent. */
  fault?: "vertical" | "horizontal" | null;
  /** Faint contour linework over the bands. */
  contours?: boolean;
  /**
   * Fill mode: absolute-fill for backdrops (default) or in-flow block for
   * strips. In-flow blocks need an explicit height from the caller.
   */
  fill?: boolean;
  className?: string;
};

/**
 * StrataField — the Strata visual world as a reusable backdrop.
 *
 * Diffuse upper bands (estimates, analysis) compress into a dense seam
 * (liquidity); an accent fault marks settlement crossing every layer.
 * Always paired with adjacent copy that says what it means; never a
 * standalone decoration. Rendered absolute-fill; the parent sets position,
 * rounding, and borders.
 */
export function StrataField({
  bands = 6,
  seam = true,
  fault = null,
  contours = false,
  fill = true,
  className,
}: StrataFieldProps) {
  const count = Math.max(2, Math.min(bands, BAND_TONES.length));
  const tones = BAND_TONES.slice(0, count);

  return (
    <div
      aria-hidden="true"
      className={cn(fill ? "absolute inset-0" : "relative", "koby-grain overflow-hidden", className)}
    >
      <div className="absolute inset-0 flex flex-col">
        {tones.map((tone, index) => {
          const isSeam = seam && index === tones.length - 1;
          return (
            <div
              key={tone}
              className={cn(
                "flex-1",
                isSeam ? "border-t border-koby-accent/50 bg-koby-accent-subtle" : tone,
              )}
            />
          );
        })}
      </div>

      {contours ? (
        <svg
          className="absolute inset-0 h-full w-full text-koby-text-muted opacity-40"
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path d="M-10,40 C80,30 140,55 230,42 C300,33 350,48 410,38" />
          <path d="M-10,95 C70,88 160,108 240,96 C310,87 360,100 410,92" />
          <path d="M-10,150 C90,142 170,162 250,150 C320,141 365,154 410,146" />
        </svg>
      ) : null}

      {fault === "vertical" ? (
        <div
          data-orient="vertical"
          className="koby-fault absolute top-0 bottom-0 left-1/2 w-0.5 bg-koby-accent"
        />
      ) : null}
      {fault === "horizontal" ? (
        <div
          data-orient="horizontal"
          className="koby-fault absolute top-1/2 right-0 left-0 h-0.5 bg-koby-accent"
        />
      ) : null}
    </div>
  );
}
