import React from "react";
import { cn } from "@/lib/utils";

export type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<LogoSize, { px: number; className: string }> = {
  xs: { px: 20, className: "size-5" },
  sm: { px: 28, className: "size-7" },
  md: { px: 36, className: "size-9" },
  lg: { px: 48, className: "size-12" },
  xl: { px: 64, className: "size-16" },
};

export interface AppLogoMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: LogoSize | number;
  className?: string;
  shadow?: boolean;
}

/**
 * AppLogoMark — Neobrutalist QR Matrix Monogram
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
  size = "sm",
  className,
  shadow = true,
  ...props
}: Readonly<AppLogoMarkProps>) {
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size].px;
  const sizeClass = typeof size === "number" ? "" : SIZE_MAP[size].className;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={pixelSize}
      height={pixelSize}
      fill="none"
      role="img"
      aria-label="CCS Attendance Mark"
      className={cn("shrink-0 select-none", sizeClass, className)}
      {...props}
    >
      {/* Hard Neobrutalist Shadow */}
      {shadow && (
        <rect
          x="9.5"
          y="9.5"
          width="48"
          height="48"
          rx="12"
          fill="#111111"
          className="dark:fill-black"
        />
      )}

      {/* Main Badge Surface */}
      <rect
        x="6.5"
        y="6.5"
        width="48"
        height="48"
        rx="12"
        fill="#FFFFFF"
        stroke="#111111"
        strokeWidth="2.5"
        className="dark:stroke-border"
      />

      {/* Quadrant 1 (Top-Left): 'C' (College) in Coral */}
      <rect
        x="10"
        y="10"
        width="19"
        height="19"
        rx="4.5"
        fill="#E8635A"
        stroke="#111111"
        strokeWidth="1.8"
      />
      {/* Bold Geometric 'C' */}
      <path
        d="M23.5 16H17.5C16.4 16 15.5 16.9 15.5 18V21C15.5 22.1 16.4 23 17.5 23H23.5"
        stroke="#FFFFFF"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* QR Core Dot */}
      <rect x="18.5" y="18.5" width="2.5" height="2.5" rx="0.6" fill="#FFE566" />

      {/* Quadrant 2 (Top-Right): 'C' (Computer) in Yellow */}
      <rect
        x="32"
        y="10"
        width="19"
        height="19"
        rx="4.5"
        fill="#FFE566"
        stroke="#111111"
        strokeWidth="1.8"
      />
      {/* Bold Geometric 'C' */}
      <path
        d="M45.5 16H39.5C38.4 16 37.5 16.9 37.5 18V21C37.5 22.1 38.4 23 39.5 23H45.5"
        stroke="#111111"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* QR Core Dot */}
      <rect x="40.5" y="18.5" width="2.5" height="2.5" rx="0.6" fill="#E8635A" />

      {/* Quadrant 3 (Bottom-Left): 'S' (Studies) in Teal */}
      <rect
        x="10"
        y="32"
        width="19"
        height="19"
        rx="4.5"
        fill="#4ECDC4"
        stroke="#111111"
        strokeWidth="1.8"
      />
      {/* Bold Geometric 'S' */}
      <path
        d="M23.5 37.5H17.5C16.7 37.5 16 38.2 16 39V40.2C16 41 16.7 41.6 17.5 41.6H21C21.8 41.6 22.5 42.3 22.5 43.1V44.3C22.5 45.1 21.8 45.8 21 45.8H15.5"
        stroke="#111111"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Quadrant 4 (Bottom-Right): QR Scanner Viewfinder & Check in Dark */}
      <rect
        x="32"
        y="32"
        width="19"
        height="19"
        rx="4.5"
        fill="#111111"
        stroke="#111111"
        strokeWidth="1.8"
      />
      {/* Corner QR Finder Brackets */}
      <path
        d="M37 37H35.5V38.5"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M46 37H47.5V38.5"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M37 46H35.5V44.5"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M46 46H47.5V44.5"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Verified Attendance Checkmark */}
      <path
        d="M38.5 41.7L40.7 43.7L44.7 39.3"
        stroke="#4ECDC4"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center Synchronization Node */}
      <circle cx="30.5" cy="30.5" r="2.2" fill="#111111" />
    </svg>
  );
}

export interface AppLogoProps {
  size?: LogoSize;
  showWordmark?: boolean;
  showTagline?: boolean;
  className?: string;
  wordmarkClassName?: string;
}

export function AppLogo({
  size = "sm",
  showWordmark = true,
  showTagline = false,
  className,
  wordmarkClassName,
}: Readonly<AppLogoProps>) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <AppLogoMark size={size} />

      {showWordmark && (
        <div className={cn("flex flex-col leading-none", wordmarkClassName)}>
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold tracking-tight text-foreground font-heading">
              CCS Attendance
            </span>
          </div>
          {showTagline && (
            <span className="mt-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              College of Computer Studies
            </span>
          )}
        </div>
      )}
    </div>
  );
}
