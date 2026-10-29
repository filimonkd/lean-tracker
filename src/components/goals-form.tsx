"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { updateGoals } from "@/lib/actions";
import { cn } from "@/lib/cn";
import type { Macros } from "@/lib/types";
import { Button, Card, FormError, SectionTitle } from "./ui";

const FIELDS: { key: keyof Macros; label: string; tint: string; deep: string }[] = [
  { key: "calories", label: "kcal", tint: "bg-bg", deep: "text-ink-soft" },
  { key: "protein", label: "Protein g", tint: "bg-protein/20", deep: "text-ink-soft" },
  { key: "carbs", label: "Carbs g", tint: "bg-carbs/25", deep: "text-ink-soft" },
  { key: "fat", label: "Fat g", tint: "bg-fat/20", deep: "text-ink-soft" },
];

/** Manual override of the calculated targets. */
export function GoalsForm({ initial }: { initial: Macros }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, String(initial[f.key])])) as Record<keyof Macros, string>,
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const n = (k: keyof Macros) => Number(values[k]) || 0;
  const macroKcal = Math.round(n("protein") * 4 + n("carbs") * 4 + n("fat") * 9);
  const gap = macroKcal - n("calories");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateGoals({
        calories: Number(values.calories),
        protein: Number(values.protein),
        carbs: Number(values.carbs),
        fat: Number(values.fat),
      });
      if (!result.ok) return setError(result.error);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <Card>
      <SectionTitle
        description={
          <>
            Override the calculated targets. Macros add up to{" "}
            <b className="text-ink tabular-nums">{macroKcal.toLocaleString()} kcal</b>
            {Math.abs(gap) > 50 && <> ({gap > 0 ? "+" : "−"}{Math.abs(gap)} vs. calories)</>}.
          </>
        }
      >
        Custom goals
      </SectionTitle>
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5" noValidate>
        <div className="grid grid-cols-4 gap-2">
          {FIELDS.map((f) => (
            <label key={f.key} className={cn("flex flex-col gap-0.5 rounded-[18px] px-2.5 pt-2.5 pb-2 text-[11px] font-medium", f.tint, f.deep)}>
              {f.label}
              <input
                type="number"
                inputMode="numeric"
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="w-full bg-transparent font-display text-[17px] font-bold text-ink outline-none"
              />
            </label>
          ))}
        </div>
        <FormError message={error} />
        <Button type="submit" variant="secondary" loading={pending}>
          {saved ? <><Check className="size-4 animate-pop" /> Saved</> : "Save goals"}
        </Button>
      </form>
    </Card>
  );
}
