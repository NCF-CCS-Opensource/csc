# Graph Report - csc-338  (2026-09-25)

## Corpus Check
- 438 files · ~249,047 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2397 nodes · 5616 edges · 119 communities (102 shown, 14 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 88 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8daefbd2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- events/actions.ts
- gemini.ts
- cn
- event-lifecycle.ts
- AttendanceController
- CallerActor
- semester-lifecycle.ts
- Attendance Session
- scanQueue.ts
- dashboard-view.tsx
- 2. Quickstart (Docker Compose)
- import-enrollment-roster.mjs
- ledger.integration.test.ts
- SettingsScreen.tsx
- students-view.tsx
- web/package.json
- useTheme
- CCS Attendance Repository
- expo
- students-view.test.tsx
- program.module.ts
- dependencies
- components.json
- EventsScreen.tsx
- app-shell.tsx
- BoothScreen.tsx
- dependencies
- query-sync.ts
- compilerOptions
- scripts
- auth.ts
- LoginScreen.tsx
- ApiError
- app/layout.tsx
- devDependencies
- tasks
- App.tsx
- compilerOptions
- Test-Driven Development Loop
- clearance/page.tsx
- scripts
- api.ts
- db/tsconfig.json
- Mobile App Icon
- mobile/tsconfig.json
- clearance-view.test.tsx
- drizzle-scan.repository.ts
- db/package.json
- Actor
- main.ts
- seed-students.mjs
- api/package.json
- Graphify Knowledge Graph Rule
- drizzle-student.repository.ts
- Governor Workflow
- test-integration.sh
- Rust Token Killer CLI
- eslint.config.mjs
- postcss.config.mjs
- @testing-library/react
- Domain Docs Architecture
- Deep Module Specifications
- Student
- get_latest_mtime
- watch-obsidian.sh script
- auth.guard.ts
- Design Guidelines — CCS Attendance Web
- drizzle-attendance.repository.ts
- api-client.ts
- sync-obsidian.sh
- domain/ledger.ts
- capability.guard.ts
- contracts/src/index.ts
- my-attendance-view.tsx
- 0016-enrollment-roster-precedes-student-identity.md
- report.use-case.ts
- domain/report.ts
- semester-event-lifecycle.integration.test.ts
- compilerOptions
- SemesterResponse
- ReportUseCase
- RequireCapability
- Semester
- admin/page.tsx
- bento-grid.tsx
- claim-roster.use-case.ts
- marketing-landing.tsx
- ProgramRepository
- contracts/package.json
- scan.ts
- AdminOnlyController
- SemesterRepository
- Security Assessment — 2026-09-23
- @clerk/nextjs
- pendingTab.ts
- Design Guidelines — CCS Attendance Officer Mobile
- next.config.ts
- contracts/tsconfig.json
- mode-toggle.tsx
- tsconfig.build.json
- Product
- students/actions.ts
- seed-all-roster-students.mjs
- NestJS Rewrite Plan
- generate-android-icons.sh
- apiFetch
- NestJS API with Clean Architecture and single-action controllers
- Any managed Postgres addressed by URL, hosted on Heroku for now
- The web app is a BFF with no database access
- Reports are computed on the API and rendered on Vercel
- Ledger is a module without a repository, and no-show materialization is a command
- queryLifecycle.test.ts
- scripts
- MemoryStorage
- Needs Review Scan Decisions are re-decidable, not just discardable
- Floating top navbar replaces the collapsible sidebar app shell

## God Nodes (most connected - your core abstractions)
1. `cn()` - 95 edges
2. `@nestjs/common` - 70 edges
3. `Actor` - 54 edges
4. `RequireCapability()` - 49 edges
5. `@testing-library/react` - 30 edges
6. `CapabilityGuard` - 28 edges
7. `apiFetch()` - 28 edges
8. `apiPost()` - 28 edges
9. `AuthGuard` - 27 edges
10. `Semester` - 26 edges

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

## Communities (119 total, 14 thin omitted)

### Community 0 - "events/actions.ts"
Cohesion: 0.08
Nodes (26): createEvent(), deleteEvent(), eventsSnapshot, fail(), parseEventForm(), runOrReportError(), { apiFetch, MockApiError }, redirect (+18 more)

### Community 1 - "gemini.ts"
Cohesion: 0.17
Nodes (21): GET(), GET(), GET(), GET(), FinancialPdfDocument(), styles, PerSemesterPdfDocument(), styles (+13 more)

### Community 2 - "cn"
Cohesion: 0.05
Nodes (46): AppLogo(), AppLogoMark(), AppLogoMarkProps, AppLogoProps, LogoSize, SIZE_MAP, FloatingNavbar(), NavLink (+38 more)

### Community 3 - "event-lifecycle.ts"
Cohesion: 0.05
Nodes (44): CreateEventUseCase, ADR-0017, Inject, Injectable, Inject, ADR-0007, Inject, Inject (+36 more)

### Community 4 - "AttendanceController"
Cohesion: 0.15
Nodes (12): AttendanceController, Body, Controller, Inject, Post, UseGuards, AttendanceField, AttendanceGridResponse (+4 more)

### Community 5 - "CallerActor"
Cohesion: 0.25
Nodes (8): ScanController, Body, Controller, Inject, Post, UseGuards, CallerActor, ScanDecisionRequest

### Community 6 - "semester-lifecycle.ts"
Cohesion: 0.25
Nodes (6): DateRange, ADR-0024, validateSemesterDates(), validateSemesterInput(), ValidationError, DomainLifecycleError

### Community 7 - "Attendance Session"
Cohesion: 0.18
Nodes (16): Attendance Session, Clearance, Event, Governor, Ledger, Officer, Offline Scan Queue, Payment (+8 more)

### Community 8 - "scanQueue.ts"
Cohesion: 0.10
Nodes (44): addRecentScan(), blockingScanCount(), claimLegacyScans(), deliveredScans(), DeliveryState, dequeue(), discardLegacyScans(), discardScan() (+36 more)

### Community 9 - "dashboard-view.tsx"
Cohesion: 0.12
Nodes (28): RejectionsLoading(), dynamic, AnalyticsLoading(), ClearanceLoading(), ActiveSessionHeroCell(), AllSemesterEventsCell(), EventItem, getEventRowBadgeVariant() (+20 more)

### Community 10 - "2. Quickstart (Docker Compose)"
Cohesion: 0.17
Nodes (12): 1. Prerequisites, 2. Quickstart (Docker Compose), 3. Building the Web Application Docker Image, 4. Port Reference Table, 5. Helper Commands Summary, Apply Drizzle migrations & seed, Local Development & Testing with Docker, Run the Web App locally (+4 more)

### Community 11 - "import-enrollment-roster.mjs"
Cohesion: 0.21
Nodes (11): decodeXml(), gboxEmails, isGbox(), PROGRAMS, roster, rows, sharedStrings, [source] (+3 more)

### Community 12 - "ledger.integration.test.ts"
Cohesion: 0.07
Nodes (40): Inject, Transaction, ADR-0017, EMPTY_STANDING, LedgerUseCase, Inject, Injectable, LEDGER_REPOSITORY (+32 more)

### Community 13 - "SettingsScreen.tsx"
Cohesion: 0.12
Nodes (22): endOfficerSession(), colorOf(), COLORS, initialsOf(), fetchRejectedScans(), RejectedScanRow, RejectionReason, apiFetch (+14 more)

### Community 14 - "students-view.tsx"
Cohesion: 0.11
Nodes (32): PaymentCell(), ScanCell(), ADR-0013, UndoPayment(), eventGridQueryKey(), ADR-0013, EventRow, ADR-0007 (+24 more)

### Community 15 - "web/package.json"
Cohesion: 0.07
Nodes (27): @attendance/contracts, react, @tanstack/query-async-storage-persister, @tanstack/react-query, @tanstack/react-query-persist-client, @types/node, @types/react, typescript (+19 more)

### Community 16 - "useTheme"
Cohesion: 0.08
Nodes (33): AuthenticatedApp(), FontGate(), AppLogo(), AppLogoMark(), AppLogoMarkProps, AppLogoProps, LogoSize, makeStyles() (+25 more)

### Community 17 - "CCS Attendance Repository"
Cohesion: 0.18
Nodes (17): Agent Guidelines and Repo Conventions, CCS Attendance System Domain Model, Mobile Web Platform Split, TanStack Query and Zustand State Management, GitHub Issue Tracker Workflow, Issue Triage Labels, Database Architecture Drizzle Postgres, Mobile Architecture Expo (+9 more)

### Community 18 - "expo"
Cohesion: 0.08
Nodes (23): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled (+15 more)

### Community 19 - "students-view.test.tsx"
Cohesion: 0.25
Nodes (7): changeId(), { correctStudentMock, snapshotMock }, openCorrection(), openDialogByChangingId(), renderStudents(), save(), snapshot

### Community 20 - "program.module.ts"
Cohesion: 0.19
Nodes (14): CreateProgramUseCase, DeleteProgramUseCase, ListProgramsDetailedUseCase, ListProgramsUseCase, ADR-0014, ADR-0019, Injectable, PROGRAM_REPOSITORY (+6 more)

### Community 21 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, @clerk/clerk-expo, expo, expo-auth-session, expo-camera, expo-crypto, expo-font, @expo-google-fonts/dm-sans (+18 more)

### Community 22 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 23 - "EventsScreen.tsx"
Cohesion: 0.14
Nodes (24): apiFetch(), createEvent(), deleteEvent(), EventInput, EventRow, eventsKey, EventType, fetchEvents() (+16 more)

### Community 24 - "app-shell.tsx"
Cohesion: 0.08
Nodes (38): buildQrPayload(), QrSubject, AppShell(), NAV_ITEMS, navForRole(), ADR-0013, AppLayout(), GET() (+30 more)

### Community 25 - "BoothScreen.tsx"
Cohesion: 0.12
Nodes (22): isReadableQrPayload(), parseQrPayload(), QrStudent, isAlreadyScanned(), isNeedsReviewActionable(), recentScanOutcomeLabel(), ScanOutcome, scan (+14 more)

### Community 26 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, @attendance/contracts, class-variance-authority, @clerk/nextjs, clsx, @google/generative-ai, lucide-react, next (+13 more)

### Community 27 - "query-sync.ts"
Cohesion: 0.17
Nodes (14): AdminCacheSync(), invalidateProgramCaches(), invalidateSemesterCaches(), ADR-0013, dashboardQueryKey, ADR-0013, RefreshButton(), ADR-0013 (+6 more)

### Community 28 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 29 - "scripts"
Cohesion: 0.06
Nodes (30): devDependencies, turbo, typescript, engines, node, typescript, name, packageManager (+22 more)

### Community 30 - "auth.ts"
Cohesion: 0.09
Nodes (25): currentCampusDate(), maxDuration, POST(), AnalyticsPage(), dynamic, dashboardSnapshot, RecentScanItem, ADR-0013 (+17 more)

### Community 31 - "LoginScreen.tsx"
Cohesion: 0.18
Nodes (12): LinkingLike, matchesRedirectScheme(), UrlHandler, watchForRedirectUrl(), hardShadow(), LoginScreen(), signIn(), makeStyles() (+4 more)

### Community 32 - "ApiError"
Cohesion: 0.14
Nodes (22): claimEnrollmentRoster(), OnboardingState, BlockedEmail(), OnboardingForm(), dynamic, OnboardingPage(), ApiError, claimRosterByEmail() (+14 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.15
Nodes (9): dmSans, geistMono, metadata, spaceGrotesk, queryDefaults, QueryProvider(), ADR-0013, ThemeProvider() (+1 more)

### Community 34 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, eslint, eslint-config-next, jsdom, tailwindcss, @tailwindcss/postcss, @testing-library/dom, @testing-library/jest-dom (+7 more)

### Community 35 - "tasks"
Cohesion: 0.15
Nodes (12): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+4 more)

### Community 36 - "App.tsx"
Cohesion: 0.06
Nodes (38): App(), AppShell(), MobileAdmission, navTheme(), styles, Tab, TAB_ICONS, ADR-0012 (+30 more)

### Community 37 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowImportingTsExtensions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, module, moduleResolution, noEmit (+4 more)

### Community 38 - "Test-Driven Development Loop"
Cohesion: 0.16
Nodes (14): Code Review Agent Interface, Fowler Code Smell Baseline, Spec Review Axis, Standards Review Axis, Two-Axis Code Review, Implement Agent Interface, Implementation Workflow, TDD Agent Interface (+6 more)

### Community 39 - "clearance/page.tsx"
Cohesion: 0.15
Nodes (15): ClearancePage(), dynamic, mockBatchLedger, mockSemester, mockStudents, { requireOfficerOrGovernorMock, apiFetchMock, apiPostMock, getOpenSemesterMock }, apiFetchWithToken(), getOpenSemester() (+7 more)

### Community 40 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test, typecheck

### Community 41 - "api.ts"
Cohesion: 0.14
Nodes (17): BoothApp(), API_BASE_URL, ApiError, rememberedOfficerIdentity(), rememberOfficerIdentity(), asyncStorageBacking, getToken, ADR-0012 (+9 more)

### Community 42 - "db/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json

### Community 43 - "Mobile App Icon"
Cohesion: 0.40
Nodes (6): Android Adaptive Icon Background, Android Adaptive Icon Foreground, Android Adaptive Icon Monochrome, Mobile Web Favicon, Mobile App Icon, Mobile Splash Icon

### Community 44 - "mobile/tsconfig.json"
Cohesion: 0.40
Nodes (4): compilerOptions, strict, extends, expo/tsconfig.base

### Community 45 - "clearance-view.test.tsx"
Cohesion: 0.13
Nodes (10): ClearanceItem, ClearanceView(), { markSafFeePaid, voidSafFeePayment }, mockResults, mockSemester, MyAttendanceView(), downloadQrCards(), StudentsView() (+2 more)

### Community 46 - "drizzle-scan.repository.ts"
Cohesion: 0.13
Nodes (17): ScanApprovalUseCase, Inject, Injectable, ScanError, decodeQrPayload(), modeToHalfAndField(), QrPayload, qrRejectionReason() (+9 more)

### Community 47 - "db/package.json"
Cohesion: 0.07
Nodes (28): dependencies, drizzle-orm, postgres, devDependencies, drizzle-kit, typescript, vitest, drizzle-orm (+20 more)

### Community 48 - "Actor"
Cohesion: 0.11
Nodes (13): Body, Post, presentIdentity(), StudentController, Body, Controller, Post, UseGuards (+5 more)

### Community 49 - "main.ts"
Cohesion: 0.29
Nodes (6): AppModule, Module, bootstrap(), DevErrorLoggerFilter, ADR-0017, Catch

### Community 50 - "seed-students.mjs"
Cohesion: 0.50
Nodes (3): ADR-0012, sql, TEST_STUDENTS

### Community 51 - "api/package.json"
Cohesion: 0.05
Nodes (43): dependencies, @attendance/contracts, @attendance/db, @clerk/backend, drizzle-orm, @nestjs/common, @nestjs/core, @nestjs/platform-express (+35 more)

### Community 52 - "Graphify Knowledge Graph Rule"
Cohesion: 0.67
Nodes (3): Graphify Knowledge Graph Rule, Graphify Query and Inspection Tools, Graphify Workflow

### Community 53 - "drizzle-student.repository.ts"
Cohesion: 0.06
Nodes (45): CorrectStudentUseCase, ADR-0014, ADR-0019, Inject, Injectable, GetCallerIdentityUseCase, ADR-0017, Inject (+37 more)

### Community 54 - "Governor Workflow"
Cohesion: 0.67
Nodes (3): Governor Mobile Booth Access, Anonymized AI Reporting with Gemini, Governor Workflow

### Community 59 - "@testing-library/react"
Cohesion: 0.12
Nodes (9): DashboardView(), mockSnapshot, { snapshotMock }, AppError(), EventsLoading(), StudentsLoading(), GlobalError(), OnboardingLoading() (+1 more)

### Community 62 - "Deep Module Specifications"
Cohesion: 0.17
Nodes (12): Shared Event Ownership, Late Registrants Full Semester Liability, Sentinel Attendance Timestamp, Clerk Google SSO Domain Restriction, Officer Direct Student Corrections, On-Demand QR Card Pull Model, Officer Workflow, Student Workflow (+4 more)

### Community 63 - "Student"
Cohesion: 0.33
Nodes (7): CCS Web Application, Pending Student, Student, ADR-0001: Supabase, Drizzle, Turborepo, Vercel, and Expo Stack, ADR-0002: shadcn/ui Design System from app.ncfccs.org, ADR-0003: Password Auth Instead of Magic Link, ADR-0005: Client-Trusted Cached Session for Sidebar Navigation

### Community 64 - "get_latest_mtime"
Cohesion: 0.67
Nodes (3): Path, get_latest_mtime(), main()

### Community 66 - "auth.guard.ts"
Cohesion: 0.07
Nodes (35): AttendanceModule, Module, EnrollmentRosterModule, Module, DeleteEventUseCase, Injectable, ListEventsUseCase, Injectable (+27 more)

### Community 67 - "Design Guidelines — CCS Attendance Web"
Cohesion: 0.08
Nodes (25): Bento Cards & Cells, Bento Grid Architecture (Dashboards, Tables & Data Views), Buttons, Canvas & Base Surfaces, Colors, Components, Decorative Handcrafted Layer, Design Guidelines — CCS Attendance Web (+17 more)

### Community 68 - "drizzle-attendance.repository.ts"
Cohesion: 0.13
Nodes (12): AttendanceUseCase, Inject, Injectable, AttendanceHalf, currentCampusDate(), isAbsent(), owedHalves(), DrizzleAttendanceRepository (+4 more)

### Community 69 - "api-client.ts"
Cohesion: 0.22
Nodes (6): API_BASE_URL, ErrorBody, ADR-0019, apiFetch, auth, identity

### Community 71 - "domain/ledger.ts"
Cohesion: 0.08
Nodes (33): absent(), buildCollectedByEvent(), buildContext(), buildEventSessionCounts(), buildEventStats(), compareEvents(), computeEventGrid(), computeLedger() (+25 more)

### Community 72 - "capability.guard.ts"
Cohesion: 0.07
Nodes (29): ADR-0017, Capability, CapabilityDenial, ROLE_CAPABILITIES, ADR-0017, ADR-0019, AuthGuard, extractBearerToken() (+21 more)

### Community 73 - "contracts/src/index.ts"
Cohesion: 0.07
Nodes (24): myAttendanceSnapshot, ADR-0013, mockSnapshotCleared, mockSnapshotNoOpenSemester, mockSnapshotWithDebt, mockStudent, { snapshotMock }, dynamic (+16 more)

### Community 74 - "my-attendance-view.tsx"
Cohesion: 0.10
Nodes (26): Event, ReportsClient(), ReportsClientProps, Semester, Student, mockEvents, mockSemesters, mockStudents (+18 more)

### Community 76 - "report.use-case.ts"
Cohesion: 0.15
Nodes (10): FinancialReportInput, PerEventReportInput, PerSemesterReportInput, PerStudentReportInput, REPORT_REPOSITORY, ReportRepository, asOfTimestamp(), DrizzleReportRepository (+2 more)

### Community 77 - "domain/report.ts"
Cohesion: 0.09
Nodes (36): attendedHalvesForStudentEvent(), computeFinancialReport(), computePerEventReport(), computePerSemesterReport(), computePerStudentReport(), currentCampusDate(), deriveHalfStatus(), eventHalfPenalty() (+28 more)

### Community 78 - "semester-event-lifecycle.integration.test.ts"
Cohesion: 0.11
Nodes (26): CloseSemesterUseCase, Injectable, CreateSemesterUseCase, ADR-0017, Injectable, DeleteSemesterUseCase, Injectable, GetOpenSemesterUseCase (+18 more)

### Community 79 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+12 more)

### Community 80 - "SemesterResponse"
Cohesion: 0.15
Nodes (12): Body, Post, presentSemester(), runLifecycle(), ClearanceViewProps, CloseSemesterRequest, CreateSemesterRequest, DeleteSemesterRequest (+4 more)

### Community 81 - "ReportUseCase"
Cohesion: 0.16
Nodes (10): ReportUseCase, Inject, Injectable, ReportController, Body, Controller, Inject, Post (+2 more)

### Community 82 - "RequireCapability"
Cohesion: 0.21
Nodes (9): toResponse(), LedgerController, Body, Controller, Inject, Post, UseGuards, RequireCapability() (+1 more)

### Community 83 - "Semester"
Cohesion: 0.21
Nodes (6): SemesterInput, SemesterLifecycleError, Semester, DrizzleSemesterRepository, Inject, Injectable

### Community 84 - "admin/page.tsx"
Cohesion: 0.19
Nodes (20): addProgram(), closeSemester(), createSemester(), deleteSemester(), editSemester(), fail(), promoteToOfficer(), removeProgram() (+12 more)

### Community 85 - "bento-grid.tsx"
Cohesion: 0.14
Nodes (17): AdminLoading(), DashboardLoading(), MyAttendanceLoading(), BentoCell(), BentoCellContent(), BentoCellDescription(), BentoCellElevation, BentoCellFooter() (+9 more)

### Community 86 - "claim-roster.use-case.ts"
Cohesion: 0.06
Nodes (37): ClaimRosterUseCase, ADR-0019, Inject, Injectable, ENROLLMENT_ROSTER_REPOSITORY, EnrollmentRosterRepository, RosterRow, ADR-0017 (+29 more)

### Community 87 - "marketing-landing.tsx"
Cohesion: 0.11
Nodes (8): ICON_TONES, IconTone, MarketingLanding(), roles, steps, Badge(), badgeVariants, class-variance-authority

### Community 88 - "ProgramRepository"
Cohesion: 0.07
Nodes (16): Inject, DuplicateProgramError, ProgramRepository, DrizzleProgramRepository, Inject, Injectable, ProgramController, Body (+8 more)

### Community 89 - "contracts/package.json"
Cohesion: 0.17
Nodes (11): devDependencies, typescript, typescript, main, name, private, scripts, typecheck (+3 more)

### Community 90 - "scan.ts"
Cohesion: 0.24
Nodes (7): capabilityFailure(), hasCapability(), BOOTH_MODES, RejectedScanLogEntry, RejectedScanLogRequest, RejectedScanLogResponse, SCAN_APPROVAL_PERMANENT_STATUSES

### Community 91 - "AdminOnlyController"
Cohesion: 0.40
Nodes (4): AdminOnlyController, Controller, UseGuards, Get

### Community 92 - "SemesterRepository"
Cohesion: 0.11
Nodes (7): Inject, Inject, Inject, Inject, Inject, Inject, SemesterRepository

### Community 93 - "Security Assessment — 2026-09-23"
Cohesion: 0.22
Nodes (8): 1. SAST, 2. STRIDE threat model, 3. Attack tree — "non-Officer gains Officer/Governor capabilities", 4. Security requirements extracted, 5. Threat → mitigation mapping (defense-in-depth), 6. SAST configuration recommendation, Bottom line, Security Assessment — 2026-09-23

### Community 95 - "pendingTab.ts"
Cohesion: 0.53
Nodes (4): LogoutCounts, logoutResolution, networkStatus, unresolvedCount()

### Community 96 - "Design Guidelines — CCS Attendance Officer Mobile"
Cohesion: 0.25
Nodes (7): Colors, Design Guidelines — CCS Attendance Officer Mobile, Do's and Don'ts, Elevation & Depth (React Native), Overview, Shapes & Radius, Typography

### Community 97 - "next.config.ts"
Cohesion: 0.40
Nodes (4): enforcedCsp, nextConfig, reportOnlyCsp, next

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
Cohesion: 0.16
Nodes (11): correctStudent(), studentsSnapshot, ADR-0013, ADR-0014, dynamic, StudentsPage(), ADR-0013, StudentCorrectionError (+3 more)

### Community 107 - "NestJS Rewrite Plan"
Cohesion: 0.20
Nodes (9): Architecture Deepening Plan, Acceptance gate, Decisions, Loose ends, NestJS Rewrite Plan, Out of scope, Outcome, Slice order (+1 more)

### Community 110 - "apiFetch"
Cohesion: 0.14
Nodes (19): markSafFeePaid(), Result, run(), voidSafFeePayment(), SafCell(), eventGrid(), markPaid(), setScanField() (+11 more)

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

### Community 125 - "Needs Review Scan Decisions are re-decidable, not just discardable"
Cohesion: 0.50
Nodes (3): Consequences, Considered Options, Needs Review Scan Decisions are re-decidable, not just discardable

## Knowledge Gaps
- **764 isolated node(s):** `name`, `version`, `private`, `build`, `start` (+759 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1044 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@nestjs/common` connect `semester-event-lifecycle.integration.test.ts` to `auth.guard.ts`, `event-lifecycle.ts`, `drizzle-attendance.repository.ts`, `semester-lifecycle.ts`, `capability.guard.ts`, `ledger.integration.test.ts`, `report.use-case.ts`, `drizzle-scan.repository.ts`, `main.ts`, `api/package.json`, `program.module.ts`, `drizzle-student.repository.ts`, `claim-roster.use-case.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `@testing-library/react` connect `@testing-library/react` to `events/actions.ts`, `app/layout.tsx`, `cn`, `clearance/page.tsx`, `dashboard-view.tsx`, `my-attendance-view.tsx`, `contracts/src/index.ts`, `clearance-view.test.tsx`, `apiFetch`, `students-view.tsx`, `web/package.json`, `students-view.test.tsx`, `admin/page.tsx`, `bento-grid.tsx`, `marketing-landing.tsx`, `app-shell.tsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `RequireCapability()` connect `RequireCapability` to `auth.guard.ts`, `event-lifecycle.ts`, `drizzle-attendance.repository.ts`, `AttendanceController`, `CallerActor`, `capability.guard.ts`, `ledger.integration.test.ts`, `semester-event-lifecycle.integration.test.ts`, `SemesterResponse`, `ReportUseCase`, `Actor`, `program.module.ts`, `drizzle-student.repository.ts`, `ProgramRepository`, `AdminOnlyController`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _764 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `events/actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08108108108108109 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.052464947987336044 - nodes in this community are weakly interconnected._
- **Should `event-lifecycle.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05063291139240506 - nodes in this community are weakly interconnected._