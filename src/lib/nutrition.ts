// Pure nutrition math — no server imports, so the onboarding form can import
// it too and show a live preview of the targets before saving.

export type Gender = "MALE" | "FEMALE";
export type ActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";

export const ACTIVITY_LEVELS: Record<ActivityLevel, { label: string; description: string; multiplier: number }> = {
  SEDENTARY: { label: "Sedentary", description: "Desk job, little exercise", multiplier: 1.2 },
  LIGHT: { label: "Lightly active", description: "Exercise 1–3 days/week", multiplier: 1.375 },
  MODERATE: { label: "Moderately active", description: "Exercise 3–5 days/week", multiplier: 1.55 },
  ACTIVE: { label: "Very active", description: "Exercise 6–7 days/week", multiplier: 1.725 },
  VERY_ACTIVE: { label: "Athlete", description: "Hard training or physical job", multiplier: 1.9 },
};

export const DAILY_DEFICIT = 500; // ≈ 0.5 kg (1 lb) of fat loss per week
// Common clinical floors: going lower should be medically supervised.
export const MIN_CALORIES: Record<Gender, number> = { MALE: 1500, FEMALE: 1200 };

const PROTEIN_G_PER_KG_GOAL = 1.8; // preserves muscle in a deficit
const FAT_SHARE = 0.25; // 25% of calories from fat

export interface ProfileMetrics {
  weightKg: number;
  goalWeightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
}

export interface Targets {
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** True when the deficit was reduced to keep calories above the safe floor. */
  flooredAtMinimum: boolean;
}

/** Mifflin-St Jeor resting energy expenditure (kcal/day). */
export function calculateBmr({ weightKg, heightCm, age, gender }: ProfileMetrics): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return base + (gender === "MALE" ? 5 : -161);
}

export function calculateTdee(profile: ProfileMetrics): number {
  return calculateBmr(profile) * ACTIVITY_LEVELS[profile.activityLevel].multiplier;
}

export function calculateTargets(profile: ProfileMetrics): Targets {
  const bmr = calculateBmr(profile);
  const tdee = calculateTdee(profile);

  // Only cut when there's weight to lose; otherwise eat at maintenance.
  const wantsLoss = profile.goalWeightKg < profile.weightKg;
  const target = wantsLoss ? tdee - DAILY_DEFICIT : tdee;
  const floor = MIN_CALORIES[profile.gender];
  const calories = Math.round(Math.max(target, floor));

  // Protein from goal weight (not current) so it stays sensible at higher weights.
  const protein = Math.round(PROTEIN_G_PER_KG_GOAL * profile.goalWeightKg);
  const fat = Math.round((calories * FAT_SHARE) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories,
    protein,
    carbs,
    fat,
    flooredAtMinimum: target < floor,
  };
}

const KCAL_PER_KG_FAT = 7700;

/**
 * Expected pace at a given intake, e.g. { kgPerWeek: 0.45, label: "5 months" }.
 * A duration (not a date) keeps renders pure and identical on server and client.
 */
export function timeToGoal(tdee: number, calories: number, weightKg: number, goalWeightKg: number) {
  const kgPerWeek = ((tdee - calories) * 7) / KCAL_PER_KG_FAT;
  const toLose = weightKg - goalWeightKg;
  if (toLose <= 0 || kgPerWeek <= 0) return null;
  const weeks = Math.ceil(toLose / kgPerWeek);
  return { kgPerWeek, label: weeks <= 12 ? `${weeks} weeks` : `${Math.round(weeks / 4.345)} months` };
}

// Unit helpers for the imperial toggle in the UI.
export const lbToKg = (lb: number) => lb * 0.45359237;
export const kgToLb = (kg: number) => kg / 0.45359237;
export const inToCm = (inches: number) => inches * 2.54;
export const cmToIn = (cm: number) => cm / 2.54;
