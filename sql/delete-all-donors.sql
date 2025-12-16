-- ================================================
-- DELETE ALL DONORS
-- ================================================
-- WARNING: This will delete ALL donor records
-- Use this to clean up the database

-- Step 1: Check current donor count
SELECT COUNT(*) as total_donors FROM donors;

-- Step 2: View all donors before deletion
SELECT id, name, email, blood_group, location, created_at FROM donors;

-- Step 3: Delete all donors
DELETE FROM donors;

-- Step 4: Verify deletion
SELECT COUNT(*) as remaining_donors FROM donors;

-- ================================================
-- DELETE SUPABASE AUTH USERS (Required!)
-- ================================================
-- The donors table is now empty, but Supabase Auth users still exist
-- You MUST delete them to allow re-registration with the same email

-- Step 5: View all auth users
SELECT id, email, created_at FROM auth.users;

-- Step 6: Delete all auth users
-- Note: Run this in Supabase Dashboard if SQL Editor doesn't have permission
DELETE FROM auth.users;

-- Alternative: Delete specific user by email
-- DELETE FROM auth.users WHERE email = 'user@example.com';

-- Step 7: Verify auth users deleted
SELECT COUNT(*) as remaining_auth_users FROM auth.users;
