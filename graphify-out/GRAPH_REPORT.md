# Graph Report - issue-203  (2026-09-21)

## Corpus Check
- 356 files · ~148,453 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2233 nodes · 4942 edges · 135 communities (116 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ecb500eb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- events/actions.ts
- contracts/src/index.ts
- cn
- event.controller.ts
- mode-toggle.tsx
- api-client.ts
- admin/page.tsx
- Attendance Session
- scanQueue.ts
- Bento Grid Design Guidelines
- 2. Quickstart (Docker Compose)
- import-enrollment-roster.mjs
- ledger.integration.test.ts
- SettingsScreen.tsx
- students-view.tsx
- web/package.json
- theme-context.tsx
- CCS Attendance Repository
- expo
- ApiError
- App.tsx
- dependencies
- components.json
- EventsScreen.tsx
- web/lib/qr.ts
- BoothScreen.tsx
- dependencies
- students-view.test.tsx
- compilerOptions
- scripts
- Architecture & Technical Design
- ssoRedirect.test.ts
- attendance-grid.tsx
- app/layout.tsx
- devDependencies
- tasks
- api.ts
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
- program.module.ts
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
- auth.ts
- sync-obsidian.sh
- domain/ledger.ts
- LedgerUseCase
- drizzle-student.repository.ts
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
- ledger.use-case.ts
- bento-grid.tsx
- apiPost
- drizzle-enrollment-roster.repository.ts
- DbModule
- contracts/package.json
- Design Guidelines — Clean Style
- queryClient.tsx
- students/actions.ts
- semester-event-lifecycle.integration.test.ts
- Design Guidelines — Neobrutalism
- enrollment-roster.module.ts
- enrollment-roster.controller.ts
- analytics/page.tsx
- contracts/tsconfig.json
- db/src/index.ts
- tsconfig.build.json
- Product
- DeleteSemesterUseCase
- clerk-identity-profile.provider.ts
- src/report.ts
- DomainLifecycleError
- seed-all-roster-students.mjs
- NestJS Rewrite Plan
- roster-claim.integration.test.ts
- TokenAuthGuard
- lib/ledger.test.ts
- NestJS API with Clean Architecture and single-action controllers
- Any managed Postgres addressed by URL, hosted on Heroku for now
- The web app is a BFF with no database access
- Reports are computed on the API and rendered on Vercel
- Ledger is a module without a repository, and no-show materialization is a command
- .execute
- role.ts
- EnrollmentRosterController
- CloseSemesterUseCase
- GetOpenSemesterUseCase
- ListSemestersUseCase
- schema.ts
- RequireCapability
- semester.module.ts
- LedgerController
- DrizzleReportRepository
- scripts
- DrizzleLedgerRepository
- isEventPastInManila
- global-error.test.tsx
- ProgramModule
- StudentModule

## God Nodes (most connected - your core abstractions)
1. `cn()` - 110 edges
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

## Communities (135 total, 16 thin omitted)

### Community 0 - "events/actions.ts"
Cohesion: 0.12
Nodes (20): createEvent(), deleteEvent(), eventsSnapshot, fail(), parseEventForm(), runOrReportError(), { apiFetch, MockApiError }, redirect (+12 more)

### Community 1 - "contracts/src/index.ts"
Cohesion: 0.18
Nodes (19): GET(), GET(), GET(), GET(), FinancialPdfDocument(), styles, PerEventPdfDocument(), styles (+11 more)

### Community 2 - "cn"
Cohesion: 0.05
Nodes (69): AppSidebar(), Identity, NAV_ITEMS, navForRole(), NavItem, readCachedIdentity(), AlertDialogMedia(), AlertDialogOverlay() (+61 more)

### Community 3 - "event.controller.ts"
Cohesion: 0.05
Nodes (54): CreateEventUseCase, ADR-0017, Inject, Injectable, DeleteEventUseCase, Inject, Injectable, ListEventsUseCase (+46 more)

### Community 5 - "api-client.ts"
Cohesion: 0.09
Nodes (29): ClearancePage(), findOpenSemester(), dashboardSnapshot, findOpenSemester(), ADR-0013, DashboardView(), DashboardPage(), dynamic (+21 more)

### Community 6 - "admin/page.tsx"
Cohesion: 0.12
Nodes (27): dynamic, dynamic, dashboardQueryKey, ADR-0013, RefreshButton(), ADR-0013, AppError(), myAttendanceQueryKey (+19 more)

### Community 7 - "Attendance Session"
Cohesion: 0.18
Nodes (16): Attendance Session, Clearance, Event, Governor, Ledger, Officer, Offline Scan Queue, Payment (+8 more)

### Community 8 - "scanQueue.ts"
Cohesion: 0.13
Nodes (35): addRecentScan(), blockingScanCount(), claimLegacyScans(), DeliveryState, dequeue(), discardLegacyScans(), discardScan(), enqueue() (+27 more)

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
Cohesion: 0.23
Nodes (12): DB, db, createTestApp(), db, db, attendanceSessions, events, payments (+4 more)

### Community 13 - "SettingsScreen.tsx"
Cohesion: 0.13
Nodes (19): endOfficerSession(), colorOf(), COLORS, initialsOf(), fetchRejectedScans(), RejectedScanRow, RejectionReason, apiFetch (+11 more)

### Community 14 - "students-view.tsx"
Cohesion: 0.08
Nodes (31): Event, ReportsClient(), ReportsClientProps, Semester, Student, ADR-0013, studentsQueryKey, ADR-0013 (+23 more)

### Community 15 - "web/package.json"
Cohesion: 0.08
Nodes (25): @attendance/contracts, react, @tanstack/react-query, @types/node, @types/react, typescript, vitest, name (+17 more)

### Community 16 - "theme-context.tsx"
Cohesion: 0.13
Nodes (18): CalendarGrid(), CELL_SIZE, makeStyles(), MONTH_NAMES, toDateString(), WEEKDAYS, Dropdown(), makeStyles() (+10 more)

### Community 17 - "CCS Attendance Repository"
Cohesion: 0.18
Nodes (17): Agent Guidelines and Repo Conventions, CCS Attendance System Domain Model, Mobile Web Platform Split, TanStack Query and Zustand State Management, GitHub Issue Tracker Workflow, Issue Triage Labels, Database Architecture Drizzle Postgres, Mobile Architecture Expo (+9 more)

### Community 18 - "expo"
Cohesion: 0.08
Nodes (23): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled (+15 more)

### Community 19 - "ApiError"
Cohesion: 0.15
Nodes (20): claimEnrollmentRoster(), ONBOARDING_TEST_EMAILS, OnboardingState, OnboardingForm(), dynamic, OnboardingPage(), ApiError, claimRosterByEmail() (+12 more)

### Community 20 - "App.tsx"
Cohesion: 0.06
Nodes (39): App(), AppShell(), AuthenticatedApp(), MobileAdmission, navTheme(), styles, Tab, TAB_ICONS (+31 more)

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
Nodes (15): buildQrPayload(), QrSubject, POST(), GET(), GET(), chunk(), QrCardPdfDocument(), renderQrCardPdf() (+7 more)

### Community 25 - "BoothScreen.tsx"
Cohesion: 0.12
Nodes (22): isReadableQrPayload(), parseQrPayload(), QrStudent, isAlreadyScanned(), recentScanOutcomeLabel(), ScanOutcome, scan, RecentScan (+14 more)

### Community 26 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @attendance/contracts, class-variance-authority, @clerk/nextjs, clsx, @google/generative-ai, lucide-react, next (+11 more)

### Community 27 - "students-view.test.tsx"
Cohesion: 0.23
Nodes (9): downloadQrCards(), StudentsView(), changeId(), { correctStudentMock, snapshotMock }, openCorrection(), openDialogByChangingId(), renderStudents(), save() (+1 more)

### Community 28 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 29 - "scripts"
Cohesion: 0.06
Nodes (30): devDependencies, turbo, typescript, engines, node, typescript, name, packageManager (+22 more)

### Community 30 - "Architecture & Technical Design"
Cohesion: 0.07
Nodes (26): 10. Turborepo Verification Pipeline, 1. Domain Layer (`apps/api/src/modules/<resource>/domain/`), 1. High-Level System Architecture, 1. Server-Authoritative XP, 2. Application Layer (`apps/api/src/modules/<resource>/application/`), 2. Badge Multiplicity (ADR 0003), 2. Monorepo Structure & Package Boundaries, 3. Backend Architecture: Clean Architecture (`apps/api`) (+18 more)

### Community 31 - "ssoRedirect.test.ts"
Cohesion: 0.39
Nodes (5): LinkingLike, matchesRedirectScheme(), UrlHandler, watchForRedirectUrl(), signIn()

### Community 32 - "attendance-grid.tsx"
Cohesion: 0.14
Nodes (23): PaymentCell(), ScanCell(), ADR-0013, eventGridQueryKey(), ADR-0013, EventRow, ADR-0007, eventsQueryKey (+15 more)

### Community 33 - "app/layout.tsx"
Cohesion: 0.14
Nodes (11): dmSans, geistMono, metadata, spaceGrotesk, QueryProvider(), ADR-0013, ThemeProvider(), TooltipProvider() (+3 more)

### Community 34 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, eslint, eslint-config-next, jsdom, tailwindcss, @tailwindcss/postcss, @testing-library/dom, @testing-library/jest-dom (+7 more)

### Community 35 - "tasks"
Cohesion: 0.15
Nodes (12): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+4 more)

