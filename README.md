# SafeDose NearMiss

## Psychologically Safe Medication Incident Reporting & Organisational Learning Infrastructure

> **Academic & Operational Prototype v2.4**  
> Operational safety support and quality improvement prototype. Non-clinical educational demonstration. Not medical advice. Not certified as a medical device for clinical diagnosis or treatment.

---

## 1. Executive Summary & Clinical Mission

Medication near misses are critical indicators of latent operational vulnerabilities in inpatient hospital environments. Traditional hospital incident reporting systems suffer from severe underreporting due to administrative friction (average 15–20 minutes per submission) and psychological fear of punitive reprisal or career jeopardy.

**SafeDose NearMiss** solves this through a psychologically safe, high-velocity reporting workflow:
- **Default-On Anonymity**: No reporter identity or personal tracking data is stored when anonymous mode is active.
- **60-Second Completion Target**: Guided structured selectors replace tedious free-text narrative writing.
- **Zero-Harm Boundary**: Strict algorithmic gatekeeping blocks actual harm submissions and redirects to serious adverse incident clinical escalation pathways.
- **Strict Prohibition on Medical Advice**: Zero diagnostic or dosing recommendations are offered; clinical queries are intercepted with immediate refusal banners.
- **Actionable Root-Cause Triage**: Captures medication stage, therapeutic class, and systemic human factors for immediate hospital safety committee remediation.

---

## 2. Complete Architecture & Provenance Framework

```
[ Bedside Nurse / Clinician ]
               │
               ▼
   [ Structured Report Form ]
      │  ├─ Privacy / PII Filtering (Regex)
      │  ├─ Medical Advice Guardrail (Zero-Leak Boundary)
      │  ├─ Zero-Harm Redirection
      │  └─ Vagueness & Completeness Checks
      ▼
   [ PostgreSQL + RLS Database (Supabase) ]
      │
      ├─────────────────────────────────────────┐
      ▼                                         ▼
[ Rule-Based Heuristic Classifier ]   [ Evaluation Sessions Telemetry ]
   (Concordance: 91.8% benchmark)       (Reconciliation Engine)
      │                                         │
      ▼                                         ▼
[ Human Clinical Review Queue ]       [ Empirical Evaluation Engine ]
   (Triage, Notes, Status)              (Baseline vs SafeDose Comparison)
      │                                         │
      ▼                                         ▼
[ Operational Audit & Governance ]    [ Printable Committee Audit Report ]
```

### Provenance Classification Levels
All data artifacts across the application and documentation are classified under four rigorous provenance tiers:
1. `SYNTHETIC BENCHMARK`: Deterministic simulations modeled on Institute for Safe Medication Practices (ISMP) and WHO patient safety guidelines.
2. `DEMONSTRATION DATA`: Realistic scenario archetypes for interface demonstrations and shift usability evaluation.
3. `AUTOMATED TEST INVARIANT`: Invariants verified via unit, integration, and E2E test suites (e.g. 100% boundary interception, 0 leaks).
4. `CLINICAL EVIDENCE`: Formal randomized clinical trial data *(Explicitly marked: Pending / Not Yet Performed)*.

---

## 3. Core Features & Capabilities

- **Rapid Structured Reporting** (`/report`): Guided multi-attribute incident submission completed in ~55 seconds.
- **Clinical Review Queue** (`/review`): Filterable, sortable incident triage with high-priority visual highlighting, reviewer note editing, and status lifecycles (`Submitted`, `Under Review`, `Action Required`, `Closed`).
- **CSV Data Export (CWE-1236 Protected)**: Browser export neutralizing formula injection attacks (`=`, `+`, `-`, `@`, `\t`, `\r`).
- **Executive Audit Report** (`/audit-report`): Printable clinical governance audit summary supporting direct print-to-PDF export.
- **Safety Dashboard** (`/dashboard`): Recharts visualization of incident categories, workflow stages, wards, and weekly volume time-series trends.
- **Patient Safety Journeys** (`/journeys`): Multi-stage clinical narratives contrasting pediatric dosing vs high-alert electrolyte near misses with interactive timeline steppers.
- **Stakeholder Validation Portal** (`/validation`): Domain reviews with explicit consent checkboxes and live evaluation submissions marked as `Pending Verification`.
- **Empirical Evaluation Dashboard** (`/evaluation`): Controlled comparative benchmark matrix evaluating completion velocity, data completeness, and actionable yield.
- **Evaluation Session Reconciliation**: Idempotent background reconciliation engine synchronizing unlinked reports with telemetry sessions.
- **Role-Based Access Control (RBAC)**: Dedicated `AuthProvider` supporting `ANONYMOUS`, `REPORTER`, `REVIEWER`, and `ADMIN` perspectives with seamless header role switching.
- **Tamper-Evident Audit Trail**: Audit event tracking logging critical report submissions, review modifications, and data exports.

