/** Tiny class-name joiner. No external dependency by design (Phase 1). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
