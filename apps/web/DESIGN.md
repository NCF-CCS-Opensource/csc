---
name: CCS Attendance Web Design System
description: Neobrutalist tactile interface with clean editorial structure and asymmetric bento data grids
colors:
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
  text-primary: "#111111"
  text-secondary: "#555555"
  text-muted: "#888888"
  text-on-accent: "#FFFFFF"
typography:
  display:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  heading:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "40px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-on-accent}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-pill:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-on-accent}"
    rounded: "{rounded.pill}"
    padding: "14px 32px"
  card:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "24px"
  badge:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design Guidelines — CCS Attendance Web

## Overview

**Creative North Star: "The Tactile Campus Ledger"**

A handcrafted, high-energy institutional design language blending Neobrutalist tactile personality with the rigorous administrative clarity of Clean SaaS design and the structural power of Bento Grids. The interface feels like an editorial campus zine brought to life with physical weight, responsive feedback, and unambiguous data hierarchy.

**Key Characteristics:**
- **Warm Tactile Canvas**: Warm cream `#FAFADF` background with crisp `#FFFFFF` cards, bound by solid `#111111` 2px outlines and hard zero-blur offset shadows (`4px 4px 0px 0px #111111`).
- **Mechanical Responsiveness**: Every interactive surface physically depresses under cursor interaction (`translate(2px, 2px)` on hover, `translate(4px, 4px)` on click).
- **Asymmetric Data Bento**: Dense tables, attendance streams, and clearance checks compartmentalized into 4-column bento grids where importance dictates cell span.
- **Clean Editorial Restraint**: Generous 8px-based whitespace, crisp uppercase overline tags, and clean Lucide SVG line icons ensuring high-speed booth operability with zero visual clutter.


## Colors

### Canvas & Base Surfaces
- **Page Background (`--bg-page`)**: `#FAFADF` — warm cream canvas (not cold white, not harsh neon yellow).
- **Surface / Card (`--bg-surface`)**: `#FFFFFF` — crisp white cards resting on cream canvas.
- **Elevated / Alternate Surface (`--bg-surface-elevated`)**: `#F7F6F2` or light accent tint (e.g., `#FAF9EE`).
- **Dark Surface (`--bg-dark`)**: `#111111` — used for dark modal headers, footer anchors, or high-contrast callouts.
- **Border & Shadow (`--border-color`)**: `#111111` — universal border and hard drop shadow color.

### Functional Accent Palette
- **Primary / CTA (`--color-primary`)**: `#E8635A` — coral. Primary interactive buttons, key actions, high-importance triggers.
- **Secondary (`--color-secondary`)**: `#7B6CF6` — purple. Secondary actions, filter highlights, icon badge fills.
- **Lavender (`--color-lavender`)**: `#C4B5FD` — clearance pass states, prominent card borders, soft banner backgrounds.
- **Teal / Mint (`--color-teal`)**: `#4ECDC4` — present attendance status, success notifications, scanner active state.
- **Yellow (`--color-yellow`)**: `#FFE566` — incomplete attendance status, warning callouts, badge fills, decorative stars.
- **Pink (`--color-pink`)**: `#F9A8B8` — penalty highlight, accent outlines, student attention callouts.

### Text Hierarchy
- **Text Primary (`--text-primary`)**: `#111111` — high-contrast headlines, primary labels, table data.
- **Text Secondary (`--text-secondary`)**: `#555555` — card descriptions, supporting metadata, form field hints.
- **Text Muted / Overline (`--text-muted`)**: `#888888` — uppercase overline category tags, timestamps, secondary stats.
- **Text on Accent (`--text-on-accent`)**: `#FFFFFF` — text on coral, purple, or dark button states.

### Status Indicators (Attendance & Ledger)
- **Present / Attended**: `#4ECDC4` (Teal) background with `#111111` text and border.
- **Incomplete Session (Missing in/out)**: `#FFE566` (Yellow) background with `#111111` text and border.
- **Absent / Penalty Incurred**: `#E8635A` (Coral) background with white or dark text.
- **Cleared / Paid**: `#C4B5FD` (Lavender) background with `#111111` text and border.

## Typography

