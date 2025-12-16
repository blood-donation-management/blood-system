-- ================================================
-- CREATE TEST DONOR PROFILE
-- ================================================
-- ⚠️ RECOMMENDED: Use the Profile Recovery screen in the app instead!
--    It's much easier and does this automatically.
--    Go to: Login screen → "Having login issues? Fix Profile →"
--
-- Only use this SQL if you prefer manual database work.
-- ================================================

-- ================================================
-- STEP 1: Find your Auth User ID
-- ================================================
-- Run ONLY this query first:

SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- ⚠️ STOP HERE! Copy your user ID from the results above.
-- Then continue to Step 2.

-- ================================================
-- STEP 2: Create Donor Profile
-- ================================================
-- IMPORTANT: Don't run this directly! Follow these steps:
-- 1. Copy your User ID from Step 1 results
-- 2. Replace 'YOUR-USER-ID-HERE' below with your actual UUID
-- 3. Update the other values (name, email, etc.)
-- 4. Then uncomment and run the INSERT

/*
-- UNCOMMENT THIS AFTER REPLACING VALUES:

INSERT INTO donors (
    id,
    name,
    email,
    blood_group,
    location,
    phone_number,
    status,
    verified,
    created_at
) VALUES (
    'YOUR-USER-ID-HERE',  -- ← PASTE YOUR USER ID HERE (from Step 1)
    'Test User',          -- ← Change to your name
    'test@example.com',   -- ← Change to your email (must match auth.users email)
    'O+',                 -- ← Change to your blood group
    'Dhaka, Bangladesh',  -- ← Change to your location
    '+8801234567890',     -- ← Change to your phone
    'active',
    false,
    NOW()
);
*/

-- ================================================
-- STEP 3: Verify Profile Created
-- ================================================
-- After running the INSERT above, verify with:
/*
SELECT * FROM donors 
WHERE email = 'test@example.com'  -- ← Change to your email
ORDER BY created_at DESC;
*/

-- ================================================
-- EXAMPLE: Complete Working Example
-- ================================================
-- Let's say your user ID is: 12345678-1234-1234-1234-123456789abc
-- And your email is: john@example.com

-- The insert would look like:
/*
INSERT INTO donors (
    id,
    name,
    email,
    blood_group,
    location,
    phone_number,
    status,
    verified,
    created_at
) VALUES (
    '12345678-1234-1234-1234-123456789abc',
    'John Doe',
    'john@example.com',
    'A+',
    'Dhaka, Bangladesh',
    '+8801712345678',
    'active',
    false,
    NOW()
);
*/

-- ================================================
-- ALTERNATIVE: Use the Profile Recovery Screen!
-- ================================================
-- Instead of running SQL, you can use the app:
-- 1. Go to Login screen
-- 2. Tap "Having login issues? Fix Profile →"
-- 3. Fill in the form
-- 4. Create profile automatically!
