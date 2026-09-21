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
  /** Neobrutalist design-foundation palette (DESIGN.md). New fields only —
   * existing keys above are untouched so current consumers keep compiling. */
  neoBgPage: string;
  neoBgSurface: string;
  neoBgDark: string;
  neoBorder: string;
  neoPrimary: string;
  neoSecondary: string;
  neoLavender: string;
  neoTeal: string;
  neoYellow: string;
  neoPink: string;
}

type SchemeValue = { light: string; dark: string };

/** Single source of truth: each token's light/dark value, listed once. */
const tokens = {
  background: { light: "#f8f8f9", dark: "#09090b" },
  card: { light: "#ffffff", dark: "#141416" },
  border: { light: "#e5e5ea", dark: "#27272a" },
  borderSubtle: { light: "#f2f2f7", dark: "#1f1f22" },
  text: { light: "#000000", dark: "#ffffff" },
  textMuted: { light: "#8e8e93", dark: "#9a9a9f" },
  textFaint: { light: "#a0a0a5", dark: "#71717a" },
  textDisabled: { light: "#c7c7cc", dark: "#52525b" },
  chevron: { light: "#c7c7cc", dark: "#71717a" },
  inputBackground: { light: "#f4f4f6", dark: "#1c1c1e" },
  primary: { light: "#000000", dark: "#ffffff" },
  primaryText: { light: "#ffffff", dark: "#000000" },
  cancelBackground: { light: "#ffffff", dark: "#141416" },
  cancelText: { light: "#000000", dark: "#ffffff" },
  danger: { light: "#ef4444", dark: "#f87171" },
  dangerBg: { light: "#fee2e2", dark: "#371b1e" },
  dangerBorder: { light: "#fca5a5", dark: "#5a2a2a" },
  success: { light: "#15803d", dark: "#4ade80" },
  successBg: { light: "#e6f7ed", dark: "#0f2e1a" },
  warning: { light: "#a16207", dark: "#fbbf24" },
  warningBg: { light: "#fef9c3", dark: "#33270a" },
  neutral: { light: "#64748b", dark: "#94a3b8" },
  neutralBg: { light: "#f1f5f9", dark: "#27272a" },
  backdrop: { light: "rgba(0,0,0,0.45)", dark: "rgba(0,0,0,0.7)" },
  handle: { light: "#d1d1d6", dark: "#3f3f46" },
  tabActive: { light: "#000000", dark: "#ffffff" },
  tabInactive: { light: "#8e8e93", dark: "#71717a" },
  iconPurpleBg: { light: "#f3e8ff", dark: "#2e1065" },
  iconPurple: { light: "#9333ea", dark: "#c084fc" },
  iconBlueBg: { light: "#dbeafe", dark: "#1e3a8a" },
  iconBlue: { light: "#2563eb", dark: "#60a5fa" },
  iconGrayBg: { light: "#f1f5f9", dark: "#334155" },
  iconGray: { light: "#475569", dark: "#94a3b8" },
  iconPinkBg: { light: "#ffe4e6", dark: "#4c0519" },
  iconPink: { light: "#e11d48", dark: "#fb7185" },
  // Neobrutalist design-foundation palette (DESIGN.md). Accent colors are
  // identical across schemes, per apps/web's .dark block.
  neoBgPage: { light: "#FAFADF", dark: "#121212" },
  neoBgSurface: { light: "#FFFFFF", dark: "#1E1E1E" },
  neoBgDark: { light: "#111111", dark: "#0A0A0A" },
  neoBorder: { light: "#111111", dark: "#FFFFFF" },
  neoPrimary: { light: "#E8635A", dark: "#E8635A" },
  neoSecondary: { light: "#7B6CF6", dark: "#7B6CF6" },
  neoLavender: { light: "#C4B5FD", dark: "#C4B5FD" },
  neoTeal: { light: "#4ECDC4", dark: "#4ECDC4" },
  neoYellow: { light: "#FFE566", dark: "#FFE566" },
  neoPink: { light: "#F9A8B8", dark: "#F9A8B8" },
} satisfies Record<Exclude<keyof ThemeColors, "mode">, SchemeValue>;

function buildTheme(mode: ColorScheme): ThemeColors {
  const colors = Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [key, value[mode]]),
  ) as Omit<ThemeColors, "mode">;
  return { mode, ...colors };
}

const light: ThemeColors = buildTheme("light");
const dark: ThemeColors = buildTheme("dark");

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

export type ShadowSize = "sm" | "md" | "lg";

const SHADOW_OFFSET: Record<ShadowSize, number> = { sm: 3, md: 4, lg: 6 };

/**
 * Neobrutalist hard-offset shadow (DESIGN.md "Elevation & Depth"). Dark mode
 * keeps the shadow black even though `border` flips to white in dark mode.
 */
export function neoShadow(mode: ColorScheme, size: ShadowSize = "md") {
  const offset = SHADOW_OFFSET[size];
  return {
    shadowColor: mode === "dark" ? "#000000" : "#111111",
    shadowOffset: { width: offset, height: offset },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: offset,
  };
}
