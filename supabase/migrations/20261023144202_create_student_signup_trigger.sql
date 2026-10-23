/*
# Create on_student_signed_up trigger for auto-creating student_profiles

## Overview
When a new student signs up via Supabase Auth, their full_name and
student_id are stored in auth.users.raw_user_meta_data (passed via
options.data in signUp). This trigger automatically creates a
matching row in student_profiles so the frontend never has to
manually insert it.

## Changes
- Creates function `handle_new_student_profile()` that reads
  raw_user_meta_data for full_name, student_id, and email, then
  inserts a row into student_profiles.
- Creates trigger `on_student_signed_up` that fires AFTER INSERT
  on auth.users, calling the function.
- The trigger is SECURITY DEFINER so it can write to student_profiles
  even though the inserting user is not yet authenticated.
- Function search_path is set to 'public' for security.

## Important Notes
1. The function runs with elevated privileges (SECURITY DEFINER) so
   it can insert into student_profiles which has RLS enabled.
2. REVOKE EXECUTE from PUBLIC and anon so only the trigger can call it.
3. email is sourced from the NEW record's email column; full_name and
   student_id come from raw_user_meta_data.
*/

CREATE OR REPLACE FUNCTION public.handle_new_student_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.student_profiles (id, email, full_name, student_id, is_pro)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'student_id', ''),
    false
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_student_profile() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS on_student_signed_up ON auth.users;

CREATE TRIGGER on_student_signed_up
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_student_profile();
