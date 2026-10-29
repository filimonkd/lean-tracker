// Calendar-day helpers. A "day key" is a local date string "YYYY-MM-DD";
// in the database the same day is stored as UTC midnight (see schema.prisma).

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

export function isDayKey(value: unknown): value is string {
  if (typeof value !== "string" || !DAY_KEY.test(value)) return false;
  return dateToDayKey(dayKeyToDate(value)) === value; // rejects 2026-02-31
}

/** Today's day key in the given IANA time zone. */
export function todayKey(timeZone = "UTC"): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Current hour (0–23) in the given IANA time zone. */
export function hourIn(timeZone = "UTC"): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" }).format(new Date()));
}

export function dayKeyToDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function dateToDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(key: string, days: number): string {
  return dateToDayKey(new Date(dayKeyToDate(key).getTime() + days * MS_PER_DAY));
}

/** The `count` day keys ending at (and including) `endKey`, oldest first. */
export function lastNDays(endKey: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(endKey, i - count + 1));
}

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || !tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
