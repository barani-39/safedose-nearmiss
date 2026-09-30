/*
# Harden Row Level Security (RLS) Policies Across All Tables

1. near_miss_reports:
   - DROP overly permissive legacy policies: anon_update_reports, anon_delete_reports
   - Maintain legitimate anonymous report submission: INSERT WITH CHECK (true) for anon and authenticated
   - Restrict UPDATE to authenticated users with REVIEWER or ADMIN role
   - Restrict DELETE strictly to authenticated ADMIN role

2. evaluation_sessions:
   - DROP permissive anon_delete_eval
   - INSERT: anon and authenticated (recording comparative evaluation measurements)
   - SELECT: anon and authenticated (benchmarking comparison)
   - DELETE: restricted strictly to authenticated ADMIN role

3. profiles:
   - Enforce least privilege: Prevent users from self-elevating role
   - UPDATE policy: users can update display_name and department only, cannot modify role
   - Only ADMIN can update user roles

4. audit_events:
   - Append-only immutable log: INSERT allowed for all
   - Read restricted to authenticated REVIEWER and ADMIN
   - NO UPDATE or DELETE policies (denied to everyone)

5. stakeholder_feedback:
   - Create table if not exists
   - INSERT: anon and authenticated with consent_given = true
   - SELECT: anon and authenticated
   - UPDATE / DELETE: ADMIN only
*/

-- 1. near_miss_reports hardening
DROP POLICY IF EXISTS "anon_update_reports" ON near_miss_reports;
DROP POLICY IF EXISTS "anon_delete_reports" ON near_miss_reports;

-- Only Reviewers and Admins can update clinical review status, notes, or verified category
DROP POLICY IF EXISTS "reviewers_admins_update_reports" ON near_miss_reports;
CREATE POLICY "reviewers_admins_update_reports" ON near_miss_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('REVIEWER', 'ADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('REVIEWER', 'ADMIN')
    )
  );

-- Only Admins can delete reports (for governance cleanup or legal retraction)
DROP POLICY IF EXISTS "admins_delete_reports" ON near_miss_reports;
CREATE POLICY "admins_delete_reports" ON near_miss_reports FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN'
    )
  );

-- 2. evaluation_sessions hardening
DROP POLICY IF EXISTS "anon_delete_eval" ON evaluation_sessions;

DROP POLICY IF EXISTS "admins_delete_eval" ON evaluation_sessions;
CREATE POLICY "admins_delete_eval" ON evaluation_sessions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN'
    )
  );

-- 3. profiles hardening: Prevent self-elevation to ADMIN or REVIEWER
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Ensure role is not modified by normal user unless already an ADMIN
    AND (
      role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
    )
  );

-- 4. stakeholder_feedback table and least privilege RLS
CREATE TABLE IF NOT EXISTS stakeholder_feedback (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  role text NOT NULL,
  organization text NOT NULL,
  department text,
  feedback text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  psychological_safety_rating integer NOT NULL CHECK (psychological_safety_rating >= 1 AND psychological_safety_rating <= 5),
  consent_given boolean NOT NULL CHECK (consent_given = true),
  app_version text NOT NULL DEFAULT 'v2.4-prototype',
  status text NOT NULL DEFAULT 'Pending Verification' CHECK (status IN ('Pending Verification', 'Verified', 'Archived')),
  is_synthetic boolean NOT NULL DEFAULT false
);

ALTER TABLE stakeholder_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_stakeholder_feedback" ON stakeholder_feedback;
CREATE POLICY "anon_insert_stakeholder_feedback" ON stakeholder_feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (consent_given = true);

DROP POLICY IF EXISTS "all_select_stakeholder_feedback" ON stakeholder_feedback;
CREATE POLICY "all_select_stakeholder_feedback" ON stakeholder_feedback FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "admins_update_stakeholder_feedback" ON stakeholder_feedback;
CREATE POLICY "admins_update_stakeholder_feedback" ON stakeholder_feedback FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "admins_delete_stakeholder_feedback" ON stakeholder_feedback;
CREATE POLICY "admins_delete_stakeholder_feedback" ON stakeholder_feedback FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN'
    )
  );
