import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ProfileForm } from "@/components/profile-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui";
import { getProfile } from "@/lib/actions";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Welcome" };

// Decorative food stickers from the default food list.
const HERO = [
  { name: "Egg", kcal: 72, note: "P 6.3 · F 4.8", bg: "bg-dinner", deep: "text-[#1b1f5c]", pos: "left-1 top-8 -rotate-[9deg]" },
  { name: "Banana", kcal: 105, note: "C 27 · 1 medium", bg: "bg-carbs", deep: "text-[#5c4200]", pos: "left-[28%] top-0 rotate-6" },
  { name: "Milk, 2%", kcal: 122, note: "P 8 · 1 cup", bg: "bg-sky", deep: "text-[#0b3a52]", pos: "right-1 top-16 -rotate-[4deg]" },
];

export default function OnboardingPage() {
  return (
    <div className="pb-4">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      <div aria-hidden className="relative -mt-4 h-[240px]">
        {HERO.map((s, i) => (
          <div
            key={s.name}
            style={{ animationDelay: `${i * 90}ms` }}
            className={cn(
              "animate-fade-up absolute flex h-[160px] w-[140px] flex-col rounded-[28px] p-4 text-[#111114] shadow-xl shadow-black/10",
              s.bg,
              s.pos,
            )}
          >
            <span className="font-display text-lg font-bold">{s.name}</span>
            <span className="mt-auto font-display text-[32px] leading-none font-bold tracking-tight">{s.kcal} kcal</span>
            <span className={cn("mt-1.5 text-xs", s.deep)}>{s.note}</span>
          </div>
        ))}
      </div>

      <h1 className="mt-4 font-display text-[46px] leading-[0.98] font-bold tracking-[-0.045em]">Let&apos;s build your plan</h1>
      <p className="mt-3 mb-6 text-base leading-relaxed text-ink-soft">
        A few details and we&apos;ll work out a daily calorie target for steady, sustainable weight loss.
      </p>

      <Suspense fallback={<Skeleton className="h-[34rem] rounded-[32px]" />}>
        <OnboardingForm />
      </Suspense>
    </div>
  );
}

async function OnboardingForm() {
  await connection();
  const profile = await getProfile();
  if (profile.onboarded) redirect("/"); // already set up: changes live in Your Plan
  return <ProfileForm initial={profile} mode="onboarding" />;
}
