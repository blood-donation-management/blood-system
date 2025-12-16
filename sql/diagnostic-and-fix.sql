-- ================================================
-- DATABASE DIAGNOSTIC & FIX
-- ================================================
-- Run this to check and fix common database issues

-- ================================================
-- CHECK 1: Verify Tables Exist
-- ================================================
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
    AND table_name IN ('donors', 'admins', 'blood_requests')
ORDER BY table_name;

-- Expected: 3 tables (donors, admins, blood_requests)

-- ================================================
-- CHECK 2: Verify Donors Table Structure
-- ================================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'donors'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid), name (varchar), email (varchar), blood_group (varchar),
-- location (varchar), phone_number (varchar), status (varchar),
-- verified (boolean), verification_note (text), last_donation_date (timestamp),
-- created_at (timestamp), updated_at (timestamp)

-- ================================================
-- CHECK 3: Check RLS Status
-- ================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('donors', 'admins', 'blood_requests')
ORDER BY tablename;

-- RLS should be:
-- donors: false (or true with proper policies)
-- admins: false (MUST be false for direct queries)
-- blood_requests: false (or true with proper policies)

-- ================================================
-- FIX 1: Disable RLS on All Tables
-- ================================================
-- Run these if RLS is causing issues:

ALTER TABLE donors DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests DISABLE ROW LEVEL SECURITY;

-- ================================================
-- FIX 2: Check for Duplicate Constraints
-- ================================================
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'donors'::regclass
ORDER BY conname;

-- ================================================
-- FIX 3: Check Existing Donors
-- ================================================
SELECT 
    id,
    name,
    email,
    blood_group,
    phone_number,
    status,
    verified,
    created_at
FROM donors
ORDER BY created_at DESC
LIMIT 10;

-- ================================================
-- FIX 4: Check Auth Users
-- ================================================
SELECT 
    id,
    email,
    created_at,
    confirmed_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ================================================
-- FIX 5: Find Orphaned Auth Users (No Profile)
-- ================================================
SELECT 
    u.id,
    u.email,
    u.created_at,
    CASE 
        WHEN d.id IS NULL THEN 'NO PROFILE'
        ELSE 'HAS PROFILE'
    END as status
FROM auth.users u
LEFT JOIN donors d ON u.id = d.id
ORDER BY u.created_at DESC;

-- If you see users with 'NO PROFILE', use Profile Recovery screen for them

-- ================================================
-- FIX 6: Clean Up Orphaned Auth Users (CAREFUL!)
-- ================================================
-- ONLY run this if you want to delete auth users without profiles
-- UNCOMMENT to use:

/*
DELETE FROM auth.users
WHERE id IN (
    SELECT u.id
    FROM auth.users u
    LEFT JOIN donors d ON u.id = d.id
    WHERE d.id IS NULL
);
*/

-- ================================================
-- FIX 7: Recreate Donors Table (NUCLEAR OPTION)
-- ================================================
-- ONLY use this if table is completely broken
-- THIS WILL DELETE ALL DONOR DATA!
-- UNCOMMENT to use:

/*
DROP TABLE IF EXISTS blood_requests CASCADE;
DROP TABLE IF EXISTS donors CASCADE;

CREATE TABLE donors (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    blood_group VARCHAR(10) NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    location VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    verified BOOLEAN DEFAULT false,
    verification_note TEXT,
    last_donation_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_donors_email ON donors(email);
CREATE INDEX idx_donors_phone ON donors(phone_number);
CREATE INDEX idx_donors_blood_group ON donors(blood_group);
CREATE INDEX idx_donors_location ON donors(location);

ALTER TABLE donors DISABLE ROW LEVEL SECURITY;
*/

-- ================================================
-- VERIFICATION
-- ================================================
-- After fixes, verify everything:

-- 1. Check RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- 2. Try a test insert (replace UUID with a real one)
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
    gen_random_uuid(),
    'Test User',
    'test' || floor(random() * 10000) || '@example.com',
    'O+',
    'Test City',
    '+88012345' || floor(random() * 10000),
    'active',
    false,
    NOW()
);
*/

-- 3. Check if insert worked
SELECT COUNT(*) FROM donors;
