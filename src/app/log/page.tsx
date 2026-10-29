import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { FoodLogger } from "@/components/log/food-logger";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui";
import { getDailySummary, getProfile, getRecentFoods, searchFoods } from "@/lib/actions";
import { MEAL_TYPES } from "@/lib/constants";
import { hourIn } from "@/lib/dates";
import type { MealType } from "@/lib/types";

export const metadata: Metadata = { title: "Log Food" };

/** A sensible default meal for the time of day. */
function mealForHour(hour: number): MealType {
  if (hour < 11) return "BREAKFAST";
  if (hour < 15) return "LUNCH";
  if (hour < 17) return "SNACK";
  if (hour < 22) return "DINNER";
  return "SNACK";
}

export default function LogPage(props: PageProps<"/log">) {
  return (
    <>
      <PageHeader title="Log Food" />
      <Suspense fallback={<LoggerSkeleton />}>
        <Logger searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function Logger({ searchParams }: Pick<PageProps<"/log">, "searchParams">) {
  await connection();
  const [{ meal }, profile] = await Promise.all([searchParams, getProfile()]);
  if (!profile.onboarded) redirect("/onboarding");

  const [summary, foods, recent] = await Promise.all([getDailySummary(), searchFoods("", 100), getRecentFoods(12)]);
  const initialMeal = MEAL_TYPES.includes(meal as MealType) ? (meal as MealType) : mealForHour(hourIn(profile.timezone));

  return <FoodLogger summary={summary} foods={foods} recent={recent} initialMeal={initialMeal} />;
}

function LoggerSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading foods">
      <Skeleton className="h-4 w-20 rounded-full" />
      <div className="mt-2 flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>
      <Skeleton className="mt-4 h-14 rounded-full" />
      <div className="mt-10 grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[188px] rounded-[26px]" />
        ))}
      </div>
    </div>
  );
}
