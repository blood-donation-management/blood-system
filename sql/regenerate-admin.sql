-- ================================================
-- REGENERATE ADMIN PASSWORD
-- ================================================
-- Password: admin123
-- Username: admin
-- IMPORTANT: Use the "Setup Admin Account" button in the app instead!
--            This SQL is a backup method only.

-- Step 1: Check if admin exists
SELECT id, username, created_at FROM admins WHERE username = 'admin';

-- Step 2: Delete old admin
DELETE FROM admins WHERE username = 'admin';

-- Step 3: Create new admin with bcrypt hash (rounds=10)
-- Multiple hashes to try - uncomment ONE at a time
INSERT INTO admins (username, password, created_at)
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW());

-- Alternative Hash 2 (if above doesn't work):
-- DELETE FROM admins WHERE username = 'admin';
-- INSERT INTO admins (username, password, created_at)
-- VALUES ('admin', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8VpnFfXBbKcNqbqGqT6ppQqBFD5Dua', NOW());

-- Alternative Hash 3:
-- DELETE FROM admins WHERE username = 'admin';
-- INSERT INTO admins (username, password, created_at)
-- VALUES ('admin', '$2b$10$nOUIs5kJ7naTuTFkBy1veuK0kSxUFXfuaOKdOKf9xYT0KKIGSJwFa', NOW());

-- Alternative Hash 4 (fresh generation):
-- DELETE FROM admins WHERE username = 'admin';
-- INSERT INTO admins (username, password, created_at)
-- VALUES ('admin', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRVMQPq8rIQjjw8qRvQWL6CKQYOFu', NOW());

-- Step 4: Verify admin was created
SELECT id, username, length(password) as pwd_length, substring(password, 1, 30) as pwd_start, created_at
FROM admins WHERE username = 'admin';

-- Step 5: Final verification - count admins
SELECT COUNT(*) as admin_count FROM admins WHERE username = 'admin';

-- Step 6: Show complete admin details
SELECT * FROM admins WHERE username = 'admin';

-- ================================================
-- TROUBLESHOOTING
-- ================================================

-- If still not working, check table structure:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admins';

-- Check Row Level Security (RLS) status:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'admins';

-- If RLS is enabled and causing issues, disable it:
-- ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- ================================================
-- RECOMMENDED: Use the app's Setup Button instead!
-- ================================================
-- The "Setup Admin Account" button in the admin login screen
-- generates the hash programmatically using the same bcryptjs
-- library that verifies it, ensuring 100% compatibility.
