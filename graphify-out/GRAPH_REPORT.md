# Graph Report - agent-af44687ae5be94158  (2026-09-22)

## Corpus Check
- 392 files · ~225,887 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2271 nodes · 5200 edges · 129 communities (112 shown, 14 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 80 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6efee0c9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- events/actions.ts
- gemini.ts
- cn
- event.controller.ts
- (app)/layout.tsx
- drizzle-event.repository.ts
- semester.module.ts
- Attendance Session
- scanQueue.ts
- students-view.tsx
- 2. Quickstart (Docker Compose)
- import-enrollment-roster.mjs
- drizzle-scan.repository.ts
- SettingsScreen.tsx
- events-view.tsx
- web/package.json
- useTheme
- CCS Attendance Repository
- expo
- students-view.test.tsx
- program.module.ts
- dependencies
- components.json
- EventsScreen.tsx
- web/lib/qr.ts
- BoothScreen.tsx
- dependencies
- dashboard-view.tsx
- compilerOptions
- scripts
- dashboard/actions.ts
- LoginScreen.tsx
- api-client.ts
- app/layout.tsx
- devDependencies
- tasks
- App.tsx
- compilerOptions
- Test-Driven Development Loop
- requireOfficerOrGovernor
- scripts
- syncScans.ts
- db/tsconfig.json
- Mobile App Icon
- mobile/tsconfig.json
- @testing-library/react
- DrizzleScanRepository
- db/package.json
- contracts/src/index.ts
- main.ts
- seed-students.mjs
- api/package.json
- Graphify Knowledge Graph Rule
- Actor
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
- @nestjs/common
- Design Guidelines — CCS Attendance Web
- DrizzleAttendanceRepository
- auth.ts
- sync-obsidian.sh
- domain/ledger.ts
- role.ts
- my-attendance/actions.ts
- reports-client.tsx
- 0016-enrollment-roster-precedes-student-identity.md
- report.use-case.ts
- domain/report.ts
- semester-event-lifecycle.integration.test.ts
- compilerOptions
- RequireCapability
- .perEvent
- LedgerController
- Semester
- admin/page.tsx
- bento-grid.tsx
- enrollment-roster.module.ts
- marketing-landing.tsx
- ProgramRepository
- contracts/package.json
- TokenAuthGuard
- AdminOnlyController
- CreateSemesterUseCase
- src/report.ts
- @clerk/nextjs
- event-lifecycle.ts
- Design Guidelines — CCS Attendance Officer Mobile
- CloseSemesterUseCase
- contracts/tsconfig.json
- GetOpenSemesterUseCase
- tsconfig.build.json
- Product
- DeleteEventUseCase
- students/actions.ts
- DrizzleEventRepository
- eventsSnapshot
- seed-all-roster-students.mjs
- NestJS Rewrite Plan
- generate-android-icons.sh
- apiFetch
- my-attendance-view.test.tsx
- NestJS API with Clean Architecture and single-action controllers
- Any managed Postgres addressed by URL, hosted on Heroku for now
- The web app is a BFF with no database access
- Reports are computed on the API and rendered on Vercel
- Ledger is a module without a repository, and no-show materialization is a command
- queryLifecycle.test.ts
- scripts
- per-student/[id]/pdf/route.ts
- query-provider.test.tsx
- MemoryStorage
- CreateEventUseCase
- UpdateEventUseCase
- devDependencies
- Needs Review Scan Decisions are re-decidable, not just discardable
- Floating top navbar replaces the collapsible sidebar app shell
- DbModule

## God Nodes (most connected - your core abstractions)
1. `cn()` - 95 edges
2. `@nestjs/common` - 66 edges
3. `Actor` - 51 edges
4. `RequireCapability()` - 47 edges
5. `apiPost()` - 28 edges
6. `Semester` - 26 edges
7. `apiFetch()` - 26 edges
8. `DrizzleStudentRepository` - 25 edges
9. `AuthGuard` - 25 edges
10. `CapabilityGuard` - 25 edges

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

## Communities (129 total, 14 thin omitted)

### Community 0 - "events/actions.ts"
Cohesion: 0.13
Nodes (17): createEvent(), deleteEvent(), fail(), parseEventForm(), runOrReportError(), { apiFetch, MockApiError }, redirect, requireOfficerOrGovernor (+9 more)

### Community 1 - "gemini.ts"
Cohesion: 0.20
Nodes (17): GET(), GET(), GET(), FinancialPdfDocument(), styles, PerEventPdfDocument(), styles, PerSemesterPdfDocument() (+9 more)

### Community 2 - "cn"
Cohesion: 0.05
Nodes (44): AppLogo(), AppLogoMark(), AppLogoMarkProps, AppLogoProps, LogoSize, SIZE_MAP, FloatingNavbar(), NavLink (+36 more)

### Community 3 - "event.controller.ts"
Cohesion: 0.17
Nodes (18): deriveWholeDayPenalty(), parseEventInput(), EventController, Body, Controller, ADR-0007, ADR-0017, Post (+10 more)

### Community 4 - "(app)/layout.tsx"
Cohesion: 0.22
Nodes (15): AppLayout(), Identity, NAV_ITEMS, navForRole(), readCachedIdentity(), AppDestination, Capability, capabilityFailure() (+7 more)

### Community 5 - "drizzle-event.repository.ts"
Cohesion: 0.21
Nodes (10): ADR-0017, ADR-0007, Event, EventInput, EventType, EVENT_REPOSITORY, EventRepository, ADR-0007 (+2 more)

### Community 6 - "semester.module.ts"
Cohesion: 0.35
Nodes (4): ADR-0017, validateSemesterDates(), ValidationError, SEMESTER_REPOSITORY

### Community 7 - "Attendance Session"
Cohesion: 0.18
Nodes (16): Attendance Session, Clearance, Event, Governor, Ledger, Officer, Offline Scan Queue, Payment (+8 more)

### Community 8 - "scanQueue.ts"
Cohesion: 0.12
Nodes (37): addRecentScan(), blockingScanCount(), claimLegacyScans(), deliveredScans(), DeliveryState, dequeue(), discardLegacyScans(), discardScan() (+29 more)

### Community 9 - "students-view.tsx"
Cohesion: 0.12
Nodes (32): ClearanceView(), AttendanceStatus, MyAttendanceView(), correctStudent(), ROLE_LABEL, roleBadgeVariant(), StudentRow, StudentTableRow (+24 more)

### Community 10 - "2. Quickstart (Docker Compose)"
Cohesion: 0.17
Nodes (12): 1. Prerequisites, 2. Quickstart (Docker Compose), 3. Building the Web Application Docker Image, 4. Port Reference Table, 5. Helper Commands Summary, Apply Drizzle migrations & seed, Local Development & Testing with Docker, Run the Web App locally (+4 more)

### Community 11 - "import-enrollment-roster.mjs"
Cohesion: 0.21
Nodes (11): decodeXml(), gboxEmails, isGbox(), PROGRAMS, roster, rows, sharedStrings, [source] (+3 more)

### Community 12 - "drizzle-scan.repository.ts"
Cohesion: 0.10
Nodes (37): Transaction, EMPTY_STANDING, LedgerUseCase, Injectable, LEDGER_REPOSITORY, ScanResult, StudentQuery, Transaction (+29 more)

### Community 13 - "SettingsScreen.tsx"
Cohesion: 0.14
Nodes (17): colorOf(), COLORS, initialsOf(), LogoutCounts, logoutResolution, networkStatus, unresolvedCount(), RejectionRow() (+9 more)

### Community 14 - "events-view.tsx"
Cohesion: 0.11
Nodes (31): eventGrid(), markPaid(), setScanField(), ADR-0013, AttendanceGrid(), PaymentCell(), ScanCell(), mockRows (+23 more)

### Community 15 - "web/package.json"
Cohesion: 0.07
Nodes (27): @attendance/contracts, react, @tanstack/query-async-storage-persister, @tanstack/react-query, @tanstack/react-query-persist-client, @types/node, @types/react, typescript (+19 more)

### Community 16 - "useTheme"
Cohesion: 0.07
Nodes (43): AuthenticatedApp(), FontGate(), AppLogo(), AppLogoMark(), AppLogoMarkProps, AppLogoProps, LogoSize, makeStyles() (+35 more)

### Community 17 - "CCS Attendance Repository"
Cohesion: 0.18
Nodes (17): Agent Guidelines and Repo Conventions, CCS Attendance System Domain Model, Mobile Web Platform Split, TanStack Query and Zustand State Management, GitHub Issue Tracker Workflow, Issue Triage Labels, Database Architecture Drizzle Postgres, Mobile Architecture Expo (+9 more)

### Community 18 - "expo"
Cohesion: 0.08
Nodes (23): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled (+15 more)

### Community 19 - "students-view.test.tsx"
Cohesion: 0.19
Nodes (9): downloadQrCards(), StudentsView(), changeId(), { correctStudentMock, snapshotMock }, openCorrection(), openDialogByChangingId(), renderStudents(), save() (+1 more)

### Community 20 - "program.module.ts"
Cohesion: 0.21
Nodes (13): CreateProgramUseCase, DeleteProgramUseCase, ListProgramsDetailedUseCase, ListProgramsUseCase, ADR-0014, ADR-0019, Injectable, DuplicateProgramError (+5 more)

### Community 21 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, @clerk/clerk-expo, expo, expo-auth-session, expo-camera, expo-crypto, expo-font, @expo-google-fonts/dm-sans (+18 more)

### Community 22 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 23 - "EventsScreen.tsx"
Cohesion: 0.12
Nodes (27): apiFetch(), createEvent(), deleteEvent(), EventInput, EventRow, eventsKey, EventType, fetchEvents() (+19 more)

### Community 24 - "web/lib/qr.ts"
Cohesion: 0.18
Nodes (17): buildQrPayload(), QrSubject, maxDuration, POST(), GET(), GET(), chunk(), QrCardPdfDocument() (+9 more)

### Community 25 - "BoothScreen.tsx"
Cohesion: 0.12
Nodes (22): isReadableQrPayload(), parseQrPayload(), QrStudent, isAlreadyScanned(), isNeedsReviewActionable(), recentScanOutcomeLabel(), ScanOutcome, scan (+14 more)

### Community 26 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, @attendance/contracts, class-variance-authority, @clerk/nextjs, clsx, @google/generative-ai, lucide-react, next (+13 more)

### Community 27 - "dashboard-view.tsx"
Cohesion: 0.10
Nodes (22): AdminCacheSync(), invalidateProgramCaches(), invalidateSemesterCaches(), ADR-0013, ActiveSessionHeroCell(), AllSemesterEventsCell(), EventItem, getEventRowBadgeVariant() (+14 more)

### Community 28 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 29 - "scripts"
Cohesion: 0.06
Nodes (30): devDependencies, turbo, typescript, engines, node, typescript, name, packageManager (+22 more)

### Community 30 - "dashboard/actions.ts"
Cohesion: 0.14
Nodes (13): dashboardSnapshot, RecentScanItem, ADR-0013, DashboardView(), mockSnapshot, { snapshotMock }, DashboardPage(), dynamic (+5 more)

### Community 31 - "LoginScreen.tsx"
Cohesion: 0.20
Nodes (11): LinkingLike, matchesRedirectScheme(), UrlHandler, watchForRedirectUrl(), hardShadow(), LoginScreen(), signIn(), makeStyles() (+3 more)

### Community 32 - "api-client.ts"
Cohesion: 0.12
Nodes (23): claimEnrollmentRoster(), ONBOARDING_TEST_EMAILS, OnboardingState, OnboardingForm(), dynamic, OnboardingPage(), API_BASE_URL, ApiError (+15 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.18
Nodes (8): dmSans, geistMono, metadata, spaceGrotesk, ThemeProvider(), nextConfig, next, next-themes

### Community 34 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, eslint, eslint-config-next, jsdom, tailwindcss, @tailwindcss/postcss, @testing-library/dom, @testing-library/jest-dom (+7 more)

### Community 35 - "tasks"
Cohesion: 0.15
Nodes (12): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+4 more)

### Community 36 - "App.tsx"
Cohesion: 0.06
Nodes (44): App(), AppShell(), MobileAdmission, navTheme(), styles, Tab, TAB_ICONS, ADR-0012 (+36 more)

### Community 37 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowImportingTsExtensions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, module, moduleResolution, noEmit (+4 more)

### Community 38 - "Test-Driven Development Loop"
Cohesion: 0.16
Nodes (14): Code Review Agent Interface, Fowler Code Smell Baseline, Spec Review Axis, Standards Review Axis, Two-Axis Code Review, Implement Agent Interface, Implementation Workflow, TDD Agent Interface (+6 more)

### Community 39 - "requireOfficerOrGovernor"
Cohesion: 0.16
Nodes (12): ClearancePage(), dynamic, mockBatchLedger, mockSemester, mockStudents, { requireOfficerOrGovernorMock, apiFetchMock, apiPostMock, getOpenSemesterMock }, requireOfficerOrGovernor(), getOpenSemester() (+4 more)

### Community 40 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test, typecheck

### Community 41 - "syncScans.ts"
Cohesion: 0.27
Nodes (9): BoothApp(), ApiError, isPermanentScanFailure(), deliverQueue(), flushQueue(), requestFor(), retryTimers, scheduleRetry() (+1 more)

### Community 42 - "db/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json

### Community 43 - "Mobile App Icon"
Cohesion: 0.40
Nodes (6): Android Adaptive Icon Background, Android Adaptive Icon Foreground, Android Adaptive Icon Monochrome, Mobile Web Favicon, Mobile App Icon, Mobile Splash Icon

### Community 44 - "mobile/tsconfig.json"
Cohesion: 0.40
Nodes (4): compilerOptions, strict, extends, expo/tsconfig.base

### Community 45 - "@testing-library/react"
Cohesion: 0.17
Nodes (6): ClearanceItem, mockResults, mockSemester, AppError(), GlobalError(), @testing-library/react

### Community 46 - "DrizzleScanRepository"
Cohesion: 0.08
Nodes (27): ScanApprovalUseCase, Inject, Injectable, ScanError, decodeQrPayload(), modeToHalfAndField(), QrPayload, qrRejectionReason() (+19 more)

### Community 47 - "db/package.json"
Cohesion: 0.07
Nodes (28): dependencies, drizzle-orm, postgres, devDependencies, drizzle-kit, typescript, vitest, drizzle-orm (+20 more)

### Community 48 - "contracts/src/index.ts"
Cohesion: 0.05
Nodes (42): EnrollmentRosterController, Body, Controller, ADR-0017, Post, UseGuards, CorrectStudentUseCase, Inject (+34 more)

### Community 49 - "main.ts"
Cohesion: 0.29
Nodes (6): AppModule, Module, bootstrap(), DevErrorLoggerFilter, ADR-0017, Catch

### Community 50 - "seed-students.mjs"
Cohesion: 0.50
Nodes (3): ADR-0012, sql, TEST_STUDENTS

### Community 51 - "api/package.json"
Cohesion: 0.05
Nodes (42): dependencies, @attendance/contracts, @attendance/db, @clerk/backend, drizzle-orm, @nestjs/common, @nestjs/core, @nestjs/platform-express (+34 more)

### Community 52 - "Graphify Knowledge Graph Rule"
Cohesion: 0.67
Nodes (3): Graphify Knowledge Graph Rule, Graphify Query and Inspection Tools, Graphify Workflow

### Community 53 - "Actor"
Cohesion: 0.08
Nodes (25): ADR-0014, ADR-0019, ADR-0017, DuplicateStudentIdError, InvalidProgramError, StudentNotFoundError, ADR-0014, NewStudent (+17 more)

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

### Community 66 - "@nestjs/common"
Cohesion: 0.07
Nodes (46): AttendanceUseCase, Injectable, AttendanceModule, Module, EventModule, Module, LedgerModule, Module (+38 more)

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
Cohesion: 0.06
Nodes (35): Inject, absent(), buildCollectedByEvent(), buildContext(), buildEventSessionCounts(), buildEventStats(), compareEvents(), computeEventGrid() (+27 more)

### Community 72 - "role.ts"
Cohesion: 0.29
Nodes (6): CapabilityDenial, capabilityFailure(), hasCapability(), ROLE_CAPABILITIES, ADR-0017, ADR-0019

### Community 73 - "my-attendance/actions.ts"
Cohesion: 0.18
Nodes (11): myAttendanceSnapshot, ADR-0013, MyAttendanceViewProps, dynamic, MyAttendancePage(), ADR-0013, getMyLedger(), studentLedgerQueryKey() (+3 more)

### Community 74 - "reports-client.tsx"
Cohesion: 0.10
Nodes (25): dynamic, RejectionsPage(), Event, ReportsClient(), ReportsClientProps, Semester, Student, mockEvents (+17 more)

### Community 76 - "report.use-case.ts"
Cohesion: 0.13
Nodes (11): Inject, FinancialReportInput, PerEventReportInput, PerSemesterReportInput, PerStudentReportInput, REPORT_REPOSITORY, ReportRepository, asOfTimestamp() (+3 more)

### Community 77 - "domain/report.ts"
Cohesion: 0.19
Nodes (19): attendedHalvesForStudentEvent(), computeFinancialReport(), computePerEventReport(), computePerSemesterReport(), computePerStudentReport(), deriveHalfStatus(), eventHalfPenalty(), EventType (+11 more)

### Community 78 - "semester-event-lifecycle.integration.test.ts"
Cohesion: 0.12
Nodes (6): Inject, Injectable, UpdateSemesterDatesUseCase, db, ADR-0007, ADR-0017

### Community 79 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+12 more)

### Community 80 - "RequireCapability"
Cohesion: 0.20
Nodes (16): SemesterController, Body, Controller, ADR-0017, Post, UseGuards, presentSemester(), RequireCapability() (+8 more)

### Community 82 - "LedgerController"
Cohesion: 0.13
Nodes (12): toResponse(), LedgerController, Body, Controller, Inject, Post, UseGuards, BatchStudentLedgerResponse (+4 more)

### Community 83 - "Semester"
Cohesion: 0.16
Nodes (7): DateRange, SemesterLifecycleError, SemesterRepository, Semester, DrizzleSemesterRepository, Inject, Injectable

### Community 84 - "admin/page.tsx"
Cohesion: 0.30
Nodes (15): addProgram(), closeSemester(), createSemester(), deleteSemester(), editSemester(), fail(), promoteToOfficer(), removeProgram() (+7 more)

### Community 85 - "bento-grid.tsx"
Cohesion: 0.19
Nodes (14): BentoCell(), BentoCellContent(), BentoCellDescription(), BentoCellElevation, BentoCellFooter(), BentoCellHeader(), BentoCellOverline(), BentoCellProps (+6 more)

### Community 86 - "enrollment-roster.module.ts"
Cohesion: 0.06
Nodes (34): ClaimRosterUseCase, ADR-0019, Inject, Injectable, ENROLLMENT_ROSTER_REPOSITORY, EnrollmentRosterRepository, RosterRow, ADR-0017 (+26 more)

### Community 87 - "marketing-landing.tsx"
Cohesion: 0.10
Nodes (9): ICON_TONES, IconTone, MarketingLanding(), roles, steps, DecorativeAccents(), Badge(), badgeVariants (+1 more)

### Community 88 - "ProgramRepository"
Cohesion: 0.08
Nodes (15): Inject, ProgramRepository, DrizzleProgramRepository, Inject, Injectable, ProgramController, Body, Controller (+7 more)

### Community 89 - "contracts/package.json"
Cohesion: 0.17
Nodes (11): devDependencies, typescript, typescript, main, name, private, scripts, typecheck (+3 more)

### Community 90 - "TokenAuthGuard"
Cohesion: 0.33
Nodes (4): extractBearerToken(), TokenAuthGuard, Inject, Injectable

### Community 91 - "AdminOnlyController"
Cohesion: 0.40
Nodes (4): AdminOnlyController, Controller, UseGuards, Get

### Community 92 - "CreateSemesterUseCase"
Cohesion: 0.12
Nodes (10): CreateSemesterUseCase, Inject, Injectable, DeleteSemesterUseCase, Inject, Injectable, ListSemestersUseCase, Inject (+2 more)

### Community 93 - "src/report.ts"
Cohesion: 0.15
Nodes (12): FinancialEventBreakdown, FinancialOutstandingBalance, FinancialPaymentLogSummary, FinancialProgramBreakdown, Half, PerSemesterClearanceReadiness, PerSemesterEventSummary, PerSemesterProgramBreakdown (+4 more)

### Community 95 - "event-lifecycle.ts"
Cohesion: 0.24
Nodes (7): EVENT_TYPES, SemesterRange, ADR-0004, validateEventInput(), validateEventUpdate(), ValidationError, DomainLifecycleError

### Community 96 - "Design Guidelines — CCS Attendance Officer Mobile"
Cohesion: 0.25
Nodes (7): Colors, Design Guidelines — CCS Attendance Officer Mobile, Do's and Don'ts, Elevation & Depth (React Native), Overview, Shapes & Radius, Typography

### Community 97 - "CloseSemesterUseCase"
Cohesion: 0.40
Nodes (3): CloseSemesterUseCase, Inject, Injectable

### Community 98 - "contracts/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, noEmit, outDir, extends, include, ../../tsconfig.base.json

### Community 99 - "GetOpenSemesterUseCase"
Cohesion: 0.40
Nodes (3): GetOpenSemesterUseCase, Inject, Injectable

### Community 100 - "tsconfig.build.json"
Cohesion: 0.33
Nodes (5): compilerOptions, noEmit, exclude, extends, ./tsconfig.json

### Community 101 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 102 - "DeleteEventUseCase"
Cohesion: 0.17
Nodes (7): DeleteEventUseCase, Inject, Injectable, ListEventsUseCase, Inject, Injectable, Inject

### Community 103 - "students/actions.ts"
Cohesion: 0.17
Nodes (11): studentsSnapshot, ADR-0013, ADR-0014, dynamic, StudentsPage(), ADR-0013, ValidationError, StudentCorrectionError (+3 more)

### Community 104 - "DrizzleEventRepository"
Cohesion: 0.27
Nodes (4): EventLifecycleError, DrizzleEventRepository, Inject, Injectable

### Community 105 - "eventsSnapshot"
Cohesion: 0.24
Nodes (7): eventsSnapshot, EventsView(), snapshot, { updateEventMock, deleteEventMock, eventsSnapshotMock }, dynamic, EventsPage(), ADR-0013

### Community 107 - "NestJS Rewrite Plan"
Cohesion: 0.20
Nodes (9): Architecture Deepening Plan, Acceptance gate, Decisions, Loose ends, NestJS Rewrite Plan, Out of scope, Outcome, Slice order (+1 more)

### Community 110 - "apiFetch"
Cohesion: 0.31
Nodes (6): AttendancePage(), apiFetch(), getEventList(), eventListQueryKey, { apiFetch }, ADR-0013

### Community 111 - "my-attendance-view.test.tsx"
Cohesion: 0.25
Nodes (5): mockSnapshotCleared, mockSnapshotNoOpenSemester, mockSnapshotWithDebt, mockStudent, { snapshotMock }

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

### Community 117 - "queryLifecycle.test.ts"
Cohesion: 0.43
Nodes (3): AppStateLike, NetInfoLike, wireQueryLifecycle()

### Community 118 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, android, ios, start, test, typecheck, web

### Community 119 - "per-student/[id]/pdf/route.ts"
Cohesion: 0.48
Nodes (5): GET(), PerStudentPdfDocument(), styles, buildPerStudentReportPrompt(), PerStudentReportData

### Community 120 - "query-provider.test.tsx"
Cohesion: 0.33
Nodes (3): queryDefaults, QueryProvider(), ADR-0013

### Community 122 - "CreateEventUseCase"
Cohesion: 0.40
Nodes (3): CreateEventUseCase, Inject, Injectable

### Community 123 - "UpdateEventUseCase"
Cohesion: 0.40
Nodes (3): Inject, Injectable, UpdateEventUseCase

### Community 124 - "devDependencies"
Cohesion: 0.50
Nodes (4): devDependencies, @types/react, typescript, vitest

### Community 125 - "Needs Review Scan Decisions are re-decidable, not just discardable"
Cohesion: 0.50
Nodes (3): Consequences, Considered Options, Needs Review Scan Decisions are re-decidable, not just discardable

### Community 128 - "DbModule"
Cohesion: 0.67
Nodes (3): DbModule, Module, Global

## Knowledge Gaps
- **730 isolated node(s):** `name`, `version`, `private`, `build`, `start` (+725 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 997 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@nestjs/common` connect `@nestjs/common` to `event.controller.ts`, `drizzle-event.repository.ts`, `semester.module.ts`, `drizzle-scan.repository.ts`, `report.use-case.ts`, `semester-event-lifecycle.integration.test.ts`, `contracts/src/index.ts`, `main.ts`, `RequireCapability`, `api/package.json`, `program.module.ts`, `Actor`, `enrollment-roster.module.ts`, `Semester`, `event-lifecycle.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `students-view.tsx`, `reports-client.tsx`, `events-view.tsx`, `bento-grid.tsx`, `marketing-landing.tsx`, `dashboard-view.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `RequireCapability()` connect `RequireCapability` to `@nestjs/common`, `event.controller.ts`, `DrizzleAttendanceRepository`, `DrizzleScanRepository`, `contracts/src/index.ts`, `.perEvent`, `LedgerController`, `program.module.ts`, `ProgramRepository`, `AdminOnlyController`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _730 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `events/actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12987012987012986 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.05413469735720375 - nodes in this community are weakly interconnected._
- **Should `scanQueue.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11649659863945579 - nodes in this community are weakly interconnected._