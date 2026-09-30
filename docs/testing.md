# SafeDose Testing Strategy & Granular Test Reference

**Project:** SafeDose NearMiss (`barani-39/safedose-nearmiss`)  
**Architecture:** React 18, TypeScript, Vite, Supabase / PostgreSQL  
**Current Test Coverage:** 49 Unit Tests (8 Suites) + 1 Integration Test + 8 Playwright E2E Tests (including Axe WCAG 2.1 AA audits)  
**Pass Rate:** 100% across all suites  

---

## 1. Multi-Layer Testing Architecture

SafeDose implements a multi-tier testing pyramid engineered to ensure clinical safety, privacy compliance, mathematical reproducibility, and UI resilience without depending on flaky external cloud services during continuous integration.

```
       ▲
      / \        Tier 4: Production Build & Static Analysis (tsc, eslint, vite build)
     /───\       Tier 3: End-to-End & WCAG Accessibility (Playwright + Axe-core, 8 tests)
    /─────\      Tier 2: Live Integration Failure-Handling (Vitest integration, 1 test)
   /───────\     Tier 1: Deterministic Unit & Invariant Tests (Vitest, 49 tests)
  ───────────
```

### Layer 1: Deterministic Unit & Invariant Tests
- **Runner:** Vitest v4.x
- **Scope:** Pure algorithmic business logic, clinical classification heuristics, medical-advice guardrails, PII redaction patterns, CWE-1236 spreadsheet sanitization, RBAC role-derivation rules, offline ring-buffering, and React ErrorBoundary lifecycles.
- **Execution Speed:** < 2.5 seconds.
- **Determinism:** 100% isolated in-memory execution; zero network requests or database dependencies.

### Layer 2: Live Integration & Failure-Handling Tests
- **Runner:** Vitest (Integration Mode)
- **Scope:** Verifies live Supabase connectivity and explicitly proves that network failures (such as DNS unresolvability or offline backend services) are caught gracefully and reported with honest clinical non-fabrication messages (`LIVE SUPABASE INTEGRATION VERIFICATION STILL REQUIRED`).

### Layer 3: End-to-End (E2E) & WCAG Accessibility Tests
- **Runner:** Playwright (Chromium) + `@axe-core/playwright`
- **Scope:** Simulates real healthcare worker journeys in a headless browser: 60-second rapid incident submission, medical-advice boundary interception, timeline steppers across 2 patient journeys, review queue triage, 403 Forbidden access control screens, and full WCAG 2.1 AA automated accessibility scans across all core clinical routes.

### Layer 4: Static Analysis & Production Build Verification
- **Tools:** TypeScript (`tsc --noEmit -p tsconfig.app.json`), ESLint (`eslint .`), Vite (`vite build`).
- **Scope:** Validates zero static typing errors, zero lint warnings/errors, and complete production bundle generation.

---

## 2. Unit Test Matrix

| Test Suite File | Operational Area | Tests | Functions / Components Under Test | Primary Security & Safety Invariant |
|:---|:---|:---:|:---|:---|
| `tests/safety.test.ts` | Safety Guardrails & PII | 7 | `detectMedicalAdviceQuery`, `containsHarmKeywords`, `detectPII`, `calculateCompletenessScore`, `classifyReport` | Zero clinical advice leakage; zero patient PII ingestion; zero actual harm in near-miss database. |
| `tests/evaluation.test.ts` | Benchmark Metrics & Scoring | 5 | `calculateCompletenessScore`, `calculateStatisticalSummary`, `computeComparativeMetrics` | Mathematical precision and deterministic baseline vs SafeDose scoring (+246% quality, -72% duration). |
| `tests/patientJourneys.test.ts` | Clinical Case Trajectories | 2 | `PATIENT_JOURNEYS`, timeline step progression, dual-check interceptor logic | Trajectory completeness across pediatric opioid and high-alert electrolyte clinical scenarios. |
| `tests/auth.test.ts` | Role-Based Access Control (RBAC) | 12 | `AuthProvider`, `ProtectedRoute`, role derivation, session resolution, privilege guards | Absolute prohibition on client-side privilege escalation; unauthorized users strictly default to `ANONYMOUS`. |
| `tests/audit.test.ts` | Governance & Audit Trail | 4 | `recordAuditEvent`, `getLocalAuditEvents`, `flushBufferedAuditEvents`, buffer retention | Sanitization of sensitive tokens; offline ring buffer capped at 100 entries with 7-day TTL cleanup. |
| `tests/export.test.ts` | CSV Export & Data Security | 9 | `sanitizeForCSV`, `generateCSV`, RFC 4180 escaping | CWE-1236 spreadsheet formula injection neutralization while preserving legitimate clinical negative numbers. |
| `tests/dashboard.test.ts` | Safety Analytics Engine | 4 | `computeDashboardStats`, `computeWeeklyTrends` | Chronological week sorting across month/year boundaries; zero-count bucket handling; empty database resilience. |
| `tests/errorBoundary.test.ts` | UI Fault Containment | 6 | `ErrorBoundary` lifecycle, `getDerivedStateFromError`, fallback renderer | Uncaught component render exceptions contained without crashing app or leaking stack traces. |