- **Primary Typeface**: **DM Sans** (Google Fonts). Friendly, balanced geometric sans-serif suited for both bold display and dense administrative data.
- **Display & H1**: Weight 800, `clamp(2.5rem, 6vw, 4.5rem)`, `line-height: 1.1`, `letter-spacing: -0.01em`. Default to **lowercase** headings for page titles (e.g. `attendance overview`, `clearance verification`) to embody the approachable neobrutalist zine feel.
- **H2 & Section Titles**: Weight 700, `clamp(1.5rem, 3.5vw, 2.25rem)`, `line-height: 1.2`.
- **H3 & Card Titles**: Weight 700, `1.15rem–1.35rem`, `line-height: 1.3`.
- **Body Copy**: Weight 400, `0.95rem` (15px), `line-height: 1.65`, color `#555555`.
- **Overline Labels (Clean Style)**: Weight 600, `0.75rem–0.8rem`, uppercase, `letter-spacing: 0.08em`, color `#888888`. Used immediately above H1/H2 titles to introduce sections (e.g. `STUDENT PORTAL`, `SEMESTER 1 • 2026`).
- **Data & Numbers**: Tabular figures (`font-variant-numeric: tabular-nums; font-weight: 700;`) for penalty amounts, student IDs, and timestamps.
- **Monospace**: Geist Mono or Space Mono for scan codes, transaction hashes, and raw payloads.

## Layout

### Spatial Scale (8px Base Grid)
- **Base Unit**: 8px (`--space-xs: 8px`, `--space-sm: 16px`, `--space-md: 24px`, `--space-lg: 40px`, `--space-xl: 64px`, `--space-xxl: 96px`).
- **Container**: Max width `1200px`, centered with `24px` horizontal mobile gutter (`40px` on desktop).
- **Section Spacing**: `64px–96px` vertical separation between major page segments.

### Bento Grid Architecture (Dashboards, Tables & Data Views)
All administrative dashboard views, student attendance summaries, and clearance monitors utilize asymmetric Bento Grids:
- **Base Grid**: 4-column layout (`grid-template-columns: repeat(4, 1fr); gap: 20px;`).
- **Cell Hierarchy**:
  - **Hero Cell (2×2)**: Primary focus — active attendance session monitor, student penalty ledger summary, or governor quick-action booth. Elevated with `var(--bg-surface)` and `6px 6px 0px #111111` shadow.
  - **Wide Cell (2×1 or 3×1)**: Secondary features — recent scan stream, event schedule timeline, filterable search bar with quick filters.
  - **Tall Cell (1×2)**: Vertical metrics — clearance checklist, session breakdown (AM vs PM), program distribution.
  - **Small Cell (1×1)**: Core metrics — total attendees, unpaid penalty count, attendance percentage, active semester badge.
- **The 70/20/10 Rule**:
  - 70% Base Canvas (`#FAFADF` page background).
  - 20% Elevated White Cells (`#FFFFFF` surfaces).
  - 10% Targeted Accent (1 or 2 hero/accent cells featuring coral, teal, lavender, or yellow).
- **Responsive Breakpoints**:
  - **Desktop (>900px)**: 4 columns asymmetric.
  - **Tablet (521px–900px)**: 2 columns auto-flow.
  - **Mobile (≤520px)**: 1 column stack, 16px gap.

## Elevation & Depth

**The Zero-Blur Hard Shadow Rule.** All elevation in this system is communicated via solid black `#111111` offset shadows with zero blur and zero spread. Surfaces never use ambient diffuse shadows (`rgba(...)`) or glassmorphism. Prominent elements receive hard offset elevation; supporting elements remain flat with border-only styling to maintain editorial cleanliness.

**The Tactile Press-Down Rule.** Every interactive button, clickable bento cell, and tab item must provide physical tactile feedback:
- **Rest**: `transform: translate(0, 0); box-shadow: 4px 4px 0px #111;`
- **Hover**: `transform: translate(2px, 2px); box-shadow: 2px 2px 0px #111; transition: 0.1s ease;`
- **Active / Press**: `transform: translate(4px, 4px); box-shadow: 0px 0px 0px #111;`

### Shadow Vocabulary
- **Signature Shadow (`--shadow-md`)**: `box-shadow: 4px 4px 0px 0px #111111` — Standard cards, primary buttons, sticky navbar.
- **Small Shadow (`--shadow-sm`)**: `box-shadow: 3px 3px 0px 0px #111111` — Badges, input fields, pill tags.
- **Large / Hero Shadow (`--shadow-lg`)**: `box-shadow: 6px 6px 0px 0px #111111` — Hero bento cells, primary modal dialogs, standout banners.
- **Hover Shadow (`--shadow-hover`)**: `box-shadow: 2px 2px 0px 0px #111111` — Accompanying hover translation.


