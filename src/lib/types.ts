// Shapes returned by the Server Actions. These are plain, serializable DTOs —
// never raw Prisma rows — so the client only receives what the UI renders.

import type { MEAL_TYPES } from "./constants";
import type { ActivityLevel, Gender, Targets } from "./nutrition";

export type MealType = (typeof MEAL_TYPES)[number];

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Food extends Macros {
  id: string;
  name: string;
  servingSize: string;
  isCustom: boolean;
}

export interface FoodLogEntry extends Macros {
  // Macros here are already multiplied by `quantity`.
  id: string;
  date: string;
  mealType: MealType;
  quantity: number;
  food: Food;
  createdAt: string;
}

export interface MealGroup {
  entries: FoodLogEntry[];
  totals: Macros;
}

export interface DailySummary {
  date: string;
  goals: Macros;
  consumed: Macros;
  /** goals − consumed; negative means over target. */
  remaining: Macros;
  meals: Record<MealType, MealGroup>;
}

export interface UserProfile {
  id: string;
  name: string | null;
  onboarded: boolean;
  timezone: string;
  goals: Macros;
  currentWeightKg: number | null;
  goalWeightKg: number | null;
  heightCm: number | null;
  age: number | null;
  gender: Gender | null;
  activityLevel: ActivityLevel | null;
}

export interface ProfileInput {
  weightKg: number;
  goalWeightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  timezone?: string;
  name?: string;
}

export type SavedProfile = { profile: UserProfile; targets: Targets };

export interface CustomFoodInput extends Macros {
  name: string;
  servingSize?: string;
}

export interface LogFoodInput {
  foodItemId: string;
  mealType: MealType;
  quantity?: number;
  /** Day key "YYYY-MM-DD"; defaults to today in the user's time zone. */
  date?: string;
}

export interface WeightPoint {
  id: string;
  date: string;
  weight: number;
}

export interface WeightHistory {
  points: WeightPoint[];
  goalWeightKg: number | null;
  latestKg: number | null;
  /** Latest minus first weigh-in in the window; negative = lost weight. */
  changeKg: number | null;
}

export interface CalorieDay extends Macros {
  date: string;
  goal: number;
  logged: boolean;
}

export interface CalorieHistory {
  days: CalorieDay[];
  goal: number;
  /**
   * Average over completed days with at least one entry (empty days aren't 0 kcal,
   * and today's partial total would drag it down). Falls back to today alone.
   */
  averageCalories: number;
  daysLogged: number;
}