---

## 3. Granular Test Suite Specifications

### 3.1. Safety Guardrails & Boundaries (`tests/safety.test.ts`)
- **Purpose:** Verifies that SafeDose operates strictly as an operational safety learning tool and never provides medical advice, accepts severe adverse harm reports, or stores identifying patient details.
- **Functions Under Test:**
  - `detectMedicalAdviceQuery(text: string): boolean`
  - `containsHarmKeywords(text: string): boolean`
  - `detectPII(text: string): { hasPII: boolean; matches: string[] }`
  - `calculateCompletenessScore(report: Partial<NearMissReport>): number`
  - `classifyReport(description: string): { suggestedCategory: string; confidence: string }`
- **Test Scenarios:**
  1. *Normal Case:* Valid near-miss description ("U-500 insulin vial selected instead of U-100 regular insulin") passes boundary check cleanly.
  2. *Boundary Case:* Questions containing clinical inquiry phrasing ("What dose should I give to a pediatric patient?") are caught by `detectMedicalAdviceQuery`.
  3. *Failure Case:* Actual patient harm ("Patient died after cardiac arrest due to potassium overdose") is flagged by `containsHarmKeywords` to trigger immediate redirection to serious incident escalation channels.
  4. *Privacy / PII Case:* Phone numbers (`+44 7911 123456`), NHS numbers (`485 777 3456`), email addresses, and patient names are detected and flagged.
  5. *Completeness Scoring:* Evaluates score calculation (0–100) based on ward, medication category, stage, incident type, priority, and contributing factors.
- **Expected Outcome:** 100% boundary interception; 0% false negatives on medical advice or severe harm.

---

### 3.2. Statistical Evaluation Engine (`tests/evaluation.test.ts`)
- **Purpose:** Validates the mathematical and statistical formulas that drive the empirical evaluation matrix comparing traditional baseline incident reporting against SafeDose.
- **Functions Under Test:**
  - `calculateCompletenessScore`
  - `calculateStatisticalSummary`
  - Comparative delta percentage calculations
- **Test Scenarios:**
  1. *Normal Case:* Full SafeDose multi-attribute report achieves completeness score $\ge 90\%$.
  2. *Baseline Case:* Unstructured baseline narrative achieves completeness score $\le 35\%$.
  3. *Boundary Case:* Minimal valid 20-character description with 1 factor evaluates to usable report threshold (`usable_report: true`).
  4. *Delta Formulation:* Mean duration reduction percentage: $\frac{\text{Baseline} - \text{SafeDose}}{\text{Baseline}} \times 100 = 72.7\%$.
- **Expected Outcome:** Deterministic metrics matching benchmark outputs within $\pm 0.1\%$ tolerances.

---

### 3.3. Patient Safety Journeys (`tests/patientJourneys.test.ts`)
- **Purpose:** Verifies clinical accuracy, milestone sequence, and dual-check interception points across both pediatric and adult surgical safety journeys.
- **Objects Under Test:** `PATIENT_JOURNEYS` configuration array.
- **Test Scenarios:**
  1. *Journey 1 (High-Alert Insulin):* 5 sequential workflow steps from Prescribing to SafeDose Dual-Check Interception to Organizational Learning.
  2. *Journey 2 (Pediatric Opioid PACU):* Contrasting acute pediatric recovery administration where lack of independent secondary checker led to an intercepted near miss.
- **Expected Outcome:** Both journeys possess valid identifiers, urgency ratings, and structured step details.

---

### 3.4. Role-Based Access Control & RBAC Boundaries (`tests/auth.test.ts`)
- **Purpose:** Prevents client-side privilege escalation and ensures unauthenticated browser sessions strictly default to `ANONYMOUS`.
- **Functions Under Test:**
  - Role verification helpers: `isReviewerOrAdmin`, `canSubmitReport`, `canAccessReviewQueue`, `canEditReviews`, `canViewAuditLog`.
  - LocalStorage tamper sanitization.
  - Profile-based database role derivation.
