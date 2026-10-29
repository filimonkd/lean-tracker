"use server";

// All database reads and writes go through these Server Functions.
//
// - Reads return DTOs directly and throw on failure (caught by error boundaries).
//   Call them from Server Components, or from Client Components when needed.
// - Mutations return an ActionResult so forms can show validation errors, and
//   revalidate every route so the dashboard, logger and charts stay in sync.
//
// Server Actions are public POST endpoints, so every input is validated here
// and every query is scoped to the current user.

import { revalidatePath } from "next/cache";
import type { FoodItem, FoodLog, User, WeightLog } from "@prisma/client";
import { prisma } from "./prisma";
import { DEFAULT_USER_ID, MEAL_TYPES } from "./constants";
import { addDays, dateToDayKey, dayKeyToDate, isDayKey, isValidTimeZone, lastNDays, todayKey } from "./dates";
import { ACTIVITY_LEVELS, calculateTargets, type ActivityLevel, type Gender } from "./nutrition";
import type {
  ActionResult,
  CalorieHistory,
  CustomFoodInput,
  DailySummary,
  Food,
  FoodLogEntry,
  LogFoodInput,
  Macros,
  MealGroup,
  MealType,
  ProfileInput,
  SavedProfile,
  UserProfile,
  WeightHistory,
  WeightPoint,
} from "./types";

/* ------------------------------------------------------------------------ */
/* Internals                                                                */
/* ------------------------------------------------------------------------ */

class ValidationError extends Error {}

/** Auth seam: swap this for a session lookup when adding real accounts. */
async function getCurrentUser(): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: DEFAULT_USER_ID } });
  return user ?? prisma.user.create({ data: { id: DEFAULT_USER_ID } });
}

/** Runs a mutation, refreshes all routes on success, and converts errors to a result. */
async function mutate<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    revalidatePath("/", "layout");
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ValidationError) return { ok: false, error: error.message };
    console.error(error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

function num(value: unknown, label: string, min: number, max: number): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) throw new ValidationError(`${label} must be a number.`);
  if (n < min || n > max) throw new ValidationError(`${label} must be between ${min} and ${max}.`);
  return n;
}

function int(value: unknown, label: string, min: number, max: number): number {
  return Math.round(num(value, label, min, max));
}

function text(value: unknown, label: string, maxLength: number): string {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) throw new ValidationError(`${label} is required.`);
  if (s.length > maxLength) throw new ValidationError(`${label} must be ${maxLength} characters or fewer.`);
  return s;
}

function id(value: unknown): string {
  if (typeof value !== "string" || !value || value.length > 64) throw new ValidationError("Invalid id.");
  return value;
}

function mealType(value: unknown): MealType {
  if (!MEAL_TYPES.includes(value as MealType)) throw new ValidationError("Choose a meal.");
  return value as MealType;
}

function gender(value: unknown): Gender {
  if (value !== "MALE" && value !== "FEMALE") throw new ValidationError("Choose a sex for the BMR formula.");
  return value;
}

function activityLevel(value: unknown): ActivityLevel {
  if (typeof value !== "string" || !(value in ACTIVITY_LEVELS)) throw new ValidationError("Choose an activity level.");
  return value as ActivityLevel;
}

/** A client-supplied day key, or today in the user's time zone. */
function resolveDay(user: User, date: unknown): string {
  if (date === undefined || date === null || date === "") return todayKey(user.timezone);
  if (!isDayKey(date)) throw new ValidationError("Invalid date.");
  return date;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const ZERO: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

function addMacros(a: Macros, b: Macros): Macros {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  };
}

function roundMacros(m: Macros): Macros {
  return { calories: Math.round(m.calories), protein: round1(m.protein), carbs: round1(m.carbs), fat: round1(m.fat) };
}

function toFood(item: FoodItem): Food {
  return {
    id: item.id,
    name: item.name,
    servingSize: item.servingSize,
    isCustom: item.isCustom,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
  };
}

