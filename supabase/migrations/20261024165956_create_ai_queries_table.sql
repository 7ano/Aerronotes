/*
# Create ai_queries table for AI Tutor daily usage tracking

## Summary
- Creates a new `ai_queries` table to track each AI Tutor message a user sends, used to enforce the 5-queries-per-24-hours free-tier limit.
- Enables RLS so only authenticated users can read/insert their own query rows.

## New Tables
- `ai_queries`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to the authenticated user) — references auth.users
  - `query_text` (text, not null) — the user's question
  - `response_text` (text, nullable) — the AI response (stored for history)
  - `created_at` (timestamptz, defaults to now()) — used for 24h window calculations

## Security
- Enable RLS on `ai_queries`.
- Grant SELECT, INSERT to `authenticated` (the app requires sign-in to use AI Tutor).
- Owner-scoped policies: each authenticated user can only read and insert their own rows.
- `user_id` defaults to `auth.uid()` so inserts that omit it still succeed.
*/

CREATE TABLE IF NOT EXISTS ai_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  query_text text NOT NULL,
  response_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_queries ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON ai_queries TO authenticated;

DROP POLICY IF EXISTS "select_own_ai_queries" ON ai_queries;
CREATE POLICY "select_own_ai_queries" ON ai_queries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_ai_queries" ON ai_queries;
CREATE POLICY "insert_own_ai_queries" ON ai_queries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_queries_user_created ON ai_queries (user_id, created_at DESC);