- **Test Scenarios:**
  1. *Anonymous Submission:* Confirms `ANONYMOUS` role can submit reports but cannot access `/review` or `/audit-report`.
  2. *Tamper Resistance:* Simulates a user injecting `localStorage.setItem('safedose_user_role', 'ADMIN')` in production mode; test proves client role remains `ANONYMOUS`.
  3. *Horizontal Isolation:* Proves `REPORTER` cannot edit reviewer notes or update incident categories.
  4. *Authoritative Resolution:* Authenticated session with valid profile role `REVIEWER` unlocks review queue and triage controls.
- **Security Relevance:** CWE-285 (Improper Authorization) & CWE-269 (Improper Privilege Management).
- **Expected Outcome:** Unauthorized access rejected with HTTP 403 equivalents; zero elevation via client state.

---

### 3.5. Audit Trail & Offline Buffering (`tests/audit.test.ts`)
- **Purpose:** Verifies append-only audit event logging, sensitive data sanitization, and offline buffer management.
- **Functions Under Test:**
  - `recordAuditEvent(params)`
  - `getLocalAuditEvents()`
  - `flushBufferedAuditEvents()`
  - Data sanitization regex and property redactor
- **Test Scenarios:**
  1. *Data Protection:* Audit event payloads containing sensitive tokens, passwords, or raw narratives are stripped and replaced with `[REDACTED_FOR_PRIVACY]`.
  2. *Offline Buffering:* When database connection is unavailable, events are buffered in `localStorage` under `safedose_audit_log` with `is_buffered_offline: true`.
  3. *Ring Buffer Cap:* Local buffer enforces a strict ceiling of 100 entries and a 7-day retention TTL cutoff to prevent browser storage exhaustion.
  4. *Sync Flushing:* Proves buffered events transition to `server_persisted: true` upon successful flush.
- **Expected Outcome:** Sensitive information never stored in audit logs; buffer stays within capacity limits.

---

### 3.6. CSV Export & Spreadsheet Injection Protection (`tests/export.test.ts`)
- **Purpose:** Protects clinical governance personnel against formula injection attacks when opening exported near-miss incident data in Microsoft Excel, Google Sheets, or LibreOffice Calc.
- **Functions Under Test:**
  - `sanitizeForCSV(value: unknown): string`
  - `generateCSV(headers: string[], rows: (string | number)[][]): string`
- **Test Scenarios:**
  1. *Formula Prefix Neutralization:* Strings beginning with `=`, `+`, `-`, `@`, `\t`, `\r`, or leading whitespace followed by trigger characters are prefixed with a neutralizing single quote (`'`).
  2. *Legitimate Negative Numbers:* Clinical numbers such as `-5`, `"-42"`, `-12.5`, and `+37.5` are preserved as legitimate numbers without quote alteration.
  3. *RFC 4180 Escaping:* Fields containing commas, double quotes, or newlines are wrapped in double quotes, with internal quotes escaped as `""`.
- **Security Relevance:** CWE-1236 (Improper Neutralization of Formula Elements in CSV File).
- **Expected Outcome:** 100% neutralization of executable formulas; 0% corruption of clinical numbers.

---

### 3.7. Safety Dashboard Analytics Derivation (`tests/dashboard.test.ts`)
- **Purpose:** Validates time-series aggregation, operational priority grouping, and calendar week sorting in clinical trend analytics.
- **Functions Under Test:**
  - `computeDashboardStats(reports: NearMissReport[])`
  - `computeWeeklyTrends(reports: NearMissReport[])`
- **Test Scenarios:**
  1. *Empty Database:* Returns zero counts and empty trend array without throwing exceptions.
  2. *Chronological Sorting:* Ensures weekly trends spanning month and year boundaries (e.g. December W52 into January W01) sort in strict chronological ISO order.
  3. *Invalid Date Resilience:* Corrupted or malformed timestamp strings are filtered out cleanly without crashing the Recharts renderer.
  4. *Status Triage:* Correctly counts `Submitted`, `Under Review`, and `Closed` records.
- **Expected Outcome:** Deterministic time-series ordering with zero NaN or undefined values.

---

