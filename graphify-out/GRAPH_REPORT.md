# Graph Report - csc-issue-245  (2026-09-21)

## Corpus Check
- 373 files · ~161,376 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2329 nodes · 5114 edges · 124 communities (107 shown, 14 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bd879c80`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- events/actions.ts
- gemini.ts
- cn
- event.controller.ts
- auth.ts
- dashboard/actions.ts
- dropdown-menu.tsx
- Attendance Session
- scanQueue.ts
- Bento Grid Design Guidelines
- 2. Quickstart (Docker Compose)
- import-enrollment-roster.mjs
- ledger.integration.test.ts
- student-correction.integration.test.ts
- api-client.ts
- web/package.json
- SettingsScreen.tsx
- CCS Attendance Repository
- expo
- my-attendance/actions.ts
- App.tsx
- dependencies
- components.json
- EventsScreen.tsx
- web/lib/qr.ts
- BoothScreen.tsx
- dependencies
- events-view.tsx
- compilerOptions
- scripts
- Architecture & Technical Design
- LoginScreen.tsx
- ApiError
- app/layout.tsx
- devDependencies
- tasks
- @testing-library/react
- compilerOptions
- Test-Driven Development Loop
- Events Page
- scripts
- Step 2 — Design Decisions
- db/tsconfig.json
- Mobile App Icon
- mobile/tsconfig.json
- @clerk/nextjs
- drizzle-scan.repository.ts
- db/package.json
- CallerActor
- @nestjs/common
- seed-students.mjs
- api/package.json
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
- Actor
- Design Guidelines — CCS Attendance Web
- drizzle-attendance.repository.ts
- proxy.ts
- sync-obsidian.sh
- domain/ledger.ts
- RequireCapability
- students-view.tsx
- semester.controller.ts
- 0016-enrollment-roster-precedes-student-identity.md
- report.use-case.ts
- domain/report.ts
- reflect-metadata
- compilerOptions
- Semester
- ReportUseCase
- Bento Design Skill
- Neobrutalism Design Skill
- apiPost
- dashboard-view.tsx
- PendingScreen.tsx
- marketing-landing.tsx
- program.module.ts
- contracts/package.json
- Design Guidelines — Clean Style
- token-auth.guard.ts
- reports-client.tsx
- semester-event-lifecycle.integration.test.ts
- Design Guidelines — Neobrutalism
- claim-roster.use-case.ts
- contracts/src/index.ts
- Design Guidelines — CCS Attendance Officer Mobile
- contracts/tsconfig.json
- per-student/[id]/pdf/route.ts
- tsconfig.build.json
- Product
- CloseSemesterUseCase
- students/actions.ts
- role.ts
- DomainLifecycleError
- seed-all-roster-students.mjs
- NestJS Rewrite Plan
- LedgerController
- DbModule
- StudentModule
- NestJS API with Clean Architecture and single-action controllers
- Any managed Postgres addressed by URL, hosted on Heroku for now
- The web app is a BFF with no database access
- Reports are computed on the API and rendered on Vercel
- Ledger is a module without a repository, and no-show materialization is a command
- AdminOnlyController
- GetOpenSemesterUseCase
- ListSemestersUseCase
- scripts
- semester.module.ts
- Floating top navbar replaces the collapsible sidebar app shell

## God Nodes (most connected - your core abstractions)
1. `cn()` - 92 edges
2. `@nestjs/common` - 66 edges
3. `Actor` - 51 edges
4. `RequireCapability()` - 46 edges
5. `Semester` - 26 edges
6. `apiPost()` - 26 edges
7. `DrizzleStudentRepository` - 25 edges
8. `AuthGuard` - 25 edges
9. `CapabilityGuard` - 25 edges
10. `apiFetch()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Scan Approval` --semantically_similar_to--> `Integration-Style Tests vs Implementation Details`  [INFERRED] [semantically similar]
  CONTEXT.md → .claude/skills/tdd/tests.md
- `CCS Attendance Repository` --references--> `CCS Web Application`  [INFERRED]
  README.md → apps/web/README.md
- `ADR-0003: Password Auth Instead of Magic Link` --conceptually_related_to--> `Student`  [INFERRED]
  docs/adr/0003-password-auth-instead-of-magic-link.md → CONTEXT.md
- `ADR-0005: Client-Trusted Cached Session for Sidebar Navigation` --conceptually_related_to--> `Student`  [INFERRED]
  docs/adr/0005-client-trusted-session-for-nav.md → CONTEXT.md
- `ADR-0004: Single-Day Events Instead of Date Ranges` --conceptually_related_to--> `Attendance Session`  [INFERRED]
  docs/adr/0004-event-per-day-not-date-range.md → CONTEXT.md

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

## Communities (124 total, 14 thin omitted)

### Community 0 - "events/actions.ts"
Cohesion: 0.09
Nodes (28): ClearancePage(), dynamic, findOpenSemester(), createEvent(), deleteEvent(), eventsSnapshot, fail(), parseEventForm() (+20 more)

### Community 1 - "gemini.ts"
Cohesion: 0.20
Nodes (17): GET(), GET(), GET(), FinancialPdfDocument(), styles, PerEventPdfDocument(), styles, PerSemesterPdfDocument() (+9 more)

### Community 2 - "cn"
Cohesion: 0.07
Nodes (39): AlertDialogMedia(), AlertDialogOverlay(), Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+31 more)

### Community 3 - "event.controller.ts"
Cohesion: 0.05
Nodes (52): CreateEventUseCase, ADR-0017, Inject, Injectable, DeleteEventUseCase, Inject, Injectable, ListEventsUseCase (+44 more)

### Community 4 - "auth.ts"
Cohesion: 0.14
Nodes (22): GET(), AppLayout(), Identity, NAV_ITEMS, navForRole(), readCachedIdentity(), NavLink, getCurrentStudent (+14 more)

### Community 5 - "dashboard/actions.ts"
Cohesion: 0.17
Nodes (11): dashboardSnapshot, findOpenSemester(), RecentScanItem, ADR-0013, DashboardView(), mockSnapshot, { snapshotMock }, DashboardPage() (+3 more)

### Community 6 - "dropdown-menu.tsx"
Cohesion: 0.11
Nodes (13): FloatingNavbar(), ModeToggle(), DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem() (+5 more)

### Community 7 - "Attendance Session"
Cohesion: 0.18
Nodes (16): Attendance Session, Clearance, Event, Governor, Ledger, Officer, Offline Scan Queue, Payment (+8 more)

### Community 8 - "scanQueue.ts"
Cohesion: 0.12
Nodes (38): BoothApp(), ApiError, addRecentScan(), blockingScanCount(), claimLegacyScans(), DeliveryState, dequeue(), discardLegacyScans() (+30 more)

### Community 9 - "Bento Grid Design Guidelines"
Cohesion: 0.06
Nodes (31): Accent Color Direction by Content Type, Animation Rules, Anti-Patterns, Base Grid, Bento Grid Design Guidelines, Cell Anatomy, Cell Count, Cell Size Vocabulary (+23 more)

### Community 10 - "2. Quickstart (Docker Compose)"
Cohesion: 0.17
Nodes (12): 1. Prerequisites, 2. Quickstart (Docker Compose), 3. Building the Web Application Docker Image, 4. Port Reference Table, 5. Helper Commands Summary, Apply Drizzle migrations & seed, Local Development & Testing with Docker, Run the Web App locally (+4 more)

### Community 11 - "import-enrollment-roster.mjs"
Cohesion: 0.21
Nodes (11): decodeXml(), gboxEmails, isGbox(), PROGRAMS, roster, rows, sharedStrings, [source] (+3 more)

### Community 12 - "ledger.integration.test.ts"
Cohesion: 0.07
Nodes (42): Transaction, ADR-0017, LedgerUseCase, Inject, Injectable, LEDGER_REPOSITORY, LedgerRepository, DrizzleLedgerRepository (+34 more)

### Community 13 - "student-correction.integration.test.ts"
Cohesion: 0.08
Nodes (21): CorrectStudentUseCase, ADR-0014, ADR-0019, Inject, Injectable, InvalidProgramError, InvalidStudentIdError, StudentController (+13 more)

### Community 14 - "api-client.ts"
Cohesion: 0.22
Nodes (6): API_BASE_URL, ErrorBody, ADR-0019, apiFetch, auth, identity

### Community 15 - "web/package.json"
Cohesion: 0.08
Nodes (25): @attendance/contracts, react, @tanstack/react-query, @types/node, @types/react, typescript, vitest, name (+17 more)

### Community 16 - "SettingsScreen.tsx"
Cohesion: 0.06
Nodes (46): AuthenticatedApp(), FontGate(), CalendarGrid(), CELL_SIZE, makeStyles(), MONTH_NAMES, toDateString(), WEEKDAYS (+38 more)

### Community 17 - "CCS Attendance Repository"
Cohesion: 0.18
Nodes (17): Agent Guidelines and Repo Conventions, CCS Attendance System Domain Model, Mobile Web Platform Split, TanStack Query and Zustand State Management, GitHub Issue Tracker Workflow, Issue Triage Labels, Database Architecture Drizzle Postgres, Mobile Architecture Expo (+9 more)

### Community 18 - "expo"
Cohesion: 0.08
Nodes (23): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled (+15 more)

### Community 19 - "my-attendance/actions.ts"
Cohesion: 0.12
Nodes (15): findOpenSemester(), myAttendanceSnapshot, ADR-0013, MyAttendanceViewProps, mockSnapshotCleared, mockSnapshotNoOpenSemester, mockSnapshotWithDebt, mockStudent (+7 more)

### Community 20 - "App.tsx"
Cohesion: 0.05
Nodes (51): App(), AppShell(), MobileAdmission, navTheme(), styles, Tab, TAB_ICONS, ADR-0012 (+43 more)

### Community 21 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, @clerk/clerk-expo, expo, expo-auth-session, expo-camera, expo-crypto, expo-font, @expo-google-fonts/dm-sans (+18 more)

### Community 22 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 23 - "EventsScreen.tsx"
Cohesion: 0.15
Nodes (18): apiFetch(), EventRow, EventType, fetchMyEvents(), myEventsKey, useMyEvents(), DeleteEventModal(), confirmDelete() (+10 more)

### Community 24 - "web/lib/qr.ts"
Cohesion: 0.19
Nodes (16): buildQrPayload(), QrSubject, maxDuration, POST(), GET(), GET(), chunk(), QrCardPdfDocument() (+8 more)

### Community 25 - "BoothScreen.tsx"
Cohesion: 0.12
Nodes (22): isReadableQrPayload(), parseQrPayload(), QrStudent, isAlreadyScanned(), isNeedsReviewActionable(), recentScanOutcomeLabel(), ScanOutcome, scan (+14 more)

### Community 26 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @attendance/contracts, class-variance-authority, @clerk/nextjs, clsx, @google/generative-ai, lucide-react, next (+11 more)

### Community 27 - "events-view.tsx"
Cohesion: 0.10
Nodes (33): eventGrid(), markPaid(), setScanField(), ADR-0013, AttendanceGrid(), PaymentCell(), ScanCell(), mockRows (+25 more)

### Community 28 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 29 - "scripts"
Cohesion: 0.06
Nodes (30): devDependencies, turbo, typescript, engines, node, typescript, name, packageManager (+22 more)

### Community 30 - "Architecture & Technical Design"
Cohesion: 0.07
Nodes (26): 10. Turborepo Verification Pipeline, 1. Domain Layer (`apps/api/src/modules/<resource>/domain/`), 1. High-Level System Architecture, 1. Server-Authoritative XP, 2. Application Layer (`apps/api/src/modules/<resource>/application/`), 2. Badge Multiplicity (ADR 0003), 2. Monorepo Structure & Package Boundaries, 3. Backend Architecture: Clean Architecture (`apps/api`) (+18 more)

### Community 31 - "LoginScreen.tsx"
Cohesion: 0.20
Nodes (11): LinkingLike, matchesRedirectScheme(), UrlHandler, watchForRedirectUrl(), hardShadow(), LoginScreen(), signIn(), makeStyles() (+3 more)

### Community 32 - "ApiError"
Cohesion: 0.15
Nodes (20): claimEnrollmentRoster(), ONBOARDING_TEST_EMAILS, OnboardingState, OnboardingForm(), dynamic, OnboardingPage(), ApiError, claimRosterByEmail() (+12 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.15
Nodes (10): dmSans, geistMono, metadata, spaceGrotesk, QueryProvider(), ADR-0013, ThemeProvider(), nextConfig (+2 more)

### Community 34 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, eslint, eslint-config-next, jsdom, tailwindcss, @tailwindcss/postcss, @testing-library/dom, @testing-library/jest-dom (+7 more)

### Community 35 - "tasks"
Cohesion: 0.15
Nodes (12): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+4 more)

### Community 36 - "@testing-library/react"
Cohesion: 0.15
Nodes (7): ClearanceItem, ClearanceView(), mockResults, mockSemester, AppError(), GlobalError(), @testing-library/react

### Community 37 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowImportingTsExtensions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, module, moduleResolution, noEmit (+4 more)

### Community 38 - "Test-Driven Development Loop"
Cohesion: 0.16
Nodes (14): Code Review Agent Interface, Fowler Code Smell Baseline, Spec Review Axis, Standards Review Axis, Two-Axis Code Review, Implement Agent Interface, Implementation Workflow, TDD Agent Interface (+6 more)

### Community 39 - "Events Page"
Cohesion: 0.36
Nodes (8): Login Page, Pop-up: Add event, Pop-up: Delete event, Pop-up: Edit event, Events Page, Pop-up: After scan, Scanner Page, Settings Page

### Community 40 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test, typecheck

### Community 41 - "Step 2 — Design Decisions"
Cohesion: 0.07
Nodes (26): Accordion (FAQ), Borders & Radius, Buttons, Clean Design Skill, Color Palette — Default, FAQ, Feature Sections, Footer (+18 more)

### Community 42 - "db/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json

### Community 43 - "Mobile App Icon"
Cohesion: 0.40
Nodes (6): Android Adaptive Icon Background, Android Adaptive Icon Foreground, Android Adaptive Icon Monochrome, Mobile Web Favicon, Mobile App Icon, Mobile Splash Icon

### Community 44 - "mobile/tsconfig.json"
Cohesion: 0.40
Nodes (4): compilerOptions, strict, extends, expo/tsconfig.base

### Community 46 - "drizzle-scan.repository.ts"
Cohesion: 0.11
Nodes (23): ScanApprovalUseCase, Inject, Injectable, ScanError, decodeQrPayload(), modeToHalfAndField(), QrPayload, qrRejectionReason() (+15 more)

### Community 47 - "db/package.json"
Cohesion: 0.07
Nodes (28): dependencies, drizzle-orm, postgres, devDependencies, drizzle-kit, typescript, vitest, drizzle-orm (+20 more)

### Community 48 - "CallerActor"
Cohesion: 0.25
Nodes (8): ScanController, Body, Controller, Inject, Post, UseGuards, CallerActor, ScanDecisionRequest

### Community 49 - "@nestjs/common"
Cohesion: 0.10
Nodes (32): AttendanceUseCase, Injectable, AttendanceModule, Module, EnrollmentRosterModule, Module, LedgerModule, Module (+24 more)

### Community 50 - "seed-students.mjs"
Cohesion: 0.50
Nodes (3): ADR-0012, sql, TEST_STUDENTS

### Community 51 - "api/package.json"
Cohesion: 0.05
Nodes (43): dependencies, @attendance/contracts, @attendance/db, @clerk/backend, drizzle-orm, @nestjs/common, @nestjs/core, @nestjs/platform-express (+35 more)

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
Cohesion: 0.17
Nodes (12): Shared Event Ownership, Late Registrants Full Semester Liability, Sentinel Attendance Timestamp, Clerk Google SSO Domain Restriction, Officer Direct Student Corrections, On-Demand QR Card Pull Model, Officer Workflow, Student Workflow (+4 more)

### Community 63 - "Student"
Cohesion: 0.33
Nodes (7): CCS Web Application, Pending Student, Student, ADR-0001: Supabase, Drizzle, Turborepo, Vercel, and Expo Stack, ADR-0002: shadcn/ui Design System from app.ncfccs.org, ADR-0003: Password Auth Instead of Magic Link, ADR-0005: Client-Trusted Cached Session for Sidebar Navigation

### Community 64 - "get_latest_mtime"
Cohesion: 0.67
Nodes (3): Path, get_latest_mtime(), main()

### Community 66 - "Actor"
Cohesion: 0.08
Nodes (28): GetCallerIdentityUseCase, ADR-0017, Inject, Injectable, ListStudentsUseCase, Inject, Injectable, PromoteStudentUseCase (+20 more)

### Community 67 - "Design Guidelines — CCS Attendance Web"
Cohesion: 0.08
Nodes (25): Bento Cards & Cells, Bento Grid Architecture (Dashboards, Tables & Data Views), Buttons, Canvas & Base Surfaces, Colors, Components, Decorative Handcrafted Layer, Design Guidelines — CCS Attendance Web (+17 more)

### Community 68 - "drizzle-attendance.repository.ts"
Cohesion: 0.09
Nodes (20): Inject, AttendanceHalf, currentCampusDate(), isAbsent(), owedHalves(), DrizzleAttendanceRepository, Transaction, Inject (+12 more)

### Community 69 - "proxy.ts"
Cohesion: 0.47
Nodes (5): hasStudentRecord(), config, isAppRoute, proxy, ADR-0005

### Community 71 - "domain/ledger.ts"
Cohesion: 0.08
Nodes (33): absent(), buildCollectedByEvent(), buildContext(), buildEventSessionCounts(), buildEventStats(), compareEvents(), computeEventGrid(), computeLedger() (+25 more)

### Community 72 - "RequireCapability"
Cohesion: 0.13
Nodes (12): Body, Post, ProgramController, Body, Controller, Post, UseGuards, RequireCapability() (+4 more)

### Community 73 - "students-view.tsx"
Cohesion: 0.10
Nodes (29): AttendanceStatus, MyAttendanceView(), myAttendanceQueryKey, ADR-0013, correctStudent(), studentsQueryKey, ADR-0013, downloadQrCards() (+21 more)

### Community 74 - "semester.controller.ts"
Cohesion: 0.19
Nodes (16): SemesterController, Body, Controller, ADR-0017, Post, UseGuards, presentSemester(), runLifecycle() (+8 more)

### Community 76 - "report.use-case.ts"
Cohesion: 0.15
Nodes (10): FinancialReportInput, PerEventReportInput, PerSemesterReportInput, PerStudentReportInput, REPORT_REPOSITORY, ReportRepository, asOfTimestamp(), DrizzleReportRepository (+2 more)

### Community 77 - "domain/report.ts"
Cohesion: 0.10
Nodes (33): attendedHalvesForStudentEvent(), computeFinancialReport(), computePerEventReport(), computePerSemesterReport(), computePerStudentReport(), currentCampusDate(), deriveHalfStatus(), eventHalfPenalty() (+25 more)

### Community 78 - "reflect-metadata"
Cohesion: 0.22
Nodes (8): AppModule, Module, bootstrap(), DevErrorLoggerFilter, ADR-0017, Catch, @nestjs/core, reflect-metadata

### Community 79 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+12 more)

### Community 80 - "Semester"
Cohesion: 0.14
Nodes (10): ADR-0017, DateRange, SemesterLifecycleError, validateSemesterDates(), ValidationError, SemesterRepository, Semester, DrizzleSemesterRepository (+2 more)

### Community 81 - "ReportUseCase"
Cohesion: 0.16
Nodes (9): ReportUseCase, Inject, Injectable, ReportController, Body, Controller, Inject, Post (+1 more)

### Community 82 - "Bento Design Skill"
Cohesion: 0.10
Nodes (19): 70/20/10 Color Rule, Bento Design Skill, Cell base, Deliverable Checklist, Entrance stagger (on load), Grid, Grid Architecture, Hover lift (on every cell) (+11 more)

### Community 83 - "Neobrutalism Design Skill"
Cohesion: 0.11
Nodes (18): Button (press-down required on every interactive button), Card, CTA Block & Testimonial, Icon Box, Input, Navbar, Neobrutalism Design Skill, Quick Reference (+10 more)

### Community 84 - "apiPost"
Cohesion: 0.25
Nodes (16): addProgram(), closeSemester(), createSemester(), deleteSemester(), editSemester(), fail(), promoteToOfficer(), removeProgram() (+8 more)

### Community 85 - "dashboard-view.tsx"
Cohesion: 0.11
Nodes (23): ActiveSessionHeroCell(), AllSemesterEventsCell(), EventItem, getEventRowBadgeVariant(), getEventStatusBadgeVariant(), getEventStatusLabel(), getScanBadgeVariant(), RecentScansFeedCell() (+15 more)

### Community 86 - "PendingScreen.tsx"
Cohesion: 0.26
Nodes (8): LogoutCounts, logoutResolution, networkStatus, unresolvedCount(), makeStyles(), PendingScreen(), Styles, @react-native-community/netinfo

### Community 87 - "marketing-landing.tsx"
Cohesion: 0.11
Nodes (6): ICON_TONES, IconTone, MarketingLanding(), roles, steps, DecorativeAccents()

### Community 88 - "program.module.ts"
Cohesion: 0.09
Nodes (21): CreateProgramUseCase, DeleteProgramUseCase, ListProgramsDetailedUseCase, ListProgramsUseCase, ADR-0014, ADR-0019, Inject, Injectable (+13 more)

### Community 89 - "contracts/package.json"
Cohesion: 0.17
Nodes (11): devDependencies, typescript, typescript, main, name, private, scripts, typecheck (+3 more)

### Community 90 - "Design Guidelines — Clean Style"
Cohesion: 0.14
Nodes (13): Borders & Radius, Buttons, Color Palette, Components Spotted, Design Guidelines — Clean Style, Icons, Imagery & Illustration, Micro-Animations (+5 more)

### Community 91 - "token-auth.guard.ts"
Cohesion: 0.20
Nodes (7): TokenVerifier, Inject, extractBearerToken(), TokenAuthGuard, ADR-0019, Inject, Injectable

### Community 92 - "reports-client.tsx"
Cohesion: 0.11
Nodes (23): dynamic, Event, ReportsClient(), ReportsClientProps, Semester, Student, mockEvents, mockSemesters (+15 more)

### Community 93 - "semester-event-lifecycle.integration.test.ts"
Cohesion: 0.12
Nodes (6): Inject, Injectable, UpdateSemesterDatesUseCase, db, ADR-0007, ADR-0017

### Community 94 - "Design Guidelines — Neobrutalism"
Cohesion: 0.15
Nodes (12): Borders & Radius, Buttons, Color Palette, Components Spotted, Design Guidelines — Neobrutalism, Icons, Imagery & Illustration, Overall Replication Notes (+4 more)

### Community 95 - "claim-roster.use-case.ts"
Cohesion: 0.07
Nodes (28): ClaimRosterUseCase, ADR-0019, Inject, Injectable, ENROLLMENT_ROSTER_REPOSITORY, EnrollmentRosterRepository, RosterRow, ADR-0017 (+20 more)

### Community 96 - "contracts/src/index.ts"
Cohesion: 0.11
Nodes (16): EnrollmentRosterController, Body, Controller, ADR-0017, Post, UseGuards, presentIdentity(), CallerAuthUserId (+8 more)

### Community 97 - "Design Guidelines — CCS Attendance Officer Mobile"
Cohesion: 0.25
Nodes (7): Colors, Design Guidelines — CCS Attendance Officer Mobile, Do's and Don'ts, Elevation & Depth (React Native), Overview, Shapes & Radius, Typography

### Community 98 - "contracts/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, noEmit, outDir, extends, include, ../../tsconfig.base.json

### Community 99 - "per-student/[id]/pdf/route.ts"
Cohesion: 0.48
Nodes (5): GET(), PerStudentPdfDocument(), styles, buildPerStudentReportPrompt(), PerStudentReportData

### Community 100 - "tsconfig.build.json"
Cohesion: 0.33
Nodes (5): compilerOptions, noEmit, exclude, extends, ./tsconfig.json

### Community 101 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 102 - "CloseSemesterUseCase"
Cohesion: 0.12
Nodes (10): CloseSemesterUseCase, Inject, Injectable, CreateSemesterUseCase, Inject, Injectable, DeleteSemesterUseCase, Inject (+2 more)

### Community 103 - "students/actions.ts"
Cohesion: 0.10
Nodes (18): studentsSnapshot, ADR-0013, ADR-0014, dynamic, StudentsPage(), ADR-0013, changeId(), { correctStudentMock, snapshotMock } (+10 more)

### Community 104 - "role.ts"
Cohesion: 0.29
Nodes (5): CapabilityDenial, capabilityFailure(), ROLE_CAPABILITIES, ADR-0017, ADR-0019

### Community 107 - "NestJS Rewrite Plan"
Cohesion: 0.20
Nodes (9): Architecture Deepening Plan, Acceptance gate, Decisions, Loose ends, NestJS Rewrite Plan, Out of scope, Outcome, Slice order (+1 more)

### Community 109 - "LedgerController"
Cohesion: 0.40
Nodes (4): LedgerController, Controller, Inject, UseGuards

### Community 110 - "DbModule"
Cohesion: 0.67
Nodes (3): DbModule, Module, Global

### Community 112 - "NestJS API with Clean Architecture and single-action controllers"
Cohesion: 0.50
Nodes (3): Consequences, Considered Options, NestJS API with Clean Architecture and single-action controllers

### Community 113 - "Any managed Postgres addressed by URL, hosted on Heroku for now"
Cohesion: 0.50
Nodes (3): Any managed Postgres addressed by URL, hosted on Heroku for now, Consequences, Considered Options

### Community 114 - "The web app is a BFF with no database access"
Cohesion: 0.50
Nodes (3): Consequences, Considered Options, The web app is a BFF with no database access

### Community 115 - "Reports are computed on the API and rendered on Vercel"
Cohesion: 0.50
Nodes (3): Consequences, Considered Options, Reports are computed on the API and rendered on Vercel

### Community 116 - "Ledger is a module without a repository, and no-show materialization is a command"
Cohesion: 0.50
Nodes (3): Consequences, Considered Options, Ledger is a module without a repository, and no-show materialization is a command

### Community 117 - "AdminOnlyController"
Cohesion: 0.40
Nodes (4): AdminOnlyController, Controller, UseGuards, Get

### Community 121 - "GetOpenSemesterUseCase"
Cohesion: 0.40
Nodes (3): GetOpenSemesterUseCase, Inject, Injectable

### Community 122 - "ListSemestersUseCase"
Cohesion: 0.40
Nodes (3): ListSemestersUseCase, Inject, Injectable

### Community 123 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, android, ios, start, test, typecheck, web

### Community 125 - "semester.module.ts"
Cohesion: 0.47
Nodes (3): SEMESTER_REPOSITORY, SemesterModule, Module

## Knowledge Gaps
- **819 isolated node(s):** `name`, `version`, `private`, `build`, `start` (+814 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1078 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@nestjs/common` connect `@nestjs/common` to `contracts/src/index.ts`, `Actor`, `event.controller.ts`, `drizzle-attendance.repository.ts`, `DomainLifecycleError`, `semester.controller.ts`, `ledger.integration.test.ts`, `report.use-case.ts`, `reflect-metadata`, `drizzle-scan.repository.ts`, `Semester`, `student-correction.integration.test.ts`, `api/package.json`, `semester-event-lifecycle.integration.test.ts`, `program.module.ts`, `token-auth.guard.ts`, `semester.module.ts`, `claim-roster.use-case.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `dropdown-menu.tsx`, `students-view.tsx`, `dashboard-view.tsx`, `events-view.tsx`, `reports-client.tsx`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `RequireCapability()` connect `RequireCapability` to `contracts/src/index.ts`, `Actor`, `event.controller.ts`, `drizzle-attendance.repository.ts`, `semester.controller.ts`, `student-correction.integration.test.ts`, `CallerActor`, `@nestjs/common`, `ReportUseCase`, `AdminOnlyController`, `program.module.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _819 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `events/actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09309309309309309 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.06708595387840671 - nodes in this community are weakly interconnected._
- **Should `event.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.050686641697877656 - nodes in this community are weakly interconnected._