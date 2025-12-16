-- ================================================
-- ADD RATING COLUMN TO BLOOD_REQUESTS TABLE
-- ================================================
-- This script adds a rating column to blood_requests
-- to store ratings given to donors when requests are completed

-- Add rating column (1-5 stars)
ALTER TABLE blood_requests 
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- Add index for querying rated requests
CREATE INDEX IF NOT EXISTS idx_blood_requests_rating ON blood_requests(rating) WHERE rating IS NOT NULL;

-- Add a note column for feedback (if not exists)
ALTER TABLE blood_requests 
ADD COLUMN IF NOT EXISTS note TEXT;

-- Verify the columns were added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'blood_requests' 
AND column_name IN ('rating', 'note')
ORDER BY ordinal_position;

-- Check constraints
SELECT con.conname AS constraint_name, 
       pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'blood_requests'
AND con.conname LIKE '%rating%';
