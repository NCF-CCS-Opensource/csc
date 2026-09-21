# Graph Report - csc  (2026-09-21)

## Corpus Check
- 367 files · ~219,497 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2186 nodes · 5013 edges · 109 communities (94 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 80 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4e91fd3a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- events/actions.ts
- contracts/src/index.ts
- cn
- event.controller.ts
- (app)/layout.tsx
- RequireCapability
- App.tsx
- Attendance Session
- scanQueue.ts
- reports-client.tsx
- 2. Quickstart (Docker Compose)
- import-enrollment-roster.mjs
- semester-event-lifecycle.integration.test.ts
- RejectionsScreen.tsx
- events-view.tsx
- web/package.json
- SettingsScreen.tsx
- CCS Attendance Repository
- expo
- students-view.test.tsx
- scan.controller.ts
- dependencies
- components.json
- EventsScreen.tsx
- web/lib/qr.ts
- BoothScreen.tsx
- dependencies
- students-view.tsx
- compilerOptions
- scripts
- dashboard/actions.ts
- LoginScreen.tsx
- ApiError
- app/layout.tsx
- devDependencies
- tasks
- mobile/package.json
- compilerOptions
- Test-Driven Development Loop
- mode-toggle.tsx
- scripts
- Actor
- db/tsconfig.json
- Mobile App Icon
- mobile/tsconfig.json
- ProgramController
- drizzle-scan.repository.ts
- db/package.json
- clearance-view.test.tsx
- @nestjs/common
- seed-students.mjs
- api/package.json
- Graphify Knowledge Graph Rule
- DrizzleStudentRepository
- Governor Workflow
- test-integration.sh
- Rust Token Killer CLI
- eslint.config.mjs
- postcss.config.mjs
- analytics/page.tsx
- Domain Docs Architecture
- Deep Module Specifications
- Student
- get_latest_mtime
- watch-obsidian.sh script
- student.controller.ts
- Design Guidelines — CCS Attendance Web
- DrizzleAttendanceRepository
- auth.ts
- sync-obsidian.sh
- domain/ledger.ts
- role.ts
- my-attendance/actions.ts
- api-client.ts
- 0016-enrollment-roster-precedes-student-identity.md
- report.use-case.ts
- domain/report.ts
- main.ts
- compilerOptions
- semester.controller.ts
- ReportUseCase
- ledger.use-case.ts
- PendingScreen.tsx
- admin/page.tsx
- dashboard-view.tsx
- enrollment-roster.module.ts
- marketing-landing.tsx
- ProgramRepository
- contracts/package.json
- TokenAuthGuard
- AdminOnlyController
- @clerk/nextjs
- Design Guidelines — CCS Attendance Officer Mobile
- contracts/tsconfig.json
- tsconfig.build.json
- Product
- students/actions.ts
- seed-all-roster-students.mjs
- NestJS Rewrite Plan
- NestJS API with Clean Architecture and single-action controllers
- Any managed Postgres addressed by URL, hosted on Heroku for now
- The web app is a BFF with no database access
- Reports are computed on the API and rendered on Vercel
- Ledger is a module without a repository, and no-show materialization is a command
- DbModule
- Floating top navbar replaces the collapsible sidebar app shell

## God Nodes (most connected - your core abstractions)
1. `cn()` - 95 edges
2. `@nestjs/common` - 66 edges
3. `Actor` - 51 edges
4. `RequireCapability()` - 46 edges
5. `Semester` - 26 edges
6. `apiPost()` - 26 edges
7. `DrizzleStudentRepository` - 25 edges
8. `AuthGuard` - 25 edges
9. `CapabilityGuard` - 25 edges
10. `useTheme()` - 25 edges

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
- **Android Adaptive Icon Asset Suite** — apps_mobile_assets_android_icon_background_android_icon_background, apps_mobile_assets_android_icon_foreground_android_icon_foreground, apps_mobile_assets_android_icon_monochrome_android_icon_monochrome [INFERRED 0.95]

## Communities (109 total, 12 thin omitted)

### Community 0 - "events/actions.ts"
Cohesion: 0.10
Nodes (22): createEvent(), deleteEvent(), eventsSnapshot, fail(), parseEventForm(), runOrReportError(), { apiFetch, MockApiError }, redirect (+14 more)

### Community 1 - "contracts/src/index.ts"
Cohesion: 0.17
Nodes (22): GET(), GET(), GET(), GET(), FinancialPdfDocument(), styles, PerEventPdfDocument(), styles (+14 more)

### Community 2 - "cn"
Cohesion: 0.06
Nodes (40): FloatingNavbar(), NavLink, AlertDialogMedia(), AlertDialogOverlay(), Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup() (+32 more)

### Community 3 - "event.controller.ts"
Cohesion: 0.05
Nodes (52): CreateEventUseCase, ADR-0017, Inject, Injectable, DeleteEventUseCase, Inject, Injectable, ListEventsUseCase (+44 more)

### Community 4 - "(app)/layout.tsx"
Cohesion: 0.22
Nodes (15): AppLayout(), Identity, NAV_ITEMS, navForRole(), readCachedIdentity(), AppDestination, Capability, capabilityFailure() (+7 more)

### Community 5 - "RequireCapability"
Cohesion: 0.35
Nodes (7): ScanController, Body, Controller, Post, UseGuards, CallerActor, RequireCapability()

### Community 6 - "App.tsx"
Cohesion: 0.14
Nodes (21): AppShell(), BoothApp(), MobileAdmission, navTheme(), styles, Tab, TAB_ICONS, ADR-0012 (+13 more)

### Community 7 - "Attendance Session"
Cohesion: 0.18
Nodes (16): Attendance Session, Clearance, Event, Governor, Ledger, Officer, Offline Scan Queue, Payment (+8 more)

### Community 8 - "scanQueue.ts"
Cohesion: 0.13
Nodes (38): addRecentScan(), blockingScanCount(), claimLegacyScans(), deliveredScans(), DeliveryState, dequeue(), discardLegacyScans(), discardScan() (+30 more)

### Community 9 - "reports-client.tsx"
Cohesion: 0.10
Nodes (24): dynamic, Event, ReportsClient(), ReportsClientProps, Semester, Student, mockEvents, mockSemesters (+16 more)

### Community 10 - "2. Quickstart (Docker Compose)"
Cohesion: 0.17
Nodes (12): 1. Prerequisites, 2. Quickstart (Docker Compose), 3. Building the Web Application Docker Image, 4. Port Reference Table, 5. Helper Commands Summary, Apply Drizzle migrations & seed, Local Development & Testing with Docker, Run the Web App locally (+4 more)

### Community 11 - "import-enrollment-roster.mjs"
Cohesion: 0.21
Nodes (11): decodeXml(), gboxEmails, isGbox(), PROGRAMS, roster, rows, sharedStrings, [source] (+3 more)

### Community 12 - "semester-event-lifecycle.integration.test.ts"
Cohesion: 0.09
Nodes (33): Transaction, StudentRow, DB, db, createTestApp(), db, db, db (+25 more)

### Community 13 - "RejectionsScreen.tsx"
Cohesion: 0.16
Nodes (17): colorOf(), COLORS, initialsOf(), fetchRejectedScans(), RejectedScanRow, RejectionReason, apiFetch, useRejectedScans() (+9 more)

### Community 14 - "events-view.tsx"
Cohesion: 0.13
Nodes (26): AttendanceGrid(), PaymentCell(), ScanCell(), ADR-0013, eventGridQueryKey(), ADR-0013, EventRow, ADR-0007 (+18 more)

### Community 15 - "web/package.json"
Cohesion: 0.08
Nodes (25): @attendance/contracts, react, @tanstack/react-query, @types/node, @types/react, typescript, vitest, name (+17 more)

### Community 16 - "SettingsScreen.tsx"
Cohesion: 0.07
Nodes (40): AuthenticatedApp(), FontGate(), AppLogo(), AppLogoMark(), AppLogoMarkProps, AppLogoProps, LogoSize, makeStyles() (+32 more)

### Community 17 - "CCS Attendance Repository"
Cohesion: 0.18
Nodes (17): Agent Guidelines and Repo Conventions, CCS Attendance System Domain Model, Mobile Web Platform Split, TanStack Query and Zustand State Management, GitHub Issue Tracker Workflow, Issue Triage Labels, Database Architecture Drizzle Postgres, Mobile Architecture Expo (+9 more)

### Community 18 - "expo"
Cohesion: 0.08
Nodes (23): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled (+15 more)

### Community 19 - "students-view.test.tsx"
Cohesion: 0.25
Nodes (7): changeId(), { correctStudentMock, snapshotMock }, openCorrection(), openDialogByChangingId(), renderStudents(), save(), snapshot

### Community 20 - "scan.controller.ts"
Cohesion: 0.17
Nodes (10): ScanApprovalUseCase, Inject, Injectable, Inject, BOOTH_MODES, RejectedScanLogEntry, RejectedScanLogRequest, RejectedScanLogResponse (+2 more)

### Community 21 - "dependencies"
Cohesion: 0.06
Nodes (33): dependencies, @clerk/clerk-expo, expo, expo-auth-session, expo-camera, expo-crypto, expo-font, @expo-google-fonts/dm-sans (+25 more)

### Community 22 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 23 - "EventsScreen.tsx"
Cohesion: 0.14
Nodes (17): EventRow, EventType, fetchMyEvents(), myEventsKey, useMyEvents(), DeleteEventModal(), confirmDelete(), deriveStatus() (+9 more)

### Community 24 - "web/lib/qr.ts"
Cohesion: 0.19
Nodes (16): buildQrPayload(), QrSubject, maxDuration, POST(), GET(), GET(), chunk(), QrCardPdfDocument() (+8 more)

### Community 25 - "BoothScreen.tsx"
Cohesion: 0.15
Nodes (17): isReadableQrPayload(), parseQrPayload(), QrStudent, isAlreadyScanned(), isNeedsReviewActionable(), recentScanOutcomeLabel(), ScanOutcome, scan (+9 more)

### Community 26 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @attendance/contracts, class-variance-authority, @clerk/nextjs, clsx, @google/generative-ai, lucide-react, next (+11 more)

### Community 27 - "students-view.tsx"
Cohesion: 0.10
Nodes (36): ClearanceView(), AttendanceStatus, MyAttendanceView(), myAttendanceQueryKey, ADR-0013, studentsQueryKey, ADR-0013, downloadQrCards() (+28 more)

### Community 28 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 29 - "scripts"
Cohesion: 0.06
Nodes (30): devDependencies, turbo, typescript, engines, node, typescript, name, packageManager (+22 more)

### Community 30 - "dashboard/actions.ts"
Cohesion: 0.18
Nodes (11): dashboardSnapshot, findOpenSemester(), RecentScanItem, ADR-0013, DashboardView(), mockSnapshot, { snapshotMock }, DashboardPage() (+3 more)

### Community 31 - "LoginScreen.tsx"
Cohesion: 0.20
Nodes (12): LinkingLike, matchesRedirectScheme(), UrlHandler, watchForRedirectUrl(), hardShadow(), LoginScreen(), signIn(), makeStyles() (+4 more)

### Community 32 - "ApiError"
Cohesion: 0.14
Nodes (21): claimEnrollmentRoster(), ONBOARDING_TEST_EMAILS, OnboardingState, OnboardingForm(), dynamic, OnboardingPage(), ApiError, claimRosterByEmail() (+13 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.15
Nodes (10): dmSans, geistMono, metadata, spaceGrotesk, QueryProvider(), ADR-0013, ThemeProvider(), nextConfig (+2 more)

### Community 34 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, eslint, eslint-config-next, jsdom, tailwindcss, @tailwindcss/postcss, @testing-library/dom, @testing-library/jest-dom (+7 more)

### Community 35 - "tasks"
Cohesion: 0.15
Nodes (12): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+4 more)

### Community 36 - "mobile/package.json"
Cohesion: 0.06
Nodes (34): App(), apiFetch, boothQueryDefaults, BoothQueryProvider(), cacheMaxAgeMs, persister, queryClient, devDependencies (+26 more)

### Community 37 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowImportingTsExtensions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, module, moduleResolution, noEmit (+4 more)

### Community 38 - "Test-Driven Development Loop"
Cohesion: 0.16
Nodes (14): Code Review Agent Interface, Fowler Code Smell Baseline, Spec Review Axis, Standards Review Axis, Two-Axis Code Review, Implement Agent Interface, Implementation Workflow, TDD Agent Interface (+6 more)

### Community 40 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test, typecheck

### Community 41 - "Actor"
Cohesion: 0.14
Nodes (6): presentIdentity(), Post, Actor, ADR-0019, Role, Param

### Community 42 - "db/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json

### Community 43 - "Mobile App Icon"
Cohesion: 0.40
Nodes (6): Android Adaptive Icon Background, Android Adaptive Icon Foreground, Android Adaptive Icon Monochrome, Mobile Web Favicon, Mobile App Icon, Mobile Splash Icon

### Community 44 - "mobile/tsconfig.json"
Cohesion: 0.40
Nodes (4): compilerOptions, strict, extends, expo/tsconfig.base

### Community 45 - "ProgramController"
Cohesion: 0.18
Nodes (8): ProgramController, Body, Controller, Post, UseGuards, CreateProgramRequest, DeleteProgramRequest, ADR-0019

### Community 46 - "drizzle-scan.repository.ts"
Cohesion: 0.15
Nodes (14): ScanError, decodeQrPayload(), modeToHalfAndField(), QrPayload, qrRejectionReason(), RejectionReason, DrizzleScanRepository, ScanResult (+6 more)

### Community 47 - "db/package.json"
Cohesion: 0.07
Nodes (28): dependencies, drizzle-orm, postgres, devDependencies, drizzle-kit, typescript, vitest, drizzle-orm (+20 more)

### Community 48 - "clearance-view.test.tsx"
Cohesion: 0.15
Nodes (7): ClearanceItem, mockResults, mockSemester, Role, ADR-0019, StudentSummary, ADR-0019

### Community 49 - "@nestjs/common"
Cohesion: 0.07
Nodes (47): AttendanceUseCase, Injectable, AttendanceModule, Module, EventModule, Module, LedgerModule, Module (+39 more)

### Community 50 - "seed-students.mjs"
Cohesion: 0.50
Nodes (3): ADR-0012, sql, TEST_STUDENTS

### Community 51 - "api/package.json"
Cohesion: 0.05
Nodes (42): dependencies, @attendance/contracts, @attendance/db, @clerk/backend, drizzle-orm, @nestjs/common, @nestjs/core, @nestjs/platform-express (+34 more)

### Community 52 - "Graphify Knowledge Graph Rule"
Cohesion: 0.67
Nodes (3): Graphify Knowledge Graph Rule, Graphify Query and Inspection Tools, Graphify Workflow

### Community 53 - "DrizzleStudentRepository"
Cohesion: 0.23
Nodes (6): NewStudent, StudentCorrection, DrizzleStudentRepository, Inject, Injectable, toActor()

### Community 54 - "Governor Workflow"
Cohesion: 0.67
Nodes (3): Governor Mobile Booth Access, Anonymized AI Reporting with Gemini, Governor Workflow

### Community 59 - "analytics/page.tsx"
Cohesion: 0.39
Nodes (5): currentCampusDate(), currentCampusDate(), isEventPastInManila(), AnalyticsPage(), dynamic

### Community 62 - "Deep Module Specifications"
Cohesion: 0.17
Nodes (12): Shared Event Ownership, Late Registrants Full Semester Liability, Sentinel Attendance Timestamp, Clerk Google SSO Domain Restriction, Officer Direct Student Corrections, On-Demand QR Card Pull Model, Officer Workflow, Student Workflow (+4 more)

### Community 63 - "Student"
Cohesion: 0.33
Nodes (7): CCS Web Application, Pending Student, Student, ADR-0001: Supabase, Drizzle, Turborepo, Vercel, and Expo Stack, ADR-0002: shadcn/ui Design System from app.ncfccs.org, ADR-0003: Password Auth Instead of Magic Link, ADR-0005: Client-Trusted Cached Session for Sidebar Navigation

### Community 64 - "get_latest_mtime"
Cohesion: 0.67
Nodes (3): Path, get_latest_mtime(), main()

### Community 66 - "student.controller.ts"
Cohesion: 0.06
Nodes (44): PROGRAM_REPOSITORY, ADR-0017, CorrectStudentUseCase, ADR-0014, ADR-0019, Inject, Injectable, GetCallerIdentityUseCase (+36 more)

### Community 67 - "Design Guidelines — CCS Attendance Web"
Cohesion: 0.08
Nodes (25): Bento Cards & Cells, Bento Grid Architecture (Dashboards, Tables & Data Views), Buttons, Canvas & Base Surfaces, Colors, Components, Decorative Handcrafted Layer, Design Guidelines — CCS Attendance Web (+17 more)

### Community 68 - "DrizzleAttendanceRepository"
Cohesion: 0.08
Nodes (19): Inject, AttendanceHalf, currentCampusDate(), isAbsent(), owedHalves(), DrizzleAttendanceRepository, Inject, Injectable (+11 more)

### Community 69 - "auth.ts"
Cohesion: 0.16
Nodes (13): GET(), getCurrentStudent, hasStudentRecord(), Identity, apiFetch, auth, identity, ADR-0012 (+5 more)

### Community 71 - "domain/ledger.ts"
Cohesion: 0.07
Nodes (33): absent(), buildCollectedByEvent(), buildContext(), buildEventSessionCounts(), buildEventStats(), compareEvents(), computeEventGrid(), computeLedger() (+25 more)

### Community 72 - "role.ts"
Cohesion: 0.29
Nodes (6): CapabilityDenial, capabilityFailure(), hasCapability(), ROLE_CAPABILITIES, ADR-0017, ADR-0019

### Community 73 - "my-attendance/actions.ts"
Cohesion: 0.12
Nodes (16): findOpenSemester(), myAttendanceSnapshot, ADR-0013, MyAttendanceViewProps, mockSnapshotCleared, mockSnapshotNoOpenSemester, mockSnapshotWithDebt, mockStudent (+8 more)

### Community 74 - "api-client.ts"
Cohesion: 0.17
Nodes (15): ClearancePage(), dynamic, findOpenSemester(), eventGrid(), markPaid(), setScanField(), ADR-0013, AttendancePage() (+7 more)

### Community 76 - "report.use-case.ts"
Cohesion: 0.15
Nodes (10): FinancialReportInput, PerEventReportInput, PerSemesterReportInput, PerStudentReportInput, REPORT_REPOSITORY, ReportRepository, asOfTimestamp(), DrizzleReportRepository (+2 more)

### Community 77 - "domain/report.ts"
Cohesion: 0.10
Nodes (31): attendedHalvesForStudentEvent(), computeFinancialReport(), computePerEventReport(), computePerSemesterReport(), computePerStudentReport(), deriveHalfStatus(), eventHalfPenalty(), EventType (+23 more)

### Community 78 - "main.ts"
Cohesion: 0.29
Nodes (6): AppModule, Module, bootstrap(), DevErrorLoggerFilter, ADR-0017, Catch

### Community 79 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+12 more)

### Community 80 - "semester.controller.ts"
Cohesion: 0.05
Nodes (47): CloseSemesterUseCase, Inject, Injectable, CreateSemesterUseCase, ADR-0017, Inject, Injectable, DeleteSemesterUseCase (+39 more)

### Community 81 - "ReportUseCase"
Cohesion: 0.17
Nodes (9): ReportUseCase, Inject, Injectable, ReportController, Body, Controller, Inject, Post (+1 more)

### Community 82 - "ledger.use-case.ts"
Cohesion: 0.12
Nodes (13): LedgerUseCase, Inject, Injectable, LEDGER_REPOSITORY, LedgerRepository, LedgerController, Body, Controller (+5 more)

### Community 83 - "PendingScreen.tsx"
Cohesion: 0.17
Nodes (10): LogoutCounts, logoutResolution, networkStatus, unresolvedCount(), DeliveredCard(), formatMeta(), makeStyles(), ScanCardHeader() (+2 more)

### Community 84 - "admin/page.tsx"
Cohesion: 0.30
Nodes (16): addProgram(), closeSemester(), createSemester(), deleteSemester(), editSemester(), fail(), promoteToOfficer(), removeProgram() (+8 more)

### Community 85 - "dashboard-view.tsx"
Cohesion: 0.08
Nodes (27): ActiveSessionHeroCell(), AllSemesterEventsCell(), EventItem, getEventRowBadgeVariant(), getEventStatusBadgeVariant(), getEventStatusLabel(), getScanBadgeVariant(), RecentScansFeedCell() (+19 more)

### Community 86 - "enrollment-roster.module.ts"
Cohesion: 0.05
Nodes (43): ClaimRosterUseCase, ADR-0019, Inject, Injectable, ENROLLMENT_ROSTER_REPOSITORY, EnrollmentRosterRepository, RosterRow, ADR-0017 (+35 more)

### Community 87 - "marketing-landing.tsx"
Cohesion: 0.06
Nodes (17): mockRows, { setScanFieldMock, markPaidMock, eventGridMock }, GlobalError(), ICON_TONES, IconTone, MarketingLanding(), roles, steps (+9 more)

### Community 88 - "ProgramRepository"
Cohesion: 0.10
Nodes (8): Inject, DuplicateProgramError, ProgramInUseError, ProgramRepository, DrizzleProgramRepository, Inject, Injectable, Program

### Community 89 - "contracts/package.json"
Cohesion: 0.17
Nodes (11): devDependencies, typescript, typescript, main, name, private, scripts, typecheck (+3 more)

### Community 90 - "TokenAuthGuard"
Cohesion: 0.33
Nodes (4): extractBearerToken(), TokenAuthGuard, Inject, Injectable

### Community 91 - "AdminOnlyController"
Cohesion: 0.40
Nodes (4): AdminOnlyController, Controller, UseGuards, Get

### Community 96 - "Design Guidelines — CCS Attendance Officer Mobile"
Cohesion: 0.25
Nodes (7): Colors, Design Guidelines — CCS Attendance Officer Mobile, Do's and Don'ts, Elevation & Depth (React Native), Overview, Shapes & Radius, Typography

### Community 98 - "contracts/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, noEmit, outDir, extends, include, ../../tsconfig.base.json

### Community 100 - "tsconfig.build.json"
Cohesion: 0.33
Nodes (5): compilerOptions, noEmit, exclude, extends, ./tsconfig.json

### Community 101 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 103 - "students/actions.ts"
Cohesion: 0.15
Nodes (12): correctStudent(), studentsSnapshot, ADR-0013, ADR-0014, dynamic, StudentsPage(), ADR-0013, ValidationError (+4 more)

### Community 107 - "NestJS Rewrite Plan"
Cohesion: 0.20
Nodes (9): Architecture Deepening Plan, Acceptance gate, Decisions, Loose ends, NestJS Rewrite Plan, Out of scope, Outcome, Slice order (+1 more)

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

### Community 118 - "DbModule"
Cohesion: 0.67
Nodes (3): DbModule, Module, Global

## Knowledge Gaps
- **704 isolated node(s):** `name`, `version`, `private`, `build`, `start` (+699 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 957 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@nestjs/common` connect `@nestjs/common` to `student.controller.ts`, `event.controller.ts`, `Actor`, `semester-event-lifecycle.integration.test.ts`, `report.use-case.ts`, `main.ts`, `drizzle-scan.repository.ts`, `semester.controller.ts`, `ledger.use-case.ts`, `api/package.json`, `scan.controller.ts`, `enrollment-roster.module.ts`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `reports-client.tsx`, `events-view.tsx`, `dashboard-view.tsx`, `marketing-landing.tsx`, `students-view.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `@testing-library/react` connect `marketing-landing.tsx` to `events/actions.ts`, `cn`, `reports-client.tsx`, `my-attendance/actions.ts`, `events-view.tsx`, `web/package.json`, `clearance-view.test.tsx`, `students-view.test.tsx`, `admin/page.tsx`, `dashboard-view.tsx`, `students-view.tsx`, `dashboard/actions.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _704 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `events/actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09885057471264368 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.058445353594389245 - nodes in this community are weakly interconnected._
- **Should `event.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05201465201465202 - nodes in this community are weakly interconnected._