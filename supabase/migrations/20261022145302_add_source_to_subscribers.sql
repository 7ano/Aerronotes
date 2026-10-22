/*
# Add source column to subscribers table

## Overview
The subscription form needs to track where each signup came from.
This adds a `source` text column to the `subscribers` table.

## Modified Tables
- `subscribers`
  - Added `source` (text, nullable, defaults to 'website_footer') — identifies
    which form/widget the subscription came from (e.g. 'website_footer',
    'dashboard_card').

## Security
- No policy changes needed — the existing INSERT policy with WITH CHECK (true)
  already allows inserting any columns the table has.
*/

ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS source text DEFAULT 'website_footer';
