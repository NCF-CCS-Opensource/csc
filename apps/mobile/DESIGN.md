---
name: CCS Attendance Officer Mobile Design System
description: Neobrutalist tactile interface, adapted from apps/web/DESIGN.md for React Native
colors:
  light:
    bg-page: "#FAFADF"
    bg-surface: "#FFFFFF"
    bg-dark: "#111111"
    border: "#111111"
    primary: "#E8635A"
    secondary: "#7B6CF6"
    lavender: "#C4B5FD"
    teal: "#4ECDC4"
    yellow: "#FFE566"
    pink: "#F9A8B8"
  dark:
    bg-page: "#121212"
    bg-surface: "#1E1E1E"
    bg-dark: "#0A0A0A"
    border: "#FFFFFF"
    primary: "#E8635A"
    secondary: "#7B6CF6"
    lavender: "#C4B5FD"
    teal: "#4ECDC4"
    yellow: "#FFE566"
    pink: "#F9A8B8"
typography:
  fontFamily: "DM Sans (DMSans_400Regular / _500Medium / _700Bold / _800ExtraBold)"
rounded:
  sm: 6
  md: 10
  lg: 14
  pill: 999
  circle: 9999
spacing:
  xs: 8
  sm: 16
  md: 24
  lg: 40
  xl: 64
shadows:
  sm:
    shadowColor: "#111111"
    shadowOffset: { width: 3, height: 3 }
    shadowOpacity: 1
    shadowRadius: 0
    elevation: 3
  md:
    shadowColor: "#111111"
    shadowOffset: { width: 4, height: 4 }
    shadowOpacity: 1
    shadowRadius: 0
    elevation: 4
  lg:
    shadowColor: "#111111"
    shadowOffset: { width: 6, height: 6 }
    shadowOpacity: 1
    shadowRadius: 0
    elevation: 6
---

# Design Guidelines — CCS Attendance Officer Mobile

## Overview

Same "Tactile Campus Ledger" neobrutalist language as `apps/web/DESIGN.md`, adapted for
React Native: solid borders, flat pastel accents, and hard offset shadows instead of
CSS `box-shadow`. This foundation establishes tokens and the app shell only — screen
content is migrated separately.

## Colors

Two palettes, light and dark, mirroring the web app's `:root` and `.dark` blocks in
`apps/web/app/globals.css`.

| Token | Light | Dark |
|---|---|---|
| `bg-page` | `#FAFADF` | `#121212` |
| `bg-surface` | `#FFFFFF` | `#1E1E1E` |
| `bg-dark` | `#111111` | `#0A0A0A` |
| `border` | `#111111` | `#FFFFFF` |
| `primary` (coral) | `#E8635A` | `#E8635A` |
| `secondary` (purple) | `#7B6CF6` | `#7B6CF6` |
| `lavender` | `#C4B5FD` | `#C4B5FD` |
| `teal` | `#4ECDC4` | `#4ECDC4` |
| `yellow` | `#FFE566` | `#FFE566` |
| `pink` | `#F9A8B8` | `#F9A8B8` |

Accent colors stay identical across schemes (per web's `.dark` block); only the base
canvas/surface/border tokens flip.

## Typography

**DM Sans**, loaded via `@expo-google-fonts/dm-sans` + `expo-font`, gated at the app
root (`App.tsx`) before the auth/identity flow mounts — a booth screen never renders
with the system fallback font mid-flash. Weights: `DMSans_400Regular`,
`DMSans_500Medium`, `DMSans_700Bold`, `DMSans_800ExtraBold`.

## Shapes & Radius

Same scale as web: `sm: 6`, `md: 10`, `lg: 14`, `pill: 999`, `circle` (use a value
≥ half the element's size, e.g. `9999`).

## Elevation & Depth (React Native)

CSS's zero-blur hard offset shadow (`4px 4px 0px 0px #111111`) has no direct RN
equivalent — RN shadows always blur — so the closest tactile approximation is a fully
opaque shadow color with a real offset and `shadowRadius: 0` to keep the edge as crisp
as the platform allows, plus a matching `elevation` for Android:

```ts
{
  shadowColor: "#111111", // "#000000" in dark mode, per web's dark shadow tokens
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 4,
}
```

- **Small (`shadow.sm`)**: offset `{3, 3}`, elevation `3` — badges, pills, inputs.
- **Medium (`shadow.md`)**: offset `{4, 4}`, elevation `4` — cards, buttons, tab bar.
- **Large (`shadow.lg`)**: offset `{6, 6}`, elevation `6` — hero cards, modals.

`shadowColor` uses `border` (black in light mode, white in dark mode is *not* used for
shadow — web's dark shadow stays `#000000` even though the border flips to white, so
mobile mirrors that: shadow color stays `#111111`/`#000000`, never white).

## Do's and Don'ts

Same as `apps/web/DESIGN.md`, translated to RN: no blurred/soft shadows (`shadowRadius`
stays `0`), rounded corners on cards (never fully square), flat borders using the
`border` token, no emoji as functional icons in new work.
