# SafeDose Error Handling & Clinical Fault Resilience Model

**Project:** SafeDose NearMiss (`barani-39/safedose-nearmiss`)  
**Scope:** Systematic classification of failure modes, containment boundaries, recovery mechanisms, and clinical safety implications.  

---

## 1. Overview & Architectural Resilience Principles

In acute healthcare software, unhandled runtime crashes, data loss, and silent failures pose real risks to patient safety and staff trust. A nurse who encounters an unhandled white-screen crash or loses an in-progress near-miss report is significantly less likely to report future near misses.

SafeDose NearMiss is engineered around four core fault-containment principles:

1. **Zero-Harm Redirection:** Severe events involving actual patient harm are never recorded as near misses; they are actively intercepted and redirected to immediate clinical escalation pathways.
2. **Defensive Non-Fabrication:** If a network or backend service is offline, the system never fabricates success. It presents an honest, transparent notice to the user and retains the data locally where feasible.
3. **Graceful UI Containment:** Component render faults are caught by React Error Boundaries at the routing perimeter, keeping the global navigation and header operational.
4. **Resilient Offline Buffering:** Auditing events and near-miss telemetry are stored in an in-browser ring buffer when connectivity drops and automatically synchronized when restored.

---

## 2. Failure Mode Summary Matrix

| Error Category | Detection Layer | User-Visible Response | Recovery Pathway | Data Persistence |
|:---|:---|:---|:---|:---|
| **1. Form Validation Error** | Client (DOM / React State) | Inline red field alerts; submit button disabled for advice queries | Correct invalid input; submit becomes enabled immediately | Retained in form state |
| **2. Backend / Network Failure** | Supabase Client / Fetch API | *"Backend service is currently unavailable. Please verify network connectivity or try again later."* | User can retry immediately without retyping data | In-memory form state preserved |
| **3. Authentication Failure** | `AuthContext` / Supabase Auth | Transparent fallback to `ANONYMOUS` perspective; no login crash | Re-authenticate via hospital SSO or continue anonymously | Anonymous reporting remains operational |
| **4. Authorization Failure (403)** | `ProtectedRoute` | HTTP 403 Forbidden: *"Restricted Clinical Area"* screen with required privilege details | Navigate to public pages or log in with verified reviewer role | Protected route blocked; no data leaked |
| **5. Database / RLS Rejection** | PostgreSQL RLS Engine | Error banner in review queue; update rejected | Authenticate with verified committee role (`REVIEWER`/`ADMIN`) | Rejected modification is discarded |
| **6. Unexpected UI Crash** | React `ErrorBoundary` | Application Resilience Notice: *"Something went wrong while loading this section"* | Click *"Try Again"* or *"Return to SafeDose Home"* | Preserved; stack trace suppressed |
| **7. CSV Export Failure** | Browser Blob / File API | Alert notification if download blocked; sanitization warning | Retry export; check browser download permissions | Source records unaffected |
| **8. Evaluation Telemetry Fault** | `ReportForm.tsx` (Non-blocking) | Report submission proceeds uninterrupted; non-fatal warning in console | Automatic reconciliation engine catches unlinked records | Near-miss report is guaranteed durable |
| **9. Empty Analytics State** | `Dashboard.tsx` Analytics Engine | Informative empty-state cards: *"No Incident Reports Recorded Yet"* | Await incoming submissions; seed demo data if in dev mode | Clean zero-count render |
| **10. Audit Buffering Overflow** | `audit.ts` Ring Buffer | Silent FIFO eviction of oldest entries; 7-day TTL cleanup | Automatic buffer flush on next successful server interaction | Top 100 recent events retained |

---

## 3. Detailed Failure Mode Analysis

### 3.1. Form Validation & Safety Guardrail Interception
- **Detection Mechanism:** Evaluated in real-time in `src/pages/ReportForm.tsx` on input change and submit attempt.
- **Safety Interceptions:**
  - *Medical Advice Query:* Detected via regex pattern matching (`detectMedicalAdviceQuery`). If the narrative asks for clinical diagnosis, dosing instructions, or treatment guidance, an amber disclaimer banner appears and the submit button is strictly disabled.
  - *Actual Patient Harm:* If the reporter selects `patient_harm_status === 'Yes'`, an urgent clinical warning banner appears advising immediate escalation to the hospital's serious adverse incident reporting team.
  - *Unnecessary Patient PII:* Detected via regex patterns (`detectPII`) scanning for UK NHS numbers, phone numbers, email addresses, and patient identifiers. A cautionary reminder prompts the user to anonymize the narrative.
  - *Required Fields:* Ward, medicine category, workflow stage, incident type, priority, and administered status must be selected. Missing fields highlight in red.
- **Recovery:** Users edit the form in-place; all typed text is preserved.

### 3.2. Supabase / Backend Network Failures
- **Detection Mechanism:** Caught in `try...catch` blocks wrapping `supabase.from('near_miss_reports').insert(...)`.
- **User Response:** An accessible error banner displays:  
  `"Backend service is currently unavailable. Please verify network connectivity or try again later."`
