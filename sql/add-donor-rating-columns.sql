-- ================================================
-- ADD RATING COLUMNS TO DONORS TABLE
-- ================================================
-- This script adds avg_rating and rating_count columns
-- to track donor ratings from completed requests

-- Add avg_rating column (decimal for precise averages)
ALTER TABLE donors 
ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0 CHECK (avg_rating >= 0 AND avg_rating <= 5);

-- Add rating_count column (total number of ratings received)
ALTER TABLE donors 
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0 CHECK (rating_count >= 0);

-- Add index for querying top-rated donors
CREATE INDEX IF NOT EXISTS idx_donors_avg_rating ON donors(avg_rating DESC);

-- Verify the columns were added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'donors' 
AND column_name IN ('avg_rating', 'rating_count')
ORDER BY ordinal_position;

-- Optional: Recalculate ratings from existing blood_requests
/*
UPDATE donors d
SET 
  avg_rating = COALESCE((
    SELECT AVG(rating)::DECIMAL(3,2)
    FROM blood_requests
    WHERE donor_id = d.id 
    AND rating IS NOT NULL
    AND status = 'completed'
  ), 0),
  rating_count = COALESCE((
    SELECT COUNT(*)
    FROM blood_requests
    WHERE donor_id = d.id 
    AND rating IS NOT NULL
    AND status = 'completed'
  ), 0)
WHERE EXISTS (
  SELECT 1 FROM blood_requests 
  WHERE donor_id = d.id 
  AND rating IS NOT NULL
  AND status = 'completed'
);
*/
