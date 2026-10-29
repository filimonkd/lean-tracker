import Link from "next/link";
import { Apple, Moon, Plus, Sun, Sunrise, type LucideIcon } from "lucide-react";
import { MEAL_TYPES } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { MEAL_STYLES } from "@/lib/palette";
import type { DailySummary, MealType } from "@/lib/types";
import { Badge } from "../ui";

export const MEAL_ICONS: Record<MealType, LucideIcon> = {
  BREAKFAST: Sunrise,
  LUNCH: Sun,
  DINNER: Moon,
  SNACK: Apple,
};

/** Horizontally scrolling colored meal cards; empty meals invite you to add. */
export function MealCards({ summary, editable }: { summary: DailySummary; editable: boolean }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5">
      {MEAL_TYPES.map((meal, i) => {
        const style = MEAL_STYLES[meal];
        const group = summary.meals[meal];
        const Icon = MEAL_ICONS[meal];
        const empty = group.entries.length === 0;
        const names = group.entries.map((e) => e.food.name.split(",")[0]).join(", ");
        const href = `/log?meal=${meal}`;

        const body = (
          <>
            {empty ? (
              <div className="flex h-32 flex-col items-center justify-center gap-1.5 rounded-[22px] border-2 border-dashed border-white/60">
                <span className="flex size-11 items-center justify-center rounded-full bg-white">
                  <Plus className="size-5" strokeWidth={2.4} />
                </span>
                <span className={cn("text-[13px] font-semibold", style.deep)}>{editable ? `Add ${style.label.toLowerCase()}` : "Nothing logged"}</span>
              </div>
            ) : (
              <div className={cn("relative flex h-32 items-center justify-center rounded-[22px]", style.soft)}>
                <Badge className="absolute top-2 right-2">{group.totals.calories} kcal</Badge>
                <Icon className={cn("size-14 opacity-80", style.deep)} strokeWidth={1.5} aria-hidden />
              </div>
            )}
            <span className="mx-2 mt-2.5 font-display text-[19px] font-bold">{style.label}</span>
            <span className={cn("mx-2 mt-0.5 truncate text-[13px]", style.deep)}>{empty ? "Not logged yet" : names}</span>
          </>
        );

        const className = cn(
          "animate-fade-up flex h-[216px] w-[168px] shrink-0 snap-start flex-col rounded-[28px] p-2 text-[#111114] transition active:scale-[0.97]",
          style.bg,
        );
        return editable ? (
          <Link key={meal} href={href} className={className} style={{ animationDelay: `${i * 60}ms` }}>
            {body}
          </Link>
        ) : (
          <div key={meal} className={className}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
