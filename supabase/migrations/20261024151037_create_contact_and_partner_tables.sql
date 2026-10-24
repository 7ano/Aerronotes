/*
# Create contact_submissions and partner_inquiries tables

1. New Tables
- `contact_submissions`: Stores messages from the Contact Us form.
  - id (uuid PK), name (text), email (text), subject_type (text: inquiry/support/feedback),
    message (text), created_at (timestamptz)
- `partner_inquiries`: Stores applications from the Partner with AeroNotes form.
  - id (uuid PK), name (text), email (text), role (text: student/club/lecturer/study_group/other),
    organization (text), message (text), created_at (timestamptz)

2. Security
- Both tables are single-tenant public-write: anyone (anon + authenticated) can submit.
- Only service_role can read (admin review). No anon/authenticated SELECT.
- RLS enabled on both. INSERT-only policies for anon + authenticated.
- No UPDATE or DELETE policies for anon/authenticated.
*/

CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject_type text NOT NULL DEFAULT 'inquiry',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON contact_submissions TO anon, authenticated;
GRANT SELECT ON contact_submissions TO service_role;

DROP POLICY IF EXISTS "anon_insert_contact" ON contact_submissions;
CREATE POLICY "anon_insert_contact" ON contact_submissions FOR INSERT
TO anon, authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS partner_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'student',
  organization text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE partner_inquiries ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON partner_inquiries TO anon, authenticated;
GRANT SELECT ON partner_inquiries TO service_role;

DROP POLICY IF EXISTS "anon_insert_partner" ON partner_inquiries;
CREATE POLICY "anon_insert_partner" ON partner_inquiries FOR INSERT
TO anon, authenticated WITH CHECK (true);