---

## 4. Verification & Testing Pyramid

SafeDose enforces a 3-tier testing pyramid with 100% pass rates across all suites (total 57 automated tests: 49 unit/invariant tests + 8 Playwright E2E/WCAG tests):

| Tier | Test Suite | Runner | Scope & Coverage | Tests | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Unit & Invariant** | `safety.test.ts`, `evaluation.test.ts`, `auth.test.ts`, `audit.test.ts`, `export.test.ts`, `dashboard.test.ts`, `patientJourneys.test.ts`, `errorBoundary.test.ts` | Vitest | Safety boundaries, PII detection, completeness scoring, RBAC roles, audit logging, CWE-1236 CSV sanitization, timeline navigation, ErrorBoundary fallback & suppression | 8 Suites / 49 Tests | **49 / 49 Passing (100%)** |
| **Tier 2: Live Integration** | `supabase.integration.test.ts` | Vitest Integration | Live Supabase PostgreSQL database connectivity, schema verification, head queries, offline fallback | 1 Suite | **Passing / Resilient** |
| **Tier 3: End-to-End & A11y** | `manual_smoke_flow.spec.ts`, `accessibility_and_flows.spec.ts` | Playwright (Chromium) | Manual smoke test flow, report form submission, triage status update, timeline stepper, 403 access control, WCAG AA accessibility audit | 2 Files / 8 Tests | **8 / 8 Passing (100%)** |

> For granular test specifications, invariants, normal/boundary/failure test matrices, and clinical test philosophy, see [`docs/testing.md`](docs/testing.md).

### Running Test Suites
```bash
# Run unit tests (49 tests across 8 suites)
npm run test:unit

# Run live Supabase integration tests
npm run test:integration

# Run Playwright E2E and WCAG AA accessibility audit (8 tests)
npm run test:e2e

# Run all test suites
npm run test:all

# Complete verification pipeline (Lint, Typecheck, 49 Unit Tests, Production Build)
npm run verify
```

---

## 5. Database Schema & Entity Relationships

SafeDose utilizes a relational PostgreSQL schema managed via Supabase with strict Row Level Security (RLS) policies on all tables:

```
    ┌──────────────────────┐              ┌──────────────────────────┐
    │       PROFILES       │              │    NEAR_MISS_REPORTS     │
    ├──────────────────────┤              ├──────────────────────────┤
    │ id (UUID, PK)        │ 1 ──────── 0 │ id (UUID, PK)            │
    │ email (TEXT)         │   reports_   │ reporter_id (UUID, FK)   │
    │ role (user_role)     │   user_id_fk │ incident_type (TEXT)     │
    │ display_name (TEXT)  │              │ operational_priority     │
    │ department (TEXT)    │              │ status (report_status)   │
    └──────────────────────┘              └────────────┬─────────────┘
               │                                       │
               │ 1                                     │ 1
               │                                       │
               │ has_many                              │ 1:1 linked_session
               ▼                                       ▼
    ┌──────────────────────┐              ┌──────────────────────────┐
    │     AUDIT_EVENTS     │              │   EVALUATION_SESSIONS    │
    ├──────────────────────┤              ├──────────────────────────┤
    │ id (TEXT, PK)        │              │ id (UUID, PK)            │
    │ user_id (UUID, FK)   │              │ report_id (UUID, FK, UQ) │
    │ action (TEXT)        │              │ session_type (TEXT)      │
    │ resource_type (TEXT) │              │ completion_time_seconds  │
    │ resource_id (TEXT)   │              │ data_completeness_score  │
    │ details (JSONB)      │              └──────────────────────────┘
    └──────────────────────┘
```

