/*
# Create audit_events table

1. New Tables
- `audit_events`: Stores tamper-evident operational and administrative audit trails
  - `id` (uuid, primary key, auto-generated)
  - `created_at` (timestamptz, default now())
  - `user_id` (uuid, nullable)
  - `user_role` (text, not null)
  - `action` (text, not null)
  - `resource_type` (text, not null)
  - `resource_id` (text, nullable)
  - `details` (jsonb, not null, default '{}'::jsonb)

2. Security & RLS
- Enable RLS on `audit_events`.
- Allow INSERT for anon and authenticated users (append-only log).
- Allow SELECT only for users with ADMIN or REVIEWER role.
*/

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  user_role text NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Append-only for all clients
CREATE POLICY "audit_events_insert_all" ON audit_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Read restricted to authenticated reviewers and admins
CREATE POLICY "audit_events_select_reviewer_admin" ON audit_events FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('REVIEWER', 'ADMIN')
    )
  );

CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events (action);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource ON audit_events (resource_type, resource_id);
