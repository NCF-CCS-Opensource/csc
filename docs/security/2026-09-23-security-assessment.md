# Security Assessment — 2026-09-23

Read-only assessment of `csc` (CCS Attendance System) using the `security-scanning` plugin's analysis skills: SAST, STRIDE threat modeling, attack-tree construction, security-requirement extraction, and threat-mitigation mapping. No code was changed as part of this pass.

Scope: `apps/web` (Next.js BFF, Clerk auth), `apps/api` (NestJS, `AuthGuard` + `CapabilityGuard`), `apps/mobile` (booth scanning client). Domain reference: `CONTEXT.md`.

## 1. SAST

Tools: `pnpm --filter web lint` (eslint-config-next) + manual grep sweep for classic sinks (XSS, `eval`, command injection, raw SQL interpolation, hardcoded secrets, CORS wildcards, insecure randomness). No Python present; semgrep/bandit not installed and not added since the project's own lint already covers React/Next-specific rules.

Result: clean. No `dangerouslySetInnerHTML`, `.innerHTML =`, `eval()`/`new Function()` in source (only inside `.next` build artifacts — framework internals, not source), no `exec`/`shell: true`, no raw SQL string interpolation, no hardcoded secrets, no CORS wildcards, no `Math.random()` used for tokens/sessions. `pnpm lint` passes with 0 errors.

Open item: `.env.docker` is git-tracked (2 commits). Contents were not inspected (sandbox blocked reading it as a credential-materialization risk). **Verify manually** that it holds no real secrets; if it does, rotate and scrub from history.

## 2. STRIDE threat model

| Category | Threat | Current control | Verdict |
|---|---|---|---|
| Spoofing | Forging another student's identity via QR at the booth | `Scan Approval` requires visual ID match against the worn school ID, not the QR card itself (by design) | Mitigated by process design |
| Spoofing | Forged/replayed API bearer token | `AuthGuard`/`TokenAuthGuard` verify via Clerk `TokenVerifier`, reject uniformly on missing/expired/tampered/foreign-signed (ADR-0019) | Good |
| Tampering | Client tampers with `studentId`/`semesterId` in ledger/report requests to read/alter another student's data | Cross-student routes (`ledger/student`, `report/*`, `attendance/correct`) gated behind `manage_operations`/`administer`; own-record routes (`ledger/mine`) use `actor.id`, not client-supplied id | Good — verified in `ledger.controller.ts` |
| Tampering | Offline Scan Queue delivered out of order or replayed | Domain rule: earliest Time-in / latest Time-out canonical regardless of delivery order | Handled by domain logic; not independently verified server-side in this pass |
| Repudiation | Officer denies recording/rejecting a scan or payment | Scan rejections logged for fraud-pattern detection; Payments recorded with `(amount, date, receiving Officer)` | Present by design; no centralized audit-log/SIEM found |
| Info Disclosure | PDF report routes (`apps/web/app/api/reports/**`) leaking data cross-tenant | Correctly proxy the caller's Clerk token to the API (`apiFetch`), so the API's `manage_operations` capability check still applies — no BFF-identity-substitution bug | Good |
| DoS | Report/PDF generation (Gemini call + `react-pdf` render) abused for resource exhaustion | No rate limiting found on these routes | **Gap** |
| Elevation of Privilege | A future route added without `@RequireCapability` | `CapabilityGuard.canActivate` **fails open** (`if (!capability) return true`) when no capability metadata is set. All 8 current controllers declare a capability on every route (verified), so there is no active bypass today | **Latent risk** — no fail-closed default, no lint/test enforcing "every route declares a capability" |

## 3. Attack tree — "non-Officer gains Officer/Governor capabilities"

```
GOAL: Non-Officer student gains Officer/Governor capabilities
 OR
 ├─ Exploit a future route missing @RequireCapability (Medium skill, Low detection until audited)
 ├─ Forge/steal a Governor's Clerk session token (High skill, Medium detection)
 ├─ Logic bug in `promote/:id` bypassing the `administer` check (Low likelihood — guard is centralized per ADR-0017)
 └─ Compromise CI/CD or a dependency to inject a backdoor (High skill — no SAST/dependency-scanning gate in CI today)
```

No exploitable path found today; `promote/:id` is correctly gated `administer`-only. The CI gap raises the cost/detection profile of the supply-chain leaf.

## 4. Security requirements extracted

| Requirement | Type | Priority | Traces to |
|---|---|---|---|
| `CapabilityGuard` must fail **closed** by default (throw if no capability metadata is present, or add a startup/lint check that every controller method declares `@RequireCapability`) | Functional | High | EoP gap (§2) |
| CI must run a SAST tool (Semgrep `p/security-audit` + `p/owasp-top-ten`, or `eslint-plugin-security`) on every PR | Constraint | High | No SAST step in `ci.yml` |
| CI must run dependency/secret scanning (`pnpm audit`, Dependabot/Renovate, gitleaks) | Constraint | Medium | No Dependabot config found |
| `.env.docker` must not carry real credentials if committed; rotate + scrub history if it does | Constraint | High (pending confirmation) | Untracked-secret finding (§1) |
| Report/PDF generation endpoints should have rate limiting given external Gemini call cost + PDF render cost | Non-functional | Medium | DoS row (§2) |

## 5. Threat → mitigation mapping (defense-in-depth)

| Layer | Current | Gap |
|---|---|---|
| Application (authn) | Clerk-issued tokens, verified centrally (`AuthGuard`) | — |
| Application (authz) | Single-point `CapabilityGuard`, per ADR-0017/0019 | Fail-open default when decorator missing |
| Data | BFF never touches the DB directly; the API is the sole authorization point | — |
| Process/CI | Lint, typecheck, unit + integration tests, build | No SAST, no dependency/secret scanning, no SBOM |
| Detective | Scan-rejection logging for fraud patterns | No general audit log / SIEM; acceptable at current scale, but no anomaly detection for e.g. mass report generation |

## 6. SAST configuration recommendation

Add a `semgrep` step to `.github/workflows/ci.yml` using `p/security-audit` + `p/owasp-top-ten` (free, no server needed), plus `pnpm audit --audit-level=high` and a Dependabot config for the `npm` and `github-actions` ecosystems. No custom rules needed — nothing repo-specific surfaced.

## Bottom line

The auth/authz architecture is deliberately centralized and well-documented (ADR-0017/0019) and holds up under review — no active vulnerability found. Two concrete, low-effort fixes are open:

1. Make `CapabilityGuard` fail closed instead of relying on every future route remembering the decorator.
2. Add SAST + dependency/secret scanning to CI.
