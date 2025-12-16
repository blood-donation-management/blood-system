-- Add ban_expiry column to donors table for temporary bans
-- This allows admins to ban users for a specific number of days

-- Add the ban_expiry column (nullable timestamp)
ALTER TABLE donors 
ADD COLUMN IF NOT EXISTS ban_expiry TIMESTAMPTZ;

-- Add a comment to document the column
COMMENT ON COLUMN donors.ban_expiry IS 'Timestamp when a temporary ban expires. NULL means permanent ban or no ban.';

-- Optional: Create an index for efficient queries on active bans
CREATE INDEX IF NOT EXISTS idx_donors_ban_expiry ON donors(ban_expiry) 
WHERE status = 'suspended' AND ban_expiry IS NOT NULL;

-- Optional: Create a function to automatically unban users when their ban expires
CREATE OR REPLACE FUNCTION auto_unban_expired_users()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE donors
  SET status = 'active',
      ban_expiry = NULL,
      updated_at = NOW()
  WHERE status = 'suspended' 
    AND ban_expiry IS NOT NULL 
    AND ban_expiry <= NOW();
END;
$$;

-- Optional: You can set up a cron job or trigger to run this function periodically
-- For now, this function can be called manually or via a scheduled task

COMMENT ON FUNCTION auto_unban_expired_users IS 'Automatically unbans users whose temporary ban has expired';
