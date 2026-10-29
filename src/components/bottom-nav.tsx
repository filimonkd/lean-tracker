"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartLine, House, Plus, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/", label: "Today", icon: House },
  { href: "/log", label: "Log Food", icon: Plus },
  { href: "/history", label: "Progress", icon: ChartLine },
  { href: "/settings", label: "Plan", icon: UserRound },
] as const;

// Full-screen flows that shouldn't show the tab bar.
const HIDDEN_ON = ["/onboarding"];

/** Floating pill tab bar: the current tab expands to show its label. */
export function BottomNav() {
  const pathname = usePathname();
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 mx-auto w-[calc(100%-2rem)] max-w-[24rem]"
    >
      <ul className="flex h-[68px] items-center justify-between rounded-full bg-nav p-2 shadow-xl shadow-black/25 ring-1 ring-white/5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const isLog = href === "/log";
          return (
            <li key={href} className={cn(active && "flex-1", "flex justify-center transition-[flex] duration-300")}>
              <Link
                href={href}
                aria-label={active ? undefined : label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[52px] items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-all duration-300 active:scale-95",
                  active ? "w-full max-w-40 px-4" : "w-[52px]",
                  isLog
                    ? "bg-lunch text-[#111114]"
                    : active
                      ? "bg-nav-active text-[#111114]"
                      : "text-[#a9a9bb] hover:text-white",
                )}
              >
                <Icon className={cn("size-[22px] shrink-0", active && "animate-pop")} strokeWidth={isLog ? 2.6 : 2.2} />
                {active && <span className="animate-fade-up truncate">{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