function toEntry(log: FoodLog & { foodItem: FoodItem }): FoodLogEntry {
  const q = log.quantity;
  return {
    id: log.id,
    date: dateToDayKey(log.date),
    mealType: log.mealType,
    quantity: q,
    food: toFood(log.foodItem),
    ...roundMacros({
      calories: log.foodItem.calories * q,
      protein: log.foodItem.protein * q,
      carbs: log.foodItem.carbs * q,
      fat: log.foodItem.fat * q,
    }),
    createdAt: log.createdAt.toISOString(),
  };
}

function toWeightPoint(log: WeightLog): WeightPoint {
  return { id: log.id, date: dateToDayKey(log.date), weight: round1(log.weight) };
}

function goalsOf(user: User): Macros {
  return {
    calories: user.dailyCalorieGoal,
    protein: user.dailyProteinGoal,
    carbs: user.dailyCarbGoal,
    fat: user.dailyFatGoal,
  };
}

function toProfile(user: User): UserProfile {
  return {
    id: user.id,
    name: user.name,
    onboarded: user.onboardedAt !== null,
    timezone: user.timezone,
    goals: goalsOf(user),
    currentWeightKg: user.currentWeightKg,
    goalWeightKg: user.goalWeightKg,
    heightCm: user.heightCm,
    age: user.age,
    gender: user.gender,
    activityLevel: user.activityLevel,
  };
}

/** Foods visible to a user: the shared defaults plus their own live custom foods. */
function visibleFoods(userId: string) {
  return { archivedAt: null, OR: [{ createdById: null }, { createdById: userId }] };
}

function customFoodData(input: CustomFoodInput) {
  return {
    name: text(input.name, "Name", 80),
    servingSize: input.servingSize?.trim().slice(0, 40) || "1 serving",
    calories: num(input.calories, "Calories", 0, 5000),
    protein: num(input.protein, "Protein", 0, 500),
    carbs: num(input.carbs, "Carbs", 0, 500),
    fat: num(input.fat, "Fat", 0, 500),
  };
}

/** One of the user's own live custom foods, with how many log entries use it. */
async function findOwnCustomFood(userId: string, foodId: unknown) {
  const food = await prisma.foodItem.findFirst({
    where: { id: id(foodId), createdById: userId, isCustom: true, archivedAt: null },
    include: { _count: { select: { logs: true } } },
  });
  if (!food) throw new ValidationError("That food no longer exists.");
  return food;
}

/** Keeps User.currentWeightKg equal to the most recent weigh-in. */
async function syncCurrentWeight(userId: string) {
  const latest = await prisma.weightLog.findFirst({ where: { userId }, orderBy: { date: "desc" } });
  if (latest) await prisma.user.update({ where: { id: userId }, data: { currentWeightKg: latest.weight } });
}

/* ------------------------------------------------------------------------ */
/* Profile & goals                                                          */
/* ------------------------------------------------------------------------ */

export async function getProfile(): Promise<UserProfile> {
  return toProfile(await getCurrentUser());
}

/** Onboarding / settings: computes Mifflin-St Jeor targets and saves them. */
export async function saveProfile(input: ProfileInput): Promise<ActionResult<SavedProfile>> {
  return mutate(async () => {
    const user = await getCurrentUser();
    const metrics = {
      weightKg: num(input.weightKg, "Current weight", 30, 350),
      goalWeightKg: num(input.goalWeightKg, "Goal weight", 30, 350),
      heightCm: num(input.heightCm, "Height", 100, 250),
      age: int(input.age, "Age", 18, 100),
      gender: gender(input.gender),
      activityLevel: activityLevel(input.activityLevel),
    };
    const timezone = isValidTimeZone(input.timezone) ? input.timezone : user.timezone;
    const name = input.name?.trim().slice(0, 50) || user.name;
    const targets = calculateTargets(metrics);

    // Save the profile and record today's weight as a weigh-in, atomically.
    const today = dayKeyToDate(todayKey(timezone));
    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          name,
          timezone,
          currentWeightKg: metrics.weightKg,
          goalWeightKg: metrics.goalWeightKg,
          heightCm: metrics.heightCm,
          age: metrics.age,
          gender: metrics.gender,
          activityLevel: metrics.activityLevel,
          dailyCalorieGoal: targets.calories,
          dailyProteinGoal: targets.protein,
          dailyCarbGoal: targets.carbs,
          dailyFatGoal: targets.fat,
          onboardedAt: user.onboardedAt ?? new Date(),
        },
      }),
      prisma.weightLog.upsert({
        where: { userId_date: { userId: user.id, date: today } },
        update: { weight: metrics.weightKg },
        create: { userId: user.id, date: today, weight: metrics.weightKg },
      }),
    ]);

    return { profile: toProfile(updated), targets };
  });
}

