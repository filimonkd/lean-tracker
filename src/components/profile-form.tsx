"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Flame } from "lucide-react";
import { saveProfile } from "@/lib/actions";
import {
  ACTIVITY_LEVELS,
  calculateTargets,
  cmToIn,
  inToCm,
  kgToLb,
  lbToKg,
  timeToGoal,
  type ActivityLevel,
  type Gender,
  type ProfileMetrics,
  type Targets,
} from "@/lib/nutrition";
import type { UserProfile } from "@/lib/types";
import { Button, Card, Chip, Field, FormError, Input, SectionTitle, SegmentedControl } from "./ui";

type Units = "metric" | "imperial";

/** Rounds for display in an input; empty string for missing values. */
function show(n: number | null | undefined, decimals = 1): string {
  if (n == null || !Number.isFinite(n)) return "";
  const f = 10 ** decimals;
  return String(Math.round(n * f) / f);
}

function parse(value: string): number {
  return value.trim() === "" ? NaN : Number(value);
}

const inRange = (n: number, min: number, max: number) => Number.isFinite(n) && n >= min && n <= max;

export function ProfileForm({ initial, mode }: { initial: UserProfile; mode: "onboarding" | "settings" }) {
  const router = useRouter();
  const [units, setUnits] = useState<Units>("metric");
  const [weight, setWeight] = useState(show(initial.currentWeightKg));
  const [goalWeight, setGoalWeight] = useState(show(initial.goalWeightKg));
  const [heightCm, setHeightCm] = useState(show(initial.heightCm, 0));
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [age, setAge] = useState(initial.age?.toString() ?? "");
  const [gender, setGender] = useState<Gender | null>(initial.gender);
  const [activity, setActivity] = useState<ActivityLevel>(initial.activityLevel ?? "LIGHT");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const imperial = units === "imperial";
  const weightUnit = imperial ? "lb" : "kg";

  // Everything is computed in metric, whatever the user is typing in.
  const toKg = (v: string) => (imperial ? lbToKg(parse(v)) : parse(v));
  const metrics: Partial<ProfileMetrics> = {
    weightKg: toKg(weight),
    goalWeightKg: toKg(goalWeight),
    heightCm: imperial ? inToCm(parse(heightFt) * 12 + (parse(heightIn) || 0)) : parse(heightCm),
    age: parse(age),
    gender: gender ?? undefined,
    activityLevel: activity,
  };
  const complete =
    inRange(metrics.weightKg!, 30, 350) &&
    inRange(metrics.goalWeightKg!, 30, 350) &&
    inRange(metrics.heightCm!, 100, 250) &&
    inRange(metrics.age!, 18, 100) &&
    metrics.gender !== undefined;
  const targets = complete ? calculateTargets(metrics as ProfileMetrics) : null;

  function switchUnits(next: Units) {
    if (next === units) return;
    const convert = (v: string) => {
      const n = parse(v);
      return Number.isFinite(n) ? show(next === "imperial" ? kgToLb(n) : lbToKg(n)) : v;
    };
    setWeight(convert(weight));
    setGoalWeight(convert(goalWeight));
    if (next === "imperial") {
      const totalIn = cmToIn(parse(heightCm));
      if (Number.isFinite(totalIn)) {
        let ft = Math.floor(totalIn / 12);
        let inches = Math.round(totalIn - ft * 12);
        if (inches === 12) [ft, inches] = [ft + 1, 0];
        setHeightFt(String(ft));
        setHeightIn(String(inches));
      }
    } else {
      const cm = inToCm(parse(heightFt) * 12 + (parse(heightIn) || 0));
      if (Number.isFinite(cm)) setHeightCm(show(cm, 0));
    }
    setUnits(next);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!complete) {
      setError("Please fill in every field (age 18+). We need them all to calculate your plan.");
      return;
    }
    startTransition(async () => {
      const result = await saveProfile({
        ...(metrics as ProfileMetrics),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (mode === "onboarding") {
        router.push("/");
      } else {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  const changedTarget = mode === "settings" && targets && targets.calories !== initial.goals.calories;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <Card className="flex flex-col gap-5">
        <SectionTitle
          action={
            <SegmentedControl
              ariaLabel="Units"
              size="sm"
              value={units}
              onChange={switchUnits}
              options={[
                { value: "metric", label: "kg/cm" },
                { value: "imperial", label: "lb/ft" },
              ]}
            />
          }
        >
          About you
        </SectionTitle>

        <div className="-mt-3 grid grid-cols-2 gap-2.5">
          <Field label="Current weight" htmlFor="weight">
            <Input id="weight" type="number" inputMode="decimal" step="0.1" placeholder={imperial ? "200" : "90"}
              value={weight} onChange={(e) => setWeight(e.target.value)} suffix={weightUnit} />
          </Field>
          <Field label="Goal weight" htmlFor="goalWeight">
            <Input id="goalWeight" type="number" inputMode="decimal" step="0.1" placeholder={imperial ? "175" : "78"}
              value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} suffix={weightUnit} />
          </Field>

          {imperial ? (
            <Field label="Height" htmlFor="heightFt">
              <div className="grid grid-cols-2 gap-1.5">
                <Input id="heightFt" type="number" inputMode="numeric" placeholder="5" compact
                  value={heightFt} onChange={(e) => setHeightFt(e.target.value)} suffix="ft" aria-label="Height, feet" />
                <Input type="number" inputMode="numeric" placeholder="10" compact
                  value={heightIn} onChange={(e) => setHeightIn(e.target.value)} suffix="in" aria-label="Height, inches" />
              </div>
            </Field>
          ) : (
            <Field label="Height" htmlFor="heightCm">
              <Input id="heightCm" type="number" inputMode="numeric" placeholder="175"
                value={heightCm} onChange={(e) => setHeightCm(e.target.value)} suffix="cm" />
            </Field>
          )}
          <Field label="Age" htmlFor="age">
            <Input id="age" type="number" inputMode="numeric" placeholder="30"
              value={age} onChange={(e) => setAge(e.target.value)} suffix="yrs" />
          </Field>
        </div>

        <Field label="Sex (for the BMR formula)">
          <SegmentedControl
            ariaLabel="Sex"
            value={gender}
            onChange={setGender}
            options={[
              { value: "FEMALE", label: "Female" },
              { value: "MALE", label: "Male" },
            ]}
          />
        </Field>

        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-soft" id="activity-label">Activity level</p>
          <div role="radiogroup" aria-labelledby="activity-label" className="flex flex-wrap gap-1.5">
            {(Object.keys(ACTIVITY_LEVELS) as ActivityLevel[]).map((level) => (
              <Chip
                key={level}
                role="radio"
                aria-checked={activity === level}
                selected={activity === level}
                tone="inverse"
                onClick={() => setActivity(level)}
                className="h-[38px] px-3.5 text-sm"
              >
                {ACTIVITY_LEVELS[level].label}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-[13px] text-ink-muted">{ACTIVITY_LEVELS[activity].description}</p>
        </div>
      </Card>

      {mode === "onboarding" && <PlanPreview targets={targets} metrics={metrics} />}

      <FormError message={error} />

      {changedTarget && (
        <p className="animate-fade-up px-2 text-sm text-ink-soft">
          New target: <b className="text-ink">{targets.calories.toLocaleString()} kcal</b> (P {targets.protein} · C {targets.carbs} · F {targets.fat} g).
          Saving replaces any custom goals.
        </p>
      )}

      <Button type="submit" size="lg" loading={pending} className="w-full">
        {saved ? (
          <><Check className="size-5 animate-pop" /> Saved</>
        ) : mode === "onboarding" ? (
          "Start my plan"
        ) : (
          "Save & recalculate"
        )}
      </Button>
    </form>
  );
}

function PlanPreview({ targets, metrics }: { targets: Targets | null; metrics: Partial<ProfileMetrics> }) {
  if (!targets) {
    return (
      <div className="flex items-center gap-3 rounded-[32px] border-2 border-dashed border-chip px-5 py-4 text-sm text-ink-muted">
        <Flame className="size-5 shrink-0" />
        Fill in your details to see your daily calorie target.
      </div>
    );
  }

  const eta = timeToGoal(targets.tdee, targets.calories, metrics.weightKg!, metrics.goalWeightKg!);
  return (
    <div className="animate-fade-up rounded-[32px] bg-lunch px-5 py-4 text-[#111114]">
      <p className="text-sm text-[#0b3d23]">Your daily target</p>
      <p className="font-display text-[40px] leading-tight font-bold tracking-[-0.045em] tabular-nums">
        {targets.calories.toLocaleString()} kcal
      </p>
      <p className="text-[13px] text-[#0b3d23]">
        P {targets.protein} · C {targets.carbs} · F {targets.fat} g
        {eta && <> · about {eta.label} to goal</>}
      </p>
      {targets.flooredAtMinimum && (
        <p className="mt-2 text-xs text-[#0b3d23]">
          Kept at a safe minimum of {targets.calories} kcal, so the deficit is smaller than 500.
        </p>
      )}
    </div>
  );
}
