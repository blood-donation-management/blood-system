-- ================================================
-- CLEANUP TEST/MOCK DATA
-- ================================================
-- This script removes test donors and their associated requests
-- Run this to show only real-time notifications

-- Step 1: Delete ALL old blood requests (keeps the system fresh)
-- This removes ALL existing requests so you see only new real-time ones
DELETE FROM blood_requests;

-- Step 2: Delete test donors (optional - comment out if you want to keep them)
DELETE FROM donors
WHERE email LIKE '%test%' 
   OR email LIKE '%example.com'
   OR name LIKE 'Test %'
   OR phone_number LIKE '017123450%'; -- Test phone numbers

-- Step 3: Reset the system to show only fresh real-time data
-- After running this script:
-- - All old requests are deleted
-- - New requests will show correct timestamps ("just now", "2 minutes ago", etc.)
-- - Notification counts will be accurate

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