### Community 36 - "api.ts"
Cohesion: 0.22
Nodes (11): BoothApp(), API_BASE_URL, ApiError, OfficerIdentity, rememberedOfficerIdentity(), rememberOfficerIdentity(), getToken, ADR-0012 (+3 more)

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
Cohesion: 0.08
Nodes (30): ScanApprovalUseCase, Inject, Injectable, ScanError, decodeQrPayload(), modeToHalfAndField(), QrPayload, qrRejectionReason() (+22 more)

### Community 47 - "db/package.json"
Cohesion: 0.07
Nodes (28): dependencies, drizzle-orm, postgres, devDependencies, drizzle-kit, typescript, vitest, drizzle-orm (+20 more)

### Community 48 - "program.module.ts"
Cohesion: 0.07
Nodes (27): CreateProgramUseCase, DeleteProgramUseCase, ListProgramsDetailedUseCase, ListProgramsUseCase, ADR-0014, ADR-0019, Inject, Injectable (+19 more)

### Community 49 - "@nestjs/common"
Cohesion: 0.11
Nodes (30): AttendanceModule, Module, LedgerModule, Module, ReportModule, Module, ScanModule, Module (+22 more)

### Community 50 - "seed-students.mjs"
Cohesion: 0.50
Nodes (3): ADR-0012, sql, TEST_STUDENTS

