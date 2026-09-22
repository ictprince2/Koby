import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

function Shell({
  children,
  className,
  role,
}: {
  children: ReactNode;
  className?: string;
  role?: string;
}) {
  return (
    <div
      role={role}
      className={cn(
        "rounded-koby-md border border-koby-border bg-koby-surface px-5 py-8 text-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * EmptyState — neutral "nothing here yet", never styled like an error
 * (DESIGN.md Section 27, USER_FLOW.md Section 25).
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Shell className={className}>
      <h2 className="text-base font-semibold text-koby-text">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-koby-text-secondary">{description}</p>
      {action !== undefined ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </Shell>
  );
}

/**
 * LoadingState — describes what is actually loading, never a bare spinner
 * (DESIGN.md Section 26, USER_FLOW.md Section 26).
 */
export function LoadingState({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 py-8">
      <span aria-hidden="true" className="inline-block h-4 w-4 animate-pulse rounded-full bg-koby-text-muted" />
      <p className="text-sm text-koby-text-secondary">{message}</p>
    </div>
  );
}

/**
 * ErrorState — what happened + what is known + what the user can do
 * (USER_FLOW.md Section 27). Never resembles success.
 */
export function ErrorState({
  title,
  message,
  action,
  className,
}: {
  title: string;
  message: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Shell className={cn("border-koby-error", className)} role="alert">
      <h2 className="text-base font-semibold text-koby-error">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-koby-text-secondary">{message}</p>
      {action !== undefined ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </Shell>
  );
}
