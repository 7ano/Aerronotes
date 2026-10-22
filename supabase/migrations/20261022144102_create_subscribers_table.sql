/*
# Create subscribers table

## Overview
Stores email addresses for the MIAT Central newsletter subscription.
Single-tenant, no-auth app — any visitor can subscribe.

## New Tables
- `subscribers`
  - `id` (uuid, PK)
  - `email` (text, UNIQUE, NOT NULL) — the subscriber's email address
  - `created_at` (timestamptz) — subscription timestamp

## Security
- RLS enabled on `subscribers`.
- CRUD granted to `anon, authenticated` (no-auth app).
- Public read/insert/update/delete — data is intentionally shared.
- UNIQUE constraint on email prevents duplicate subscriptions.
*/

CREATE TABLE IF NOT EXISTS subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON subscribers TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_subscribers" ON subscribers;
CREATE POLICY "public_read_subscribers" ON subscribers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_subscribers" ON subscribers;
CREATE POLICY "public_insert_subscribers" ON subscribers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_subscribers" ON subscribers;
CREATE POLICY "public_update_subscribers" ON subscribers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_subscribers" ON subscribers;
CREATE POLICY "public_delete_subscribers" ON subscribers FOR DELETE
  TO anon, authenticated USING (true);
