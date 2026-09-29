# Security, RBAC & Row Level Security (RLS) Specification

This document details the authentication architecture, Role-Based Access Control (RBAC), Row Level Security (RLS) policies, and audit trail enforcement in SafeDose NearMiss.

---

## 1. Role-Based Access Control (RBAC) Architecture

SafeDose operates four explicit access levels:

| Role | Access Description | Permissions |
| :--- | :--- | :--- |
| **`ANONYMOUS`** | Unauthenticated bedside reporter | Can view public dashboard metrics, patient journeys, privacy commitments, and submit anonymous near-miss reports. No attribution stored. |
| **`REPORTER`** | Authenticated ward nurse / clinician | Can submit near-miss reports with optional reporter identity, track confirmation status, and access shift educational benchmarks. |
| **`REVIEWER`** | Clinical Safety Committee member | Full triage access to `/review`, can update status (`Submitted`, `Under Review`, `Action Required`, `Closed`), author reviewer notes, and confirm clinical category. |
| **`ADMIN`** | Clinical Governance & Hospital Lead | Full system access, audit trail inspection, user role administration, and compliance export. |

---

## 2. Row Level Security (RLS) Policies

All tables in PostgreSQL enforce strict Row Level Security:

### `near_miss_reports` Table
- **SELECT**: Accessible by all (`anon`, `authenticated`) to enable transparent institutional learning, dashboard trends, and safety huddle reviews.
- **INSERT**: Permitted for all (`anon`, `authenticated`). Maintains zero-barrier reporting.
- **UPDATE**: Restricted to authenticated users with `REVIEWER` or `ADMIN` roles. Reporters cannot edit or delete submitted records once entered.
- **DELETE**: Restricted to `ADMIN` role with an associated audit event logged.

### `audit_events` Table
- **INSERT**: Append-only for all sessions.
- **SELECT**: Strictly restricted to `REVIEWER` and `ADMIN` profiles.
- **UPDATE / DELETE**: Forbidden. The audit trail is immutable.

---

## 3. Tamper-Evident Audit Logging

All safety-critical operations trigger structured audit entries:

- `REPORT_SUBMITTED`: Logged on report ingestion with unique report UUID.
- `REPORT_STATUS_CHANGED`: Logged when report transitions from `Submitted` to `Under Review`, `Action Required`, or `Closed`.
- `REVIEWER_NOTES_UPDATED`: Logged when clinical notes or verified categories are updated.
- `REPORT_EXPORTED`: Logged when datasets are exported to CSV or PDF with requesting role attribution.
- `EVALUATION_RECONCILED`: Logged when evaluation sessions are synchronized.
