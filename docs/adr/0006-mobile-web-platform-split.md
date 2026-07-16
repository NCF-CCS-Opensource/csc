# Mobile/web platform split

The system ships two clients against one Supabase backend, and responsibility is split by **device context**, not cleanly by role. The **native mobile app is Officer-only** and carries the booth work — QR scanning with the offline capture/sync queue, Event setup, and on-the-spot Payment logging. The **web app is mobile-responsive for every role** (a Student's QR and Penalty balance must work in a phone browser), but the desk-shaped screens — attendance correction, Clearance sign-off, analytics, Governor admin, and rejection review — are **gated to desktop viewports** and hidden below the desktop breakpoint.

## Considered Options

- **Officer as a single-platform (mobile-only) role** — rejected: attendance correction, Clearance, and reporting are keyboard/big-screen tasks that belong on a desk.
- **Native mobile screens (or deep-links) for Officer desk tasks** — rejected: desk work is desktop-gated on the web app; the native app deliberately does not surface or link to it.

## Consequences

- **Roles × platform:** Student → web only (responsive). Officer → native mobile (booth, Events, Payments) **and** web (desk work, which needs desktop). Governor → web only, never native.
- **Payment is the one booth exception.** Every other desk task is desktop-only, but logging a Payment is allowed on mobile because it happens physically at the booth while the Officer holds the phone — reconstructing cash records later from memory is exactly what we avoid.
- **Duplication is accepted for Event setup** — it lives on both native mobile and web, so two forms stay in lockstep.
- **One auth, one backend.** Both clients share Supabase email/password auth; the mobile app is a thin client calling the web app's `/api/*` routes and Supabase directly. Offline scan capture/sync is the native app's reason to exist.
- **The web app must enforce a desktop breakpoint** on desk screens; the Student dashboard stays phone-friendly below it.
