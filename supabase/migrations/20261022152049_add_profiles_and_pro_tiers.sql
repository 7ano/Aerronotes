/*
# Add profiles table and is_pro column for tier management

## Overview
Introduces a user profile system for MIAT Central's Free/Pro tier management.
Since this is a no-auth single-tenant app, a single profile row is used to
track whether the current user has Pro access. Resources and quiz questions
get an `is_pro` flag to distinguish free vs premium content.

## New Tables
- `profiles`
  - `id` (uuid, PK)
  - `is_pro` (boolean, default false) — whether the user has Pro tier access
  - `created_at` (timestamptz)

## Modified Tables
- `resources`
  - Added `is_pro` (boolean, default false) — marks premium resources
- `quiz_questions`
  - Added `is_pro` (boolean, default false) — marks premium quiz questions

## Security
- RLS enabled on `profiles`.
- CRUD granted to `anon, authenticated` — single-tenant no-auth app.
- Public read/insert/update/delete — data is intentionally shared.

## Seed Data
- One profile row with is_pro = false (the default free user).
- Marks several existing resources and quiz questions as Pro-only.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_pro boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_profiles" ON profiles;
CREATE POLICY "public_read_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_insert_profiles" ON profiles;
CREATE POLICY "public_insert_profiles" ON profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "public_update_profiles" ON profiles;
CREATE POLICY "public_update_profiles" ON profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_delete_profiles" ON profiles;
CREATE POLICY "public_delete_profiles" ON profiles FOR DELETE
  TO anon, authenticated USING (true);

-- Add is_pro columns to resources and quiz_questions
ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false;

-- Seed a default profile (ensure at least one row exists)
INSERT INTO profiles (id, is_pro)
SELECT gen_random_uuid(), false
WHERE NOT EXISTS (SELECT 1 FROM profiles);

-- Mark premium resources (past papers and lab manuals as Pro content)
UPDATE resources SET is_pro = true WHERE type IN ('past_paper', 'lab_manual');
-- Also mark some EASA PDF summaries as Pro
UPDATE resources SET is_pro = true WHERE track = 'easa' AND type = 'pdf_summary' AND subject IN ('Turbine Aerodynamics', 'Maintenance Practices');

-- Mark premium quiz questions (M11A and M7 as Pro)
UPDATE quiz_questions SET is_pro = true WHERE module_code IN ('M11A', 'M7');
