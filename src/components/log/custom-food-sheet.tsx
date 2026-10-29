"use client";

import { useState, useTransition } from "react";
import { addCustomFood, updateCustomFood } from "@/lib/actions";
import { MEAL_STYLES } from "@/lib/palette";
import type { Food, FoodLogEntry, MealType } from "@/lib/types";
import { Button, Field, FormError, Input } from "../ui";
import { MealPicker } from "./meal-picker";

type Props =
  | {
      mode: "create";
      initialName: string;
      initialMeal: MealType;
      onCreated: (food: Food, entry: FoodLogEntry | null) => void;
    }
  | {
      mode: "edit";
      food: Food;
      onSaved: (food: Food, versioned: boolean) => void;
    };

const asField = (n: number) => String(Math.round(n * 10) / 10);

/** Contents of the custom food bottom sheet: create (and optionally log) or edit. */
export function CustomFoodSheet(props: Props) {
  const editing = props.mode === "edit" ? props.food : null;
  const [values, setValues] = useState(() =>
    editing
      ? {
          name: editing.name,
          servingSize: editing.servingSize,
          calories: asField(editing.calories),
          protein: asField(editing.protein),
          carbs: asField(editing.carbs),
          fat: asField(editing.fat),
        }
      : { name: props.mode === "create" ? props.initialName : "", servingSize: "", calories: "", protein: "", carbs: "", fat: "" },
  );
  const [meal, setMeal] = useState<MealType>(props.mode === "create" ? props.initialMeal : "SNACK");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState<"log" | "save" | null>(null);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function submit(andLog: boolean) {
    setError(null);
    if (!values.name.trim()) return setError("Give your food a name.");
    if (values.calories.trim() === "") return setError("Enter the calories per serving.");
    const input = {
      name: values.name,
      servingSize: values.servingSize,
      calories: Number(values.calories),
      protein: Number(values.protein || 0),
      carbs: Number(values.carbs || 0),
      fat: Number(values.fat || 0),
    };
    setSubmitting(andLog ? "log" : "save");
    startTransition(async () => {
      if (props.mode === "edit") {
        const result = await updateCustomFood(props.food.id, input);
        setSubmitting(null);
        if (!result.ok) return setError(result.error);
        props.onSaved(result.data.food, result.data.versioned);
        return;
      }
      const result = await addCustomFood(input, andLog ? { mealType: meal, quantity: 1 } : undefined);
      setSubmitting(null);
      if (!result.ok) return setError(result.error);
      props.onCreated(result.data.food, result.data.entry);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(!editing);
      }}
      className="flex flex-col gap-4"
      noValidate
    >
      <div>
        <h2 className="font-display text-[32px] leading-tight font-bold tracking-[-0.03em]">{editing ? "Edit food" : "Custom food"}</h2>
        <p className="text-sm text-ink-muted">
          {editing ? "Entries you've already logged keep their original values." : "Values for one serving, from the label."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Name" htmlFor="cf-name" className="col-span-2">
          <Input tone="raised" id="cf-name" value={values.name} onChange={set("name")} placeholder="e.g. Injera" maxLength={80} autoComplete="off" />
        </Field>
        <Field label="Serving size" htmlFor="cf-serving">
          <Input tone="raised" id="cf-serving" value={values.servingSize} onChange={set("servingSize")} placeholder="1 piece (125 g)" maxLength={40} className="text-base" />
        </Field>
        <Field label="Calories" htmlFor="cf-kcal">
          <Input tone="raised" id="cf-kcal" type="number" inputMode="decimal" value={values.calories} onChange={set("calories")} placeholder="166" suffix="kcal" />
        </Field>
        <div className="col-span-2 grid grid-cols-3 gap-2">
          <Field label="Protein" htmlFor="cf-p">
            <Input tone="raised" id="cf-p" type="number" inputMode="decimal" value={values.protein} onChange={set("protein")} placeholder="0" suffix="g" compact />
          </Field>
          <Field label="Carbs" htmlFor="cf-c">
            <Input tone="raised" id="cf-c" type="number" inputMode="decimal" value={values.carbs} onChange={set("carbs")} placeholder="0" suffix="g" compact />
          </Field>
          <Field label="Fat" htmlFor="cf-f">
            <Input tone="raised" id="cf-f" type="number" inputMode="decimal" value={values.fat} onChange={set("fat")} placeholder="0" suffix="g" compact />
          </Field>
        </div>
      </div>

      {!editing && (
        <div>
          <p className="mb-2.5 text-sm font-medium text-ink-muted">Add to</p>
          <MealPicker value={meal} onChange={setMeal} label="Add to meal" />
        </div>
      )}

      <FormError message={error} />

      {editing ? (
        <Button type="submit" size="lg" loading={pending}>
          Save changes
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <Button type="submit" size="lg" loading={pending && submitting === "log"} disabled={pending}>
            Save &amp; add to {MEAL_STYLES[meal].label}
          </Button>
          <Button type="button" variant="ghost" onClick={() => submit(false)} loading={pending && submitting === "save"} disabled={pending}>
            Save without logging
          </Button>
        </div>
      )}
    </form>
  );
}
