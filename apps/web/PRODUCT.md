# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Student**: College of Computer Studies (CCS) student who signs in with their school Google account (`@gbox` or institutional domain) and completes onboarding (linking Student ID, Program, and Section via Roster Claim). Primary jobs: view personal attendance history across semester events, monitor computed penalty balances on their Ledger, access/download their printable or digital QR Card, and check clearance standing.
- **Officer**: CCS student promoted by the Governor to run event operations. Primary jobs: create, schedule, edit, and manage semester events; operate check-in booths; execute manual attendance grid edits (Present/Absent sentinels); collect and record cash penalty payments; issue QR Cards; and verify student clearance readiness.
- **Governor**: Student administrator with full officer privileges plus executive governance. Primary jobs: manage semester cycles (create, activate, close), maintain academic program rosters, promote students to Officer status, and generate official aggregate PDF attendance and financial audit reports with AI narrative summaries.
- **Pending Student**: Authenticated student who has signed in with a valid school account but has not yet linked to an Enrollment Roster entry. Restricted exclusively to the onboarding flow until claimed.

## Product Purpose

Eliminate physical paper sign-in sheets across College of Computer Studies events by providing a unified digital QR attendance, penalty ledger, and clearance management portal. Success means instantaneous and fraud-resistant attendance logging, real-time and dispute-free penalty recalculation for event absences, and automated verification for end-of-semester student clearance.

## Positioning

An institutional governance and attendance system built specifically for CCS department policies. Unlike generic ticketing or check-in apps, CCS Attendance strictly codifies departmental rules: per-semester isolated liability (debts do not carry forward across terms), full-semester liability for mid-term registrants, mandatory dual-session (AM/PM Time-in and Time-out) attendance validation, and hard clearance gating linked to penalty resolution.

## Operating Context

- High-density campus gatherings (general assemblies, symposiums, college days, workshops) with hundreds of simultaneous student check-ins.
- Officer-operated booth stations on laptops, tablets, or mobile devices verifying worn physical student ID badges alongside QR scans to prevent attendance fraud.
- Intermittent campus network conditions requiring robust query caching, optimistic UI updates, and error resilience.
- End-of-semester physical clearance signing periods where officers rapidly audit a student's penalty ledger on screen before signing physical clearance forms.

## Capabilities and Constraints

- **Single Active Semester**: Exactly one open semester at any time. Once closed, event configurations and definitions freeze permanently, while attendance corrections and payment recording remain open for reconciliation and audit.
- **Session & Penalty Architecture**: Events are designated as whole-day or half-day with configurable penalty rates. Whole-day events feature separate AM and PM sessions. An attended session strictly requires both Time-in and Time-out; any missing scan marks the session absent.
- **Derived Real-Time Ledger**: Penalties are dynamically derived on read from attendance sessions, absence sentinels, and recorded payment transactions, rather than stored as mutable static balances. Mid-semester registrants are automatically charged for all prior events within the open semester.
- **Clearance Gate**: Clearance readiness evaluates strictly to true only when outstanding semester penalty balance is zero.
- **Privacy-Preserving AI Narrative**: On-demand PDF analytics reports leverage Google Gemini exclusively for high-level narrative summaries over anonymized aggregate event statistics; student personally identifiable information (PII) is never transmitted to external AI endpoints.
- **Technical Framework**: Next.js App Router (16.2), React 19, Tailwind CSS, Radix UI / shadcn/ui, TanStack Query, Clerk Authentication (`@clerk/nextjs`), Supabase / PostgreSQL backend, `@react-pdf/renderer`.

## Brand Commitments

- **Name**: CCS Attendance (College of Computer Studies Attendance System).
- **Tone & Voice**: Institutional, precise, auditable, and utilitarian. Unambiguous status terminology: Present, Incomplete, Absent, Unpaid, Cleared.
- **Academic Programs**: Computer Science (BSCS), Information Technology (BSIT), Information Systems (BSIS), Associate in Computer Technology (ACT).
- **Currency**: Philippine Peso (₱ / PHP).

## Evidence on Hand

- Master enrollment roster schema and spreadsheet: `Enrollment List.xlsx`.
- Canonical domain model, terminology, and invariants: `CONTEXT.md`.
- Architecture and user flows: `docs/architecture.md`, `docs/system-design.md`, `docs/flows/`.
- Production-ready Next.js routes under `apps/web/app/`: `(marketing)`, `(app)/dashboard`, `(app)/events`, `(app)/students`, `(app)/my-attendance`, `(app)/clearance`, `(app)/analytics`, `(app)/admin`.

## Product Principles

1. **Auditable Truth Over Convenience**: Attendance timestamps, manual edits, and cash payments must remain auditable; session attendance state is deterministic and dispute-resistant.
2. **Zero Paper, Zero Lost Records**: Every attendance action, roster claim, and payment has immediate digital persistence and validation.
3. **High-Stakes Simplicity**: Officers operating at crowded booths need frictionless scan approval and immediate clarity on student status; students need unmistakable visibility into their penalty ledger and clearance state.
4. **Strict Department Policy Fidelity**: Academic regulations (whole-semester liability, non-transferrable term debt, mandatory dual check-ins) are codified without compromise.

## Accessibility & Inclusion

- High-contrast visual readability across indoor auditorium lighting and bright outdoor campus environments.
- Responsive design supporting student mobile devices for QR card display and officer desktop/laptop/tablet use for attendance management and clearance stations.
- Clear color and iconography distinction for attendance statuses (never relying on color alone for Present vs Incomplete vs Absent).
