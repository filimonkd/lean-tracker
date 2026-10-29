"use client";

import { useOptimistic, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteFoodLog } from "@/lib/actions";
import { MEAL_TYPES } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { MEAL_STYLES } from "@/lib/palette";
import type { DailySummary, FoodLogEntry } from "@/lib/types";
import { Button } from "../ui";

/** Today's entries grouped by meal. Deletes disappear instantly (optimistic). */
export function TodaysLog({
  summary,
  highlightId,
  onError,
}: {
  summary: DailySummary;
  highlightId: string | null;
  onError: (message: string) => void;
}) {
  const allEntries = MEAL_TYPES.flatMap((m) => summary.meals[m].entries);
  const [entries, removeOptimistic] = useOptimistic(allEntries, (state: FoodLogEntry[], id: string) =>
    state.filter((e) => e.id !== id),
  );
  const [, startTransition] = useTransition();

  function remove(entry: FoodLogEntry) {
    startTransition(async () => {
      removeOptimistic(entry.id);
      const result = await deleteFoodLog(entry.id);
      if (!result.ok) onError(result.error); // the entry reappears when the transition ends
    });
  }

  const total = Math.round(entries.reduce((sum, e) => sum + e.calories, 0));

  return (
    <section aria-labelledby="todays-log" className="mt-8">
      <div className="flex items-baseline justify-between">
        <h2 id="todays-log" className="font-display text-[26px] font-bold tracking-[-0.03em]">
          Today&apos;s log
        </h2>
        <span className="text-[15px] text-ink-soft">
          <b key={total} className="animate-pop inline-block text-ink tabular-nums">{total.toLocaleString()}</b> kcal
        </span>
      </div>

      <div className="mt-3.5 flex flex-col gap-2.5">
        {MEAL_TYPES.map((meal) => {
          const items = entries.filter((e) => e.mealType === meal);
          const style = MEAL_STYLES[meal];
          const kcal = Math.round(items.reduce((s, e) => s + e.calories, 0));

          if (items.length === 0) {
            return (
              <div key={meal} className="flex items-center justify-between rounded-[24px] border-2 border-dashed border-chip px-4 py-3">
                <span className="flex items-center gap-2 font-display text-base font-bold">
                  <span className={cn("size-2.5 rounded-full", style.dot)} />
                  {style.label}
                </span>
                <span className="text-[13px] text-ink-muted">Nothing logged yet</span>
              </div>
            );
          }

          return (
            <div key={meal} className="rounded-[28px] bg-surface px-[18px] py-1.5">
              <div className="flex items-center justify-between pt-3 pb-1.5">
                <span className="flex items-center gap-2 font-display text-[17px] font-bold">
                  <span className={cn("size-2.5 rounded-full", style.dot)} />
                  {style.label}
                </span>
                <span className="text-sm text-ink-soft tabular-nums">{kcal} kcal</span>
              </div>
              <ul>
                {items.map((e) => (
                  <li
                    key={e.id}
                    className={cn(
                      "flex items-center gap-2.5 border-t border-line py-2",
                      e.id === highlightId && "animate-pop",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{e.food.name}</span>
                      <span className="block truncate text-[13px] text-ink-muted">
                        {e.quantity === 1 ? e.food.servingSize : `${e.quantity} × ${e.food.servingSize}`}
                      </span>
                    </span>
                    {e.id === highlightId && <span className="rounded-full bg-lunch/25 px-2 py-0.5 text-[11px] font-semibold text-ink">New</span>}
                    <span className="text-[15px] font-semibold tabular-nums">{e.calories}</span>
                    <Button variant="ghost" size="icon-sm" onClick={() => remove(e)} aria-label={`Delete ${e.food.name}`}>
                      <Trash2 className="size-[18px]" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
