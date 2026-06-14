export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "sod-theme";
export const THEME_CHANGE_EVENT = "sod-theme-change";

/** Runs before React hydrates to avoid a flash of the wrong theme. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

export function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

export interface ThemeSnapshot {
  theme: Theme;
  resolvedTheme: "light" | "dark";
}

/** Stable reference required by useSyncExternalStore getServerSnapshot. */
export const SERVER_THEME_SNAPSHOT: ThemeSnapshot = {
  theme: "system",
  resolvedTheme: "light",
};

let clientSnapshot: ThemeSnapshot = SERVER_THEME_SNAPSHOT;

export function getThemeSnapshot(): ThemeSnapshot {
  const theme = readStoredTheme();
  const resolvedTheme = resolveTheme(theme);
  if (clientSnapshot.theme === theme && clientSnapshot.resolvedTheme === resolvedTheme) {
    return clientSnapshot;
  }
  clientSnapshot = { theme, resolvedTheme };
  return clientSnapshot;
}

export function getServerThemeSnapshot(): ThemeSnapshot {
  return SERVER_THEME_SNAPSHOT;
}

export function subscribeToTheme(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => onStoreChange();
  window.addEventListener(THEME_CHANGE_EVENT, handler);
  media.addEventListener("change", handler);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handler);
    media.removeEventListener("change", handler);
  };
}

export function setStoredTheme(theme: Theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}
