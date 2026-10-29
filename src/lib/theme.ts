// Shared by the server layout (inline script) and the client ThemeProvider.
// Lives outside the "use client" module so the layout gets the real string,
// not a client reference.

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/**
 * Runs in <head> during HTML parsing, before first paint, so a saved dark
 * preference never flashes light. Must match `resolveTheme` in ThemeProvider.
 */
export const THEME_SCRIPT = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");var d=p==="dark"||(p!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light")}catch(e){}})()`;
