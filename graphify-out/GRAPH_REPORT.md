# Graph Report - csc-346  (2026-09-25)

## Corpus Check
- 464 files · ~259,284 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2533 nodes · 6024 edges · 127 communities (111 shown, 13 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 95 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1f72349d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apiFetch
- contracts/src/index.ts
- cn
- event.controller.ts
- RequireCapability
- ExpenseCategory
- semester-lifecycle.ts
- Attendance Session
- scanQueue.ts
- admin/page.tsx
- 2. Quickstart (Docker Compose)
- import-enrollment-roster.mjs
- drizzle-scan.repository.ts
- RejectionsScreen.tsx
- events-view.tsx
- web/package.json
- useTheme
- CCS Attendance Repository
- expo
- students-view.test.tsx
- department-fund.use-case.ts
- dependencies
- components.json
- EventsScreen.tsx
- auth.ts
- recentScanStatus.ts
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
- open-semester.ts
- scripts
- BoothScreen.tsx
- db/tsconfig.json
- Mobile App Icon
- mobile/tsconfig.json
- clearance-view.test.tsx
- scan-approval.use-case.ts
- db/package.json
- requireCapability
- schema.ts
- seed-students.mjs
- api/package.json
- Graphify Knowledge Graph Rule
- drizzle-student.repository.ts
- Governor Workflow
- test-integration.sh
- Rust Token Killer CLI
- eslint.config.mjs
- postcss.config.mjs
- global-error.test.tsx
- Domain Docs Architecture
- Deep Module Specifications
- Student
- get_latest_mtime
- watch-obsidian.sh script
- @nestjs/common
- Design Guidelines — CCS Attendance Web
- drizzle-attendance.repository.ts
- CreateSemesterUseCase
- sync-obsidian.sh
- domain/ledger.ts
- saf-fee.integration.test.ts
- my-attendance/actions.ts
- students-view.tsx
- 0016-enrollment-roster-precedes-student-identity.md
- report.use-case.ts
- domain/report.ts
- semester-event-lifecycle.integration.test.ts
- compilerOptions
- semester.controller.ts
- ReportController
- ledger.use-case.ts
- Semester
- apiPost
- @testing-library/react
- enrollment-roster.module.ts
- marketing-landing.tsx
- ProgramRepository
- contracts/package.json
- role.ts
- AdminOnlyController
- SemesterRepository
- Security Assessment — 2026-09-23
- @clerk/nextjs
- SettingsScreen.tsx
- Design Guidelines — CCS Attendance Officer Mobile
- next.config.ts
- contracts/tsconfig.json
- DrizzleLedgerRepository
- tsconfig.build.json
- Product
- analytics/page.tsx
- DrizzleEnrollmentRosterRepository
- admin-page.test.tsx
- finance/actions.ts
- seed-all-roster-students.mjs
- NestJS Rewrite Plan
- generate-android-icons.sh
- attendance-grid.tsx
- DrizzleExpenseRepository
- NestJS API with Clean Architecture and single-action controllers
- Any managed Postgres addressed by URL, hosted on Heroku for now
- The web app is a BFF with no database access
- Reports are computed on the API and rendered on Vercel
- Ledger is a module without a repository, and no-show materialization is a command
- queryLifecycle.test.ts
- CloseSemesterUseCase
- ListSemestersUseCase
- mobile/lib/qr.ts
- MemoryStorage
- The Department Fund is one cumulative pot, not per-Semester
- DbModule
- Needs Review Scan Decisions are re-decidable, not just discardable
- Floating top navbar replaces the collapsible sidebar app shell

## God Nodes (most connected - your core abstractions)
1. `cn()` - 97 edges
2. `@nestjs/common` - 78 edges
3. `RequireCapability()` - 57 edges
4. `Actor` - 54 edges
5. `apiPost()` - 33 edges
6. `CapabilityGuard` - 32 edges
7. `@testing-library/react` - 32 edges
8. `AuthGuard` - 31 edges
9. `DrizzleStudentRepository` - 28 edges
10. `apiFetch()` - 28 edges

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

## Communities (127 total, 13 thin omitted)

### Community 0 - "apiFetch"
Cohesion: 0.06
Nodes (40): markSafFeePaid(), Result, run(), voidSafFeePayment(), SafCell(), ClearancePage(), dynamic, mockBatchLedger (+32 more)

### Community 1 - "contracts/src/index.ts"
Cohesion: 0.15
Nodes (24): GET(), GET(), GET(), GET(), FinancialPdfDocument(), styles, PerEventPdfDocument(), styles (+16 more)

### Community 2 - "cn"
Cohesion: 0.06
Nodes (39): AppLogo(), AppLogoMark(), AppLogoMarkProps, AppLogoProps, LogoSize, SIZE_MAP, FloatingNavbar(), NavLink (+31 more)

### Community 3 - "event.controller.ts"
Cohesion: 0.05
Nodes (50): CreateEventUseCase, ADR-0017, Inject, Injectable, DeleteEventUseCase, Inject, Injectable, ListEventsUseCase (+42 more)

### Community 4 - "RequireCapability"
Cohesion: 0.11
Nodes (21): AttendanceUseCase, Injectable, AttendanceController, Body, Controller, ADR-0024, Inject, Post (+13 more)

### Community 5 - "ExpenseCategory"
Cohesion: 0.06
Nodes (28): CreateExpenseCategoryUseCase, DeleteExpenseCategoryUseCase, ListExpenseCategoriesDetailedUseCase, ListExpenseCategoriesUseCase, RenameExpenseCategoryUseCase, Inject, Injectable, DuplicateExpenseCategoryError (+20 more)

### Community 6 - "semester-lifecycle.ts"
Cohesion: 0.27
Nodes (5): DateRange, ADR-0024, validateSemesterDates(), ValidationError, DomainLifecycleError

### Community 7 - "Attendance Session"
Cohesion: 0.18
Nodes (16): Attendance Session, Clearance, Event, Governor, Ledger, Officer, Offline Scan Queue, Payment (+8 more)

### Community 8 - "scanQueue.ts"
Cohesion: 0.14
Nodes (35): addRecentScan(), blockingScanCount(), claimLegacyScans(), deliveredScans(), DeliveryState, dequeue(), discardLegacyScans(), discardScan() (+27 more)

### Community 9 - "admin/page.tsx"
Cohesion: 0.13
Nodes (24): RejectionsLoading(), dynamic, ClearanceLoading(), AttendanceLoading(), dynamic, EventsLoading(), FinanceView(), peso() (+16 more)

### Community 10 - "2. Quickstart (Docker Compose)"
Cohesion: 0.17
Nodes (12): 1. Prerequisites, 2. Quickstart (Docker Compose), 3. Building the Web Application Docker Image, 4. Port Reference Table, 5. Helper Commands Summary, Apply Drizzle migrations & seed, Local Development & Testing with Docker, Run the Web App locally (+4 more)

### Community 11 - "import-enrollment-roster.mjs"
Cohesion: 0.21
Nodes (11): decodeXml(), gboxEmails, isGbox(), PROGRAMS, roster, rows, sharedStrings, [source] (+3 more)

### Community 12 - "drizzle-scan.repository.ts"
Cohesion: 0.18
Nodes (17): Transaction, ADR-0017, ScanResult, StudentQuery, Transaction, Inject, DB, db (+9 more)

### Community 13 - "RejectionsScreen.tsx"
Cohesion: 0.16
Nodes (17): colorOf(), COLORS, initialsOf(), fetchRejectedScans(), RejectedScanRow, RejectionReason, apiFetch, useRejectedScans() (+9 more)

### Community 14 - "events-view.tsx"
Cohesion: 0.13
Nodes (22): EventRow, ADR-0007, initialState, ConfirmSubmitButton(), ConfirmSubmitButtonProps, DecorativeAccents(), ModeToggle(), AlertDialog() (+14 more)

### Community 15 - "web/package.json"
Cohesion: 0.07
Nodes (27): @attendance/contracts, react, @tanstack/query-async-storage-persister, @tanstack/react-query, @tanstack/react-query-persist-client, @types/node, @types/react, typescript (+19 more)

### Community 16 - "useTheme"
Cohesion: 0.08
Nodes (35): AuthenticatedApp(), FontGate(), AppLogo(), AppLogoMark(), AppLogoMarkProps, AppLogoProps, LogoSize, makeStyles() (+27 more)

### Community 17 - "CCS Attendance Repository"
Cohesion: 0.18
Nodes (17): Agent Guidelines and Repo Conventions, CCS Attendance System Domain Model, Mobile Web Platform Split, TanStack Query and Zustand State Management, GitHub Issue Tracker Workflow, Issue Triage Labels, Database Architecture Drizzle Postgres, Mobile Architecture Expo (+9 more)

### Community 18 - "expo"
Cohesion: 0.08
Nodes (23): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled (+15 more)

### Community 19 - "students-view.test.tsx"
Cohesion: 0.14
Nodes (13): studentsSnapshot, dynamic, StudentsPage(), ADR-0013, downloadQrCards(), StudentsView(), changeId(), { correctStudentMock, snapshotMock } (+5 more)

### Community 20 - "department-fund.use-case.ts"
Cohesion: 0.09
Nodes (19): DepartmentFundUseCase, ADR-0021, ADR-0025, Inject, Injectable, computeDepartmentFund(), DepartmentFundInput, ADR-0021 (+11 more)

### Community 21 - "dependencies"
Cohesion: 0.06
Nodes (33): dependencies, @clerk/clerk-expo, expo, expo-auth-session, expo-camera, expo-crypto, expo-font, @expo-google-fonts/dm-sans (+25 more)

### Community 22 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 23 - "EventsScreen.tsx"
Cohesion: 0.13
Nodes (25): createEvent(), deleteEvent(), EventInput, EventRow, eventsKey, EventType, fetchEvents(), apiFetch (+17 more)

### Community 24 - "auth.ts"
Cohesion: 0.08
Nodes (34): AppShell(), NAV_ITEMS, navForRole(), ADR-0013, AppLayout(), NavProgressBar(), mockSearchParams, getCurrentStudent (+26 more)

### Community 25 - "recentScanStatus.ts"
Cohesion: 0.42
Nodes (7): isAlreadyScanned(), isNeedsReviewActionable(), recentScanOutcomeLabel(), ScanOutcome, scan, RecentScan, RecentScanRow()

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
Cohesion: 0.18
Nodes (12): LinkingLike, matchesRedirectScheme(), UrlHandler, watchForRedirectUrl(), hardShadow(), LoginScreen(), signIn(), makeStyles() (+4 more)

### Community 32 - "api-client.ts"
Cohesion: 0.09
Nodes (31): ADR-0013, ADR-0014, claimEnrollmentRoster(), OnboardingState, BlockedEmail(), OnboardingForm(), dynamic, OnboardingPage() (+23 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.16
Nodes (8): dmSans, geistMono, metadata, spaceGrotesk, ThemeProvider(), TooltipContent(), TooltipProvider(), next-themes

### Community 34 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, eslint, eslint-config-next, jsdom, tailwindcss, @tailwindcss/postcss, @testing-library/dom, @testing-library/jest-dom (+7 more)

### Community 35 - "tasks"
Cohesion: 0.15
Nodes (12): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+4 more)

### Community 36 - "App.tsx"
Cohesion: 0.06
Nodes (40): App(), AppShell(), MobileAdmission, navTheme(), styles, Tab, TAB_ICONS, ADR-0012 (+32 more)

### Community 37 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowImportingTsExtensions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, module, moduleResolution, noEmit (+4 more)

### Community 38 - "Test-Driven Development Loop"
Cohesion: 0.16
Nodes (14): Code Review Agent Interface, Fowler Code Smell Baseline, Spec Review Axis, Standards Review Axis, Two-Axis Code Review, Implement Agent Interface, Implementation Workflow, TDD Agent Interface (+6 more)

### Community 39 - "open-semester.ts"
Cohesion: 0.26
Nodes (9): apiFetchWithToken(), getOpenSemester(), getOpenSemesterCached, OPEN_SEMESTER_CACHE_TAG, openSemesterQueryKey, ADR-0013, { apiFetch }, unstable_cache (+1 more)

### Community 40 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test, typecheck

### Community 41 - "BoothScreen.tsx"
Cohesion: 0.09
Nodes (31): BoothApp(), API_BASE_URL, ApiError, apiFetch(), endOfficerSession(), rememberedOfficerIdentity(), rememberOfficerIdentity(), asyncStorageBacking (+23 more)

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
Cohesion: 0.22
Nodes (5): ClearanceItem, { markSafFeePaid, voidSafFeePayment }, mockResults, mockSemester, SafLine

### Community 46 - "scan-approval.use-case.ts"
Cohesion: 0.10
Nodes (20): ScanApprovalUseCase, Inject, Injectable, ScanError, decodeQrPayload(), modeToHalfAndField(), QrPayload, qrRejectionReason() (+12 more)

### Community 47 - "db/package.json"
Cohesion: 0.07
Nodes (28): dependencies, drizzle-orm, postgres, devDependencies, drizzle-kit, typescript, vitest, drizzle-orm (+20 more)

### Community 48 - "requireCapability"
Cohesion: 0.18
Nodes (17): buildQrPayload(), QrSubject, maxDuration, POST(), GET(), GET(), chunk(), QrCardPdfDocument() (+9 more)

### Community 49 - "schema.ts"
Cohesion: 0.11
Nodes (19): db, rosterRepository, studentRepository, ADR-0019, useCaseWithProfile(), createDb(), CreateDbOptions, boothModeEnum (+11 more)

### Community 50 - "seed-students.mjs"
Cohesion: 0.50
Nodes (3): ADR-0012, sql, TEST_STUDENTS

### Community 51 - "api/package.json"
Cohesion: 0.04
Nodes (44): dependencies, @attendance/contracts, @attendance/db, @clerk/backend, drizzle-orm, @nestjs/common, @nestjs/core, @nestjs/platform-express (+36 more)

### Community 52 - "Graphify Knowledge Graph Rule"
Cohesion: 0.67
Nodes (3): Graphify Knowledge Graph Rule, Graphify Query and Inspection Tools, Graphify Workflow

### Community 53 - "drizzle-student.repository.ts"
Cohesion: 0.05
Nodes (54): CorrectStudentUseCase, ADR-0014, ADR-0019, Injectable, GetCallerIdentityUseCase, ADR-0017, Inject, Injectable (+46 more)

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

### Community 66 - "@nestjs/common"
Cohesion: 0.06
Nodes (54): AttendanceModule, Module, EventModule, Module, FinanceModule, Module, LedgerModule, Module (+46 more)

### Community 67 - "Design Guidelines — CCS Attendance Web"
Cohesion: 0.08
Nodes (25): Bento Cards & Cells, Bento Grid Architecture (Dashboards, Tables & Data Views), Buttons, Canvas & Base Surfaces, Colors, Components, Decorative Handcrafted Layer, Design Guidelines — CCS Attendance Web (+17 more)

### Community 68 - "drizzle-attendance.repository.ts"
Cohesion: 0.12
Nodes (13): Inject, AttendanceHalf, currentCampusDate(), isAbsent(), owedHalves(), DrizzleAttendanceRepository, Transaction, Inject (+5 more)

### Community 69 - "CreateSemesterUseCase"
Cohesion: 0.12
Nodes (10): CreateSemesterUseCase, Inject, Injectable, DeleteSemesterUseCase, Inject, Injectable, GetOpenSemesterUseCase, Inject (+2 more)

### Community 71 - "domain/ledger.ts"
Cohesion: 0.09
Nodes (32): absent(), buildCollectedByEvent(), buildContext(), buildEventSessionCounts(), buildEventStats(), compareEvents(), computeEventGrid(), computeLedger() (+24 more)

### Community 72 - "saf-fee.integration.test.ts"
Cohesion: 0.11
Nodes (16): AppModule, Module, bootstrap(), DevErrorLoggerFilter, ADR-0017, LEDGER_REPOSITORY, db, createTestApp() (+8 more)

### Community 73 - "my-attendance/actions.ts"
Cohesion: 0.11
Nodes (15): myAttendanceSnapshot, ADR-0013, MyAttendanceViewProps, mockSnapshotCleared, mockSnapshotNoOpenSemester, mockSnapshotWithDebt, mockStudent, { snapshotMock } (+7 more)

### Community 74 - "students-view.tsx"
Cohesion: 0.10
Nodes (32): Event, ReportsClientProps, Semester, Student, ADR-0013, ClearanceView(), AttendanceStatus, MyAttendanceView() (+24 more)

### Community 76 - "report.use-case.ts"
Cohesion: 0.15
Nodes (10): Inject, FinancialReportInput, PerSemesterReportInput, PerStudentReportInput, REPORT_REPOSITORY, ReportRepository, asOfTimestamp(), DrizzleReportRepository (+2 more)

### Community 77 - "domain/report.ts"
Cohesion: 0.09
Nodes (34): attendedHalvesForStudentEvent(), computeFinancialReport(), computePerEventReport(), computePerSemesterReport(), deriveHalfStatus(), eventHalfPenalty(), EventType, financialEventBreakdown() (+26 more)

### Community 78 - "semester-event-lifecycle.integration.test.ts"
Cohesion: 0.11
Nodes (7): Inject, Injectable, UpdateSemesterDatesUseCase, db, ADR-0007, ADR-0017, ADR-0024

### Community 79 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+12 more)

### Community 80 - "semester.controller.ts"
Cohesion: 0.18
Nodes (17): SemesterController, Body, Controller, ADR-0017, Post, UseGuards, presentSemester(), runLifecycle() (+9 more)

### Community 81 - "ReportController"
Cohesion: 0.16
Nodes (8): computePerStudentReport(), ReportController, Body, Controller, Inject, Post, Throttle, UseGuards

### Community 82 - "ledger.use-case.ts"
Cohesion: 0.13
Nodes (16): EMPTY_STANDING, LedgerUseCase, toResponse(), Injectable, LedgerController, Body, Controller, Inject (+8 more)

### Community 83 - "Semester"
Cohesion: 0.21
Nodes (6): SemesterInput, SemesterLifecycleError, Semester, DrizzleSemesterRepository, Inject, Injectable

### Community 84 - "apiPost"
Cohesion: 0.24
Nodes (19): addExpenseCategory(), addProgram(), closeSemester(), createSemester(), deleteSemester(), editSemester(), fail(), promoteToOfficer() (+11 more)

### Community 85 - "@testing-library/react"
Cohesion: 0.09
Nodes (23): AdminLoading(), AnalyticsLoading(), DashboardLoading(), AppError(), FinanceLoading(), MyAttendanceLoading(), StudentsLoading(), OnboardingLoading() (+15 more)

### Community 86 - "enrollment-roster.module.ts"
Cohesion: 0.05
Nodes (40): ClaimRosterUseCase, ADR-0019, Inject, Injectable, ENROLLMENT_ROSTER_REPOSITORY, EnrollmentRosterRepository, ADR-0017, IDENTITY_PROFILE_PROVIDER (+32 more)

### Community 87 - "marketing-landing.tsx"
Cohesion: 0.11
Nodes (8): ICON_TONES, IconTone, MarketingLanding(), roles, steps, Badge(), badgeVariants, class-variance-authority

### Community 88 - "ProgramRepository"
Cohesion: 0.06
Nodes (18): Inject, DuplicateProgramError, ProgramInUseError, ProgramRepository, DrizzleProgramRepository, Inject, Injectable, ProgramController (+10 more)

### Community 89 - "contracts/package.json"
Cohesion: 0.17
Nodes (11): devDependencies, typescript, typescript, main, name, private, scripts, typecheck (+3 more)

### Community 90 - "role.ts"
Cohesion: 0.29
Nodes (6): CapabilityDenial, capabilityFailure(), hasCapability(), ROLE_CAPABILITIES, ADR-0017, ADR-0019

### Community 91 - "AdminOnlyController"
Cohesion: 0.40
Nodes (4): AdminOnlyController, Controller, UseGuards, Get

### Community 92 - "SemesterRepository"
Cohesion: 0.23
Nodes (5): ADR-0017, validateSemesterInput(), SEMESTER_REPOSITORY, SemesterRepository, ADR-0024

### Community 93 - "Security Assessment — 2026-09-23"
Cohesion: 0.22
Nodes (8): 1. SAST, 2. STRIDE threat model, 3. Attack tree — "non-Officer gains Officer/Governor capabilities", 4. Security requirements extracted, 5. Threat → mitigation mapping (defense-in-depth), 6. SAST configuration recommendation, Bottom line, Security Assessment — 2026-09-23

### Community 95 - "SettingsScreen.tsx"
Cohesion: 0.17
Nodes (11): LogoutCounts, logoutResolution, networkStatus, unresolvedCount(), hardShadow(), makeStyles(), Me, SettingsScreen() (+3 more)

### Community 96 - "Design Guidelines — CCS Attendance Officer Mobile"
Cohesion: 0.25
Nodes (7): Colors, Design Guidelines — CCS Attendance Officer Mobile, Do's and Don'ts, Elevation & Depth (React Native), Overview, Shapes & Radius, Typography

### Community 97 - "next.config.ts"
Cohesion: 0.40
Nodes (4): enforcedCsp, nextConfig, reportOnlyCsp, next

### Community 98 - "contracts/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, noEmit, outDir, extends, include, ../../tsconfig.base.json

### Community 99 - "DrizzleLedgerRepository"
Cohesion: 0.15
Nodes (6): Inject, LedgerInput, LedgerRepository, DrizzleLedgerRepository, Inject, Injectable

### Community 100 - "tsconfig.build.json"
Cohesion: 0.33
Nodes (5): compilerOptions, noEmit, exclude, extends, ./tsconfig.json

### Community 101 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 102 - "analytics/page.tsx"
Cohesion: 0.20
Nodes (9): currentCampusDate(), currentCampusDate(), isEventPastInManila(), AnalyticsPage(), dynamic, Role, ADR-0019, StudentListResponse (+1 more)

### Community 103 - "DrizzleEnrollmentRosterRepository"
Cohesion: 0.33
Nodes (4): RosterRow, DrizzleEnrollmentRosterRepository, Inject, Injectable

### Community 104 - "admin-page.test.tsx"
Cohesion: 0.29
Nodes (5): mockCategories, mockPrograms, mockSemesters, mockStudents, { requireGovernorMock, apiPostMock }

### Community 105 - "finance/actions.ts"
Cohesion: 0.38
Nodes (5): financeSummary(), ADR-0013, dynamic, FinancePage(), ADR-0013

### Community 107 - "NestJS Rewrite Plan"
Cohesion: 0.20
Nodes (9): Architecture Deepening Plan, Acceptance gate, Decisions, Loose ends, NestJS Rewrite Plan, Out of scope, Outcome, Slice order (+1 more)

### Community 110 - "attendance-grid.tsx"
Cohesion: 0.09
Nodes (25): ReportsClient(), mockEvents, mockSemesters, mockStudents, eventGrid(), markPaid(), setScanField(), ADR-0013 (+17 more)

### Community 111 - "DrizzleExpenseRepository"
Cohesion: 0.40
Nodes (3): DrizzleExpenseRepository, Inject, Injectable

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

### Community 118 - "CloseSemesterUseCase"
Cohesion: 0.40
Nodes (3): CloseSemesterUseCase, Inject, Injectable

### Community 119 - "ListSemestersUseCase"
Cohesion: 0.40
Nodes (3): ListSemestersUseCase, Inject, Injectable

### Community 120 - "mobile/lib/qr.ts"
Cohesion: 0.70
Nodes (3): isReadableQrPayload(), parseQrPayload(), QrStudent

### Community 121 - "MemoryStorage"
Cohesion: 0.15
Nodes (4): queryDefaults, QueryProvider(), MemoryStorage, ADR-0013

### Community 122 - "The Department Fund is one cumulative pot, not per-Semester"
Cohesion: 0.50
Nodes (3): Consequences, Considered Options, The Department Fund is one cumulative pot, not per-Semester

### Community 123 - "DbModule"
Cohesion: 0.67
Nodes (3): DbModule, Module, Global

### Community 125 - "Needs Review Scan Decisions are re-decidable, not just discardable"
Cohesion: 0.50
Nodes (3): Consequences, Considered Options, Needs Review Scan Decisions are re-decidable, not just discardable

## Knowledge Gaps
- **781 isolated node(s):** `name`, `version`, `private`, `build`, `start` (+776 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1088 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@nestjs/common` connect `@nestjs/common` to `event.controller.ts`, `drizzle-attendance.repository.ts`, `RequireCapability`, `ExpenseCategory`, `semester-lifecycle.ts`, `saf-fee.integration.test.ts`, `drizzle-scan.repository.ts`, `report.use-case.ts`, `scan-approval.use-case.ts`, `semester-event-lifecycle.integration.test.ts`, `semester.controller.ts`, `ledger.use-case.ts`, `api/package.json`, `department-fund.use-case.ts`, `drizzle-student.repository.ts`, `enrollment-roster.module.ts`, `SemesterRepository`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `RequireCapability()` connect `RequireCapability` to `@nestjs/common`, `event.controller.ts`, `ExpenseCategory`, `semester.controller.ts`, `ReportController`, `ledger.use-case.ts`, `department-fund.use-case.ts`, `drizzle-student.repository.ts`, `ProgramRepository`, `AdminOnlyController`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `@testing-library/react` connect `@testing-library/react` to `apiFetch`, `cn`, `admin-page.test.tsx`, `admin/page.tsx`, `my-attendance/actions.ts`, `clearance-view.test.tsx`, `attendance-grid.tsx`, `events-view.tsx`, `web/package.json`, `students-view.test.tsx`, `marketing-landing.tsx`, `auth.ts`, `MemoryStorage`, `global-error.test.tsx`, `dashboard/actions.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _781 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apiFetch` be split into smaller, more focused modules?**
  _Cohesion score 0.06289308176100629 - nodes in this community are weakly interconnected._
- **Should `contracts/src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14603174603174604 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.06453634085213032 - nodes in this community are weakly interconnected._