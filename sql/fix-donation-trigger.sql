-- ================================================
-- FIX: Update donation trigger function to use correct column name
-- ================================================
-- This fixes the error: column "user_id" does not exist
-- The donors table uses 'id' as primary key, not 'user_id'

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS trigger_update_last_donation ON blood_donations;
DROP FUNCTION IF EXISTS update_donor_last_donation();

-- Recreate function with correct column name
CREATE OR REPLACE FUNCTION update_donor_last_donation()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the donor's last_donation_date to the most recent donation
  UPDATE donors
  SET 
    last_donation_date = NEW.donation_date,
    updated_at = NOW()
  WHERE id = NEW.donor_id;  -- Changed from user_id to id
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER trigger_update_last_donation
AFTER INSERT ON blood_donations
FOR EACH ROW
EXECUTE FUNCTION update_donor_last_donation();

-- Verify the fix
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_last_donation';
