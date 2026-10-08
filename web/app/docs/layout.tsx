import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { DocsNav } from "@/components/docs/DocsNav";

export const metadata = {
  title: "Documentation — Koby",
  description:
    "Technical documentation for Koby: onchain receivables-financing infrastructure on Monad. Architecture, financing lifecycle, AI assessment, smart contracts, and developer guide.",
};

/**
 * Docs layout — sidebar + reading column. Reuses the global AppShell chrome
 * and Koby tokens; the sidebar collapses into a disclosure menu on mobile.
 */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <Container className="py-10 sm:py-14">
      <p className="text-sm">
        <Link
          href="/"
          className="font-medium text-koby-text-secondary transition-colors hover:text-koby-text"
        >
          ← Back to the Koby app
        </Link>
      </p>
      <div className="mt-6 grid min-w-0 gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        <DocsNav />
        <article className="min-w-0 max-w-[76ch] pb-8">{children}</article>
      </div>
    </Container>
  );
}
