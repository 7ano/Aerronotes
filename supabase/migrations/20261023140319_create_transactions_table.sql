/*
# Create transactions table for ToyyibPay payment tracking

## Overview
Stores ToyyibPay bill codes and payment status for Pro upgrade
transactions. Each row tracks a student's payment attempt from
bill creation through verification.

## New Tables
- `transactions`
  - `id` (uuid, PK)
  - `user_id` (uuid, references auth.users) — the student who initiated the payment
  - `bill_code` (text, NOT NULL) — the billCode returned by ToyyibPay createBill API
  - `bill_amount` (integer, NOT NULL) — amount in cents (1500 = RM 15.00)
  - `status` (text, NOT NULL, default 'pending') — 'pending', 'paid', 'failed'
  - `created_at` (timestamptz) — when the transaction was created
  - `updated_at` (timestamptz) — when the transaction was last updated

## Security
- RLS enabled on `transactions`.
- CRUD granted to `authenticated` only (requires sign-in).
- Each student can only read/insert their own transaction rows.
- The `user_id` column defaults to `auth.uid()` so client inserts
  that omit it still satisfy the WITH CHECK policy.
*/

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_code text NOT NULL,
  bill_amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO authenticated;

DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_transactions" ON transactions;
CREATE POLICY "insert_own_transactions" ON transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_transactions" ON transactions;
CREATE POLICY "update_own_transactions" ON transactions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_transactions" ON transactions;
CREATE POLICY "delete_own_transactions" ON transactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bill_code ON transactions(bill_code);