### 3.8. React Error Boundary (`tests/errorBoundary.test.ts`)
- **Purpose:** Verifies that unhandled runtime or render-phase component exceptions are caught safely without crashing the SPA or exposing sensitive stack traces.
- **Component Under Test:** `<ErrorBoundary />`
- **Test Scenarios:**
  1. *Clean State:* Mounts normally and renders child elements when no error occurs.
  2. *Error Capture:* `getDerivedStateFromError` correctly transitions state to `hasError: true`.
  3. *Fallback UI:* Renders user-facing resilience message ("Something went wrong while loading this section", "Your report data has not been intentionally changed") and recovery buttons ("Try Again", "Return to SafeDose Home").
  4. *Stack Trace Suppression:* Proves raw internal file paths and function stacks are not exposed in the rendered HTML.
  5. *Recovery Reset:* `handleReset()` clears error state and triggers `onReset` callback.
  6. *Custom Fallback:* Supports custom department fallback node when provided via props.
- **Expected Outcome:** Application white-screen prevented; recovery pathways accessible.

---

## 4. End-to-End & WCAG Accessibility Test Suite (`tests/e2e/`)

| Test Spec File | Flow Tested | Assertions | WCAG AA Audit |
|:---|:---|:---:|:---:|
| `accessibility_and_flows.spec.ts` | Homepage & Navigation | Header, rapid capture callout, page title | **PASS (0 violations)** |
| `accessibility_and_flows.spec.ts` | Report Form & Guardrails | Medical-advice interception banner, advice query blocking, submit button disabled state | **PASS (0 violations)** |
| `accessibility_and_flows.spec.ts` | Patient Safety Journeys | Step progression, timeline button switching, PACU Paediatric tab | **PASS (0 violations)** |
| `accessibility_and_flows.spec.ts` | Evaluation Matrix | Comparative benchmark matrix, missing info analysis, error analysis | **PASS (0 violations)** |
| `accessibility_and_flows.spec.ts` | Privacy & Safety Page | Zero-harm filter, default-on anonymity cards, escalation pathways | **PASS (0 violations)** |
| `accessibility_and_flows.spec.ts` | 403 Forbidden Screen | Direct unauthorized URL access to `/review` and `/audit-report` blocked | **PASS (0 violations)** |
| `accessibility_and_flows.spec.ts` | Stakeholder & Audit Report | Form submission, printable audit view, feedback submission | **PASS (0 violations)** |
| `manual_smoke_flow.spec.ts` | Complete End-to-End Cycle | Homepage $\to$ Report $\to$ Database $\to$ Eval Hook $\to$ Review Queue $\to$ Triage Update $\to$ Mobile Viewport | **PASS (0 violations)** |

---

## 5. Verification Commands Reference

```bash
# 1. Run all unit and invariant tests (49 tests across 8 suites)
npm run test:unit

# 2. Run live Supabase failure-handling integration test
npm run test:integration

# 3. Run complete Playwright E2E and Axe WCAG AA accessibility audit (8 browser tests)
npm run test:e2e

# 4. Run Vitest unit tests + Playwright E2E tests together
npm run test:all

# 5. Run full pre-submission verification pipeline (Lint + Typecheck + Unit Tests + Build)
npm run verify

# 6. Run strict ESLint static analysis
npm run lint

# 7. Run TypeScript strict type-checking
npm run typecheck

# 8. Build production bundle for deployment
npm run build

# 9. Execute mathematical benchmark evaluation runner
npm run eval

# 10. Export benchmark metrics with SHA-256 cryptographic checksums
npm run eval:export
```

---

## 6. Testing Philosophy & Clinical Rationale

1. **Why Deterministic Unit Tests Without Cloud Coupling?**  
   Hospital safety software must not rely on unstable external cloud connections during CI verification. All clinical boundaries, scoring formulas, and data sanitization algorithms are verified deterministically in-memory.

2. **Why Mock-Isolated E2E Tests for CI?**  
   Playwright tests utilize deterministic route interception to simulate both anonymous staff submissions and authenticated clinical review sessions, guaranteeing 100% reproducible tests on any CI machine without requiring live Supabase credentials.

3. **Why Separate Failure-Handling Tests?**  
   Instead of masking backend downtime with fake passes, SafeDose tests explicitly verify that when the live database is unreachable, the system fails safely, displays clear non-fabrication messages, and protects user input.

4. **Why Automated WCAG 2.1 AA Accessibility Scans?**  
   Healthcare reporting tools must be accessible to fatigued nurses and clinical staff under varying shift conditions. Integrating Axe-core into the automated test pipeline ensures color contrast, semantic form labels, and keyboard navigability are continuously enforced.
