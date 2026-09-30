# SafeDose Backend & Data Operations Reference

**Project:** SafeDose NearMiss (`barani-39/safedose-nearmiss`)  
**Backend Architecture:** Supabase (PostgreSQL 15+ with PostgREST, GoTrue Auth, and Row Level Security)  

> [!NOTE]
> SafeDose currently uses Supabase/PostgreSQL as its backend rather than a custom REST API. Therefore, this document specifies the application's effective data operations, client-side SDK contracts, input payloads, returned data structures, authorized roles, and failure handling pathways.

---

## 1. Overview of Data Operations & Contracts

All database communication occurs via the PostgREST interface exposed by Supabase using the `@supabase/supabase-js` client SDK. Every operation is subjected to:
1. **Network Connectivity Verification:** Handled gracefully via local fallbacks.
2. **PostgreSQL Row Level Security (RLS):** Evaluated server-side on every request based on JWT claims and `profiles` table roles.
3. **Client-Side Parameter Validation:** Pre-validated before transmission to prevent invalid state queries.

```
[ Frontend Component ]
         │
         ▼
[ Supabase JS Client (`src/lib/supabase.ts`) ]
         │  (JWT Bearer Token / Anon Key)
         ▼
[ PostgREST Gateway (`/rest/v1/*`) ]
         │
         ▼
[ PostgreSQL RLS Policies (`supabase/migrations/*`) ]
         │
         ▼
[ Database Tables (`near_miss_reports`, `profiles`, etc.) ]
```

---

## 2. Operations Reference Catalog

### OP-01: Create Near-Miss Report
- **Frontend Source:** [`src/pages/ReportForm.tsx`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/src/pages/ReportForm.tsx)
- **Target Table:** `near_miss_reports`
- **Action Type:** `INSERT`
- **Authorized Roles:** `ANONYMOUS`, `REPORTER`, `REVIEWER`, `ADMIN` (Public least-privilege submission)
- **Input Payload:**
  ```typescript
  interface ReportInsert {
    ward: string;
    custom_ward?: string | null;
    medicine_category: string;
    workflow_stage: string;
    incident_type: string;
    operational_priority: 'LOW' | 'MEDIUM' | 'HIGH';
    contributing_factors: string[];
    short_description: string;
    immediate_action?: string | null;
    medication_administered: 'Yes' | 'No' | 'Unsure';
    patient_harm_status: 'No' | 'Yes' | 'Unsure';
    anonymous: boolean;
    reporter_identifier?: string | null;
    suggested_category?: string | null;
    suggestion_confidence?: string | null;
  }
  ```
- **Return Value:** `{ id: string }`
- **Failure Behavior:** If the network request fails or the database rejects the insert, `setSubmitError` displays: *"Backend service is currently unavailable. Please verify network connectivity or try again later."* The form input is preserved; no false confirmation screen is rendered.
- **Secondary Actions:** Automatically triggers OP-05 (`CREATE EVALUATION SESSION`) and OP-08 (`APPEND AUDIT EVENT`) in non-blocking fashion.

---

### OP-02: Retrieve Review Queue
- **Frontend Source:** [`src/pages/ReviewQueue.tsx`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/src/pages/ReviewQueue.tsx)
- **Target Table:** `near_miss_reports`
- **Action Type:** `SELECT`
- **Authorized Roles:** `REVIEWER`, `ADMIN` (Enforced via `<ProtectedRoute />` and PostgreSQL RLS)
- **Query Parameters:**
  - `status`: Filter by `'All'` | `'Submitted'` | `'Under Review'` | `'Action Required'` | `'Closed'`
  - `priority`: Filter by `'All'` | `'HIGH'` | `'MEDIUM'` | `'LOW'`
  - `ward`: Filter by ward string
  - Order: `created_at DESC`
- **Return Value:** Array of `NearMissReport` objects.
- **Failure Behavior:** If the database query fails or the server is offline, falls back gracefully to in-memory demonstration records with a notice to the reviewer.

---

### OP-03: Retrieve Single Report Detail
- **Frontend Source:** [`src/pages/ReportDetail.tsx`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/src/pages/ReportDetail.tsx)
- **Target Table:** `near_miss_reports`
- **Action Type:** `SELECT`
- **Authorized Roles:** `REVIEWER`, `ADMIN` (Enforced via `<ProtectedRoute />` and PostgreSQL RLS)
- **Input Filter:** `id = eq.{reportId}` (Single record query via `.single()`)
- **Return Value:** Single `NearMissReport` record including timestamps, contributing factors, description, automated suggestion, and existing reviewer notes.
- **Failure Behavior:** If no matching record is found, displays a clean *"Report not found"* message with a link to return to the review queue.

---

### OP-04: Update Report Review & Classification
- **Frontend Source:** [`src/pages/ReportDetail.tsx`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/src/pages/ReportDetail.tsx)
- **Target Table:** `near_miss_reports`
- **Action Type:** `UPDATE`
- **Authorized Roles:** `REVIEWER`, `ADMIN` strictly (Anonymous and normal Reporter updates are blocked by PostgreSQL RLS policy `reviewers_admins_update_reports`)
- **Input Payload:**
  ```typescript
  interface ReportUpdate {
    status?: 'Submitted' | 'Under Review' | 'Action Required' | 'Closed';
    reviewer_notes?: string;
    human_verified_category?: string;
    operational_priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    reviewed_at?: string;
  }
  ```
- **Return Value:** Updated `NearMissReport` record.
- **Failure Behavior:** Rejection by RLS or network drop displays a warning alert without modifying previous state; triggers OP-08 audit log with failure status.

---

### OP-05: Create Evaluation Telemetry Session
- **Frontend Source:** [`src/pages/ReportForm.tsx`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/src/pages/ReportForm.tsx) & [`src/pages/BaselineForm.tsx`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/src/pages/BaselineForm.tsx)
- **Target Table:** `evaluation_sessions`
- **Action Type:** `INSERT`
- **Authorized Roles:** `ANONYMOUS`, `REPORTER`, `REVIEWER`, `ADMIN`
- **Input Payload:**
  ```typescript
  interface EvaluationSessionInsert {
    reporting_method: 'BASELINE' | 'SAFEDOSE';
    completion_seconds: number;
    completeness_score: number;
    usable_report: boolean;
    satisfaction_score: number;
    ward: string;
    description: string;
    notes?: string;
  }
  ```
- **Return Value:** Inserted session record with generated UUID.
- **Failure Behavior:** Non-blocking error handling (`console.warn`); failure to record telemetry does not prevent or delay the primary incident report submission.

---

### OP-06: Retrieve Evaluation Benchmark Sessions
- **Frontend Source:** [`src/pages/Evaluation.tsx`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/src/pages/Evaluation.tsx) & [`scripts/run-evaluation.ts`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/scripts/run-evaluation.ts)
- **Target Table:** `evaluation_sessions`
- **Action Type:** `SELECT`
- **Authorized Roles:** Public / All (Evaluation transparency)
- **Query Filter:** `order by created_at desc`
- **Return Value:** Array of `EvaluationSession` records used to compute mean completion duration, completeness score, usable report percentage, and satisfaction scores.
- **Failure Behavior:** If the database is offline, loads deterministic offline benchmark fixtures (N=33) from [`data/evaluation/near_miss_cases.csv`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/data/evaluation/near_miss_cases.csv).

---

### OP-07: Submit Stakeholder Validation Review
- **Frontend Source:** [`src/pages/StakeholderValidation.tsx`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/src/pages/StakeholderValidation.tsx)
- **Target Table:** `stakeholder_feedback`
- **Action Type:** `INSERT`
- **Authorized Roles:** Clinicians, Nurses, Pharmacists, Safety Officers (`consent_given = true` constraint enforced by database RLS)
- **Input Payload:**
  ```typescript
  interface StakeholderFeedbackInsert {
    id: string;
    name: string;
    role: string;
    organization: string;
    department?: string;
    feedback: string;
    rating: number; // 1 to 5
    psychological_safety_rating: number; // 1 to 5
    consent_given: boolean; // must be true
    status: 'Pending Verification';
    is_synthetic: boolean;
  }
  ```
- **Return Value:** `{ id: string }`
- **Failure Behavior:** Displays an inline alert if validation fails or consent checkbox was omitted; successful submission displays confirmation message.

---

### OP-08: Append Audit Event
- **Frontend Source:** [`src/lib/audit.ts`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/src/lib/audit.ts)
- **Target Table:** `audit_events`
- **Action Type:** `INSERT`
- **Authorized Roles:** Append-only for all roles; `UPDATE` and `DELETE` denied to all roles.
- **Input Payload:**
  ```typescript
  interface AuditEventInsert {
    id: string;
    user_id?: string | null;
    user_role: string;
    action: string;
    resource_type: string;
    resource_id?: string | null;
    details: Record<string, unknown>; // PII and sensitive tokens stripped
  }
  ```
- **Return Value:** Void / Confirmation.
- **Failure Behavior:** If the database insert rejects or network is disconnected, the event is immediately captured in the client-side offline ring buffer (`safedose_audit_log`) with `is_buffered_offline: true`.

---

### OP-09: Authentication & Profile Resolution
- **Frontend Source:** [`src/contexts/AuthContext.tsx`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/src/contexts/AuthContext.tsx)
- **Target Services:** Supabase GoTrue Auth (`/auth/v1/user`, `/auth/v1/token`) + `profiles` table
- **Action Type:** `SELECT`
- **Authorized Roles:** Authenticated users querying their own profile (`id = auth.uid()`), or Reviewers/Admins querying committee profiles.
- **Return Value:**
  ```typescript
  interface UserProfile {
    id: string;
    email: string;
    role: 'REPORTER' | 'REVIEWER' | 'ADMIN';
    display_name?: string;
    department?: string;
  }
  ```
- **Failure Behavior:** If no valid session or profile exists, role is securely set to `'ANONYMOUS'` with zero elevated privileges.
