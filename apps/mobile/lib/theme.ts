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
  iconPurpleBg: string;
  iconPurple: string;
  iconBlueBg: string;
  iconBlue: string;
  iconGrayBg: string;
  iconGray: string;
  iconPinkBg: string;
  iconPink: string;
}

const light: ThemeColors = {
  mode: "light",
  background: "#f8f8f9",
  card: "#ffffff",
  border: "#e5e5ea",
  borderSubtle: "#f2f2f7",
  text: "#000000",
  textMuted: "#8e8e93",
  textFaint: "#a0a0a5",
  textDisabled: "#c7c7cc",
  chevron: "#c7c7cc",
  inputBackground: "#f4f4f6",
  primary: "#000000",
  primaryText: "#ffffff",
  cancelBackground: "#ffffff",
  cancelText: "#000000",
  danger: "#ef4444",
  dangerBg: "#fee2e2",
  dangerBorder: "#fca5a5",
  success: "#15803d",
  successBg: "#e6f7ed",
  warning: "#a16207",
  warningBg: "#fef9c3",
  neutral: "#64748b",
  neutralBg: "#f1f5f9",
  backdrop: "rgba(0,0,0,0.45)",
  handle: "#d1d1d6",
  tabActive: "#000000",
  tabInactive: "#8e8e93",
  iconPurpleBg: "#f3e8ff",
  iconPurple: "#9333ea",
  iconBlueBg: "#dbeafe",
  iconBlue: "#2563eb",
  iconGrayBg: "#f1f5f9",
  iconGray: "#475569",
  iconPinkBg: "#ffe4e6",
  iconPink: "#e11d48",
};

const dark: ThemeColors = {
  mode: "dark",
  background: "#09090b",
  card: "#141416",
  border: "#27272a",
  borderSubtle: "#1f1f22",
  text: "#ffffff",
  textMuted: "#9a9a9f",
  textFaint: "#71717a",
  textDisabled: "#52525b",
  chevron: "#71717a",
  inputBackground: "#1c1c1e",
  primary: "#ffffff",
  primaryText: "#000000",
  cancelBackground: "#141416",
  cancelText: "#ffffff",
  danger: "#f87171",
  dangerBg: "#371b1e",
  dangerBorder: "#5a2a2a",
  success: "#4ade80",
  successBg: "#0f2e1a",
  warning: "#fbbf24",
  warningBg: "#33270a",
  neutral: "#94a3b8",
  neutralBg: "#27272a",
  backdrop: "rgba(0,0,0,0.7)",
  handle: "#3f3f46",
  tabActive: "#ffffff",
  tabInactive: "#71717a",
  iconPurpleBg: "#2e1065",
  iconPurple: "#c084fc",
  iconBlueBg: "#1e3a8a",
  iconBlue: "#60a5fa",
  iconGrayBg: "#334155",
  iconGray: "#94a3b8",
  iconPinkBg: "#4c0519",
  iconPink: "#fb7185",
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
