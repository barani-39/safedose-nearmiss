# SafeDose NearMiss — Verification & Testing Protocol

This document defines the verification strategy, test suites, execution commands, and continuous integration pipeline for the SafeDose NearMiss platform.

---

## 1. Testing Philosophy & Separation of Concerns

To guarantee dependable builds without external network vulnerabilities while still supporting live backend auditing, the test architecture is partitioned into three distinct tiers:

```
SafeDose Testing Pyramid
│
├── Tier 1: Unit & Invariant Tests (Vitest)
│   ├── Deterministic clinical boundary rules
│   ├── Completeness scoring formulas
│   ├── Math calculations & percentage improvements
│   └── Offline execution (0 network calls)
│
├── Tier 2: Deterministic E2E & WCAG Accessibility (Playwright + Axe)
│   ├── Intercepted Supabase REST routes (tests/e2e/fixtures/mockSupabase.ts)
│   ├── Full browser lifecycle testing (Form submission → Confirmation → Review)
│   ├── WCAG 2.1 AA automated accessibility scans via @axe-core/playwright
│   └── Runs deterministically in local dev and GitHub Actions CI without external dependencies
│
└── Tier 3: Live Cloud Integration (Vitest / Supabase REST)
    ├── Tests real connectivity to configured Supabase PostgreSQL instance
    ├── Requires reachable VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
    └── Isolated in tests/integration/live_supabase.test.ts
```

---

## 2. Local Verification Commands

| Command | Purpose | Tools Used | Expected Output |
|---|---|---|---|
| `npm run lint` | Code quality & unused variables audit | ESLint 9 + typescript-eslint | 0 errors |
| `npm run typecheck` | Strict TypeScript compilation check | TypeScript `tsc --noEmit` | 0 errors |
| `npm run test` or `npm run test:unit` | Executes all unit and clinical boundary tests | Vitest 4 | 14/14 tests pass |
| `npm run test:e2e` | End-to-end browser & accessibility flows | Playwright (Chromium) + Axe | 6/6 tests pass |
| `npm run test:integration` | Verifies live Supabase connectivity | Vitest + Supabase JS Client | Reports cloud status |
| `npm run build` | Builds optimized production distribution | Vite 5 | Zero bundle errors in `dist/` |
| `npm run verify` | Complete local verification pipeline | All of the above | All checks pass |

---

## 3. Test Suites Inventory

### A. Unit & Invariant Tests (`tests/`)
1. **`tests/safety.test.ts`**:
   - Refusal of out-of-scope medical advice requests (e.g. dosing questions).
   - Detection and warning of PII / PHI (phone numbers, emails, NHS/hospital numbers).
   - Detection of contradictory harm states (harm indicated as "No", but narrative mentions injury).
   - Keyword classifier matching and fallback rules.
2. **`tests/evaluation.test.ts`**:
   - Completeness score calculation across 7 required clinical safety dimensions.
   - Reporting velocity and quality percentage improvement calculations.
   - Psychological safety anonymity invariant: reporter identifier is strictly null when `anonymous = true`.
   - Idempotency invariant: duplicate report IDs are prevented from generating redundant evaluation sessions.
3. **`tests/patientJourneys.test.ts`**:
   - High-urgency Journey 1 (ICU Concentrated Insulin Overdose Interception) data model integrity.
   - Medium-urgency Journey 2 (Paediatric IV Paracetamol Timing Handover) timeline steps.

### B. Playwright Browser & Accessibility Tests (`tests/e2e/`)
1. **`tests/e2e/accessibility_and_flows.spec.ts`**:
   - Axe-core WCAG 2.1 AA automated audit on homepage.
   - Medical advice boundary banner display and submit button disabling.
   - Patient Journeys timeline stepper navigation.
   - Evaluation comparative matrix rendering.
   - Privacy & psychological safety policy page rendering.
2. **`tests/e2e/manual_smoke_flow.spec.ts`**:
   - Complete 18-step manual smoke flow from initial homepage visit to report submission, review queue inspection, detail editing, and responsive viewport checks on Tablet (768px) and Mobile (375px).

### C. Live Cloud Integration Tests (`tests/integration/`)
1. **`tests/integration/live_supabase.test.ts`**:
   - Connects to the active remote Supabase project using credentials in `.env`.
   - Validates live database table availability when the cloud database is reachable.

---

## 4. Continuous Integration Pipeline (GitHub Actions)

The CI workflow is configured in `.github/workflows/ci.yml` and triggers automatically on every `push` and `pull_request` to `main`:

```yaml
Steps executed in GitHub Actions runner (Ubuntu latest, Node 20 LTS):
1. Checkout repository
2. Setup Node.js with npm caching
3. npm ci
4. npm run lint
5. npm run typecheck
6. npm run test
7. npm run build
8. npx playwright install --with-deps chromium
9. npm run test:e2e
```

CI uses deterministic test routing via `tests/e2e/fixtures/mockSupabase.ts`, ensuring that pull request evaluations remain 100% reliable even if cloud databases are undergoing maintenance or paused.
