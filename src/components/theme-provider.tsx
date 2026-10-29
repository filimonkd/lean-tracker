"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY, type ResolvedTheme, type ThemePreference } from "@/lib/theme";

const CHANGE_EVENT = "themepreferencechange";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== "system") return preference;
  return matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

// localStorage + the OS setting act as an external store: subscribing this way
// keeps every toggle in sync (even across tabs) without hydration mismatches.
function subscribe(onChange: () => void) {
  const media = matchMedia(DARK_QUERY);
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  media.addEventListener("change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
    media.removeEventListener("change", onChange);
  };
}

// Each hook subscribes directly (rather than via context) so that a component
// hydrating late inside a streamed Suspense boundary still hydrates with the
// server snapshot first, then updates: no mismatch with the server HTML.
export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, readPreference, () => "system" as const);
}

export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribe, () => resolveTheme(readPreference()), () => "light" as const);
}

export function setThemePreference(next: ThemePreference) {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  try {
    if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Storage unavailable (private mode): the theme still applies for this visit.
    root.setAttribute("data-theme", resolveTheme(next));
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  window.setTimeout(() => root.classList.remove("theme-transition"), 300);
}

/** Keeps <html data-theme> in sync with the preference and the OS setting. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const resolvedTheme = useResolvedTheme();

  // The inline script sets this before paint; re-apply after React's dev
  // remount clears it, and whenever the preference or OS theme changes.
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

  return children;
}