### Community 51 - "api/package.json"
Cohesion: 0.04
Nodes (44): dependencies, @attendance/contracts, @attendance/db, @clerk/backend, drizzle-orm, @nestjs/common, @nestjs/core, @nestjs/platform-express (+36 more)

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
Cohesion: 0.07
Nodes (37): CorrectStudentUseCase, ADR-0014, ADR-0019, Inject, Injectable, GetCallerIdentityUseCase, ADR-0017, Inject (+29 more)

### Community 67 - "Design Guidelines — CCS Attendance Web"
Cohesion: 0.08
Nodes (25): Bento Cards & Cells, Bento Grid Architecture (Dashboards, Tables & Data Views), Buttons, Canvas & Base Surfaces, Colors, Components, Decorative Handcrafted Layer, Design Guidelines — CCS Attendance Web (+17 more)

### Community 68 - "drizzle-attendance.repository.ts"
Cohesion: 0.12
Nodes (16): AttendanceUseCase, Inject, Injectable, AttendanceHalf, currentCampusDate(), isAbsent(), owedHalves(), DrizzleAttendanceRepository (+8 more)

### Community 69 - "auth.ts"
Cohesion: 0.12
Nodes (23): GET(), getCurrentStudent, hasStudentRecord(), Identity, apiFetch, auth, identity, ADR-0012 (+15 more)

