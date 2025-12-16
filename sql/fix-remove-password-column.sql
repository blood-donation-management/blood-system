-- ================================================
-- FIX: Remove password column from donors table
-- ================================================
-- The donors table shouldn't have a password column
-- because we're using Supabase Auth (auth.users stores passwords)

-- Remove the password column
ALTER TABLE donors DROP COLUMN IF EXISTS password;

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'donors'
ORDER BY ordinal_position;

-- Expected columns (NO password column):
-- id, name, email, blood_group, location, phone_number,
-- status, verified, verification_note, last_donation_date,
-- created_at, updated_at
