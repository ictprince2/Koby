import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "destructive";
type Size = "sm" | "md" | "lg";

const VARIANT_STYLES: Record<Variant, string> = {
  primary:
    "bg-koby-accent text-koby-accent-text hover:bg-koby-accent-hover border border-transparent",
  secondary:
    "bg-koby-surface text-koby-text border border-koby-border-strong hover:bg-koby-bg-secondary",
  destructive:
    "bg-koby-error-subtle text-koby-error border border-koby-error hover:bg-koby-error hover:text-white",
};

const SIZE_STYLES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
  className?: string;
};

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type AnchorProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    href: string;
  };

/**
 * Action-labeled button (DESIGN.md Sections 8/21/32). Financial actions must
 * state action + amount in the label (e.g. "Fund $70,000 financing"), never
 * a bare "Continue". Minimum 44px touch target at md/lg.
 */
export function Button(props: ButtonProps | AnchorProps) {
  const { variant = "primary", size = "md", loading = false, className, children, ...rest } = props;
  const styles = cn(
    "inline-flex items-center justify-center gap-2 rounded-koby-sm font-semibold",
    "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    "min-h-[44px]",
    VARIANT_STYLES[variant],
    SIZE_STYLES[size],
    className,
  );

  if ("href" in props && props.href !== undefined) {
    const { href, ...anchorRest } = rest as AnchorProps;
    return (
      <a href={href} className={styles} aria-busy={loading || undefined} {...anchorRest}>
        {children}
      </a>
    );
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      type={buttonRest.type ?? "button"}
      className={styles}
      disabled={buttonRest.disabled ?? loading}
      aria-busy={loading || undefined}
      {...buttonRest}
    >
      {loading ? (
        <span aria-hidden="true" className="inline-block animate-pulse">
          …
        </span>
      ) : null}
      {children}
    </button>
  );
}
