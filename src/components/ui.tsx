// Small presentational building blocks shared by every screen.

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-[32px] bg-surface p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  description,
  action,
  as: Tag = "h2",
}: {
  children: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Tag className="font-display text-xl font-bold tracking-tight text-ink">{children}</Tag>
        {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const buttonVariants = {
  primary: "bg-inverse text-on-inverse hover:opacity-90",
  accent: "bg-lunch text-[#111114] hover:brightness-95",
  secondary: "bg-surface-muted text-ink hover:bg-line",
  ghost: "text-ink-soft hover:bg-surface-muted hover:text-ink",
  danger: "text-danger hover:bg-danger/10",
  destructive: "bg-danger text-white hover:opacity-90",
} as const;

const buttonSizes = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-[15px]",
  lg: "h-14 px-6 text-base",
  icon: "size-12",
  "icon-sm": "size-9",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/** Outlined pill used for filters and choices; filled when selected. */
export function Chip({
  selected,
  tone = "light",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean; tone?: "light" | "inverse" }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[15px] transition active:scale-95",
        selected
          ? tone === "inverse"
            ? "border-inverse bg-inverse font-semibold text-on-inverse"
            : "border-surface bg-surface font-medium text-ink shadow-sm shadow-black/5"
          : "border-chip text-ink-soft hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** A Chip that navigates (e.g. date-range filters kept in the URL). */
export function ChipLink({ href, active, children }: { href: string; active?: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-[15px] transition active:scale-95",
        active ? "border-surface bg-surface font-medium text-ink shadow-sm shadow-black/5" : "border-chip text-ink-soft hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-soft">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Unit shown inside the right edge, e.g. "kg". */
  suffix?: ReactNode;
  /** Tighter padding for narrow side-by-side inputs (e.g. ft + in). */
  compact?: boolean;
  /** "raised" for inputs sitting on the page background (sheets) instead of a card. */
  tone?: "inset" | "raised";
}

export function Input({ suffix, compact, tone = "inset", className, ...props }: InputProps) {
  return (
    <div className="relative">
      <input
        className={cn(
          "h-13 w-full rounded-[18px] border border-transparent font-display text-lg font-semibold text-ink placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-ink-muted/70",
          tone === "raised" ? "bg-surface" : "bg-bg",
          "outline-none transition focus:border-ink/20 focus:bg-surface focus:ring-4 focus:ring-ink/5",
          compact ? "px-3" : "px-4",
          Boolean(suffix) && (compact ? "pr-8" : "pr-12"),
          className,
        )}
        {...props}
      />
      {suffix && (
        <span
          className={cn(
            "pointer-events-none absolute inset-y-0 flex items-center text-sm text-ink-muted",
            compact ? "right-3" : "right-4",
          )}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  size = "md",
  className,
}: {
  value: T | null;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  ariaLabel: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("flex gap-0.5 rounded-full bg-surface-muted p-1", className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap transition",
              size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-[15px]",
              selected ? "bg-surface text-ink shadow-sm shadow-black/10 dark:bg-ink dark:text-bg" : "text-ink-muted hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[28px] bg-surface-muted", className)} />;
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="animate-shake rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
      {message}
    </p>
  );
}

/** Small "34 kcal"-style badge. */
export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-7 items-center rounded-full bg-white px-2.5 text-[13px] font-semibold text-[#111114] tabular-nums", className)}>
      {children}
    </span>
  );
}
