"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, Scale, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { deleteWeightLog, logWeight } from "@/lib/actions";
import { cn } from "@/lib/cn";
import type { WeightHistory, WeightPoint } from "@/lib/types";
import { Button, Card, FormError } from "../ui";
import { shortDate } from "./chart-theme";
import { WeightChart } from "./weight-chart";

/** Current weight, trend chart, today's weigh-in form and the weigh-in list. */
export function WeightCard({
  history,
  today,
  days,
  rangeLabel,
}: {
  history: WeightHistory;
  today: string;
  days: number;
  rangeLabel: string;
}) {
  const [points, removeOptimistic] = useOptimistic(history.points, (state: WeightPoint[], id: string) =>
    state.filter((p) => p.id !== id),
  );
  const todays = points.find((p) => p.date === today);
  const [weight, setWeight] = useState(todays ? String(todays.weight) : "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const latest = points.at(-1)?.weight ?? history.latestKg;
  const first = points[0]?.weight;
  const change = latest != null && first != null && points.length > 1 ? Math.round((latest - first) * 10) / 10 : null;
  const goal = history.goalWeightKg;
  const toGo = latest != null && goal != null ? Math.round((latest - goal) * 10) / 10 : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(weight);
    if (!weight.trim() || !Number.isFinite(value)) return setError("Enter your weight in kg.");
    startTransition(async () => {
      const result = await logWeight({ weight: value });
      if (!result.ok) return setError(result.error);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      removeOptimistic(id);
      const result = await deleteWeightLog(id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[15px] text-ink-muted">Current weight</span>
        {change !== null && change !== 0 && (
          <span
            className={cn(
              "flex h-[30px] items-center gap-1 rounded-full px-3 text-sm font-semibold",
              change < 0 ? "bg-lunch/25 text-ink" : "bg-surface-muted text-ink-soft",
            )}
          >
            {change < 0 ? <TrendingDown className="size-4" /> : <TrendingUp className="size-4" />}
            {change < 0 ? "−" : "+"}
            {Math.abs(change)} kg <span className="font-normal text-ink-muted">· {rangeLabel.toLowerCase()}</span>
          </span>
        )}
      </div>

      {latest != null ? (
        <p className="mt-1 flex items-baseline gap-1.5">
          <span key={latest} className="animate-pop font-display text-[60px] leading-none font-bold tracking-[-0.05em] tabular-nums">
            {latest}
          </span>
          <span className="font-display text-[22px] font-semibold">kg</span>
        </p>
      ) : (
        <p className="mt-1 font-display text-[40px] leading-tight font-bold tracking-tight text-ink-muted">No weigh-ins</p>
      )}
      {goal != null && toGo != null && (
        <p className="mt-1.5 text-sm text-ink-muted">
          Goal {goal}&nbsp;kg · {toGo > 0 ? <>{toGo}&nbsp;kg to go</> : <b className="text-ink">goal reached</b>}
        </p>
      )}

      <div className="mt-4">
        {points.length > 0 ? (
          <WeightChart points={points} today={today} days={days} goalWeightKg={goal} />
        ) : (
          <div className="flex h-[180px] flex-col items-center justify-center gap-2 rounded-[22px] bg-bg text-center text-sm text-ink-muted">
            <Scale className="size-6" />
            No weigh-ins in this range yet.
            <br />
            Log one below to start your trend.
          </div>
        )}
      </div>

      <form onSubmit={submit} className="mt-4 flex gap-2" noValidate>
        <label className="flex h-[52px] min-w-0 flex-1 items-center gap-2 rounded-full bg-bg px-[18px] focus-within:ring-4 focus-within:ring-ink/5">
          <span className="text-sm text-ink-muted">Today</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={latest != null ? String(latest) : "80"}
            aria-label="Today's weight in kg"
            className="min-w-0 flex-1 bg-transparent text-right font-display text-lg font-semibold text-ink outline-none placeholder:text-ink-muted/50"
          />
          <span className="text-sm text-ink-muted">kg</span>
        </label>
        <Button type="submit" loading={pending} className="h-[52px] px-5">
          {saved ? <><Check className="size-4 animate-pop" /> Saved</> : todays ? "Update" : "Log"}
        </Button>
      </form>
      <div className="mt-3">
        <FormError message={error} />
      </div>

      {/* Doubles as the chart's table view. */}
      {points.length > 0 && (
        <details className="group mt-1">
          <summary className="cursor-pointer list-none py-2 text-sm font-medium text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Show weigh-ins ({points.length})</span>
            <span className="hidden group-open:inline">Hide weigh-ins</span>
          </summary>
          <table className="w-full text-left text-[15px]">
            <caption className="sr-only">Weigh-ins, newest first</caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Weight</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="py-1.5 text-ink-soft">{p.date === today ? "Today" : shortDate(p.date)}</td>
                  <td className="py-1.5 text-right font-semibold tabular-nums">{p.weight} kg</td>
                  <td className="w-10 py-1 text-right">
                    <Button variant="ghost" size="icon-sm" onClick={() => remove(p.id)} aria-label={`Delete weigh-in from ${shortDate(p.date)}`}>
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </Card>
  );
}
