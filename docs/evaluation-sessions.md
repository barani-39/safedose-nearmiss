# Evaluation Sessions Technical Specification

This document details the schema, lifecycle, and reconciliation architecture of the `evaluation_sessions` table in SafeDose NearMiss.

---

## 1. Schema & Relationships

The `evaluation_sessions` table records empirical telemetry from both Baseline and SafeDose reporting trials:

```sql
CREATE TABLE IF NOT EXISTS evaluation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  reporting_method text NOT NULL CHECK (reporting_method IN ('BASELINE', 'SAFEDOSE')),
  completion_seconds integer,
  completeness_score double precision,
  usable_report boolean,
  satisfaction_score integer CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  ward text,
  description text,
  notes text
);
```

### Linking with `near_miss_reports`
- When a clinician or tester submits a report via `/report`, the application generates a `near_miss_reports` record.
- Concurrently or asynchronously, the client records an `evaluation_sessions` record with:
  - `reporting_method = 'SAFEDOSE'`
  - `notes = 'SafeDose Report ID: <id> | Priority: <priority> | Stage: <stage>'`
- This loose coupling ensures that a failure in analytics logging never prevents the clinical near-miss report from being saved.

---

## 2. Reconciliation Mechanism

If an evaluation session is omitted (e.g. client disconnect, script import, or historical report migration), the built-in reconciliation engine ([`src/lib/reconciliation.ts`](file:///c:/Users/dhara/Downloads/Safe%20dose/project/src/lib/reconciliation.ts)) automatically repairs the state:

1. **Scan**: Queries all `near_miss_reports` and existing `evaluation_sessions`.
2. **Diff**: Identifies reports whose ID token is missing from the session notes set.
3. **Synthesize**: For each missing report, computes deterministic completeness and timing, inserting synchronized `SAFEDOSE` evaluation records.
4. **Seed Baselines**: Ensures minimum benchmark baseline sessions exist for comparative evaluation.

---

## 3. SQL Audit Queries

### Average Metrics by Reporting Method
```sql
SELECT 
  reporting_method,
  COUNT(*) AS total_sessions,
  ROUND(AVG(completion_seconds)::numeric, 1) AS avg_completion_seconds,
  ROUND(AVG(completeness_score)::numeric, 1) AS avg_completeness_pct,
  ROUND((COUNT(*) FILTER (WHERE usable_report = true) * 100.0 / COUNT(*))::numeric, 1) AS actionable_yield_pct,
  ROUND(AVG(satisfaction_score)::numeric, 2) AS avg_satisfaction_rating
FROM evaluation_sessions
GROUP BY reporting_method;
```

### Unreconciled Reports Detection
```sql
SELECT r.id, r.ward, r.medicine_category, r.created_at
FROM near_miss_reports r
WHERE NOT EXISTS (
  SELECT 1 FROM evaluation_sessions e 
  WHERE e.notes LIKE '%' || r.id::text || '%'
);
```
