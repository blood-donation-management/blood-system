-- ================================================
-- ADMIN ACCOUNT SETUP & VERIFICATION
-- ================================================

-- ================================================
-- STEP 1: Check if admins table exists
-- ================================================
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admins'
) as table_exists;

-- ================================================
-- STEP 2: Check current admins
-- ================================================
SELECT id, username, created_at, 
       length(password) as password_length,
       substring(password, 1, 7) as password_start
FROM admins;

-- ================================================
-- STEP 3: Delete existing admin (if any)
-- ================================================
DELETE FROM admins WHERE username = 'admin';

-- ================================================
-- STEP 4: Create new admin account
-- ================================================
-- Username: admin
-- Password: admin123
-- The password is already hashed with bcrypt
INSERT INTO admins (username, password)
VALUES ('admin', '$2a$10$rEwBqHZPWfPJKT7VEq3HxuLZ6YP6hqF3JhxQ8vJQK8MkDqJKGmhLi');

-- ================================================
-- STEP 5: Verify it was created correctly
-- ================================================
SELECT 
    id, 
    username, 
    created_at,
    length(password) as password_length,
    substring(password, 1, 7) as password_prefix
FROM admins 
WHERE username = 'admin';

-- Expected output:
-- - username: admin
-- - password_length: 60 (bcrypt hashes are always 60 chars)
-- - password_prefix: $2a$10$

-- ================================================
-- STEP 6: Check RLS status on admins table
-- ================================================
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'admins';

-- If rowsecurity is true, disable it:
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- ================================================
-- STEP 7: Final verification
-- ================================================
SELECT COUNT(*) as admin_count FROM admins WHERE username = 'admin';
-- Should return 1

-- ================================================
-- LOGIN CREDENTIALS:
-- ================================================
-- Username: admin
-- Password: admin123
--
-- Hash verification:
-- The password 'admin123' hashes to:
-- $2a$10$rEwBqHZPWfPJKT7VEq3HxuLZ6YP6hqF3JhxQ8vJQK8MkDqJKGmhLi
--
-- You can verify at: https://bcrypt-generator.com/
-- Input: admin123
-- Rounds: 10