/** Manual override of the daily targets from Settings. */
export async function updateGoals(goals: Macros): Promise<ActionResult<UserProfile>> {
  return mutate(async () => {
    const user = await getCurrentUser();
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        dailyCalorieGoal: int(goals.calories, "Calorie goal", 1000, 6000),
        dailyProteinGoal: int(goals.protein, "Protein goal", 0, 500),
        dailyCarbGoal: int(goals.carbs, "Carb goal", 0, 1000),
        dailyFatGoal: int(goals.fat, "Fat goal", 0, 400),
      },
    });
    return toProfile(updated);
  });
}

/* ------------------------------------------------------------------------ */
/* Foods                                                                    */
/* ------------------------------------------------------------------------ */

/** Case-insensitive name search; names starting with the query rank first. */
export async function searchFoods(query: string, limit = 25): Promise<Food[]> {
  const user = await getCurrentUser();
  const q = typeof query === "string" ? query.trim().slice(0, 80) : "";
  const take = int(limit, "Limit", 1, 100);

  const items = await prisma.foodItem.findMany({
    // SQLite's LIKE (used by `contains`) is case-insensitive for ASCII.
    where: { AND: [visibleFoods(user.id), q ? { name: { contains: q } } : {}] },
    orderBy: { name: "asc" },
    take: q ? take * 2 : take, // over-fetch so re-ranking still fills the page
  });

  const lower = q.toLowerCase();
  const rank = (f: FoodItem) => (lower && f.name.toLowerCase().startsWith(lower) ? 0 : 1);
  return items
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, take)
    .map(toFood);
}

/** Distinct foods the user logged most recently — quick re-adds. */
export async function getRecentFoods(limit = 8): Promise<Food[]> {
  const user = await getCurrentUser();
  const logs = await prisma.foodLog.findMany({
    where: { userId: user.id, foodItem: { archivedAt: null } },
    orderBy: { createdAt: "desc" },
    distinct: ["foodItemId"],
    take: int(limit, "Limit", 1, 50),
    include: { foodItem: true },
  });
  return logs.map((log) => toFood(log.foodItem));
}

/** Saves a custom food; optionally logs it in the same round trip. */
export async function addCustomFood(
  input: CustomFoodInput,
  logTo?: Omit<LogFoodInput, "foodItemId">,
): Promise<ActionResult<{ food: Food; entry: FoodLogEntry | null }>> {
  return mutate(async () => {
    const user = await getCurrentUser();
    const data = customFoodData(input);
    const log = logTo && {
      mealType: mealType(logTo.mealType),
      quantity: num(logTo.quantity ?? 1, "Quantity", 0.1, 100),
      date: dayKeyToDate(resolveDay(user, logTo.date)),
    };

    const food = await prisma.foodItem.create({
      data: {
        ...data,
        isCustom: true,
        createdById: user.id,
        ...(log && { logs: { create: { ...log, userId: user.id } } }),
      },
      include: { logs: true },
    });

    const created = food.logs[0];
    return {
      food: toFood(food),
      entry: created ? toEntry({ ...created, foodItem: food }) : null,
    };
  });
}

/**
 * Edits one of the user's custom foods. Unlogged foods change in place; a food
 * already in the log gets a new version (the old one is archived), so past
 * entries keep the values they were logged with.
 */