### Community 71 - "domain/ledger.ts"
Cohesion: 0.12
Nodes (24): absent(), buildCollectedByEvent(), buildContext(), buildEventSessionCounts(), buildEventStats(), compareEvents(), computeLedger(), EVENT_ORDER (+16 more)

### Community 72 - "LedgerUseCase"
Cohesion: 0.15
Nodes (9): LedgerUseCase, Inject, Injectable, Inject, LedgerSession, PaymentHistoryEntry, SemesterLedgerEvent, SemesterLedgerResponse (+1 more)

### Community 73 - "drizzle-student.repository.ts"
Cohesion: 0.10
Nodes (16): DuplicateStudentIdError, InvalidProgramError, StudentNotFoundError, ADR-0014, StudentCorrection, DrizzleStudentRepository, Injectable, StudentRow (+8 more)

### Community 74 - "semester.controller.ts"
Cohesion: 0.20
Nodes (15): SemesterController, Body, Controller, ADR-0017, Post, UseGuards, presentSemester(), runLifecycle() (+7 more)

### Community 76 - "report.use-case.ts"
Cohesion: 0.19
Nodes (7): Inject, FinancialReportInput, PerEventReportInput, PerSemesterReportInput, PerStudentReportInput, REPORT_REPOSITORY, ReportRepository

### Community 77 - "domain/report.ts"
Cohesion: 0.19
Nodes (19): attendedHalvesForStudentEvent(), computeFinancialReport(), computePerEventReport(), computePerSemesterReport(), computePerStudentReport(), deriveHalfStatus(), eventHalfPenalty(), EventType (+11 more)

### Community 78 - "reflect-metadata"
Cohesion: 0.22
Nodes (8): AppModule, Module, bootstrap(), DevErrorLoggerFilter, ADR-0017, Catch, @nestjs/core, reflect-metadata

### Community 79 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, lib (+10 more)

### Community 80 - "Semester"
Cohesion: 0.16
Nodes (8): DateRange, SemesterLifecycleError, validateSemesterDates(), ValidationError, SemesterRepository, Semester, DrizzleSemesterRepository, Injectable

### Community 81 - "ReportUseCase"
Cohesion: 0.17
Nodes (10): ReportUseCase, Injectable, ReportController, Body, Controller, Inject, Post, UseGuards (+2 more)

### Community 82 - "Bento Design Skill"
Cohesion: 0.10
Nodes (19): 70/20/10 Color Rule, Bento Design Skill, Cell base, Deliverable Checklist, Entrance stagger (on load), Grid, Grid Architecture, Hover lift (on every cell) (+11 more)

### Community 83 - "Neobrutalism Design Skill"
Cohesion: 0.11
Nodes (18): Button (press-down required on every interactive button), Card, CTA Block & Testimonial, Icon Box, Input, Navbar, Neobrutalism Design Skill, Quick Reference (+10 more)

### Community 84 - "ledger.use-case.ts"
Cohesion: 0.31
Nodes (3): LedgerInput, LEDGER_REPOSITORY, LedgerRepository

### Community 85 - "bento-grid.tsx"
Cohesion: 0.19
Nodes (14): BentoCell(), BentoCellContent(), BentoCellDescription(), BentoCellElevation, BentoCellFooter(), BentoCellHeader(), BentoCellOverline(), BentoCellProps (+6 more)

### Community 86 - "apiPost"
Cohesion: 0.44
Nodes (12): addProgram(), closeSemester(), createSemester(), deleteSemester(), editSemester(), fail(), promoteToOfficer(), removeProgram() (+4 more)

### Community 87 - "drizzle-enrollment-roster.repository.ts"
Cohesion: 0.24
Nodes (5): EnrollmentRosterRepository, RosterRow, DrizzleEnrollmentRosterRepository, Inject, Injectable

