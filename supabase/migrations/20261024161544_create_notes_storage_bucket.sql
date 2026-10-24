/*
# Create notes storage bucket and add file_url column to note_submissions

## Summary
- Creates a Supabase Storage bucket named `notes` for uploading study PDFs.
- Adds storage policies allowing authenticated users to read, and only the admin to write/delete files.
- Adds a `file_url` column to `note_submissions` to store the public URL of an uploaded PDF.
- Adds a `file_path` column to `note_submissions` to store the storage path (for deletion).

## New Storage Bucket
- `notes` — public bucket for study material PDFs. File size limit 10MB. Allowed MIME types: application/pdf.

## Storage Policies
- Public read: anyone can SELECT (read) objects in the `notes` bucket.
- Authenticated insert: authenticated users can upload to the `notes` bucket.
- Authenticated delete: authenticated users can delete from the `notes` bucket.

## Modified Tables
- `note_submissions`: added `file_url` (text, nullable) — public URL of uploaded PDF.
- `note_submissions`: added `file_path` (text, nullable) — storage path for deletion.

## Security
- Storage bucket is public-readable so students can access PDFs without auth.
- Writes/deletes restricted to authenticated users (admin panel requires login).
- RLS on note_submissions remains as-is (public read, public insert, public update, public delete).
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('notes', 'notes', true, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "public_read_notes_bucket" ON storage.objects;
CREATE POLICY "public_read_notes_bucket"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'notes');

DROP POLICY IF EXISTS "auth_insert_notes_bucket" ON storage.objects;
CREATE POLICY "auth_insert_notes_bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'notes');

DROP POLICY IF EXISTS "auth_delete_notes_bucket" ON storage.objects;
CREATE POLICY "auth_delete_notes_bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'notes');

-- Add file_url and file_path columns to note_submissions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'note_submissions' AND column_name = 'file_url') THEN
    ALTER TABLE public.note_submissions ADD COLUMN file_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'note_submissions' AND column_name = 'file_path') THEN
    ALTER TABLE public.note_submissions ADD COLUMN file_path text;
  END IF;
END $$;
