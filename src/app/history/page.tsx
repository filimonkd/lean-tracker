import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { PageHeader } from "@/components/page-header";
import { CalorieCard } from "@/components/progress/calorie-card";
import { WeightCard } from "@/components/progress/weight-card";
import { ChipLink, Skeleton } from "@/components/ui";
import { getCalorieHistory, getProfile, getWeightHistory } from "@/lib/actions";
import { todayKey } from "@/lib/dates";

export const metadata: Metadata = { title: "Progress" };

const RANGES = {
  week: { label: "Week", days: 7, phrase: "This week" },
  month: { label: "Month", days: 30, phrase: "30 days" },
  "3m": { label: "3 Months", days: 90, phrase: "3 months" },
  "6m": { label: "6 Months", days: 180, phrase: "6 months" },
} as const;
type Range = keyof typeof RANGES;

export default function ProgressPage(props: PageProps<"/history">) {
  return (
    <>
      <PageHeader title="Progress" eyebrow="Weight & trends" />
      <Suspense fallback={<ProgressSkeleton />}>
        <Progress searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function Progress({ searchParams }: Pick<PageProps<"/history">, "searchParams">) {
  await connection();
  const [params, profile] = await Promise.all([searchParams, getProfile()]);
  if (!profile.onboarded) redirect("/onboarding");

  const range: Range = typeof params.range === "string" && params.range in RANGES ? (params.range as Range) : "month";
  const { days, phrase } = RANGES[range];
  const [weight, calories] = await Promise.all([getWeightHistory(days), getCalorieHistory(7)]);

  return (
    <>
      {/* Filters sit in one row above the content they scope. */}
      <nav aria-label="Weight range" className="no-scrollbar -mx-4 -mt-2 mb-4 flex gap-2 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
        {(Object.keys(RANGES) as Range[]).map((key) => (
          <ChipLink key={key} href={`/history?range=${key}`} active={key === range}>
            {RANGES[key].label}
          </ChipLink>
        ))}
      </nav>
      <div className="animate-fade-up flex flex-col gap-3">
        <WeightCard history={weight} today={todayKey(profile.timezone)} days={days} rangeLabel={phrase} />
        <CalorieCard history={calories} />
      </div>
    </>
  );
}

function ProgressSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading progress">
      <div className="-mt-2 mb-4 flex gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-[440px] rounded-[32px]" />
      <Skeleton className="mt-3 h-[380px] rounded-[32px]" />
    </div>
  );
}