### Community 88 - "DbModule"
Cohesion: 0.67
Nodes (3): DbModule, Module, Global

### Community 89 - "contracts/package.json"
Cohesion: 0.17
Nodes (11): devDependencies, typescript, typescript, main, name, private, scripts, typecheck (+3 more)

### Community 90 - "Design Guidelines — Clean Style"
Cohesion: 0.14
Nodes (13): Borders & Radius, Buttons, Color Palette, Components Spotted, Design Guidelines — Clean Style, Icons, Imagery & Illustration, Micro-Animations (+5 more)

### Community 91 - "queryClient.tsx"
Cohesion: 0.22
Nodes (9): apiFetch, boothQueryDefaults, BoothQueryProvider(), cacheMaxAgeMs, persister, queryClient, @react-native-async-storage/async-storage, @tanstack/query-async-storage-persister (+1 more)

### Community 92 - "students/actions.ts"
Cohesion: 0.15
Nodes (12): correctStudent(), studentsSnapshot, ADR-0013, ADR-0014, dynamic, StudentsPage(), ADR-0013, ValidationError (+4 more)

### Community 93 - "semester-event-lifecycle.integration.test.ts"
Cohesion: 0.12
Nodes (6): CreateSemesterUseCase, Inject, Injectable, db, ADR-0007, ADR-0017

### Community 94 - "Design Guidelines — Neobrutalism"
Cohesion: 0.15
Nodes (12): Borders & Radius, Buttons, Color Palette, Components Spotted, Design Guidelines — Neobrutalism, Icons, Imagery & Illustration, Overall Replication Notes (+4 more)

### Community 95 - "enrollment-roster.module.ts"
Cohesion: 0.26
Nodes (7): ADR-0019, ENROLLMENT_ROSTER_REPOSITORY, ADR-0017, IDENTITY_PROFILE_PROVIDER, ADR-0019, EnrollmentRosterModule, Module

### Community 96 - "enrollment-roster.controller.ts"
Cohesion: 0.18
Nodes (8): RosterClaimError, RosterClaimReason, Body, ADR-0017, Post, CallerAuthUserId, ClaimRosterRequest, ADR-0019

### Community 97 - "analytics/page.tsx"
Cohesion: 0.20
Nodes (9): currentCampusDate(), maxDuration, AnalyticsPage(), dynamic, requireCapability(), Role, ADR-0019, StudentListResponse (+1 more)

### Community 98 - "contracts/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, noEmit, outDir, extends, include, ../../tsconfig.base.json

### Community 99 - "db/src/index.ts"
Cohesion: 0.18
Nodes (8): Inject, Inject, Inject, Inject, createDb(), CreateDbOptions, Database, schema

### Community 100 - "tsconfig.build.json"
Cohesion: 0.33
Nodes (5): compilerOptions, noEmit, exclude, extends, ./tsconfig.json

### Community 101 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 102 - "DeleteSemesterUseCase"
Cohesion: 0.18
Nodes (7): DeleteSemesterUseCase, Inject, Injectable, Inject, Injectable, UpdateSemesterDatesUseCase, Inject

### Community 103 - "clerk-identity-profile.provider.ts"
Cohesion: 0.24
Nodes (6): Inject, IdentityProfile, IdentityProfileProvider, ClerkIdentityProfileProvider, ADR-0019, Injectable

### Community 104 - "src/report.ts"
Cohesion: 0.15
Nodes (12): FinancialEventBreakdown, FinancialOutstandingBalance, FinancialPaymentLogSummary, FinancialProgramBreakdown, Half, PerSemesterClearanceReadiness, PerSemesterEventSummary, PerSemesterProgramBreakdown (+4 more)

### Community 107 - "NestJS Rewrite Plan"
Cohesion: 0.20
Nodes (9): Architecture Deepening Plan, Acceptance gate, Decisions, Loose ends, NestJS Rewrite Plan, Out of scope, Outcome, Slice order (+1 more)

