import { MEAL_TYPES } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { MEAL_STYLES } from "@/lib/palette";
import type { DailySummary } from "@/lib/types";

const SIZE = 350;
const C = SIZE / 2;
const R = 120; // outer ring radius
const R_INNER = 96; // faint inner echo of each arc
const STROKE = 24;
const GAP = 10; // visible gap between arcs, in px
const LABEL_R = 150;
const CIRC = 2 * Math.PI * R;
const CIRC_INNER = 2 * Math.PI * R_INNER;

interface Arc {
  key: string;
  color: string;
  start: number; // 0–1, clockwise from 12 o'clock
  frac: number;
  label: string | null;
  muted?: boolean;
}

/** Splits the ring into one arc per meal (share of goal) plus what's left. */
function buildArcs(summary: DailySummary): Arc[] {
  const goal = summary.goals.calories;
  const eaten = summary.consumed.calories;
  const total = Math.max(goal, eaten, 1); // over goal: arcs share the whole ring
  const arcs: Arc[] = [];
  let start = 0;
  for (const meal of MEAL_TYPES) {
    const kcal = summary.meals[meal].totals.calories;
    if (kcal <= 0) continue;
    const frac = kcal / total;
    arcs.push({ key: meal, color: MEAL_STYLES[meal].stroke, start, frac, label: `${Math.round((kcal / goal) * 100)}%` });
    start += frac;
  }
  const left = Math.max(0, goal - eaten) / total;
  if (left > 0) arcs.push({ key: "left", color: "var(--line)", start, frac: left, label: `${Math.round(left * 100)}%`, muted: true });
  return arcs;
}

function polar(fraction: number, radius: number) {
  const a = fraction * 2 * Math.PI;
  return { x: C + radius * Math.sin(a), y: C - radius * Math.cos(a) };
}

export function CalorieRing({ summary }: { summary: DailySummary }) {
  const arcs = buildArcs(summary);
  const { calories: goal } = summary.goals;
  const eaten = summary.consumed.calories;
  const over = eaten > goal;
  const single = arcs.length === 1; // one arc spanning the whole ring needs no gaps

  const description =
    `${eaten.toLocaleString()} of ${goal.toLocaleString()} kcal eaten. ` +
    arcs.map((a) => (a.muted ? `${a.label} left` : `${MEAL_STYLES[a.key as keyof typeof MEAL_STYLES].label} ${a.label}`)).join(", ");

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[350px]">
      <svg role="img" aria-label={description} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 size-full">
        <g transform={`rotate(-90 ${C} ${C})`} fill="none">
          {arcs.map((arc) => {
            const trim = single ? 0 : GAP + STROKE; // round caps eat STROKE/2 at each end
            const len = Math.max(0.5, arc.frac * CIRC - trim);
            return (
              <circle
                key={arc.key}
                cx={C}
                cy={C}
                r={R}
                stroke={arc.color}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${len} ${CIRC}`}
                strokeDashoffset={-(arc.start * CIRC + trim / 2)}
                className={cn(!arc.muted && "animate-ring-draw", "transition-[stroke-dasharray,stroke-dashoffset] duration-700 ease-out")}
              />
            );
          })}
          {arcs
            .filter((a) => !a.muted)
            .map((arc) => {
              const trim = single ? 0 : 6;
              return (
                <circle
                  key={`inner-${arc.key}`}
                  cx={C}
                  cy={C}
                  r={R_INNER}
                  stroke={arc.color}
                  strokeOpacity={0.28}
                  strokeWidth={10}
                  strokeDasharray={`${Math.max(0.5, arc.frac * CIRC_INNER - trim)} ${CIRC_INNER}`}
                  strokeDashoffset={-(arc.start * CIRC_INNER + trim / 2)}
                  className="animate-ring-draw transition-[stroke-dasharray,stroke-dashoffset] duration-700 ease-out"
                />
              );
            })}
        </g>
      </svg>

      {/* Percentage pills sit outside the ring at each arc's midpoint. */}
      {arcs
        .filter((a) => a.label && a.frac >= 0.05 && !(single && a.muted))
        .map((arc) => {
          const { x, y } = polar(arc.start + arc.frac / 2, LABEL_R);
          return (
            <span
              key={`label-${arc.key}`}
              aria-hidden
              style={{ left: `${(x / SIZE) * 100}%`, top: `${(y / SIZE) * 100}%` }}
              className={cn(
                "animate-pop absolute flex h-8 -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-surface px-3 text-[15px] font-medium shadow-md shadow-black/5 tabular-nums",
                arc.muted ? "text-ink-muted" : "text-ink",
              )}
            >
              <span className="size-2 rounded-full" style={{ background: arc.muted ? "var(--chip)" : arc.color }} />
              {arc.label}
            </span>
          );
        })}

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[17px] text-ink-muted">Consumed:</span>
        <span key={eaten} className="animate-pop font-display text-[66px] leading-[1.05] font-bold tracking-[-0.05em] tabular-nums">
          {eaten.toLocaleString()}
        </span>
        <span className={cn("font-display text-xl font-semibold", over && "text-danger")}>
          {over ? `${(eaten - goal).toLocaleString()} over goal` : `of ${goal.toLocaleString()} kcal`}
        </span>
      </div>
    </div>
  );
}