export async function updateCustomFood(
  foodId: string,
  input: CustomFoodInput,
): Promise<ActionResult<{ food: Food; versioned: boolean }>> {
  return mutate(async () => {
    const user = await getCurrentUser();
    const existing = await findOwnCustomFood(user.id, foodId);
    const data = customFoodData(input);

    if (existing._count.logs === 0) {
      const updated = await prisma.foodItem.update({ where: { id: existing.id }, data });
      return { food: toFood(updated), versioned: false };
    }

    const [, created] = await prisma.$transaction([
      prisma.foodItem.update({ where: { id: existing.id }, data: { archivedAt: new Date() } }),
      prisma.foodItem.create({ data: { ...data, isCustom: true, createdById: user.id } }),
    ]);
    return { food: toFood(created), versioned: true };
  });
}

/**
 * Removes a custom food from search and My foods. If it was ever logged it is
 * archived rather than deleted, so those entries stay in your history.
 */
export async function deleteCustomFood(foodId: string): Promise<ActionResult<{ id: string; archived: boolean }>> {
  return mutate(async () => {
    const user = await getCurrentUser();
    const food = await findOwnCustomFood(user.id, foodId);
    if (food._count.logs === 0) {
      await prisma.foodItem.delete({ where: { id: food.id } });
      return { id: food.id, archived: false };
    }
    await prisma.foodItem.update({ where: { id: food.id }, data: { archivedAt: new Date() } });
    return { id: food.id, archived: true };
  });
}

/* ------------------------------------------------------------------------ */
/* Food log                                                                 */
/* ------------------------------------------------------------------------ */

export async function logFood(input: LogFoodInput): Promise<ActionResult<FoodLogEntry>> {
  return mutate(async () => {
    const user = await getCurrentUser();
    const foodItemId = id(input.foodItemId);
    const food = await prisma.foodItem.findFirst({ where: { id: foodItemId, ...visibleFoods(user.id) } });
    if (!food) throw new ValidationError("That food no longer exists.");

    const log = await prisma.foodLog.create({
      data: {
        userId: user.id,
        foodItemId: food.id,
        mealType: mealType(input.mealType),
        quantity: num(input.quantity ?? 1, "Quantity", 0.1, 100),
        date: dayKeyToDate(resolveDay(user, input.date)),
      },
      include: { foodItem: true },
    });
    return toEntry(log);
  });
}

export async function deleteFoodLog(logId: string): Promise<ActionResult<{ id: string }>> {
  return mutate(async () => {
    const user = await getCurrentUser();
    // Scoping the delete by userId doubles as the ownership check.
    const { count } = await prisma.foodLog.deleteMany({ where: { id: id(logId), userId: user.id } });
    if (count === 0) throw new ValidationError("Entry not found.");
    return { id: logId };
  });
}

/** Everything the dashboard and logger need for one day. */
export async function getDailySummary(date?: string): Promise<DailySummary> {
  const user = await getCurrentUser();
  const day = resolveDay(user, date);
  const logs = await prisma.foodLog.findMany({
    where: { userId: user.id, date: dayKeyToDate(day) },
    include: { foodItem: true },
    orderBy: { createdAt: "asc" },
  });

  const emptyMeal = (): MealGroup => ({ entries: [], totals: ZERO });
  const meals: Record<MealType, MealGroup> = {
    BREAKFAST: emptyMeal(),
    LUNCH: emptyMeal(),
    DINNER: emptyMeal(),
    SNACK: emptyMeal(),
  };
  let consumed = ZERO;
  for (const entry of logs.map(toEntry)) {
    const meal = meals[entry.mealType];
    meal.entries.push(entry);
    meal.totals = addMacros(meal.totals, entry);
    consumed = addMacros(consumed, entry);
  }
  for (const m of MEAL_TYPES) meals[m].totals = roundMacros(meals[m].totals);

  const goals = goalsOf(user);
  consumed = roundMacros(consumed);
  return {
    date: day,
    goals,
    consumed,
    remaining: roundMacros({
      calories: goals.calories - consumed.calories,
      protein: goals.protein - consumed.protein,
      carbs: goals.carbs - consumed.carbs,
      fat: goals.fat - consumed.fat,
    }),
    meals,
  };
}

