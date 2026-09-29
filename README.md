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

SafeDose enforces a 3-tier testing pyramid with 100% pass rates across all suites:

| Tier | Test Suite | Runner | Tests | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Unit & Invariant** | Safety boundaries, PII detection, completeness scoring, RBAC roles, audit logging, CWE-1236 CSV sanitization | Vitest | 25 Tests | **25 / 25 Passing** |
| **Tier 2: Live Integration** | Supabase database connectivity, schema verification, head queries | Vitest Integration | 1 Suite | **Passing / Resilient** |
| **Tier 3: End-to-End & A11y** | Manual smoke test flow, form submission, triage status update, WCAG AA accessibility audit | Playwright (Chromium) | 6 Tests | **6 / 6 Passing** |

### Running Test Suites
```bash
# Run unit tests
npm run test:unit

# Run live Supabase integration tests
npm run test:integration

# Run Playwright E2E and WCAG AA accessibility audit
npm run test:e2e

# Run all test suites
npm run test:all

# Complete verification pipeline (Lint, Typecheck, Unit Tests, Production Build)
npm run verify
```

---

## 5. Quickstart & Reproducibility CLI

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

## 6. Security, RBAC & Row Level Security

| Role | Operational Scope | Database Permissions |
| :--- | :--- | :--- |
| **`ANONYMOUS`** | Bedside healthcare worker | Public dashboard, patient journeys, anonymous near-miss submission (`INSERT` allowed; no attribution). |
| **`REPORTER`** | Ward nurse / clinician | Near-miss submission with optional staff identifier, personal confirmation viewing. |
| **`REVIEWER`** | Medication Safety Committee | Triage queue access, reviewer notes editing, category confirmation, priority adjustments. |
| **`ADMIN`** | Hospital Clinical Governance Lead | Full administrative access, audit event inspection, compliance data export. |

Detailed specifications are available in [`docs/security-and-roles.md`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/docs/security-and-roles.md).

---

## 7. Documentation Index

Comprehensive engineering, scientific, and clinical documentation is organized in `docs/`:

- [`docs/verification.md`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/docs/verification.md) — 3-Tier verification pipeline, CI workflow, and Playwright deterministic interception.
- [`docs/evaluation-methodology.md`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/docs/evaluation-methodology.md) — Empirical scientific protocol, hypotheses, mathematical formulas, and limitation disclosures.
- [`docs/evaluation-sessions.md`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/docs/evaluation-sessions.md) — Telemetry schema, relationship to reports, and reconciliation mechanism.
- [`docs/security-and-roles.md`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/docs/security-and-roles.md) — RBAC permissions, PostgreSQL RLS policies, and tamper-evident audit logging.
- [`docs/stakeholder-validation.md`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/docs/stakeholder-validation.md) — Domain review framework, consent requirements, and hospital trial roadmap.
- [`data/evaluation/README.md`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/data/evaluation/README.md) — Dataset dictionary and benchmark scenario schemas.
- [`data/evaluation/provenance.md`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/data/evaluation/provenance.md) — Ground truth provenance audit trail across all system metrics.

---

## 8. Explicit Disclaimers

> [!CAUTION]
> **Operational Prototype Notice**:
> - SafeDose NearMiss is an educational and operational safety research prototype.
> - **NOT MEDICAL ADVICE**: The platform does not prescribe, diagnose, adjust medication dosages, or recommend clinical treatments.
> - **ZERO-HARM BOUNDARY**: Events involving known patient harm must be escalated through formal institutional incident management channels (e.g. Datix, Ulysses, NRLS/LFPSE).
> - **PENDING CLINICAL VALIDATION**: Real-world acute hospital deployments and randomized clinical trials remain future research milestones subject to ethics and institutional governance board approvals.
