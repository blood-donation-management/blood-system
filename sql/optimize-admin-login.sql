-- Optimize Admin Login Performance
-- This script helps improve admin login speed by updating password hashes to use 8 bcrypt rounds

-- IMPORTANT: After running this script, you need to reset admin passwords using the app
-- The app will now generate hashes with 8 rounds (optimized for mobile) instead of 10 rounds

-- Step 1: Check current admin accounts
SELECT id, username, created_at 
FROM admins;

-- Step 2: To reset an admin password with optimized hash:
-- Use the "Setup Admin Account" button in the admin login screen (development mode)
-- OR manually create a new admin with bcrypt hash using 8 rounds

-- Step 3: Security recommendations:
-- 1. Never use default credentials (admin/admin123) in production
-- 2. Use strong, unique passwords for each admin
-- 3. Disable the setup button in production builds
-- 4. Consider implementing password change functionality
-- 5. Monitor admin login attempts

-- Optional: Add a last_login timestamp to track admin activity
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Optional: Add a failed_login_attempts counter for security
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;

-- Optional: Add a locked_until timestamp for account lockout after failed attempts
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Optional: Create a function to reset failed login attempts after successful login
CREATE OR REPLACE FUNCTION reset_admin_failed_attempts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.failed_login_attempts := 0;
  NEW.locked_until := NULL;
  NEW.last_login := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note about bcrypt rounds:
-- - 10 rounds (default): ~200-300ms on mobile devices
-- - 8 rounds (optimized): ~100-150ms on mobile devices
-- - 8 rounds still provides adequate security for most use cases
-- - For high-security requirements, consider 10 rounds with loading indicators

COMMENT ON COLUMN admins.last_login IS 'Timestamp of the last successful admin login';
COMMENT ON COLUMN admins.failed_login_attempts IS 'Counter for failed login attempts (for security lockout)';
COMMENT ON COLUMN admins.locked_until IS 'Account locked until this timestamp after too many failed attempts';