/* ------------------------------------------------------------------------ */
/* Weight                                                                   */
/* ------------------------------------------------------------------------ */

/** One weigh-in per day: logging again on the same day overwrites it. */
export async function logWeight(input: { weight: number; date?: string }): Promise<ActionResult<WeightPoint>> {
  return mutate(async () => {
    const user = await getCurrentUser();
    const weight = num(input.weight, "Weight", 30, 350);
    const date = dayKeyToDate(resolveDay(user, input.date));

    const log = await prisma.weightLog.upsert({
      where: { userId_date: { userId: user.id, date } },
      update: { weight },
      create: { userId: user.id, date, weight },
    });
    await syncCurrentWeight(user.id);
    return toWeightPoint(log);
  });
}

export async function deleteWeightLog(logId: string): Promise<ActionResult<{ id: string }>> {
  return mutate(async () => {
    const user = await getCurrentUser();
    const { count } = await prisma.weightLog.deleteMany({ where: { id: id(logId), userId: user.id } });
    if (count === 0) throw new ValidationError("Weigh-in not found.");
    await syncCurrentWeight(user.id);
    return { id: logId };
  });
}

/** Weigh-ins over the last `days` days (default 30), oldest first. */
export async function getWeightHistory(days = 30): Promise<WeightHistory> {
  const user = await getCurrentUser();
  const today = todayKey(user.timezone);
  const span = int(days, "Days", 1, 365);

  const logs = await prisma.weightLog.findMany({
    where: { userId: user.id, date: { gte: dayKeyToDate(addDays(today, -(span - 1))), lte: dayKeyToDate(today) } },
    orderBy: { date: "asc" },
  });
  const points = logs.map(toWeightPoint);
  const first = points[0];
  const last = points.at(-1);

  return {
    points,
    goalWeightKg: user.goalWeightKg,
    latestKg: last?.weight ?? user.currentWeightKg,
    changeKg: first && last ? round1(last.weight - first.weight) : null,
  };
}

/* ------------------------------------------------------------------------ */
/* Analytics                                                                */
/* ------------------------------------------------------------------------ */

/** Daily intake vs. goal for the last `days` days (default 7), oldest first. */
export async function getCalorieHistory(days = 7): Promise<CalorieHistory> {
  const user = await getCurrentUser();
  const keys = lastNDays(todayKey(user.timezone), int(days, "Days", 1, 90));

  const logs = await prisma.foodLog.findMany({
    where: { userId: user.id, date: { gte: dayKeyToDate(keys[0]), lte: dayKeyToDate(keys.at(-1)!) } },
    include: { foodItem: true },
  });

  const byDay = new Map<string, Macros>(keys.map((k) => [k, ZERO]));
  const loggedDays = new Set<string>();
  for (const entry of logs.map(toEntry)) {
    byDay.set(entry.date, addMacros(byDay.get(entry.date) ?? ZERO, entry));
    loggedDays.add(entry.date);
  }

  const goal = user.dailyCalorieGoal;
  const daysOut = keys.map((date) => ({
    date,
    goal,
    logged: loggedDays.has(date),
    ...roundMacros(byDay.get(date)!),
  }));
  // Today is still in progress, so it only counts when it's the only day logged.
  const logged = daysOut.filter((d) => d.logged);
  const complete = logged.filter((d) => d.date !== keys.at(-1));
  const averaged = complete.length ? complete : logged;
  const average = averaged.length ? Math.round(averaged.reduce((sum, d) => sum + d.calories, 0) / averaged.length) : 0;

  return {
    days: daysOut,
    goal,
    averageCalories: average,
    daysLogged: loggedDays.size,
  };
}