## Shapes

- **Borders**: Universal `2px solid #111111` on cards, buttons, inputs, tables, and nav headers.
- **Border Radius**:
  - Cards & Bento Cells: `10px–12px` (`--radius-md`). Rounded and friendly; **never `0px` sharp**.
  - Small Inputs & Selects: `6px–8px` (`--radius-sm`).
  - Large Banners & Modals: `14px` (`--radius-lg`).
  - Tags, Badges & Pills: `999px` (`--radius-pill`).
  - Icon Containers & Avatars: `50%` circular (`--radius-circle`).

## Components

### Buttons
- **Primary Button**: Coral `#E8635A` background, white text, 700 weight, 10px radius, 2px solid `#111`, 4px 4px `#111` shadow. Press-down mechanics on hover/active.
- **Secondary / Ghost Button**: White or transparent background, `#111` text, 2px solid `#111`, 4px 4px `#111` shadow. Fills with `#FAFADF` or `#F7F6F2` on hover.
- **Pill CTA**: 999px border-radius, coral or lavender background, used for high-prominence actions (e.g. `download qr card`, `generate report`).

### Bento Cards & Cells
- White surface, 2px `#111` border, 10–12px border radius, 24px internal padding.
- Selective elevation: prominent cards receive 4px 4px hard shadows; secondary supporting cards remain flat (2px border only) to prevent visual noise.
- Smooth entrance stagger on load (`translateY(18px) -> 0`, 60ms delay per cell).

### Tables & Data Grids (Neobrutalist Bento Tables)
- Container wrapped in white card with 2px solid `#111` border, 12px radius, and 4px 4px `#111` shadow.
- Table header: Cream `#FAFADF` or warm off-white background with bottom 2px `#111` rule, bold uppercase overline titles.
- Table rows: Alternating row hover (`#FAFADF` tint), clean 1px `#111` horizontal dividers, tabular numbers right-aligned.
- Status badges embedded in table cells with pill shape, 2px solid `#111` border, and distinct status fills.

### Form Inputs & Dropdowns
- Background `#FFFFFF`, 2px solid `#111`, 6px–8px radius, 3px 3px `#111` shadow.
- Focus state: shifts border and hard shadow to primary coral `#E8635A` with a subtle `translate(-1px, -1px)` nudge.

### Navigation Bar
- Floating sticky bar: White background, 2px solid `#111` border, 10px radius, 4px 4px `#111` shadow.
- Logo left with circular icon badge, clean centered nav links, primary action button right.

### Decorative Handcrafted Layer
- 3–6 subtle absolute-positioned decorative elements (4-point star SVG badges in yellow/pink/teal, blob splashes) scattered across hero segments and empty states to maintain handcrafted indie personality without obstructing usability.

### Icons
- Lucide SVG line icons with `1.5px–2px` stroke weight, set to `currentColor` or encased in circular containers with 2px border and pastel fill. No emojis used as functional icons.

## Do's and Don'ts

### Do
- **DO** use `#FAFADF` warm cream for the page canvas and `#FFFFFF` for content cards.
- **DO** enforce `box-shadow: 4px 4px 0px 0px #111111` with zero blur for all elevated surfaces.
- **DO** provide mechanical tactile press-down states (`translate(2px, 2px)` on hover, `translate(4px, 4px)` on click) on buttons and interactive bento cards.
- **DO** maintain rounded corners (`10–12px`) on cards; Neobrutalism here is playful, not aggressive.
- **DO** construct dashboards and data overviews using asymmetric Bento Grid layouts with clear hero cell priority.
- **DO** incorporate Clean Design's generous whitespace (8px base grid) and uppercase letter-spaced overline labels.
- **DO** use Lucide SVG line icons with 1.5px stroke weight.

### Don't
- **DON'T** use `0px` border-radius or stark pure black-on-neon-yellow styling.
- **DON'T** use soft blurred shadows (`box-shadow: 0 4px 20px rgba(0,0,0,0.1)`) or glassmorphism (`backdrop-filter: blur`).
- **DON'T** make all bento grid cells equal in size — hierarchy must map directly to cell span.
- **DON'T** use emojis as interface icons.
- **DON'T** crowd elements — maintain generous section and cell padding.
- **DON'T** apply drop shadows to every single element — mix flat border-only cards with elevated cards for visual balance.
