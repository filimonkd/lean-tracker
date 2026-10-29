"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { addDays, dayKeyToDate } from "@/lib/dates";
import type { WeightPoint } from "@/lib/types";
import { shortDate, useChartColors, type TooltipState } from "./chart-theme";

interface Datum {
  t: number;
  date: string;
  weight: number;
}

const DAY_MS = 86_400_000;

/** Three evenly spaced ticks on 0.5 kg steps, with a little headroom. */
function yTicks(weights: number[], goal: number | null): [number, number, number] {
  let min = Math.min(...weights);
  let max = Math.max(...weights);
  // Only pull the goal into view when it's close; otherwise it would flatten the trend.
  if (goal !== null && goal >= min - 3 && goal <= max + 3) {
    min = Math.min(min, goal);
    max = Math.max(max, goal);
  }
  const lo = Math.floor((min - 0.5) * 2) / 2;
  const step = Math.max(0.5, Math.ceil(((max + 0.5 - lo) / 2) * 2) / 2);
  return [lo, lo + step, lo + 2 * step];
}

/** Weight trend for the selected range: one series, so no legend box. */
export function WeightChart({
  points,
  today,
  days,
  goalWeightKg,
}: {
  points: WeightPoint[];
  today: string;
  days: number;
  goalWeightKg: number | null;
}) {
  const colors = useChartColors();
  const data: Datum[] = points.map((p) => ({ t: dayKeyToDate(p.date).getTime(), date: p.date, weight: p.weight }));
  const start = dayKeyToDate(addDays(today, -(days - 1))).getTime();
  const end = dayKeyToDate(today).getTime();
  const mid = start + Math.round((end - start) / 2 / DAY_MS) * DAY_MS;
  const ticks = yTicks(data.map((d) => d.weight), goalWeightKg);
  const [lo, , hi] = ticks;
  const showGoal = goalWeightKg !== null && goalWeightKg >= lo && goalWeightKg <= hi;
  const last = data.length - 1;

  return (
    <div className="h-[180px] w-full" role="img" aria-label={`Weight over the last ${days} days, ${points.length} weigh-ins`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 22, right: 14, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={colors.grid} />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={[start, end]}
            ticks={[start, mid, end]}
            tickFormatter={(t: number) => shortDate(new Date(t).toISOString().slice(0, 10))}
            tick={{ fill: colors.axis, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: colors.grid }}
            interval={0}
            padding={{ left: 6, right: 6 }}
          />
          <YAxis
            domain={[lo, hi]}
            ticks={ticks}
            tick={{ fill: colors.axis, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={36}
            allowDecimals
          />
          {showGoal && (
            <ReferenceLine
              y={goalWeightKg!}
              stroke={colors.reference}
              strokeDasharray="4 4"
              label={{ value: `Goal ${goalWeightKg} kg`, position: "insideBottomRight", fill: colors.axis, fontSize: 11 }}
            />
          )}
          <Tooltip
            cursor={{ stroke: colors.reference, strokeWidth: 1 }}
            content={(props) => <WeightTooltip active={props.active} payload={props.payload} />}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="weight"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={colors.primary}
            fillOpacity={0.1}
            animationDuration={700}
            activeDot={{ r: 6, fill: colors.primary, stroke: colors.surface, strokeWidth: 2 }}
            dot={(props: { cx?: number; cy?: number; index?: number; value?: number | number[] }) => {
              const { cx, cy, index } = props;
              if (cx == null || cy == null) return <g key={`dot-${index}`} />;
              const isLast = index === last;
              const value = data[index ?? 0]?.weight;
              return (
                <g key={`dot-${index}`}>
                  <circle cx={cx} cy={cy} r={isLast ? 6 : 4} fill={colors.primary} stroke={colors.surface} strokeWidth={2} />
                  {/* Direct-label the endpoint only. */}
                  {isLast && (
                    <text x={cx + 4} y={cy - 12} textAnchor="end" fontSize={12} fontWeight={600} fill={colors.axis}>
                      {value} kg
                    </text>
                  )}
                </g>
              );
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function WeightTooltip({ active, payload }: TooltipState<Datum>) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  return (
    <div className="rounded-2xl bg-inverse px-3 py-2 text-on-inverse shadow-lg">
      <p className="font-display text-base font-bold tabular-nums">{d.weight} kg</p>
      <p className="text-xs text-on-inverse-muted">{shortDate(d.date)}</p>
    </div>
  );
}
