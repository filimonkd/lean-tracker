"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import type { ThemePreference } from "@/lib/theme";
import { setThemePreference, useResolvedTheme, useThemePreference } from "./theme-provider";
import { Button, SegmentedControl } from "./ui";

/** Round header button: flips between light and dark. */
export function ThemeToggle() {
  const isDark = useResolvedTheme() === "dark";
  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={() => setThemePreference(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="size-5 animate-pop" /> : <Moon className="size-5 animate-pop" />}
    </Button>
  );
}

const OPTIONS: { value: ThemePreference; label: React.ReactNode }[] = [
  { value: "light", label: <><Sun className="size-4" /> Light</> },
  { value: "dark", label: <><Moon className="size-4" /> Dark</> },
  { value: "system", label: <><Monitor className="size-4" /> Auto</> },
];

/** Full Light / Dark / Auto picker for the Plan screen. */
export function ThemeSelector() {
  return <SegmentedControl ariaLabel="Theme" value={useThemePreference()} onChange={setThemePreference} options={OPTIONS} />;
}
