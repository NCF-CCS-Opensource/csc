# Graph Report - csc  (2026-09-21)

## Corpus Check
- 368 files · ~220,353 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2189 nodes · 5015 edges · 117 communities (100 shown, 14 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 80 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `62ad251f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- events/actions.ts
- contracts/src/index.ts
- cn
- event.controller.ts
- auth.ts
- CallerActor
- semester.module.ts
- Attendance Session
- scanQueue.ts
- my-attendance-view.tsx
- 2. Quickstart (Docker Compose)
- import-enrollment-roster.mjs
- drizzle-scan.repository.ts
- SettingsScreen.tsx
- students-view.tsx
- web/package.json
- useTheme
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
- dashboard-view.tsx
- compilerOptions
- scripts
- dashboard/actions.ts
- LoginScreen.tsx
- ApiError
- app/layout.tsx
- devDependencies
- tasks
- App.tsx
- compilerOptions
- Test-Driven Development Loop
- (app)/layout.tsx
- scripts
- Actor
- db/tsconfig.json
- Mobile App Icon
- mobile/tsconfig.json
- RequireCapability
- DrizzleScanRepository
- db/package.json
- clearance/page.tsx
- app.module.ts
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
- @nestjs/common
- Design Guidelines — CCS Attendance Web
- drizzle-attendance.repository.ts
- api-client.ts
- sync-obsidian.sh
- domain/ledger.ts
- role.ts
- apiFetch
- attendance-grid.tsx
- 0016-enrollment-roster-precedes-student-identity.md
- report.use-case.ts
- domain/report.ts
- semester-event-lifecycle.integration.test.ts
- compilerOptions
- semester.controller.ts
- ReportUseCase
- LedgerController
- DrizzleSemesterRepository
- admin/page.tsx
- bento-grid.tsx
- claim-roster.use-case.ts
- marketing-landing.tsx
- program.module.ts
- contracts/package.json
- enrollment-roster.module.ts
- AdminOnlyController
- CreateSemesterUseCase
- queryClient.tsx
- @clerk/nextjs
- semester-lifecycle.ts
- Design Guidelines — CCS Attendance Officer Mobile
- CloseSemesterUseCase
- contracts/tsconfig.json
- GetOpenSemesterUseCase
- tsconfig.build.json
- Product
- ListSemestersUseCase
- students/actions.ts
- UpdateSemesterDatesUseCase
- SemesterModule
- seed-all-roster-students.mjs
- NestJS Rewrite Plan
- generate-android-icons.sh
- NestJS API with Clean Architecture and single-action controllers
- Any managed Postgres addressed by URL, hosted on Heroku for now
- The web app is a BFF with no database access
- Reports are computed on the API and rendered on Vercel
- Ledger is a module without a repository, and no-show materialization is a command
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
- `ClearanceViewProps` --references--> `SemesterResponse`  [EXTRACTED]
  apps/web/app/(app)/clearance/clearance-view.tsx → packages/contracts/src/semester.ts
- `CCS Attendance Repository` --references--> `CCS Web Application`  [INFERRED]
  README.md → apps/web/README.md
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
- **Android Adaptive Icon Asset Suite** — apps_mobile_assets_android_icon_background_android_icon_background, apps_mobile_assets_android_icon_foreground_android_icon_foreground, apps_mobile_assets_android_icon_monochrome_android_icon_monochrome [INFERRED 0.95]

## Communities (117 total, 14 thin omitted)

### Community 0 - "events/actions.ts"
Cohesion: 0.10
Nodes (22): createEvent(), deleteEvent(), eventsSnapshot, fail(), parseEventForm(), runOrReportError(), { apiFetch, MockApiError }, redirect (+14 more)

### Community 1 - "contracts/src/index.ts"
Cohesion: 0.17
Nodes (22): GET(), GET(), GET(), GET(), FinancialPdfDocument(), styles, PerEventPdfDocument(), styles (+14 more)

### Community 2 - "cn"
Cohesion: 0.06
Nodes (35): AlertDialogMedia(), AlertDialogOverlay(), Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+27 more)

### Community 3 - "event.controller.ts"
Cohesion: 0.05
Nodes (50): CreateEventUseCase, ADR-0017, Inject, Injectable, DeleteEventUseCase, Inject, Injectable, ListEventsUseCase (+42 more)

### Community 4 - "auth.ts"
Cohesion: 0.17
Nodes (17): hasStudentRecord(), Identity, ADR-0012, ADR-0019, Capability, capabilityFailure(), dashboardDestination(), DESTINATIONS (+9 more)

### Community 5 - "CallerActor"
Cohesion: 0.30
Nodes (7): ScanController, Body, Controller, Inject, Post, UseGuards, CallerActor

### Community 6 - "semester.module.ts"
Cohesion: 0.29
Nodes (5): ADR-0017, DateRange, SEMESTER_REPOSITORY, SemesterRepository, Semester

### Community 7 - "Attendance Session"
Cohesion: 0.18
Nodes (16): Attendance Session, Clearance, Event, Governor, Ledger, Officer, Offline Scan Queue, Payment (+8 more)

### Community 8 - "scanQueue.ts"
Cohesion: 0.10
Nodes (44): BoothApp(), ApiError, addRecentScan(), blockingScanCount(), claimLegacyScans(), deliveredScans(), DeliveryState, dequeue() (+36 more)

### Community 9 - "my-attendance-view.tsx"
Cohesion: 0.17
Nodes (17): Event, ReportsClientProps, Semester, Student, ADR-0013, AttendanceStatus, myAttendanceQueryKey, ADR-0013 (+9 more)

### Community 10 - "2. Quickstart (Docker Compose)"
Cohesion: 0.17
Nodes (12): 1. Prerequisites, 2. Quickstart (Docker Compose), 3. Building the Web Application Docker Image, 4. Port Reference Table, 5. Helper Commands Summary, Apply Drizzle migrations & seed, Local Development & Testing with Docker, Run the Web App locally (+4 more)

### Community 11 - "import-enrollment-roster.mjs"
Cohesion: 0.21
Nodes (11): decodeXml(), gboxEmails, isGbox(), PROGRAMS, roster, rows, sharedStrings, [source] (+3 more)

### Community 12 - "drizzle-scan.repository.ts"
Cohesion: 0.09
Nodes (43): Transaction, ADR-0017, LedgerUseCase, Injectable, LEDGER_REPOSITORY, ScanResult, StudentQuery, Transaction (+35 more)

### Community 13 - "SettingsScreen.tsx"
Cohesion: 0.10
Nodes (25): colorOf(), COLORS, initialsOf(), LogoutCounts, logoutResolution, networkStatus, unresolvedCount(), fetchRejectedScans() (+17 more)

### Community 14 - "students-view.tsx"
Cohesion: 0.10
Nodes (32): EventRow, ADR-0007, eventsQueryKey, ADR-0013, correctStudent(), studentsQueryKey, ADR-0013, downloadQrCards() (+24 more)

### Community 15 - "web/package.json"
Cohesion: 0.07
Nodes (26): @attendance/contracts, react, @tanstack/react-query, @types/node, @types/react, typescript, vitest, name (+18 more)

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
Cohesion: 0.25
Nodes (7): changeId(), { correctStudentMock, snapshotMock }, openCorrection(), openDialogByChangingId(), renderStudents(), save(), snapshot

### Community 20 - "scan.controller.ts"
Cohesion: 0.18
Nodes (9): ScanApprovalUseCase, Inject, Injectable, BOOTH_MODES, RejectedScanLogEntry, RejectedScanLogRequest, RejectedScanLogResponse, SCAN_APPROVAL_PERMANENT_STATUSES (+1 more)

### Community 21 - "dependencies"
Cohesion: 0.06
Nodes (33): dependencies, @clerk/clerk-expo, expo, expo-auth-session, expo-camera, expo-crypto, expo-font, @expo-google-fonts/dm-sans (+25 more)

### Community 22 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 23 - "EventsScreen.tsx"
Cohesion: 0.15
Nodes (18): apiFetch(), EventRow, EventType, fetchMyEvents(), myEventsKey, useMyEvents(), DeleteEventModal(), confirmDelete() (+10 more)

### Community 24 - "web/lib/qr.ts"
Cohesion: 0.16
Nodes (19): buildQrPayload(), QrSubject, GET(), maxDuration, POST(), GET(), GET(), chunk() (+11 more)

### Community 25 - "BoothScreen.tsx"
Cohesion: 0.12
Nodes (22): isReadableQrPayload(), parseQrPayload(), QrStudent, isAlreadyScanned(), isNeedsReviewActionable(), recentScanOutcomeLabel(), ScanOutcome, scan (+14 more)

### Community 26 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @attendance/contracts, class-variance-authority, @clerk/nextjs, clsx, @google/generative-ai, lucide-react, next (+11 more)

### Community 27 - "dashboard-view.tsx"
Cohesion: 0.08
Nodes (34): dynamic, ClearanceViewProps, ActiveSessionHeroCell(), AllSemesterEventsCell(), EventItem, getEventRowBadgeVariant(), getEventStatusBadgeVariant(), getEventStatusLabel() (+26 more)

### Community 28 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 29 - "scripts"
Cohesion: 0.06
Nodes (30): devDependencies, turbo, typescript, engines, node, typescript, name, packageManager (+22 more)

### Community 30 - "dashboard/actions.ts"
Cohesion: 0.20
Nodes (10): dashboardSnapshot, findOpenSemester(), RecentScanItem, ADR-0013, DashboardView(), mockSnapshot, { snapshotMock }, DashboardPage() (+2 more)

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

### Community 36 - "App.tsx"
Cohesion: 0.06
Nodes (42): App(), AppShell(), MobileAdmission, navTheme(), styles, Tab, TAB_ICONS, ADR-0012 (+34 more)

### Community 37 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowImportingTsExtensions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, module, moduleResolution, noEmit (+4 more)

### Community 38 - "Test-Driven Development Loop"
Cohesion: 0.16
Nodes (14): Code Review Agent Interface, Fowler Code Smell Baseline, Spec Review Axis, Standards Review Axis, Two-Axis Code Review, Implement Agent Interface, Implementation Workflow, TDD Agent Interface (+6 more)

### Community 39 - "(app)/layout.tsx"
Cohesion: 0.19
Nodes (12): AppLayout(), Identity, NAV_ITEMS, navForRole(), readCachedIdentity(), FloatingNavbar(), NavLink, ModeToggle() (+4 more)

### Community 40 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test, typecheck

### Community 42 - "db/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json

### Community 43 - "Mobile App Icon"
Cohesion: 0.40
Nodes (6): Android Adaptive Icon Background, Android Adaptive Icon Foreground, Android Adaptive Icon Monochrome, Mobile Web Favicon, Mobile App Icon, Mobile Splash Icon

### Community 44 - "mobile/tsconfig.json"
Cohesion: 0.40
Nodes (4): compilerOptions, strict, extends, expo/tsconfig.base

### Community 45 - "RequireCapability"
Cohesion: 0.23
Nodes (6): Body, Post, Body, Post, RequireCapability(), Param

### Community 46 - "DrizzleScanRepository"
Cohesion: 0.18
Nodes (11): ScanError, decodeQrPayload(), modeToHalfAndField(), QrPayload, qrRejectionReason(), RejectionReason, DrizzleScanRepository, Inject (+3 more)

### Community 47 - "db/package.json"
Cohesion: 0.07
Nodes (28): dependencies, drizzle-orm, postgres, devDependencies, drizzle-kit, typescript, vitest, drizzle-orm (+20 more)

### Community 48 - "clearance/page.tsx"
Cohesion: 0.11
Nodes (12): ClearanceItem, ClearanceView(), mockResults, mockSemester, ClearancePage(), dynamic, findOpenSemester(), Role (+4 more)

### Community 49 - "app.module.ts"
Cohesion: 0.08
Nodes (25): AppModule, Module, bootstrap(), DevErrorLoggerFilter, ADR-0017, AttendanceModule, Module, EnrollmentRosterModule (+17 more)

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
Cohesion: 0.09
Nodes (16): DuplicateStudentIdError, InvalidProgramError, InvalidStudentIdError, StudentNotFoundError, ADR-0014, StudentCorrection, DrizzleStudentRepository, Inject (+8 more)

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
Cohesion: 0.09
Nodes (42): CorrectStudentUseCase, ADR-0014, ADR-0019, Inject, Injectable, GetCallerIdentityUseCase, ADR-0017, Inject (+34 more)

### Community 67 - "Design Guidelines — CCS Attendance Web"
Cohesion: 0.08
Nodes (25): Bento Cards & Cells, Bento Grid Architecture (Dashboards, Tables & Data Views), Buttons, Canvas & Base Surfaces, Colors, Components, Decorative Handcrafted Layer, Design Guidelines — CCS Attendance Web (+17 more)

### Community 68 - "drizzle-attendance.repository.ts"
Cohesion: 0.09
Nodes (20): AttendanceUseCase, Inject, Injectable, AttendanceHalf, currentCampusDate(), isAbsent(), owedHalves(), DrizzleAttendanceRepository (+12 more)

### Community 69 - "api-client.ts"
Cohesion: 0.22
Nodes (6): API_BASE_URL, ErrorBody, ADR-0019, apiFetch, auth, identity

### Community 71 - "domain/ledger.ts"
Cohesion: 0.06
Nodes (35): Inject, absent(), buildCollectedByEvent(), buildContext(), buildEventSessionCounts(), buildEventStats(), compareEvents(), computeEventGrid() (+27 more)

### Community 72 - "role.ts"
Cohesion: 0.22
Nodes (8): NewStudent, CapabilityDenial, capabilityFailure(), hasCapability(), Role, ROLE_CAPABILITIES, ADR-0017, ADR-0019

### Community 73 - "apiFetch"
Cohesion: 0.15
Nodes (14): findOpenSemester(), myAttendanceSnapshot, ADR-0013, MyAttendanceView(), MyAttendanceViewProps, mockSnapshotCleared, mockSnapshotNoOpenSemester, mockSnapshotWithDebt (+6 more)

### Community 74 - "attendance-grid.tsx"
Cohesion: 0.08
Nodes (27): ReportsClient(), mockEvents, mockSemesters, mockStudents, eventGrid(), markPaid(), setScanField(), ADR-0013 (+19 more)

### Community 76 - "report.use-case.ts"
Cohesion: 0.15
Nodes (10): FinancialReportInput, PerEventReportInput, PerSemesterReportInput, PerStudentReportInput, REPORT_REPOSITORY, ReportRepository, asOfTimestamp(), DrizzleReportRepository (+2 more)

### Community 77 - "domain/report.ts"
Cohesion: 0.10
Nodes (31): attendedHalvesForStudentEvent(), computeFinancialReport(), computePerEventReport(), computePerSemesterReport(), computePerStudentReport(), deriveHalfStatus(), eventHalfPenalty(), EventType (+23 more)

### Community 78 - "semester-event-lifecycle.integration.test.ts"
Cohesion: 0.15
Nodes (3): db, ADR-0007, ADR-0017

### Community 79 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+12 more)

### Community 80 - "semester.controller.ts"
Cohesion: 0.20
Nodes (15): SemesterController, Body, Controller, ADR-0017, Post, UseGuards, presentSemester(), runLifecycle() (+7 more)

### Community 81 - "ReportUseCase"
Cohesion: 0.17
Nodes (9): ReportUseCase, Inject, Injectable, ReportController, Body, Controller, Inject, Post (+1 more)

### Community 82 - "LedgerController"
Cohesion: 0.14
Nodes (11): LedgerController, Body, Controller, Inject, Post, UseGuards, LedgerSession, PaymentHistoryEntry (+3 more)

### Community 83 - "DrizzleSemesterRepository"
Cohesion: 0.21
Nodes (4): SemesterLifecycleError, DrizzleSemesterRepository, Inject, Injectable

### Community 84 - "admin/page.tsx"
Cohesion: 0.30
Nodes (16): addProgram(), closeSemester(), createSemester(), deleteSemester(), editSemester(), fail(), promoteToOfficer(), removeProgram() (+8 more)

### Community 85 - "bento-grid.tsx"
Cohesion: 0.19
Nodes (14): BentoCell(), BentoCellContent(), BentoCellDescription(), BentoCellElevation, BentoCellFooter(), BentoCellHeader(), BentoCellOverline(), BentoCellProps (+6 more)

### Community 86 - "claim-roster.use-case.ts"
Cohesion: 0.05
Nodes (39): ClaimRosterUseCase, ADR-0019, Inject, Injectable, ENROLLMENT_ROSTER_REPOSITORY, EnrollmentRosterRepository, RosterRow, ADR-0017 (+31 more)

### Community 87 - "marketing-landing.tsx"
Cohesion: 0.08
Nodes (12): ICON_TONES, IconTone, MarketingLanding(), roles, steps, AppLogo(), AppLogoMark(), AppLogoMarkProps (+4 more)

### Community 88 - "program.module.ts"
Cohesion: 0.07
Nodes (28): CreateProgramUseCase, DeleteProgramUseCase, ListProgramsDetailedUseCase, ListProgramsUseCase, ADR-0014, ADR-0019, Inject, Injectable (+20 more)

### Community 89 - "contracts/package.json"
Cohesion: 0.17
Nodes (11): devDependencies, typescript, typescript, main, name, private, scripts, typecheck (+3 more)

### Community 90 - "enrollment-roster.module.ts"
Cohesion: 0.15
Nodes (11): TokenVerifier, VerifiedToken, ClerkTokenVerifier, ADR-0019, Injectable, Inject, extractBearerToken(), TokenAuthGuard (+3 more)

### Community 91 - "AdminOnlyController"
Cohesion: 0.40
Nodes (4): AdminOnlyController, Controller, UseGuards, Get

### Community 92 - "CreateSemesterUseCase"
Cohesion: 0.18
Nodes (7): CreateSemesterUseCase, Inject, Injectable, DeleteSemesterUseCase, Inject, Injectable, Inject

### Community 93 - "queryClient.tsx"
Cohesion: 0.22
Nodes (9): apiFetch, boothQueryDefaults, BoothQueryProvider(), cacheMaxAgeMs, persister, queryClient, @react-native-async-storage/async-storage, @tanstack/query-async-storage-persister (+1 more)

### Community 95 - "semester-lifecycle.ts"
Cohesion: 0.31
Nodes (3): validateSemesterDates(), ValidationError, DomainLifecycleError

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

### Community 102 - "ListSemestersUseCase"
Cohesion: 0.40
Nodes (3): ListSemestersUseCase, Inject, Injectable

### Community 103 - "students/actions.ts"
Cohesion: 0.17
Nodes (11): studentsSnapshot, ADR-0013, ADR-0014, dynamic, StudentsPage(), ADR-0013, ValidationError, StudentCorrectionError (+3 more)

### Community 104 - "UpdateSemesterDatesUseCase"
Cohesion: 0.40
Nodes (3): Inject, Injectable, UpdateSemesterDatesUseCase

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

## Knowledge Gaps
- **705 isolated node(s):** `name`, `version`, `private`, `build`, `start` (+700 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 960 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@nestjs/common` connect `@nestjs/common` to `event.controller.ts`, `drizzle-attendance.repository.ts`, `semester.module.ts`, `drizzle-scan.repository.ts`, `report.use-case.ts`, `semester-event-lifecycle.integration.test.ts`, `semester.controller.ts`, `app.module.ts`, `api/package.json`, `scan.controller.ts`, `claim-roster.use-case.ts`, `program.module.ts`, `enrollment-roster.module.ts`, `semester-lifecycle.ts`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `(app)/layout.tsx`, `my-attendance-view.tsx`, `attendance-grid.tsx`, `students-view.tsx`, `bento-grid.tsx`, `marketing-landing.tsx`, `dashboard-view.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `@react-pdf/renderer` connect `contracts/src/index.ts` to `web/lib/qr.ts`, `web/package.json`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _705 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `events/actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09885057471264368 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.06458635703918723 - nodes in this community are weakly interconnected._
- **Should `event.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.052507836990595615 - nodes in this community are weakly interconnected._