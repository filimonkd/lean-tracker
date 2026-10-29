import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { Skeleton } from "@/components/ui";
import { getDailySummary, getProfile } from "@/lib/actions";
import { addDays, dayKeyToDate, todayKey } from "@/lib/dates";

export default function DashboardPage(props: PageProps<"/">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  await connection();
  const [{ day }, profile] = await Promise.all([searchParams, getProfile()]);
  if (!profile.onboarded) redirect("/onboarding");

  const today = todayKey(profile.timezone);
  const isToday = day !== "yesterday";
  const date = isToday ? today : addDays(today, -1);
  const summary = await getDailySummary(date);

  // Formatted on the server only (fixed locale + UTC), so there's no hydration mismatch.
  const dateLabel = dayKeyToDate(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return <DashboardView summary={summary} name={profile.name} isToday={isToday} dateLabel={dateLabel} />;
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading today">
      <div className="flex h-13 items-center justify-between">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="h-12 w-40 rounded-full" />
        <Skeleton className="size-12 rounded-full" />
      </div>
      <Skeleton className="mt-7 h-14 w-48" />
      <Skeleton className="mx-auto mt-10 aspect-square w-full max-w-[300px] rounded-full" />
      <div className="mt-6 grid grid-cols-2 gap-2.5">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="mt-2.5 h-52" />
    </div>
  );
}
