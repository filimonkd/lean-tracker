"use client";

import { useState } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { MEAL_TYPES } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { MACRO_STYLES, MEAL_STYLES } from "@/lib/palette";
import type { DailySummary } from "@/lib/types";
import { ThemeToggle } from "../theme-toggle";
import { Card, ChipLink, SectionTitle, SegmentedControl } from "../ui";
import { CalorieRing } from "./calorie-ring";
import { MealCards } from "./meal-cards";

type View = "ring" | "meals";

export function DashboardView({
  summary,
  name,
  isToday,
  dateLabel,
}: {
  summary: DailySummary;
  name: string | null;
  isToday: boolean;
  dateLabel: string;
}) {
  const [view, setView] = useState<View>("ring");

  return (
    <>
      <div className="flex h-13 items-center justify-between">
        <Link
          href="/settings"
          aria-label="Your plan"
          className="flex size-12 items-center justify-center rounded-full bg-[#ffd9c2] font-display text-base font-bold text-[#8a3b12] transition active:scale-95"
        >
          {name ? name.trim()[0]?.toUpperCase() : <UserRound className="size-5" />}
        </Link>
        <SegmentedControl
          ariaLabel="View"
          value={view}
          onChange={setView}
          options={[
            { value: "ring", label: "Ring" },
            { value: "meals", label: "Meals" },
          ]}
        />
        <ThemeToggle />
      </div>

      <p className="mt-7 text-[15px] font-medium text-ink-muted">{dateLabel}</p>
      <h1 className="mt-0.5 font-display text-[52px] leading-none font-bold tracking-[-0.045em]">{isToday ? "Today" : "Yesterday"}</h1>

      <nav aria-label="Day" className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
        <ChipLink href="/" active={isToday}>Today</ChipLink>
        <ChipLink href="/?day=yesterday" active={!isToday}>Yesterday</ChipLink>
        <ChipLink href="/history?range=week">Week</ChipLink>
        <ChipLink href="/history?range=month">Month</ChipLink>
      </nav>

      {view === "ring" ? <RingView summary={summary} isToday={isToday} /> : <MealsView summary={summary} isToday={isToday} />}
    </>
  );
}

/** One short line on how the day is going. */
function statusLine(summary: DailySummary, isToday: boolean) {
  const { consumed, goals, remaining, meals } = summary;
  if (consumed.calories === 0) return isToday ? "Nothing logged yet" : "Nothing was logged";
  if (remaining.calories < 0) return "Over your goal";
  if (consumed.calories / goals.calories >= 0.9) return "Almost there";
  if (!isToday) return "Under your goal";
  const next = (["BREAKFAST", "LUNCH", "DINNER"] as const).find((m) => meals[m].entries.length === 0);
  return next ? `${MEAL_STYLES[next].label} next` : "On track";
}

function RingView({ summary, isToday }: { summary: DailySummary; isToday: boolean }) {
  const { consumed, goals, remaining } = summary;
  const over = remaining.calories < 0;
  const pct = Math.round((consumed.calories / goals.calories) * 100);

  return (
    <div className="animate-fade-up">
      <div className="mt-5">
        <CalorieRing summary={summary} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <div className="rounded-[26px] bg-inverse px-[18px] py-4 text-on-inverse">
          <span className="block text-sm text-on-inverse-muted">{over ? "Over by" : "Remaining"}</span>
          <span key={remaining.calories} className="animate-pop mt-0.5 block font-display text-[34px] font-bold tracking-[-0.04em] tabular-nums">
            {Math.abs(remaining.calories).toLocaleString()}
          </span>
          <span className="block text-sm text-on-inverse-muted">{over ? "kcal above goal" : `kcal left${isToday ? " today" : ""}`}</span>
        </div>
        <div className="rounded-[26px] bg-surface px-[18px] py-4">
          <span className="block text-sm text-ink-muted">Daily goal</span>
          <span className="mt-0.5 block font-display text-[34px] font-bold tracking-[-0.04em] tabular-nums">{pct}%</span>
          <span className="block truncate text-sm text-ink-muted">{statusLine(summary, isToday)}</span>
        </div>
      </div>

      <Card className="mt-2.5 rounded-[28px]">
        <SectionTitle action={<span className="text-sm text-ink-muted">eaten / goal</span>}>Macros</SectionTitle>
        <div className="flex flex-col gap-4">
          {(["protein", "carbs", "fat"] as const).map((key) => {
            const eaten = consumed[key];
            const goal = goals[key];
            const width = goal > 0 ? Math.min(100, (eaten / goal) * 100) : 0;
            return (
              <div key={key} className="flex flex-col gap-2">
                <div className="flex justify-between text-[15px]">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className={cn("size-2.5 rounded-full", MACRO_STYLES[key].dot)} />
                    {MACRO_STYLES[key].label}
                  </span>
                  <span className={cn("tabular-nums", eaten > goal ? "text-danger" : "text-ink-soft")}>
                    <b className={eaten > goal ? "text-danger" : "text-ink"}>{Math.round(eaten)}</b> / {goal} g
                  </span>
                </div>
                <div className="h-3 rounded-full bg-surface-muted">
                  <div
                    className={cn("h-3 rounded-full transition-[width] duration-700 ease-out", MACRO_STYLES[key].dot)}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-7 flex items-baseline justify-between">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.03em]">Meals</h2>
        {isToday && (
          <Link href="/log" className="text-[15px] font-medium text-ink-soft hover:text-ink">
            Log food
          </Link>
        )}
      </div>
      <div className="mt-3.5">
        <MealCards summary={summary} editable={isToday} />
      </div>
    </div>
  );
}

function MealsView({ summary, isToday }: { summary: DailySummary; isToday: boolean }) {
  return (
    <div className="animate-fade-up mt-5 flex flex-col gap-2.5">
      {MEAL_TYPES.map((meal) => {
        const group = summary.meals[meal];
        const style = MEAL_STYLES[meal];
        return (
          <Card key={meal} className="rounded-[28px] py-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-display text-[17px] font-bold">
                <span className={cn("size-2.5 rounded-full", style.dot)} />
                {style.label}
              </span>
              <span className="text-sm text-ink-soft tabular-nums">{group.totals.calories} kcal</span>
            </div>
            {group.entries.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">
                Nothing logged.{" "}
                {isToday && (
                  <Link href={`/log?meal=${meal}`} className="font-medium text-ink underline underline-offset-2">
                    Add {style.label.toLowerCase()}
                  </Link>
                )}
              </p>
            ) : (
              <ul className="mt-2">
                {group.entries.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 border-t border-line py-2.5 first:border-t-0">
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium">{e.food.name}</span>
                      <span className="block text-[13px] text-ink-muted">
                        {e.quantity === 1 ? e.food.servingSize : `${e.quantity} × ${e.food.servingSize}`}
                      </span>
                    </span>
                    <span className="text-[15px] font-semibold tabular-nums">{e.calories}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}
