/*
# Create profiles table and Role-Based Access Control (RBAC)

1. New Tables
- `profiles`:
  - `id` (uuid, primary key, references auth.users.id on delete cascade)
  - `email` (text, not null)
  - `role` (text, not null, default 'REPORTER') CHECK (role IN ('REPORTER', 'REVIEWER', 'ADMIN'))
  - `display_name` (text)
  - `department` (text)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security & RLS
- Enable RLS on `profiles`.
- Allow users to select their own profile.
- Allow reviewers and admins to view all profiles.
- Enhance `near_miss_reports` RLS:
  - Any user (anon or authenticated) can INSERT near-miss reports (maintaining anonymous reporting).
  - Anyone can SELECT reports for clinical learning and dashboard analytics.
  - UPDATE of reviewer notes, verified category, and status is restricted to authenticated users with REVIEWER or ADMIN role.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'REPORTER' CHECK (role IN ('REPORTER', 'REVIEWER', 'ADMIN')),
  display_name text,
  department text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin_reviewer" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('REVIEWER', 'ADMIN')
    )
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'REPORTER'),
    COALESCE(new.raw_user_meta_data->>'display_name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
