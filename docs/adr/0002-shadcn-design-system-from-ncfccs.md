# Adopt shadcn/ui with app.ncfccs.org's design tokens

Status: accepted

The web app's UI has been unstyled beyond raw Tailwind utility classes on native elements, and needed to match the school's existing visual identity. Two references exist: **ncf.edu.ph** (the main WordPress/Elementor marketing site — brand green `#0A4632`, Roboto) and **app.ncfccs.org** (the CCS Research Hub — a sibling app built by the same department on the same stack we use, Next.js + Tailwind, with a full shadcn/ui token system and light/dark mode). We chose **app.ncfccs.org as the source of truth** over ncf.edu.ph, using the marketing site only to confirm the green brand family is consistent. app.ncfccs.org's tokens are directly reusable (same stack) where the WordPress site's Elementor styling isn't, and `attendance.ncfccs.org` will sit as a sibling subdomain to `app.ncfccs.org`, so visual parity between them matters more than parity with the top-level marketing site.

Concretely: **shadcn/ui** (Radix-backed components, not just a copied palette) — the copied token names (`--card`, `--popover`, `--sidebar-*`, etc.) are shadcn's own convention, so matching them means matching the component system, not reimplementing it by hand. Primary green `#008940` (light) / dark-mode background `#000d02`, radius `0.75rem`, full light+dark token pairs. **Geist Sans** for all body/heading text; **Geist Mono** only for raw identifiers (QR payloads, student/scan IDs) where monospace helps scanability — **Space Grotesk** (present on app.ncfccs.org but only lightly used, likely for isolated display/hero text) was dropped since this app has no marketing-style hero copy. A **shadcn Sidebar** app shell (collapsible left nav) replaces the current ad-hoc per-page `<Link>` list, using a text wordmark ("CCS Attendance") since no logo asset exists anywhere in the org yet. **Dark mode** ships as a real `next-themes` toggle (persisted), matching app.ncfccs.org's actual behavior, not just an OS-`prefers-color-scheme` fallback.

Scope: `apps/web` only. `apps/mobile` (the Officer booth-scan app) is out of scope — React Native doesn't use shadcn/Radix/Tailwind CSS variables, and it's a single-purpose field tool where visual parity matters far less than on the student- and staff-facing web surfaces.

## Considered Options

- ncf.edu.ph as source of truth — rejected: WordPress/Elementor styling doesn't map onto our Next.js/Tailwind stack, and the two sites' colors/fonts don't fully agree (`#0A4632`/Roboto vs `#008940`/Geist); the sibling app is the closer, more relevant, more technically compatible reference.
- Hand-rolled Tailwind restyle (copy the palette, keep native `<input>`/`<button>` elements) — rejected: the token names being copied are shadcn's own, so a palette-only copy would still look different (no Radix focus/keyboard/a11y handling, no consistent variants) despite matching colors.
- Full 3-font parity (Geist Sans + Geist Mono + Space Grotesk everywhere) — rejected: Space Grotesk's actual usage on the reference app looks isolated to display/hero text this app doesn't have; adding a third font family for that would be unused scope.
- OS-only dark mode (`prefers-color-scheme`, no toggle) — rejected: doesn't match the reference app's actual persisted-toggle behavior, and the ask was explicit parity.
- Extending the redesign to `apps/mobile` — rejected for now: different rendering stack entirely (no CSS variables/Radix), and the booth app's UX priority is speed/reliability in the field, not brand polish.

## Consequences

- Every existing page (`/`, `/register`, `/dashboard`, `/events`, `/events/[id]/attendance`, `/admin`, `/admin/rejections`, `/clearance`, `/analytics`) gets rewritten to use shadcn components instead of raw elements — a real migration, done incrementally (foundation → Student-facing → Officer/Governor tooling) rather than in one pass.
- shadcn/ui + Radix + `next-themes` become new dependencies of `apps/web`.
- If app.ncfccs.org's design later diverges or gets its own redesign, this app's tokens will drift out of sync unless deliberately re-synced — there's no shared package, the values are just copied.
- The wordmark is a placeholder; swapping in a real logo later is a small, contained change (one component).