| Table Name | Primary Key | Foreign Keys | Row Level Security (RLS) Policy | Operational Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`near_miss_reports`** | `id` (UUID) | `reporter_id` → `profiles(id)` | Anon/authenticated `INSERT`; Reporters view own; Reviewers/Admins view all & `UPDATE`. | Core medication near-miss incident repository with structured triage fields and zero-harm gatekeeping. |
| **`evaluation_sessions`**| `id` (UUID) | `report_id` → `near_miss_reports(id)` (UNIQUE) | Public/authenticated `INSERT` & `SELECT`; Admins full management. | System benchmarking telemetry recording completion speed, completeness scores, and heuristic concordance. |
| **`profiles`** | `id` (UUID) | References `auth.users(id)` | Users view own; Admins full management. | Authoritative user identities, display names, clinical departments, and RBAC roles (`REPORTER`, `REVIEWER`, `ADMIN`). |
| **`audit_events`** | `id` (TEXT) | `user_id` → `profiles(id)` | Append-only `INSERT` for authenticated/anon; Admins read-only `SELECT`; `UPDATE`/`DELETE` hard-blocked. | Immutable audit log capturing security, report submission, review triage, and export actions. |
| **`stakeholder_feedback`**| `id` (UUID) | None (consent metadata) | Public/authenticated `INSERT`; Authenticated `SELECT`. | Formally records domain expert evaluations, methodology feedback, and research consent. |

> Complete column definitions, data types, constraints, index strategies, and PostgreSQL RLS policies are documented in [`docs/database-schema.md`](docs/database-schema.md).

---

## 6. API Endpoints & PostgREST Data Operations

SafeDose interacts with PostgreSQL via Supabase's PostgREST API layer. All operations enforce least-privilege role boundaries and safe offline fallback:

| Operation ID | Supabase Table / Endpoint | REST Method | Authorized Roles | Primary Payload / Filters | Error Containment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OP-01** | `/rest/v1/near_miss_reports` | `POST` | `ANONYMOUS`, `REPORTER`, `REVIEWER`, `ADMIN` | Sanitized report record (15 structured fields; PII & medical advice stripped). | Non-blocking toast notification; returns client error on RLS violation. |
| **OP-02** | `/rest/v1/near_miss_reports` | `GET` | `REVIEWER`, `ADMIN` (All); `REPORTER` (Own) | Filtered by `status`, `operational_priority`, ordered by `created_at DESC`. | Empty list fallback with clinical error state banner. |
| **OP-03** | `/rest/v1/near_miss_reports?id=eq.{id}` | `PATCH` | `REVIEWER`, `ADMIN` | Status transition, reviewer notes, verified category/priority. | Reverts optimistic UI update on failure; audit event logged. |
| **OP-04** | `/rest/v1/evaluation_sessions` | `POST` | `ANONYMOUS`, `REPORTER`, `REVIEWER`, `ADMIN` | Session metrics (`completion_time_seconds`, `data_completeness_score`, `report_id`). | Silent background ingestion; failures do not disrupt report workflow. |
| **OP-05** | `/rest/v1/evaluation_sessions` | `GET` | Public / All | Benchmark telemetry joined with reports for comparative evaluation dashboard. | Falls back to deterministic synthetic baseline datasets. |
| **OP-06** | `/rest/v1/profiles?id=eq.{id}` | `GET` | Authenticated (`id = auth.uid()`) | Single profile lookup (`id, email, role, display_name, department`). | Falls back to JWT metadata if table is offline; defaults to `ANONYMOUS`. |
| **OP-07** | `/rest/v1/audit_events` | `POST` | All (Append-Only) | Sanitized event record (PII/secrets redacted; local ring buffer synced). | Dual-write: buffered in `localStorage` ring buffer if network is unreachable. |
| **OP-08** | `/rest/v1/audit_events` | `GET` | `ADMIN` only | Query last 50 audit entries ordered by `created_at DESC`. | Restricted by RLS; returns empty set to unauthorized roles. |
| **OP-09** | `/rest/v1/stakeholder_feedback` | `POST` | All | Clinical stakeholder feedback with consent confirmation and rating scores. | Non-blocking submission modal with success confirmation. |

> Complete request/response schemas, JSON payloads, headers, query parameters, and integration error handling are documented in [`docs/api-reference.md`](docs/api-reference.md).

---

## 7. Fault Tolerance & Error Boundary Architecture

SafeDose implements a multi-tiered resilience framework to guarantee high clinical availability:

- **React Error Boundary (`ErrorBoundary.tsx`)**: Wraps application route hierarchies to intercept unhandled JavaScript rendering exceptions:
  - **Fail-Safe Clinical Fallback**: Displays accessible diagnostic alert (`role="alert"`) with error message and action buttons.
  - **Stack Trace Suppression**: Prevents raw JavaScript stack traces and internal architecture leaks in production.
  - **Recovery Handlers**: Provides *"Try Again"* (component tree remount) and *"Return to SafeDose Home"* recovery actions.
  - **Isolated Unit Testing**: 6 automated tests verify error interception, clean state, reset execution, and fallback rendering.
