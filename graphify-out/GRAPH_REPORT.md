# Graph Report - csc  (2026-09-11)

## Corpus Check
- 232 files · ~119,007 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1232 nodes · 2733 edges · 70 communities (58 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `55b74e53`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- web/lib/events.ts
- reports.ts
- cn
- scan-approval.ts
- sidebar.tsx
- ledger.ts
- admin/page.tsx
- Attendance Session
- scanQueue.ts
- myAttendanceSnapshot
- Local Development & Testing with Docker and Supabase
- import-enrollment-roster.mjs
- architecture.integration.test.ts
- SettingsScreen.tsx
- reports-client.tsx
- web/package.json
- theme-context.tsx
- CCS Attendance Repository
- expo
- students/actions.ts
- mobile/package.json
- dependencies
- components.json
- EventsScreen.tsx
- web/lib/qr.ts
- BoothScreen.tsx
- dependencies
- students-view.test.tsx
- compilerOptions
- scripts
- 2. Quickstart (Supabase CLI)
- LoginScreen.tsx
- students-view.tsx
- app/layout.tsx
- devDependencies
- tasks
- App.tsx
- compilerOptions
- Test-Driven Development Loop
- Events Page
- scripts
- scripts
- db/tsconfig.json
- Mobile App Icon
- mobile/tsconfig.json
- @clerk/nextjs
- next
- db/package.json
- dashboard-view.tsx
- scripts
- postgres
- devDependencies
- Graphify Knowledge Graph Rule
- File Document Icon
- Governor Workflow
- test-integration.sh
- Rust Token Killer CLI
- eslint.config.mjs
- postcss.config.mjs
- Next.js Logo
- Domain Docs Architecture
- Deep Module Specifications
- Student
- get_latest_mtime
- watch-obsidian.sh script
- dependencies
- auth.ts
- sync-obsidian.sh
- 0016-enrollment-roster-precedes-student-identity.md

## God Nodes (most connected - your core abstractions)
1. `cn()` - 101 edges
2. `db` - 30 edges
3. `students` - 24 edges
4. `requireCapability()` - 22 edges
5. `scripts` - 22 edges
6. `Button()` - 20 edges
7. `authorizeRequest()` - 20 edges
8. `useTheme()` - 19 edges
9. `requireOfficerOrGovernor()` - 18 edges
10. `events` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Scan Approval` --semantically_similar_to--> `Integration-Style Tests vs Implementation Details`  [INFERRED] [semantically similar]
  CONTEXT.md → .claude/skills/tdd/tests.md
- `CCS Attendance Repository` --references--> `CCS Web Application`  [INFERRED]
  README.md → apps/web/README.md
- `CCS Attendance Repository` --references--> `Architecture Deepening Plan`  [EXTRACTED]
  README.md → docs/architecture-refactor-plan.md
- `ADR-0003: Password Auth Instead of Magic Link` --conceptually_related_to--> `Student`  [INFERRED]
  docs/adr/0003-password-auth-instead-of-magic-link.md → CONTEXT.md
- `ADR-0005: Client-Trusted Cached Session for Sidebar Navigation` --conceptually_related_to--> `Student`  [INFERRED]
  docs/adr/0005-client-trusted-session-for-nav.md → CONTEXT.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Attendance to Penalty and Clearance Accounting Pipeline** — context_attendance_session, context_time_in_time_out, context_penalty, context_ledger, context_clearance [EXTRACTED 1.00]
- **Attendance User Lifecycle Flows** — docs_flows_student_user_flow_student_workflow, docs_flows_officer_flow_officer_workflow, docs_flows_governor_flow_governor_workflow [EXTRACTED 1.00]
- **Core Deep Architecture Engines** — docs_specs_architecture_deepening_scan_approval_engine, docs_specs_architecture_deepening_ledger_calculation_engine, docs_specs_architecture_deepening_event_lifecycle_manager [EXTRACTED 1.00]
- **Engineering Workflow: Implement, TDD, and Code Review** — claude_skills_implement_skill_implement_workflow, claude_skills_tdd_skill_tdd_loop, claude_skills_code_review_skill_two_axis_review [EXTRACTED 1.00]
- **Multi-tier Monorepo Platform Stack** — docs_architecture_web_architecture, docs_architecture_mobile_architecture, docs_architecture_database_architecture, pnpm_workspace_turborepo_monorepo_workspace [EXTRACTED 1.00]
- **Role Hierarchy and User Lifecycle** — context_pending_student, context_student, context_officer, context_governor [EXTRACTED 1.00]
- **Web Starter Template UI Icons** — apps_web_public_file_file_icon, apps_web_public_globe_globe_icon, apps_web_public_window_window_icon [INFERRED 0.85]
- **Android Adaptive Icon Asset Suite** — apps_mobile_assets_android_icon_background_android_icon_background, apps_mobile_assets_android_icon_foreground_android_icon_foreground, apps_mobile_assets_android_icon_monochrome_android_icon_monochrome [INFERRED 0.95]

## Communities (70 total, 11 thin omitted)

### Community 0 - "web/lib/events.ts"
Cohesion: 0.08
Nodes (43): DELETE(), lifecycleError(), PATCH(), POST(), ClearancePage(), createEvent(), deleteEvent(), eventsSnapshot (+35 more)

### Community 1 - "reports.ts"
Cohesion: 0.08
Nodes (48): GET(), GET(), GET(), GET(), AnalyticsPage(), dynamic, FinancialPdfDocument(), styles (+40 more)

### Community 2 - "cn"
Cohesion: 0.06
Nodes (39): AlertDialogMedia(), AlertDialogOverlay(), Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+31 more)

### Community 3 - "scan-approval.ts"
Cohesion: 0.11
Nodes (26): GET(), POST(), POST(), POST(), GET(), authorizeRequest(), listOfficerRejections(), RejectedScanView (+18 more)

### Community 4 - "sidebar.tsx"
Cohesion: 0.07
Nodes (39): AppSidebar(), Identity, NAV_ITEMS, navForRole(), NavItem, readCachedIdentity(), ModeToggle(), Sidebar() (+31 more)

### Community 5 - "ledger.ts"
Cohesion: 0.08
Nodes (30): dashboardSnapshot, ADR-0013, DashboardView(), DashboardPage(), dynamic, ADR-0013, attendanceStatus(), cellFor() (+22 more)

### Community 6 - "admin/page.tsx"
Cohesion: 0.22
Nodes (18): dynamic, dynamic, myAttendanceQueryKey, ADR-0013, STEPS, ConfirmSubmitButton(), Badge(), badgeVariants (+10 more)

### Community 7 - "Attendance Session"
Cohesion: 0.18
Nodes (16): Attendance Session, Clearance, Event, Governor, Ledger, Officer, Offline Scan Queue, Payment (+8 more)

### Community 8 - "scanQueue.ts"
Cohesion: 0.13
Nodes (36): BoothApp(), addRecentScan(), blockingScanCount(), claimLegacyScans(), DeliveryState, dequeue(), discardLegacyScans(), discardScan() (+28 more)

### Community 9 - "myAttendanceSnapshot"
Cohesion: 0.40
Nodes (5): myAttendanceSnapshot, MyAttendanceView(), dynamic, MyAttendancePage(), ADR-0013

### Community 10 - "Local Development & Testing with Docker and Supabase"
Cohesion: 0.17
Nodes (11): 1. Prerequisites, 3. Quickstart (Docker Compose), 4. Building the Web Application Docker Image, 5. Port Reference Table, 6. Helper Commands Summary, Local Development & Testing with Docker and Supabase, Run Migrations & Seed against Docker Compose DB, Start Database & Supabase Studio only (+3 more)

### Community 11 - "import-enrollment-roster.mjs"
Cohesion: 0.21
Nodes (11): decodeXml(), gboxEmails, isGbox(), PROGRAMS, roster, rows, sharedStrings, [source] (+3 more)

### Community 12 - "architecture.integration.test.ts"
Cohesion: 0.10
Nodes (27): markPaid(), setScanField(), ADR-0013, ADR-0013, governor, officer, EventGridRow, StudentStanding (+19 more)

### Community 13 - "SettingsScreen.tsx"
Cohesion: 0.13
Nodes (18): colorOf(), COLORS, initialsOf(), fetchRejectedScans(), RejectedScanRow, RejectionReason, apiFetch, useRejectedScans() (+10 more)

### Community 14 - "reports-client.tsx"
Cohesion: 0.14
Nodes (13): Event, ReportsClient(), ReportsClientProps, Semester, Student, ADR-0013, CardDescription(), Label() (+5 more)

### Community 15 - "web/package.json"
Cohesion: 0.08
Nodes (25): drizzle-orm, react, @tanstack/react-query, @types/react, typescript, vitest, name, private (+17 more)

### Community 16 - "theme-context.tsx"
Cohesion: 0.13
Nodes (18): CalendarGrid(), CELL_SIZE, makeStyles(), MONTH_NAMES, toDateString(), WEEKDAYS, Dropdown(), makeStyles() (+10 more)

### Community 17 - "CCS Attendance Repository"
Cohesion: 0.18
Nodes (17): Agent Guidelines and Repo Conventions, CCS Attendance System Domain Model, Mobile Web Platform Split, TanStack Query and Zustand State Management, GitHub Issue Tracker Workflow, Issue Triage Labels, Database Architecture Drizzle Postgres, Mobile Architecture Expo (+9 more)

### Community 18 - "expo"
Cohesion: 0.08
Nodes (23): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled (+15 more)

### Community 19 - "students/actions.ts"
Cohesion: 0.06
Nodes (58): addProgram(), closeSemester(), createSemester(), deleteSemester(), editSemester(), fail(), promoteToOfficer(), removeProgram() (+50 more)

### Community 20 - "mobile/package.json"
Cohesion: 0.06
Nodes (33): App(), apiFetch, boothQueryDefaults, BoothQueryProvider(), cacheMaxAgeMs, persister, queryClient, devDependencies (+25 more)

### Community 21 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, @clerk/clerk-expo, expo, expo-auth-session, expo-camera, expo-crypto, expo-secure-store, expo-status-bar (+14 more)

### Community 22 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 23 - "EventsScreen.tsx"
Cohesion: 0.15
Nodes (18): apiFetch(), EventRow, EventType, fetchMyEvents(), myEventsKey, useMyEvents(), DeleteEventModal(), confirmDelete() (+10 more)

### Community 24 - "web/lib/qr.ts"
Cohesion: 0.20
Nodes (15): GET(), POST(), GET(), GET(), chunk(), QrCardPdfDocument(), renderQrCardPdf(), styles (+7 more)

### Community 25 - "BoothScreen.tsx"
Cohesion: 0.12
Nodes (22): isReadableQrPayload(), parseQrPayload(), QrStudent, isAlreadyScanned(), recentScanOutcomeLabel(), ScanOutcome, scan, RecentScan (+14 more)

### Community 26 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, @attendance/db, class-variance-authority, @clerk/nextjs, clsx, drizzle-orm, @google/generative-ai, lucide-react (+12 more)

### Community 27 - "students-view.test.tsx"
Cohesion: 0.14
Nodes (14): studentsSnapshot, dynamic, StudentsPage(), ADR-0013, downloadQrCards(), StudentsView(), changeId(), { correctStudentMock, snapshotMock } (+6 more)

### Community 28 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 29 - "scripts"
Cohesion: 0.06
Nodes (32): devDependencies, turbo, typescript, engines, node, typescript, name, packageManager (+24 more)

### Community 30 - "2. Quickstart (Supabase CLI)"
Cohesion: 0.33
Nodes (6): 2. Quickstart (Supabase CLI), Step 1: Start the local Supabase containers, Step 2: Apply Drizzle migrations, Step 3: Seed initial test data, Step 4: Verify in Supabase Studio, Step 5: Run the Web App locally

### Community 31 - "LoginScreen.tsx"
Cohesion: 0.19
Nodes (11): LinkingLike, matchesRedirectScheme(), UrlHandler, watchForRedirectUrl(), LoginScreen(), signIn(), makeStyles(), Styles (+3 more)

### Community 32 - "students-view.tsx"
Cohesion: 0.11
Nodes (34): PaymentCell(), ScanCell(), ADR-0013, eventGridQueryKey(), ADR-0013, EventRow, ADR-0007, eventsQueryKey (+26 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.18
Nodes (9): geistMono, geistSans, metadata, spaceGrotesk, QueryProvider(), ADR-0013, ThemeProvider(), TooltipProvider() (+1 more)

### Community 34 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, eslint, eslint-config-next, jsdom, tailwindcss, @tailwindcss/postcss, @testing-library/dom, @testing-library/jest-dom (+7 more)

### Community 35 - "tasks"
Cohesion: 0.15
Nodes (12): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+4 more)

### Community 36 - "App.tsx"
Cohesion: 0.13
Nodes (20): AppShell(), AuthenticatedApp(), MobileAdmission, navTheme(), styles, Tab, TAB_ICONS, ADR-0012 (+12 more)

### Community 37 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, module, moduleResolution, resolveJsonModule, skipLibCheck (+2 more)

### Community 38 - "Test-Driven Development Loop"
Cohesion: 0.16
Nodes (14): Code Review Agent Interface, Fowler Code Smell Baseline, Spec Review Axis, Standards Review Axis, Two-Axis Code Review, Implement Agent Interface, Implementation Workflow, TDD Agent Interface (+6 more)

### Community 39 - "Events Page"
Cohesion: 0.36
Nodes (8): Login Page, Pop-up: Add event, Pop-up: Delete event, Pop-up: Edit event, Events Page, Pop-up: After scan, Scanner Page, Settings Page

### Community 40 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, start, test, test:integration, typecheck

### Community 41 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, android, ios, start, test, typecheck, web

### Community 42 - "db/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json

### Community 43 - "Mobile App Icon"
Cohesion: 0.40
Nodes (6): Android Adaptive Icon Background, Android Adaptive Icon Foreground, Android Adaptive Icon Monochrome, Mobile Web Favicon, Mobile App Icon, Mobile Splash Icon

### Community 44 - "mobile/tsconfig.json"
Cohesion: 0.40
Nodes (4): compilerOptions, strict, extends, expo/tsconfig.base

### Community 47 - "db/package.json"
Cohesion: 0.17
Nodes (10): drizzle-orm, typescript, vitest, main, name, private, type, types (+2 more)

### Community 48 - "dashboard-view.tsx"
Cohesion: 0.29
Nodes (4): dashboardQueryKey, ADR-0013, RefreshButton(), ADR-0013

### Community 49 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, db:generate, db:import-enrollment, db:migrate, db:push, db:seed, db:seed-all-roster, test:integration (+2 more)

### Community 50 - "postgres"
Cohesion: 0.25
Nodes (6): governorList, sql, ADR-0012, sql, TEST_STUDENTS, postgres

### Community 51 - "devDependencies"
Cohesion: 0.50
Nodes (4): devDependencies, drizzle-kit, typescript, vitest

### Community 52 - "Graphify Knowledge Graph Rule"
Cohesion: 0.67
Nodes (3): Graphify Knowledge Graph Rule, Graphify Query and Inspection Tools, Graphify Workflow

### Community 53 - "File Document Icon"
Cohesion: 1.00
Nodes (3): File Document Icon, Globe Icon, Window Icon

### Community 54 - "Governor Workflow"
Cohesion: 0.67
Nodes (3): Governor Mobile Booth Access, Anonymized AI Reporting with Gemini, Governor Workflow

### Community 62 - "Deep Module Specifications"
Cohesion: 0.15
Nodes (13): Shared Event Ownership, Late Registrants Full Semester Liability, Sentinel Attendance Timestamp, Clerk Google SSO Domain Restriction, Officer Direct Student Corrections, On-Demand QR Card Pull Model, Architecture Deepening Plan, Officer Workflow (+5 more)

### Community 63 - "Student"
Cohesion: 0.33
Nodes (7): CCS Web Application, Pending Student, Student, ADR-0001: Supabase, Drizzle, Turborepo, Vercel, and Expo Stack, ADR-0002: shadcn/ui Design System from app.ncfccs.org, ADR-0003: Password Auth Instead of Magic Link, ADR-0005: Client-Trusted Cached Session for Sidebar Navigation

### Community 64 - "get_latest_mtime"
Cohesion: 0.67
Nodes (3): Path, get_latest_mtime(), main()

### Community 66 - "dependencies"
Cohesion: 0.67
Nodes (3): dependencies, drizzle-orm, postgres

### Community 69 - "auth.ts"
Cohesion: 0.13
Nodes (14): GET(), maxDuration, authMock, ADR-0007, getUserFromBearer(), verifyToken, Identity, ADR-0012 (+6 more)

## Knowledge Gaps
- **466 isolated node(s):** `Tab`, `MobileAdmission`, `TAB_ICONS`, `styles`, `ADR-0012` (+461 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 540 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `postgres` connect `postgres` to `import-enrollment-roster.mjs`, `auth.ts`, `db/package.json`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `students-view.tsx`, `sidebar.tsx`, `admin/page.tsx`, `reports-client.tsx`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `@react-pdf/renderer` connect `reports.ts` to `web/lib/qr.ts`, `web/package.json`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `Tab`, `MobileAdmission`, `TAB_ICONS` to the rest of the system?**
  _466 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `web/lib/events.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07767722473604827 - nodes in this community are weakly interconnected._
- **Should `reports.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08196721311475409 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.06428571428571428 - nodes in this community are weakly interconnected._