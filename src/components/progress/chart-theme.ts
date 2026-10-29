"use client";

import { useResolvedTheme } from "../theme-provider";

// Chart colors are passed to Recharts as SVG attributes, which can't read CSS
// variables reliably, so each theme gets explicit hex values. Only use these
// inside the charts (ResponsiveContainer draws after mount); server-rendered
// markup uses the matching --chart-* CSS variables instead. The two series
// colors are a blue/orange pair validated for both surfaces (lightness band,
// color-blind separation, 3:1 contrast) rather than the UI's mint/coral.
const LIGHT = {
  primary: "#5b6af0", // weight line; days under goal
  secondary: "#e5732a", // days over goal
  surface: "#ffffff",
  grid: "#ededf3",
  axis: "#6b6b7b",
  reference: "#8a8a9a",
};

const DARK: typeof LIGHT = {
  primary: "#7b88f7",
  secondary: "#d06a24",
  surface: "#1b1b22",
  grid: "#2a2a33",
  axis: "#a3a3b5",
  reference: "#7a7a8c",
};

export type ChartColors = typeof LIGHT;

/** The two tooltip props our custom tooltips read. */
export interface TooltipState<T> {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: T }>;
}

export function useChartColors(): ChartColors {
  return useResolvedTheme() === "dark" ? DARK : LIGHT;
}

/** "Oct 29" from a day key, independent of the viewer's time zone. */
export function shortDate(key: string) {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** "Thu" from a day key. */
export function weekday(key: string) {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}
