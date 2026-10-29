"use client";

import { MEAL_TYPES } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { MEAL_STYLES } from "@/lib/palette";
import type { MealType } from "@/lib/types";
import { Chip } from "../ui";

export function MealPicker({ value, onChange, label = "Meal" }: { value: MealType; onChange: (m: MealType) => void; label?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
      {MEAL_TYPES.map((meal) => (
        <Chip
          key={meal}
          role="radio"
          aria-checked={value === meal}
          selected={value === meal}
          tone="inverse"
          onClick={() => onChange(meal)}
          className="px-3.5 text-sm"
        >
          <span className={cn("size-2 rounded-full", MEAL_STYLES[meal].dot)} />
          {MEAL_STYLES[meal].label}
        </Chip>
      ))}
    </div>
  );
}
