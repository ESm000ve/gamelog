export type ThemeMode = "dark" | "light" | "system";
export type AccentColor = "indigo" | "green" | "blue" | "orange" | "pink" | "gold" | "purple" | "red";

export interface AccentOption {
  id: AccentColor;
  name: string;
  hex: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: "indigo", name: "Indigo", hex: "#5e5ce6" },
  { id: "green",  name: "Green",  hex: "#30d158" },
  { id: "blue",   name: "Blue",   hex: "#0a84ff" },
  { id: "orange", name: "Orange", hex: "#ff9f0a" },
  { id: "pink",   name: "Pink",   hex: "#ff375f" },
  { id: "gold",   name: "Gold",   hex: "#ffd60a" },
  { id: "purple", name: "Purple", hex: "#bf5af2" },
  { id: "red",    name: "Red",    hex: "#ff453a" },
];

const THEME_KEY = "gamelog_theme_mode";
const ACCENT_KEY = "gamelog_accent_color";

export function getStoredThemeMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY) as ThemeMode | null;
  return stored || "dark";
}

export function setStoredThemeMode(mode: ThemeMode): void {
  localStorage.setItem(THEME_KEY, mode);
  applyTheme(mode);
}

export function getStoredAccentColor(): AccentColor {
  const stored = localStorage.getItem(ACCENT_KEY) as AccentColor | null;
  return stored || "indigo";
}

export function setStoredAccentColor(color: AccentColor): void {
  localStorage.setItem(ACCENT_KEY, color);
  applyTheme(undefined, color);
}

let mediaListener: ((e: MediaQueryListEvent) => void) | null = null;

export function applyTheme(mode?: ThemeMode, accent?: AccentColor): void {
  const targetMode = mode || getStoredThemeMode();
  const targetAccent = accent || getStoredAccentColor();

  let resolvedMode: "dark" | "light" = "dark";
  if (targetMode === "light") {
    resolvedMode = "light";
  } else if (targetMode === "system") {
    const isLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    resolvedMode = isLight ? "light" : "dark";
  }

  document.documentElement.setAttribute("data-theme", resolvedMode);
  document.documentElement.setAttribute("data-accent", targetAccent);

  // Handle system preference listener
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    if (mediaListener) {
      mediaQuery.removeEventListener("change", mediaListener);
      mediaListener = null;
    }
    if (targetMode === "system") {
      mediaListener = () => {
        applyTheme("system", targetAccent);
      };
      mediaQuery.addEventListener("change", mediaListener);
    }
  }
}
