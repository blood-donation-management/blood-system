-- ================================================
-- CLEANUP TEST/MOCK DATA
-- ================================================
-- This script removes test donors and their associated requests
-- Run this to show only real-time notifications

-- Step 1: Delete test blood requests (older than 1 day or from test donors)
-- You can adjust the timeframe as needed
DELETE FROM blood_requests
WHERE created_at < NOW() - INTERVAL '1 day'
  OR donor_id IN (
    SELECT id FROM donors 
    WHERE email LIKE '%test%' 
       OR email LIKE '%example.com'
       OR name LIKE 'Test %'
  );

-- Step 2: Delete test donors
DELETE FROM donors
WHERE email LIKE '%test%' 
   OR email LIKE '%example.com'
   OR name LIKE 'Test %'
   OR phone_number LIKE '017123450%'; -- Test phone numbers

-- Step 3: Keep only recent requests (optional - uncomment if needed)
-- DELETE FROM blood_requests
-- WHERE created_at < NOW() - INTERVAL '7 days';

-- Step 4: Verify remaining data
SELECT 
  'Blood Requests' as table_name,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM blood_requests

UNION ALL

SELECT 
  'Donors' as table_name,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM donors;

-- Step 5: Show current pending notifications
SELECT 
  br.id,
  br.status,
  br.created_at,
  d.name as donor_name,
  d.blood_group
FROM blood_requests br
LEFT JOIN donors d ON d.id = br.donor_id
WHERE br.status = 'pending'
ORDER BY br.created_at DESC;
