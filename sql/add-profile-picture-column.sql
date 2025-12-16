-- ================================================
-- ADD PROFILE PICTURE COLUMN TO DONORS TABLE
-- ================================================

-- Step 1: Add profile_picture_url column
ALTER TABLE donors 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Step 2: Verify column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'donors' 
AND column_name = 'profile_picture_url';

-- Step 3: Check existing donors
SELECT id, name, email, profile_picture_url
FROM donors
LIMIT 10;
