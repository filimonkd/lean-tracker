import { cn } from "@/lib/cn";

/**
 * The Chart L mark: an "L" drawn as chart axes with a mint trend line stepping
 * down. The axes use currentColor, so the mark follows the text color in both
 * themes; the end dot's ring matches the page background.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("size-8", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <rect x="16" y="12" width="16" height="74" rx="8" fill="currentColor" />
      <rect x="16" y="70" width="70" height="16" rx="8" fill="currentColor" />
      <polyline
        points="42,24 54,42 63,36 80,56"
        fill="none"
        stroke="#4FD992"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="80" cy="56" r="7.5" fill="#4FD992" strokeWidth="3" style={{ stroke: "var(--bg)" }} />
    </svg>
  );
}

/** Mark + "Lean Tracker" wordmark. */
export function LogoLockup({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <LogoMark className="size-8" />
      <span className="font-display text-[22px] font-bold tracking-[-0.04em]">Lean Tracker</span>
    </span>
  );
}