- **Clinical Safety Implication:** The system never simulates a successful submission if the database write failed. The nurse retains their typed description and can retry when connectivity is restored or copy their narrative to standard hospital systems.

### 3.3. Authentication Failures & Session Expiration
- **Detection Mechanism:** Checked on mount and on auth state change in `src/contexts/AuthContext.tsx`.
- **Behavior:**
  - If a JWT is expired, corrupted, or unparseable, `@supabase/auth-js` clears the invalid token.
  - SafeDose catches the `null` session and unconditionally drops the effective role to `ANONYMOUS`.
  - In production mode (`VITE_DEMO_ROLE_SWITCHER !== 'true'`), client-side `localStorage` tampering is ignored.
- **Recovery:** Staff can submit reports anonymously without interruption, ensuring psychological safety is never compromised by an expired session.

### 3.4. Authorization Failures (HTTP 403 Forbidden)
- **Detection Mechanism:** Handled by `src/components/ProtectedRoute.tsx`.
- **Protected Areas:** `/review`, `/review/:id`, `/audit-report`.
- **User Response:** Renders a dedicated HTTP 403 Forbidden screen:
  - Header: *"Restricted Clinical Area"*
  - Explanation: *"This module requires verified REVIEWER or ADMIN privileges. Your current effective role is ANONYMOUS."*
  - Action Button: *"Return to SafeDose Home"*
- **Security Relevance:** Completely eliminates unauthorized access to clinical reviews or patient safety incident triage queues via direct URL manipulation.

### 3.5. Database Row Level Security (RLS) Rejection
- **Detection Mechanism:** Enforced server-side in PostgreSQL via migration `20260930000002_harden_rls_security.sql`.
- **Enforced Boundaries:**
  - `near_miss_reports`: Anonymous users can `INSERT`, but cannot `UPDATE` or `DELETE`.
  - `profiles`: Users cannot elevate their own `role` column.
  - `audit_events`: Append-only; `UPDATE` and `DELETE` are denied to all users.
  - `stakeholder_feedback`: Must have `consent_given = true`.
- **Behavior:** PostgREST returns HTTP 403 or 401. The frontend catches the error and displays a non-destructive rejection alert.

### 3.6. Unexpected React Render Exceptions (React Error Boundary)
- **Detection Mechanism:** Implemented in `src/components/ErrorBoundary.tsx` wrapping the core `<Routes />` inside `src/App.tsx`.
- **Containment:**
  - When an unexpected component render fault occurs, the Error Boundary catches it via `getDerivedStateFromError`.
  - Prevents the entire browser window from turning blank (white screen of death).
  - Keeps the top navigation bar, hospital branding, and perspective selector intact.
- **User Response:** Displays an accessible resilience card:
  - *"Something went wrong while loading this section"*
  - *"Your report data has not been intentionally changed."*
  - Provides a *"Try Again"* button to reset the boundary and a *"Return to SafeDose Home"* link.
- **Stack Trace Suppression:** Internal code traces, source file paths, and environment tokens are completely suppressed from the user interface and logged only to the diagnostic console.

### 3.7. CSV Export Failures & Spreadsheet Sanitization
- **Detection Mechanism:** Handled in `src/lib/exportUtils.ts`.
- **Protection:** All cell values are passed through `sanitizeForCSV()`. Formula trigger characters (`=`, `+`, `-`, `@`, `\t`, `\r`) are prefixed with `'`. Legitimate negative numbers (e.g. `-5`, `"-42"`, `-12.5`) are preserved.
- **Failure Handling:** If the browser blocks blob creation or automatic download, an alert guides the user to verify download settings.

### 3.8. Evaluation Telemetry Faults
- **Detection Mechanism:** Handled in `ReportForm.tsx` inside an independent `try...catch` block.
- **Isolation Strategy:** When a near-miss report is submitted, an evaluation telemetry session (`evaluation_sessions`) is recorded to compute completion duration and completeness.
- **Fault Independence:** If recording the evaluation session fails (e.g. telemetry schema mismatch), the error is logged as a non-fatal warning (`console.warn`) and the primary report confirmation flow proceeds normally. Patient safety reports are never dropped due to secondary analytics telemetry faults.

### 3.9. Empty Analytics & Trend Data States
- **Detection Mechanism:** Handled in `src/pages/Dashboard.tsx`.
- **Behavior:** If the database contains zero records or only records with unaligned dates, `computeDashboardStats` returns zero counts and `computeWeeklyTrends` returns an empty array.
- **User Response:** Recharts visualizers render a graceful *"No Incident Reports Recorded Yet"* state rather than rendering broken charts or crashing.

### 3.10. Offline Audit Trail Ring Buffering
- **Detection Mechanism:** Handled in `src/lib/audit.ts`.
- **Behavior:**
  - When Supabase is unreachable, audit events are preserved in `localStorage` under `safedose_audit_log`.
  - Sensitive passwords, tokens, and descriptions are redacted before storage.
  - To prevent storage exhaustion, the local buffer is capped at a maximum of 100 entries and drops events older than 7 days (FIFO eviction).
  - Background flushing occurs automatically when connectivity is re-established.
