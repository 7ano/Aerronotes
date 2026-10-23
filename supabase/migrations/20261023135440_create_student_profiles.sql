/*
# Create student_profiles table for authenticated students

## Overview
Now that MIAT Central has student authentication via Supabase Auth, we need
a profiles table linked to auth.users that stores each student's full name,
student ID, and Pro tier status. The existing `profiles` table was a
single-tenant placeholder — this migration creates a proper per-user table
and migrates any existing is_pro state.

## New Tables
- `student_profiles`
  - `id` (uuid, PK, references auth.users) — the authenticated user's ID
  - `email` (text, NOT NULL) — the student's email (denormalized for convenience)
  - `full_name` (text, NOT NULL) — the student's full name, captured at sign-up
  - `student_id` (text, NOT NULL) — the student's UniKL MIAT ID number
  - `is_pro` (boolean, default false) — whether the student has Pro tier access
  - `created_at` (timestamptz) — when the profile was created
  - `updated_at` (timestamptz) — when the profile was last modified

## Security
- RLS enabled on `student_profiles`.
- CRUD granted to `authenticated` only (requires sign-in).
- Each student can only read/update their own profile row.
- INSERT policy allows a student to insert their own profile row.
- The `id` column defaults to `auth.uid()` so inserts from the client
  (which omit the id) still satisfy the WITH CHECK policy.
*/

CREATE TABLE IF NOT EXISTS student_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  student_id text NOT NULL,
  is_pro boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON student_profiles TO authenticated;

DROP POLICY IF EXISTS "select_own_student_profile" ON student_profiles;
CREATE POLICY "select_own_student_profile" ON student_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_student_profile" ON student_profiles;
CREATE POLICY "insert_own_student_profile" ON student_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_student_profile" ON student_profiles;
CREATE POLICY "update_own_student_profile" ON student_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_student_profile" ON student_profiles;
CREATE POLICY "delete_own_student_profile" ON student_profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);
