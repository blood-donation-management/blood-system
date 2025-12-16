-- ================================================
-- ADD REJECTION REASON TO BLOOD REQUESTS
-- ================================================
-- This adds a column to store the reason when a donor rejects a request

-- Add rejection_reason column to blood_requests table
ALTER TABLE blood_requests
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add comment to the column
COMMENT ON COLUMN blood_requests.rejection_reason IS 'Reason provided by donor when rejecting a blood request';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'blood_requests'
AND column_name = 'rejection_reason';
