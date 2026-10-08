import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Shared documentation primitives. Restrained editorial treatment on the
 * existing Koby tokens: thin dividers, mono metadata, comfortable reading
 * width. No new dependencies, no decorative elements.
 */

export function DocHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <header>
      <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-koby-text sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-koby-text-secondary">
        {intro}
      </p>
    </header>
  );
}

export function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mt-10 border-t border-koby-border pt-8">
      <h2
        id={id}
        className="group scroll-mt-24 text-xl font-bold tracking-tight text-koby-text"
      >
        {title}{" "}
        <a
          href={`#${id}`}
          aria-label={`Link to section: ${title}`}
          className="font-mono text-sm font-medium text-koby-text-muted opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          #
        </a>
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function DocParagraph({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 max-w-[68ch] text-[15px] leading-7 text-koby-text-secondary">
      {children}
    </p>
  );
}

export function DocList({ children }: { children: ReactNode }) {
  return (
    <ul className="mt-4 max-w-[68ch] list-disc space-y-2 pl-5 text-[15px] leading-7 text-koby-text-secondary">
      {children}
    </ul>
  );
}

type CalloutTone = "note" | "caution" | "demo";

const CALLOUT_STYLES: Record<CalloutTone, string> = {
  note: "border-koby-border bg-koby-bg-secondary text-koby-text-secondary",
  caution: "border-koby-warning bg-koby-warning-subtle text-koby-text-secondary",
  demo: "border-dashed border-koby-demo-border bg-koby-demo-bg text-koby-demo-text",
};

export function Callout({
  tone = "note",
  title,
  children,
}: {
  tone?: CalloutTone;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      role="note"
      className={cn("mt-6 max-w-[68ch] rounded-koby-sm border p-4", CALLOUT_STYLES[tone])}
    >
      <p className="text-sm font-semibold text-koby-text">{title}</p>
      <div className="mt-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function CodeBlock({ code, caption }: { code: string; caption?: string }) {
  return (
    <figure className="mt-4 max-w-[68ch]">
      {caption !== undefined ? (
        <figcaption className="mb-2 font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase">
          {caption}
        </figcaption>
      ) : null}
      <pre className="overflow-x-auto rounded-koby-sm border border-koby-border bg-koby-bg-secondary p-4 font-mono text-[13px] leading-relaxed text-koby-text">
        <code>{code}</code>
      </pre>
    </figure>
  );
}

/** Responsive table wrapper: horizontal scroll is a secondary affordance,
 *  the table itself stays compact so narrow viewports rarely need it. */
export function DocTable({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 max-w-[68ch] overflow-x-auto rounded-koby-sm border border-koby-border">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function DocTh({ children }: { children: ReactNode }) {
  return (
    <th
      scope="col"
      className="border-b border-koby-border px-3 py-2.5 align-top font-mono text-[11px] font-medium tracking-[0.14em] whitespace-nowrap text-koby-text-muted uppercase"
    >
      {children}
    </th>
  );
}

export function DocTd({
  children,
  mono = false,
}: {
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <td
      className={cn(
        "border-b border-koby-border px-3 py-2.5 align-top text-[13px] leading-relaxed text-koby-text-secondary last:border-b-0",
        mono && "font-mono text-[12px] break-all",
      )}
    >
      {children}
    </td>
  );
}

/** Inline code: mono treatment for addresses, identifiers, and values. */
export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-koby-sm border border-koby-border bg-koby-bg-secondary px-1.5 py-0.5 font-mono text-[0.85em] break-all text-koby-text">
      {children}
    </code>
  );
}

/** Related-documentation links at the foot of a page. */
export function RelatedDocs({ links }: { links: Array<{ href: string; label: string }> }) {
  return (
    <nav aria-label="Related documentation" className="mt-10 border-t border-koby-border pt-6">
      <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-koby-text-muted uppercase">
        Related
      </p>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm font-medium text-koby-accent hover:underline"
            >
              {link.label} →
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
