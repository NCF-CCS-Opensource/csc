export type ThemePreference = "light" | "dark" | "system";
export type ColorScheme = "light" | "dark";

export interface ThemeColors {
  /** Resolved scheme — lets components branch (e.g. status-bar content). */
  mode: ColorScheme;
  background: string;
  card: string;
  border: string;
  borderSubtle: string;
  text: string;
  textMuted: string;
  textFaint: string;
  textDisabled: string;
  chevron: string;
  inputBackground: string;
  primary: string;
  primaryText: string;
  cancelBackground: string;
  cancelText: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  neutral: string;
  neutralBg: string;
  backdrop: string;
  handle: string;
  tabActive: string;
  tabInactive: string;
}

const light: ThemeColors = {
  mode: "light",
  background: "#fff",
  card: "#fff",
  border: "#eee",
  borderSubtle: "#f2f2f2",
  text: "#111",
  textMuted: "#888",
  textFaint: "#999",
  textDisabled: "#bbb",
  chevron: "#ccc",
  inputBackground: "#f5f5f5",
  primary: "#000",
  primaryText: "#fff",
  cancelBackground: "#f1f1f1",
  cancelText: "#333",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  success: "#15803d",
  successBg: "#dcfce7",
  warning: "#a16207",
  warningBg: "#fef9c3",
  neutral: "#64748b",
  neutralBg: "#f1f5f9",
  backdrop: "rgba(0,0,0,0.5)",
  handle: "#ddd",
  tabActive: "#000",
  tabInactive: "#999",
};

const dark: ThemeColors = {
  mode: "dark",
  background: "#0b0b0c",
  card: "#161618",
  border: "#2a2a2d",
  borderSubtle: "#232326",
  text: "#f2f2f3",
  textMuted: "#9a9a9f",
  textFaint: "#77777c",
  textDisabled: "#55555a",
  chevron: "#55555a",
  inputBackground: "#232326",
  primary: "#fff",
  primaryText: "#000",
  cancelBackground: "#2a2a2d",
  cancelText: "#e5e5e7",
  danger: "#f87171",
  dangerBg: "#2a1416",
  dangerBorder: "#5a2a2a",
  success: "#4ade80",
  successBg: "#0f2e1a",
  warning: "#fbbf24",
  warningBg: "#33270a",
  neutral: "#94a3b8",
  neutralBg: "#232326",
  backdrop: "rgba(0,0,0,0.6)",
  handle: "#3a3a3d",
  tabActive: "#fff",
  tabInactive: "#77777c",
};

/**
 * Maps a user preference plus the OS colour scheme to the active palette.
 * `"system"` follows the OS; anything other than `"dark"` (including a
 * null/undefined/unknown system scheme) falls back to light.
 */
export function resolveTheme(
  preference: ThemePreference,
  systemScheme: string | null | undefined,
): ThemeColors {
  const scheme = preference === "system" ? systemScheme : preference;
  return scheme === "dark" ? dark : light;
}