### Community 109 - "roster-claim.integration.test.ts"
Cohesion: 0.25
Nodes (8): ClaimRosterUseCase, Injectable, db, rosterRepository, studentRepository, ADR-0019, useCaseWithProfile(), enrollmentRoster

### Community 110 - "TokenAuthGuard"
Cohesion: 0.33
Nodes (4): extractBearerToken(), TokenAuthGuard, Inject, Injectable

### Community 111 - "lib/ledger.test.ts"
Cohesion: 0.25
Nodes (5): computeEventGrid(), EventGridInput, missingHalves(), owedHalves(), EARLY

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

### Community 117 - ".execute"
Cohesion: 0.36
Nodes (5): determineRole(), isSchoolEmail(), nameTokens(), rosterNameMatches(), ADR-0019

### Community 118 - "role.ts"
Cohesion: 0.29
Nodes (5): CapabilityDenial, capabilityFailure(), ROLE_CAPABILITIES, ADR-0017, ADR-0019

### Community 119 - "EnrollmentRosterController"
Cohesion: 0.40
Nodes (4): EnrollmentRosterController, Controller, Inject, UseGuards

### Community 120 - "CloseSemesterUseCase"
Cohesion: 0.40
Nodes (3): CloseSemesterUseCase, Inject, Injectable

### Community 121 - "GetOpenSemesterUseCase"
Cohesion: 0.40
Nodes (3): GetOpenSemesterUseCase, Inject, Injectable

### Community 122 - "ListSemestersUseCase"
Cohesion: 0.40
Nodes (3): ListSemestersUseCase, Inject, Injectable

### Community 123 - "schema.ts"
Cohesion: 0.20
Nodes (10): boothModeEnum, eventTypeEnum, halfEnum, programs, roleEnum, scanResultEnum, semesters, ADR-0007 (+2 more)

### Community 124 - "RequireCapability"
Cohesion: 0.20
Nodes (11): AttendanceController, Body, Controller, Post, UseGuards, RequireCapability(), AdminOnlyController, Controller (+3 more)

### Community 125 - "semester.module.ts"
Cohesion: 0.39
Nodes (4): ADR-0017, SEMESTER_REPOSITORY, SemesterModule, Module

### Community 127 - "LedgerController"
Cohesion: 0.36
Nodes (5): LedgerController, Body, Controller, Post, UseGuards

### Community 128 - "DrizzleReportRepository"
Cohesion: 0.33
Nodes (4): asOfTimestamp(), DrizzleReportRepository, Inject, Injectable

### Community 129 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, android, ios, start, test, typecheck, web

### Community 130 - "DrizzleLedgerRepository"
Cohesion: 0.33
Nodes (3): DrizzleLedgerRepository, Inject, Injectable

### Community 131 - "isEventPastInManila"
Cohesion: 0.40
Nodes (3): currentCampusDate(), isEventPastInManila(), PerEventReportData

## Knowledge Gaps
- **771 isolated node(s):** `name`, `version`, `private`, `build`, `start` (+766 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1002 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@nestjs/common` connect `@nestjs/common` to `event.controller.ts`, `ledger.integration.test.ts`, `drizzle-scan.repository.ts`, `program.module.ts`, `api/package.json`, `Actor`, `drizzle-attendance.repository.ts`, `drizzle-student.repository.ts`, `semester.controller.ts`, `report.use-case.ts`, `reflect-metadata`, `Semester`, `ledger.use-case.ts`, `drizzle-enrollment-roster.repository.ts`, `semester-event-lifecycle.integration.test.ts`, `enrollment-roster.module.ts`, `enrollment-roster.controller.ts`, `clerk-identity-profile.provider.ts`, `DomainLifecycleError`, `semester.module.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `attendance-grid.tsx`, `bento-grid.tsx`, `admin/page.tsx`, `students-view.tsx`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `@react-pdf/renderer` connect `contracts/src/index.ts` to `web/lib/qr.ts`, `web/package.json`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _771 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `events/actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.046192259675405745 - nodes in this community are weakly interconnected._
- **Should `event.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05025712949976625 - nodes in this community are weakly interconnected._