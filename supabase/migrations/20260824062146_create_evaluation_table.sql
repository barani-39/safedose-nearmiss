/*
# Create evaluation_sessions table

1. New Tables
- `evaluation_sessions`: Stores evaluation session data for comparing Baseline vs SafeDose reporting.
  - `id` (uuid, primary key, auto-generated)
  - `created_at` (timestamptz, default now())
  - `reporting_method` (text, not null) — 'BASELINE' or 'SAFEDOSE'
  - `completion_seconds` (integer, nullable) — time to complete the report
  - `completeness_score` (double precision, nullable) — 0–100 deterministic score
  - `usable_report` (boolean, nullable) — whether the report was usable
  - `satisfaction_score` (integer, nullable) — 1–5 satisfaction rating
  - `ward` (text, nullable) — ward entered during the session
  - `description` (text, nullable) — free-text from the session
  - `notes` (text, nullable) — any additional notes

2. Security
- Enable RLS on `evaluation_sessions`.
- Allow anon + authenticated full CRUD — educational prototype, no auth required.
*/

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

ALTER TABLE evaluation_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_eval" ON evaluation_sessions;
CREATE POLICY "anon_select_eval" ON evaluation_sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_eval" ON evaluation_sessions;
CREATE POLICY "anon_insert_eval" ON evaluation_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_eval" ON evaluation_sessions;
CREATE POLICY "anon_delete_eval" ON evaluation_sessions FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_eval_method ON evaluation_sessions (reporting_method);
CREATE INDEX IF NOT EXISTS idx_eval_created ON evaluation_sessions (created_at DESC);
