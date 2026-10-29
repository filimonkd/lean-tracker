import type { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";

/** Big, tight display heading with an optional eyebrow line above it. */
export function PageHeader({ title, eyebrow, action }: { title: ReactNode; eyebrow?: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-6 flex items-end justify-between gap-3 pt-3">
      <div className="min-w-0">
        {eyebrow && <p className="text-[15px] font-medium text-ink-muted">{eyebrow}</p>}
        <h1 className="mt-0.5 font-display text-[52px] leading-none font-bold tracking-[-0.045em] text-ink">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-1 pb-1">
        {action}
        <ThemeToggle />
      </div>
    </header>
  );
}
