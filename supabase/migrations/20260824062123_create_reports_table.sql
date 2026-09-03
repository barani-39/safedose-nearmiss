/*
# Create near_miss_reports table

1. New Tables
- `near_miss_reports`: Stores medication near-miss reports submitted by hospital staff.
  - `id` (uuid, primary key, auto-generated)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
  - `ward` (text, not null) — ward/area where the event occurred
  - `custom_ward` (text, nullable) — custom ward name if "Other" was selected
  - `medicine_category` (text, not null) — broad medicine category
  - `workflow_stage` (text, not null) — stage in the medication workflow
  - `incident_type` (text, not null) — type of incident
  - `operational_priority` (text, not null) — LOW, MEDIUM, HIGH review priority
  - `contributing_factors` (text[], not null) — array of contributing factor tags
  - `short_description` (text, not null) — narrative of what happened
  - `immediate_action` (text, nullable) — what was done immediately
  - `medication_administered` (text, not null) — Yes/No/Unsure
  - `patient_harm_status` (text, not null) — No/Yes/Unsure
  - `anonymous` (boolean, not null, default true) — whether report is anonymous
  - `reporter_identifier` (text, nullable) — only set if not anonymous
  - `status` (text, not null, default 'Submitted') — Submitted/Under Review/Action Required/Closed
  - `reviewer_notes` (text, nullable) — notes added by safety reviewer
  - `suggested_category` (text, nullable) — automated suggestion
  - `suggestion_confidence` (text, nullable) — heuristic confidence
  - `human_verified_category` (text, nullable) — reviewer-confirmed classification
  - `reviewed_at` (timestamptz, nullable) — when reviewer last saved changes
  - `is_synthetic` (boolean, not null, default false) — marks demo data

2. Security
- Enable RLS on `near_miss_reports`.
- Allow anon + authenticated full CRUD — this is a no-auth educational prototype where data is intentionally shared.
*/

CREATE TABLE IF NOT EXISTS near_miss_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  ward text NOT NULL,
  custom_ward text,
  medicine_category text NOT NULL,
  workflow_stage text NOT NULL,
  incident_type text NOT NULL,
  operational_priority text NOT NULL CHECK (operational_priority IN ('LOW', 'MEDIUM', 'HIGH')),
  contributing_factors text[] NOT NULL DEFAULT '{}',
  short_description text NOT NULL,
  immediate_action text,
  medication_administered text NOT NULL CHECK (medication_administered IN ('Yes', 'No', 'Unsure')),
  patient_harm_status text NOT NULL CHECK (patient_harm_status IN ('No', 'Yes', 'Unsure')),
  anonymous boolean NOT NULL DEFAULT true,
  reporter_identifier text,
  status text NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Action Required', 'Closed')),
  reviewer_notes text,
  suggested_category text,
  suggestion_confidence text,
  human_verified_category text,
  reviewed_at timestamptz,
  is_synthetic boolean NOT NULL DEFAULT false
);

ALTER TABLE near_miss_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reports" ON near_miss_reports;
CREATE POLICY "anon_select_reports" ON near_miss_reports FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reports" ON near_miss_reports;
CREATE POLICY "anon_insert_reports" ON near_miss_reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reports" ON near_miss_reports;
CREATE POLICY "anon_update_reports" ON near_miss_reports FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_reports" ON near_miss_reports;
CREATE POLICY "anon_delete_reports" ON near_miss_reports FOR DELETE
  TO anon, authenticated USING (true);

-- Index for default sort order
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON near_miss_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON near_miss_reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON near_miss_reports (operational_priority);
CREATE INDEX IF NOT EXISTS idx_reports_ward ON near_miss_reports (ward);
