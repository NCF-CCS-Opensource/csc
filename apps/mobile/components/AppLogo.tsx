import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { useTheme } from "../lib/theme-context";
import type { ThemeColors } from "../lib/theme";

export type LogoSize = "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<LogoSize, number> = {
  sm: 28,
  md: 36,
  lg: 64,
  xl: 80,
};

export interface AppLogoMarkProps {
  size?: LogoSize | number;
  shadow?: boolean;
}

/**
 * AppLogoMark — Neobrutalist QR Matrix Monogram for React Native
 * 
 * Features:
 * - 4 tactile quadrants forming C-C-S + QR Attendance Viewfinder:
 *   1. Top-Left: Coral (#E8635A) quadrant with bold 'C' (College) and Yellow accent dot
 *   2. Top-Right: Yellow (#FFE566) quadrant with bold 'C' (Computer) and Coral accent dot
 *   3. Bottom-Left: Teal (#4ECDC4) quadrant with bold 'S' (Studies)
 *   4. Bottom-Right: Dark (#111111) QR finder bracket with verified Teal (#4ECDC4) checkmark
 * - Center matrix synchronization node
 * - Hard neobrutalist zero-blur offset shadow
 */
export function AppLogoMark({
  size = "md",
  shadow = true,
}: Readonly<AppLogoMarkProps>) {
  const { colors } = useTheme();
  const px = typeof size === "number" ? size : SIZE_PX[size];

  return (
    <Svg
      width={px}
      height={px}
      viewBox="0 0 64 64"
      fill="none"
      accessibilityRole="image"
      accessibilityLabel="CCS Attendance Mark"
    >
      {/* Hard Neobrutalist Shadow */}
      {shadow && (
        <Rect
          x={9.5}
          y={9.5}
          width={48}
          height={48}
          rx={12}
          fill={colors.mode === "dark" ? "#000000" : "#111111"}
        />
      )}

      {/* Main Badge Canvas */}
      <Rect
        x={6.5}
        y={6.5}
        width={48}
        height={48}
        rx={12}
        fill="#FFFFFF"
        stroke={colors.neoBorder}
        strokeWidth={2.5}
      />

      {/* Quadrant 1 (Top-Left): 'C' (College) in Coral #E8635A */}
      <Rect
        x={10}
        y={10}
        width={19}
        height={19}
        rx={4.5}
        fill="#E8635A"
        stroke="#111111"
        strokeWidth={1.8}
      />
      {/* Bold Geometric 'C' */}
      <Path
        d="M23.5 16H17.5C16.4 16 15.5 16.9 15.5 18V21C15.5 22.1 16.4 23 17.5 23H23.5"
        stroke="#FFFFFF"
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* QR Accent Dot */}
      <Rect x={18.5} y={18.5} width={2.5} height={2.5} rx={0.6} fill="#FFE566" />

      {/* Quadrant 2 (Top-Right): 'C' (Computer) in Yellow #FFE566 */}
      <Rect
        x={32}
        y={10}
        width={19}
        height={19}
        rx={4.5}
        fill="#FFE566"
        stroke="#111111"
        strokeWidth={1.8}
      />
      {/* Bold Geometric 'C' */}
      <Path
        d="M45.5 16H39.5C38.4 16 37.5 16.9 37.5 18V21C37.5 22.1 38.4 23 39.5 23H45.5"
        stroke="#111111"
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* QR Accent Dot */}
      <Rect x={40.5} y={18.5} width={2.5} height={2.5} rx={0.6} fill="#E8635A" />

      {/* Quadrant 3 (Bottom-Left): 'S' (Studies) in Teal #4ECDC4 */}
      <Rect
        x={10}
        y={32}
        width={19}
        height={19}
        rx={4.5}
        fill="#4ECDC4"
        stroke="#111111"
        strokeWidth={1.8}
      />
      {/* Bold Geometric 'S' */}
      <Path
        d="M23.5 37.5H17.5C16.7 37.5 16 38.2 16 39V40.2C16 41 16.7 41.6 17.5 41.6H21C21.8 41.6 22.5 42.3 22.5 43.1V44.3C22.5 45.1 21.8 45.8 21 45.8H15.5"
        stroke="#111111"
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Quadrant 4 (Bottom-Right): QR Scanner Viewfinder & Check in Dark #111111 */}
      <Rect
        x={32}
        y={32}
        width={19}
        height={19}
        rx={4.5}
        fill="#111111"
        stroke="#111111"
        strokeWidth={1.8}
      />
      {/* Corner QR Brackets */}
      <Path
        d="M37 37H35.5V38.5"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M46 37H47.5V38.5"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M37 46H35.5V44.5"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M46 46H47.5V44.5"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Attendance Verified Checkmark in Teal */}
      <Path
        d="M38.5 41.7L40.7 43.7L44.7 39.3"
        stroke="#4ECDC4"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center Alignment Node */}
      <Circle cx={30.5} cy={30.5} r={2.2} fill="#111111" />
    </Svg>
  );
}

export interface AppLogoProps {
  size?: LogoSize;
  title?: string;
  subtitle?: string;
  layout?: "horizontal" | "vertical";
}

export function AppLogo({
  size = "lg",
  title = "AttendKita",
  subtitle = "CCS Attendance System",
  layout = "vertical",
}: Readonly<AppLogoProps>) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors, layout), [colors, layout]);

  return (
    <View style={styles.container}>
      <AppLogoMark size={size} />
      {(title || subtitle) ? (
        <View style={styles.textBlock}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(c: ThemeColors, layout: "horizontal" | "vertical") {
  return StyleSheet.create({
    container: {
      flexDirection: layout === "horizontal" ? "row" : "column",
      alignItems: "center",
      gap: layout === "horizontal" ? 10 : 8,
    },
    textBlock: {
      alignItems: layout === "horizontal" ? "flex-start" : "center",
    },
    title: {
      fontSize: layout === "horizontal" ? 18 : 26,
      fontFamily: "DMSans_800ExtraBold",
      color: c.text,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: layout === "horizontal" ? 11 : 13,
      fontFamily: "DMSans_500Medium",
      color: c.textMuted,
      marginTop: 2,
    },
  });
}
