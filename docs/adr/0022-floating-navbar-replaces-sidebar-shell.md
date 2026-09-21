# Floating top navbar replaces the collapsible sidebar app shell

Status: accepted

Supersedes part of ADR-0002, which adopted a shadcn `Sidebar` (collapsible left nav) as the `apps/web` app shell. The Neobrutalism/Clean Design/Bento Grid redesign (issue #201) specifies a "sticky floating navbar" for top-level navigation (story 17, and issue #207's acceptance criteria: "Sticky floating navbar renders with white background, 2px `#111111` border, 10px radius, 4px hard shadow, and active link indicator"), which the sidebar's visual language doesn't match.

`(app)/layout.tsx` now renders a shared `FloatingNavbar` (also used by the marketing shell) instead of `AppSidebar`/`SidebarProvider`. Role-based destination logic (`destinationsForRole`) and the client-side cached-identity fetch pattern from ADR-0005 are unchanged — only the container markup moved from a left rail to a top bar. `components/ui/sidebar.tsx`, `components/app-sidebar.tsx`, and `hooks/use-mobile.ts` were deleted as dead code once nothing referenced them.

## Consequences

- All `(app)` routes lose the collapsible left rail; nav links now live in the sticky top bar and collapse to icon-only below the `md` breakpoint.
- ADR-0002's "shadcn Sidebar app shell" clause is no longer current; the rest of that ADR (shadcn/ui + Radix, token system, dark mode) still applies.
