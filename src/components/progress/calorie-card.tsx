"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CalorieHistory } from "@/lib/types";
import { Card } from "../ui";
import { shortDate, useChartColors, weekday, type ChartColors, type TooltipState } from "./chart-theme";

type Status = "under" | "over" | "today" | "empty";

interface Datum {
  date: string;
  label: string;
  calories: number;
  status: Status;
}

function fill(status: Status, colors: ChartColors) {
  return status === "over" ? colors.secondary : colors.primary;
}

const compact = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}K` : String(n));

/** Daily intake vs. goal for the last 7 days, with average and summary tiles. */
export function CalorieCard({ history }: { history: CalorieHistory }) {
  const colors = useChartColors();
  const lastIndex = history.days.length - 1;
  const data: Datum[] = history.days.map((d, i) => ({
    date: d.date,
    label: i === lastIndex ? "Today" : weekday(d.date),
    calories: d.calories,
    status: i === lastIndex ? "today" : !d.logged ? "empty" : d.calories > d.goal ? "over" : "under",
  }));

  const fullDays = data.filter((d) => d.status === "under" || d.status === "over");
  const underCount = data.filter((d) => d.status === "under").length;
  // Clean ticks (0 / 1K / 2K …) with headroom above the goal line and the tallest bar.
  const peak = Math.max(history.goal, ...data.map((d) => d.calories));
  const step = peak > 3000 ? 1000 : 500;
  const yMax = Math.ceil((peak * 1.08) / step) * step;
  const tickStep = yMax >= 2000 ? 1000 : 500;
  const ticks = Array.from({ length: Math.floor(yMax / tickStep) + 1 }, (_, i) => i * tickStep);

  return (
    <>
      <Card>
        <h2 className="font-display text-xl font-bold tracking-tight">Calories, last 7 days</h2>
        {history.daysLogged ? (
          <p className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-display text-[34px] font-bold tracking-[-0.04em] tabular-nums">
              {history.averageCalories.toLocaleString()}
            </span>
            <span className="text-sm text-ink-muted">avg kcal · goal {history.goal.toLocaleString()}</span>
          </p>
        ) : (
          <p className="mt-1.5 text-sm text-ink-muted">
            No meals logged this week yet · goal {history.goal.toLocaleString()} kcal
          </p>
        )}

        <div
          className="mt-3 h-[200px] w-full"
          role="img"
          aria-label={`Daily calories: ${data.map((d) => `${d.label} ${d.calories.toLocaleString()}`).join(", ")}. Goal ${history.goal.toLocaleString()}.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 18, right: 4, bottom: 0, left: 0 }} barCategoryGap="22%">
              <CartesianGrid vertical={false} stroke={colors.grid} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: colors.grid }}
                interval={0}
                tick={(props: { x?: number | string; y?: number | string; payload?: { value: string } }) => (
                  <text
                    x={Number(props.x)}
                    y={Number(props.y) + 12}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={props.payload?.value === "Today" ? 700 : 400}
                    fill={colors.axis}
                  >
                    {props.payload?.value}
                  </text>
                )}
              />
              <YAxis
                domain={[0, yMax]}
                ticks={ticks}
                tickFormatter={compact}
                tick={{ fill: colors.axis, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <ReferenceLine
                y={history.goal}
                stroke={colors.reference}
                strokeDasharray="4 4"
                ifOverflow="extendDomain"
                label={{ value: "Goal", position: "insideTopRight", fill: colors.axis, fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip
                cursor={{ fill: colors.grid, opacity: 0.6, radius: 8 }}
                content={(props) => <CalorieTooltip active={props.active} payload={props.payload} goal={history.goal} />}
                isAnimationActive={false}
              />
              <Bar dataKey="calories" maxBarSize={24} radius={[4, 4, 0, 0]} animationDuration={700}>
                {data.map((d) => (
                  <Cell
                    key={d.date}
                    fill={fill(d.status, colors)}
                    // In-progress day: a lighter step of the same hue (it isn't a final value yet).
                    fillOpacity={d.status === "today" ? 0.35 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft" aria-label="Legend">
          {/* CSS variables, not JS colors: this markup is server-rendered and must hydrate identically. */}
          <LegendItem swatch="bg-[var(--chart-1)]">Under goal</LegendItem>
          <LegendItem swatch="bg-[var(--chart-2)]">Over goal</LegendItem>
          <LegendItem swatch="bg-[var(--chart-1)] opacity-35">Today so far</LegendItem>
        </ul>

        <details className="group mt-2">
          <summary className="cursor-pointer list-none py-2 text-sm font-medium text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Show as table</span>
            <span className="hidden group-open:inline">Hide table</span>
          </summary>
          <table className="w-full text-left text-[15px]">
            <caption className="sr-only">Calories per day, last 7 days</caption>
            <thead>
              <tr className="text-xs text-ink-muted">
                <th scope="col" className="pb-1 font-medium">Day</th>
                <th scope="col" className="pb-1 text-right font-medium">kcal</th>
                <th scope="col" className="pb-1 text-right font-medium">vs goal</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.date} className="border-t border-line">
                  <td className="py-1.5 text-ink-soft">{d.status === "today" ? "Today" : `${d.label}, ${shortDate(d.date)}`}</td>
                  <td className="py-1.5 text-right font-semibold tabular-nums">{d.status === "empty" ? "–" : d.calories.toLocaleString()}</td>
                  <td className="py-1.5 text-right text-ink-soft tabular-nums">{d.status === "empty" ? "not logged" : diffText(d.calories, history.goal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </Card>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-[26px] bg-carbs px-[18px] py-4 text-[#111114]">
          <span className="block text-sm text-[#5c4200]">Under goal</span>
          <span className="block font-display text-[30px] font-bold tracking-[-0.03em] tabular-nums">
            {fullDays.length ? `${underCount} of ${fullDays.length}` : "–"}
          </span>
          <span className="block text-[13px] text-[#5c4200]">full days logged this week</span>
        </div>
        <div className="rounded-[26px] bg-sky px-[18px] py-4 text-[#111114]">
          <span className="block text-sm text-[#0b3a52]">Days logged</span>
          <span className="block font-display text-[30px] font-bold tracking-[-0.03em] tabular-nums">{history.daysLogged} of 7</span>
          <span className="block text-[13px] text-[#0b3a52]">including today</span>
        </div>
      </div>
    </>
  );
}

function diffText(calories: number, goal: number) {
  const diff = calories - goal;
  if (diff === 0) return "on goal";
  return `${Math.abs(diff).toLocaleString()} ${diff > 0 ? "over" : "under"}`;
}

function LegendItem({ swatch, children }: { swatch: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className={`size-2.5 rounded-[3px] ${swatch}`} />
      {children}
    </li>
  );
}

function CalorieTooltip({ active, payload, goal }: TooltipState<Datum> & { goal: number }) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  return (
    <div className="rounded-2xl bg-inverse px-3 py-2 text-on-inverse shadow-lg">
      <p className="font-display text-base font-bold tabular-nums">
        {d.status === "empty" ? "Not logged" : `${d.calories.toLocaleString()} kcal`}
      </p>
      <p className="text-xs text-on-inverse-muted">
        {d.status === "today" ? "Today so far" : `${d.label}, ${shortDate(d.date)}`}
        {d.status !== "empty" && ` · ${diffText(d.calories, goal)}`}
      </p>
    </div>
  );
}
