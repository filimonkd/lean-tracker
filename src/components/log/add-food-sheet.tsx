"use client";

import { useState, useTransition } from "react";
import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteCustomFood, logFood } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { MACRO_STYLES, MEAL_STYLES } from "@/lib/palette";
import type { Food, FoodLogEntry, MealType } from "@/lib/types";
import { Button, Chip, FormError } from "../ui";
import { MealPicker } from "./meal-picker";

const SHORTCUTS = [
  { value: 0.5, label: "½" },
  { value: 1, label: "1" },
  { value: 1.5, label: "1½" },
  { value: 2, label: "2" },
];

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Contents of the "add food" bottom sheet: servings, meal, live preview. */
export function AddFoodSheet({
  food,
  initialMeal,
  remaining,
  onAdded,
  onEdit,
  onDeleted,
}: {
  food: Food;
  initialMeal: MealType;
  remaining: number;
  onAdded: (entry: FoodLogEntry) => void;
  /** Custom foods only: open the editor for this food. */
  onEdit: (food: Food) => void;
  onDeleted: (food: Food, archived: boolean) => void;
}) {
  const [quantity, setQuantity] = useState("1");
  const [meal, setMeal] = useState<MealType>(initialMeal);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, startDelete] = useTransition();

  function remove() {
    setError(null);
    startDelete(async () => {
      const result = await deleteCustomFood(food.id);
      if (!result.ok) return setError(result.error);
      onDeleted(food, result.data.archived);
    });
  }

  const q = Number(quantity);
  const valid = Number.isFinite(q) && q >= 0.1 && q <= 100;
  const scaled = (n: number) => (valid ? n * q : 0);
  const kcal = Math.round(scaled(food.calories));
  const after = remaining - kcal;

  const step = (delta: number) => setQuantity((v) => String(Math.max(0.5, round1((Number(v) || 0) + delta))));

  function add() {
    if (!valid) return setError("Servings must be between 0.1 and 100.");
    setError(null);
    startTransition(async () => {
      const result = await logFood({ foodItemId: food.id, mealType: meal, quantity: q });
      if (!result.ok) return setError(result.error);
      onAdded(result.data);
    });
  }

  return (
    <div className="flex flex-col">
      {food.isCustom &&
        (confirmingDelete ? (
          <div role="alertdialog" aria-labelledby="delete-title" className="animate-fade-up mb-4 rounded-[24px] bg-surface p-4">
            <p id="delete-title" className="font-semibold">Delete {food.name}?</p>
            <p className="mt-1 text-[13px] text-ink-muted">
              It&apos;s removed from My foods and search. Anything you&apos;ve already logged stays in your history.
            </p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" className="flex-1" onClick={remove} loading={deleting}>
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <div className="-mt-9 mb-3 flex items-center gap-1 pr-11">
            <span className="mr-auto rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink-soft">My food</span>
            <Button variant="ghost" size="sm" onClick={() => onEdit(food)}>
              <Pencil className="size-4" /> Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => setConfirmingDelete(true)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </div>
        ))}

      <div className="mt-1 flex h-[164px] w-[250px] -rotate-3 flex-col self-center rounded-[30px] bg-sky p-5 text-[#111114] shadow-xl shadow-sky/30">
        <span className="truncate font-display text-[22px] font-bold">{food.name}</span>
        <span key={kcal} className="animate-pop mt-auto font-display text-[46px] leading-none font-bold tracking-[-0.045em] tabular-nums">
          {kcal} kcal
        </span>
        <span className="mt-1.5 truncate text-[13px] text-[#0b3a52]">
          {valid && q !== 1 ? `${round1(q)} × ` : ""}
          {food.servingSize}
        </span>
      </div>

      <label htmlFor="servings" className="mt-7 mb-2.5 text-sm font-medium text-ink-muted">
        Servings
      </label>
      <div className="flex items-center justify-between rounded-full bg-surface p-1.5">
        <Button variant="secondary" size="icon" onClick={() => step(-0.5)} aria-label="Fewer servings" disabled={q <= 0.5}>
          <Minus className="size-5" strokeWidth={2.6} />
        </Button>
        <input
          id="servings"
          type="number"
          inputMode="decimal"
          step="0.5"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-24 bg-transparent text-center font-display text-[34px] font-bold tracking-tight text-ink outline-none"
        />
        <Button size="icon" onClick={() => step(0.5)} aria-label="More servings">
          <Plus className="size-5" strokeWidth={2.6} />
        </Button>
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-2">
        {SHORTCUTS.map((s) => (
          <Chip key={s.value} selected={q === s.value} aria-pressed={q === s.value} onClick={() => setQuantity(String(s.value))} className="justify-center">
            {s.label}
          </Chip>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {(["protein", "carbs", "fat"] as const).map((key) => (
          <div key={key} className="rounded-[20px] bg-surface px-3.5 py-3">
            <span className="flex items-center gap-1.5 text-xs text-ink-muted">
              <span className={cn("size-2 rounded-full", MACRO_STYLES[key].dot)} />
              {MACRO_STYLES[key].label}
            </span>
            <span className="mt-0.5 block font-display text-xl font-bold tabular-nums">{round1(scaled(food[key]))} g</span>
          </div>
        ))}
      </div>

      <p className="mt-5 mb-2.5 text-sm font-medium text-ink-muted">Add to</p>
      <MealPicker value={meal} onChange={setMeal} label="Add to meal" />

      <p className="mt-4 text-center text-[13px] text-ink-muted">
        {after >= 0 ? (
          <>After this you&apos;ll have <b className="text-ink">{after.toLocaleString()} kcal</b> left today.</>
        ) : (
          <>This takes you <b className="text-danger">{(-after).toLocaleString()} kcal</b> over today&apos;s goal.</>
        )}
      </p>

      <div className="mt-3">
        <FormError message={error} />
      </div>

      <Button size="lg" className="mt-3 w-full text-[17px]" onClick={add} loading={pending} disabled={!valid}>
        Add to {MEAL_STYLES[meal].label}
        <span className={cn("inline-flex h-7 items-center rounded-full px-2.5 text-[13px] font-semibold text-[#111114] tabular-nums", MEAL_STYLES[meal].bg)}>
          {kcal} kcal
        </span>
      </Button>
    </div>
  );
}
