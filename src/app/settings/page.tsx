import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Flame } from "lucide-react";
import { GoalsForm } from "@/components/goals-form";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/profile-form";
import { ThemeSelector } from "@/components/theme-toggle";
import { Card, SectionTitle, Skeleton } from "@/components/ui";
import { getProfile } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { ACTIVITY_LEVELS, calculateTargets, timeToGoal } from "@/lib/nutrition";
import type { UserProfile } from "@/lib/types";

export const metadata: Metadata = { title: "Your Plan" };

export default function PlanPage() {
  return (
    <>
      <PageHeader title="Your Plan" eyebrow="Profile & goals" />
      {/* The static shell renders instantly; profile data streams in. */}
      <Suspense fallback={<PlanSkeleton />}>
        <PlanContent />
      </Suspense>
      <Card className="mt-3">
        <SectionTitle description="Auto follows your phone's setting.">Appearance</SectionTitle>
        <ThemeSelector />
      </Card>
    </>
  );
}

async function PlanContent() {
  await connection(); // per-request data: never prerender this
  const profile = await getProfile();
  if (!profile.onboarded) redirect("/onboarding");

  const g = profile.goals;
  return (
    <div className="flex flex-col gap-3">
      <PlanHero profile={profile} />
      <ProfileForm initial={profile} mode="settings" />
      {/* Re-key so the form picks up freshly recalculated goals after a profile save. */}
      <GoalsForm key={`${g.calories}-${g.protein}-${g.carbs}-${g.fat}`} initial={g} />
    </div>
  );
}

const STICKERS = [
  { key: "protein", label: "Protein", bg: "bg-dinner", deep: "text-[#1b1f5c]", tilt: "-rotate-[4deg]" },
  { key: "carbs", label: "Carbs", bg: "bg-carbs", deep: "text-[#5c4200]", tilt: "rotate-2 translate-y-1.5" },
  { key: "fat", label: "Fat", bg: "bg-fat", deep: "text-[#4d120a]", tilt: "rotate-[5deg]" },
] as const;

function PlanHero({ profile }: { profile: UserProfile }) {
  const { goals } = profile;
  const metrics =
    profile.currentWeightKg && profile.goalWeightKg && profile.heightCm && profile.age && profile.gender && profile.activityLevel
      ? {
          weightKg: profile.currentWeightKg,
          goalWeightKg: profile.goalWeightKg,
          heightCm: profile.heightCm,
          age: profile.age,
          gender: profile.gender,
          activityLevel: profile.activityLevel,
        }
      : null;
  const tdee = metrics ? calculateTargets(metrics).tdee : null;
  const deficit = tdee ? tdee - goals.calories : null;
  const eta = metrics && tdee ? timeToGoal(tdee, goals.calories, metrics.weightKg, metrics.goalWeightKg) : null;

  return (
    <Card className="flex flex-col items-center overflow-hidden pt-4 pb-6 text-center">
      <div className="flex w-full justify-between text-sm text-ink-soft">
        <span className="flex items-center gap-1.5">
          <Flame className="size-4" />
          {profile.activityLevel ? ACTIVITY_LEVELS[profile.activityLevel].label : "Your activity"}
        </span>
        {deficit !== null && <span>{deficit > 0 ? `−${deficit}` : `+${-deficit}`} kcal/day</span>}
      </div>
      <p className="mt-4 text-[15px] text-ink-muted">Daily target</p>
      <p className="font-display text-[64px] leading-none font-bold tracking-[-0.05em] tabular-nums">{goals.calories.toLocaleString()}</p>
      <p className="font-display text-xl font-semibold">kcal</p>

      <div className="mt-5 flex gap-2" aria-label="Macro targets">
        {STICKERS.map((s) => (
          <div key={s.key} className={cn("flex h-[92px] w-24 flex-col justify-between rounded-[22px] p-3 text-left text-[#111114]", s.bg, s.tilt)}>
            <span className={cn("text-xs font-medium", s.deep)}>{s.label}</span>
            <span className="font-display text-[26px] font-bold tracking-tight tabular-nums">{goals[s.key]}g</span>
          </div>
        ))}
      </div>

      {eta && (
        <p className="mt-6 text-sm text-ink-soft">
          About <b className="text-ink">{eta.kgPerWeek.toFixed(1)} kg a week</b>, so you could reach {profile.goalWeightKg}&nbsp;kg in about{" "}
          <b className="text-ink">{eta.label}</b>.
        </p>
      )}
    </Card>
  );
}

function PlanSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading your plan">
      <Skeleton className="h-[340px] rounded-[32px]" />
      <Skeleton className="h-[460px] rounded-[32px]" />
      <Skeleton className="h-56 rounded-[32px]" />
    </div>
  );
}
