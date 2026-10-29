// Accent colors as Tailwind class sets. Accents keep dark text in both themes,
// so each one carries a matching deep tone for secondary text on top of it.

import type { MealType } from "./types";

export interface Swatch {
  bg: string; // card background
  soft: string; // inner panel on the card
  deep: string; // secondary text on the card
  dot: string; // small legend dot
  stroke: string; // hex for SVG strokes
}

export const MEAL_STYLES: Record<MealType, Swatch & { label: string }> = {
  BREAKFAST: { label: "Breakfast", bg: "bg-breakfast", soft: "bg-breakfast-soft", deep: "text-[#4a2410]", dot: "bg-breakfast", stroke: "#ff9a4d" },
  LUNCH: { label: "Lunch", bg: "bg-lunch", soft: "bg-lunch-soft", deep: "text-[#0b3d23]", dot: "bg-lunch", stroke: "#4fd992" },
  DINNER: { label: "Dinner", bg: "bg-dinner", soft: "bg-dinner-soft", deep: "text-[#1b1f5c]", dot: "bg-dinner", stroke: "#8b97fa" },
  SNACK: { label: "Snack", bg: "bg-snack", soft: "bg-snack-soft", deep: "text-[#4d0a2c]", dot: "bg-snack", stroke: "#f27db8" },
};

/** Food "sticker" colors, cycled through the logger grid. */
export const STICKERS: Array<Pick<Swatch, "bg" | "deep">> = [
  { bg: "bg-sky", deep: "text-[#0b3a52]" },
  { bg: "bg-carbs", deep: "text-[#5c4200]" },
  { bg: "bg-dinner", deep: "text-[#1b1f5c]" },
  { bg: "bg-lunch", deep: "text-[#0b3d23]" },
  { bg: "bg-breakfast", deep: "text-[#4a2410]" },
  { bg: "bg-snack", deep: "text-[#4d0a2c]" },
];

/** A gentle tilt per grid position, like stickers on a fridge. */
export const STICKER_TILTS = ["-rotate-[2.5deg]", "rotate-2", "rotate-[1.5deg]", "-rotate-2", "-rotate-[1.5deg]", "rotate-[2.5deg]"];

export const MACRO_STYLES = {
  protein: { label: "Protein", dot: "bg-protein", soft: "bg-protein/20" },
  carbs: { label: "Carbs", dot: "bg-carbs", soft: "bg-carbs/25" },
  fat: { label: "Fat", dot: "bg-fat", soft: "bg-fat/20" },
} as const;
