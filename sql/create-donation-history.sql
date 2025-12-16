-- ================================================
-- BLOOD DONATIONS HISTORY SYSTEM
-- ================================================
-- This script creates a complete donation history tracking system
-- that automatically updates the donor's last_donation_date

-- Step 1: Create blood_donations table
CREATE TABLE IF NOT EXISTS blood_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  donation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  location TEXT,
  hospital TEXT,
  blood_group TEXT NOT NULL,
  quantity_ml INTEGER DEFAULT 450,
  notes TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_blood_donations_donor_id ON blood_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_blood_donations_donation_date ON blood_donations(donation_date DESC);

-- Step 3: Create function to auto-update last_donation_date in donors table
CREATE OR REPLACE FUNCTION update_donor_last_donation()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the donor's last_donation_date to the most recent donation
  UPDATE donors
  SET 
    last_donation_date = NEW.donation_date,
    updated_at = NOW()
  WHERE id = NEW.donor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to automatically update last_donation_date
DROP TRIGGER IF EXISTS trigger_update_last_donation ON blood_donations;
CREATE TRIGGER trigger_update_last_donation
AFTER INSERT ON blood_donations
FOR EACH ROW
EXECUTE FUNCTION update_donor_last_donation();

-- Step 5: Enable Row Level Security
ALTER TABLE blood_donations ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own donations" ON blood_donations;
DROP POLICY IF EXISTS "Users can insert own donations" ON blood_donations;
DROP POLICY IF EXISTS "Users can update own donations" ON blood_donations;
DROP POLICY IF EXISTS "Users can delete own donations" ON blood_donations;
DROP POLICY IF EXISTS "Admins can view all donations" ON blood_donations;

-- Allow users to view their own donations
CREATE POLICY "Users can view own donations"
ON blood_donations FOR SELECT
TO authenticated
USING (auth.uid() = donor_id);

-- Allow users to insert their own donations
CREATE POLICY "Users can insert own donations"
ON blood_donations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = donor_id);

-- Allow users to update their own donations
CREATE POLICY "Users can update own donations"
ON blood_donations FOR UPDATE
TO authenticated
USING (auth.uid() = donor_id);

-- Allow users to delete their own donations
CREATE POLICY "Users can delete own donations"
ON blood_donations FOR DELETE
TO authenticated
USING (auth.uid() = donor_id);

-- Allow admins to view all donations (optional)
CREATE POLICY "Admins can view all donations"
ON blood_donations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid()
  )
);

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Check if table was created
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'blood_donations'
ORDER BY ordinal_position;

-- Check if indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'blood_donations';

-- Check if trigger was created
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'blood_donations';

-- Check RLS policies
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'blood_donations';

-- ================================================
-- TEST DATA (Optional)
-- ================================================
-- Uncomment to insert test donation records

/*
-- Test donation 1 (recent)
INSERT INTO blood_donations (donor_id, donation_date, location, hospital, blood_group, notes)
VALUES (
  (SELECT id FROM donors WHERE email = 'john.smith@test.com' LIMIT 1),
  NOW() - INTERVAL '30 days',
  'Gulshan, Dhaka',
  'Square Hospital',
  'O+',
  'Regular donation'
);

-- Test donation 2 (90 days ago - eligible again)
INSERT INTO blood_donations (donor_id, donation_date, location, hospital, blood_group, notes)
VALUES (
  (SELECT id FROM donors WHERE email = 'sarah.j@test.com' LIMIT 1),
  NOW() - INTERVAL '95 days',
  'Banani, Dhaka',
  'Apollo Hospital',
  'O-',
  'Emergency donation'
);

-- Test donation 3 (60 days ago - not eligible yet)
INSERT INTO blood_donations (donor_id, donation_date, location, hospital, blood_group, notes)
VALUES (
  (SELECT id FROM donors WHERE email = 'michael.b@test.com' LIMIT 1),
  NOW() - INTERVAL '60 days',
  'Dhanmondi, Dhaka',
  'United Hospital',
  'A+',
  'Voluntary donation'
);
*/

-- ================================================
-- QUERY EXAMPLES
-- ================================================

-- Get all donations for a specific donor
/*
SELECT 
  id,
  donation_date,
  location,
  hospital,
  blood_group,
  quantity_ml,
  notes,
  verified,
  created_at
FROM blood_donations
WHERE donor_id = 'YOUR_USER_ID_HERE'
ORDER BY donation_date DESC;
*/

-- Get donation count by donor
/*
SELECT 
  d.name,
  d.email,
  d.blood_group,
  COUNT(bd.id) as total_donations,
  MAX(bd.donation_date) as last_donation,
  d.last_donation_date as donor_last_donation
FROM donors d
LEFT JOIN blood_donations bd ON d.id = bd.donor_id
GROUP BY d.id, d.name, d.email, d.blood_group, d.last_donation_date
ORDER BY total_donations DESC;
*/

-- Get donations in last 90 days
/*
SELECT 
  d.name,
  d.email,
  bd.donation_date,
  bd.location,
  bd.hospital,
  bd.blood_group
FROM blood_donations bd
JOIN donors d ON d.id = bd.donor_id
WHERE bd.donation_date >= NOW() - INTERVAL '90 days'
ORDER BY bd.donation_date DESC;
*/

-- ================================================
-- CLEANUP (Use with caution)
-- ================================================
/*
-- Remove all test donations
DELETE FROM blood_donations WHERE notes LIKE '%test%';

-- Drop trigger and function
DROP TRIGGER IF EXISTS trigger_update_last_donation ON blood_donations;
DROP FUNCTION IF EXISTS update_donor_last_donation();

-- Drop table
DROP TABLE IF EXISTS blood_donations CASCADE;
*/