- **Offline Data Resilience**: Dual-write pattern with 100-item local ring buffer ensures audit logs and telemetry are preserved even during acute network outages.
- **Graceful Network Degradation**: All UI dashboards fallback gracefully to deterministic synthetic benchmarks if remote Supabase endpoints are unreachable.

> Complete error classification (10 categories), containment analysis, and fallback UX are documented in [`docs/error-handling.md`](docs/error-handling.md).

---

## 8. Quickstart & Reproducibility CLI

### Installation
```bash
git clone https://github.com/barani-39/safedose-nearmiss.git
cd safedose-nearmiss
npm install
```

### Environment Configuration
Copy the environment template:
```bash
cp .env.example .env
```
Configure your Supabase credentials in `.env`:
```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
*(Note: SafeDose NearMiss operates in resilient local fallback mode if Supabase credentials are not provided or if the remote endpoint is unreachable).*

### Development Server
```bash
npm run dev
```

### Reproducible Evaluation Scripts
```bash
# Seed benchmark evaluation datasets (with production safety guards)
npm run seed

# Run mathematical system evaluation and display statistical comparison
npm run eval

# Export sanitized evaluation results and cryptographic SHA-256 checksums
npm run eval:export
```

---

## 9. Security, RBAC & Row Level Security

| Role | Operational Scope | Database Permissions |
| :--- | :--- | :--- |
| **`ANONYMOUS`** | Bedside healthcare worker | Public dashboard, patient journeys, anonymous near-miss submission (`INSERT` allowed; no attribution). |
| **`REPORTER`** | Ward nurse / clinician | Near-miss submission with optional staff identifier, personal confirmation viewing. |
| **`REVIEWER`** | Medication Safety Committee | Triage queue access, reviewer notes editing, category confirmation, priority adjustments. |
| **`ADMIN`** | Hospital Clinical Governance Lead | Full administrative access, audit event inspection, compliance data export. |

Detailed specifications are available in [`docs/security-and-roles.md`](docs/security-and-roles.md).

---

## 10. Documentation Index

Comprehensive engineering, scientific, and clinical documentation is organized in `docs/`:

- [`docs/testing.md`](docs/testing.md) — Granular unit testing documentation, 4-tier pyramid, per-suite invariants, normal/boundary/failure test matrix.
- [`docs/error-handling.md`](docs/error-handling.md) — React Error Boundary architecture, 10 error categories, containment analysis, fallback UI.
- [`docs/api-reference.md`](docs/api-reference.md) — Supabase PostgREST data contracts (OP-01 to OP-09), schemas, payloads, error containment.
- [`docs/database-schema.md`](docs/database-schema.md) — PostgreSQL table definitions, Mermaid ERD, column constraints, indexes, RLS policies.
- [`docs/verification.md`](docs/verification.md) — 3-Tier verification pipeline, CI workflow, and Playwright deterministic interception.
- [`docs/evaluation-methodology.md`](docs/evaluation-methodology.md) — Empirical scientific protocol, hypotheses, mathematical formulas, and limitation disclosures.
- [`docs/evaluation-sessions.md`](docs/evaluation-sessions.md) — Telemetry schema, relationship to reports, and reconciliation mechanism.
- [`docs/security-and-roles.md`](docs/security-and-roles.md) — RBAC permissions, PostgreSQL RLS policies, and tamper-evident audit logging.
- [`docs/stakeholder-validation.md`](docs/stakeholder-validation.md) — Domain review framework, consent requirements, and hospital trial roadmap.
- [`data/evaluation/README.md`](data/evaluation/README.md) — Dataset dictionary and benchmark scenario schemas.
- [`data/evaluation/provenance.md`](data/evaluation/provenance.md) — Ground truth provenance audit trail across all system metrics.

---

## 11. Explicit Disclaimers

> [!CAUTION]
> **Operational Prototype Notice**:
> - SafeDose NearMiss is an educational and operational safety research prototype.
> - **NOT MEDICAL ADVICE**: The platform does not prescribe, diagnose, adjust medication dosages, or recommend clinical treatments.
> - **ZERO-HARM BOUNDARY**: Events involving known patient harm must be escalated through formal institutional incident management channels (e.g. Datix, Ulysses, NRLS/LFPSE).
> - **PENDING CLINICAL VALIDATION**: Real-world acute hospital deployments and randomized clinical trials remain future research milestones subject to ethics and institutional governance board approvals.

