-- Migration: add admin_id to existing blood_requests table and fix policies

-- 1) Add column if missing
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS admin_id UUID;

-- 2) Add FK to auth.users (optional, safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'blood_requests' AND c.conname = 'blood_requests_admin_id_fkey'
  ) THEN
    ALTER TABLE blood_requests
      ADD CONSTRAINT blood_requests_admin_id_fkey
      FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END$$;

-- 3) Backfill admin_id from legacy requester_id if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blood_requests' AND column_name = 'requester_id'
  ) THEN
    UPDATE blood_requests br
    SET admin_id = br.requester_id
    WHERE admin_id IS NULL;
  END IF;
END$$;

-- 4) Drop old policies referencing requester_id and recreate policies using admin_id
DROP POLICY IF EXISTS "Donors view own requests" ON blood_requests;
DROP POLICY IF EXISTS "Donors update own requests" ON blood_requests;
DROP POLICY IF EXISTS "Admins can insert requests" ON blood_requests;
DROP POLICY IF EXISTS "Admins view sent requests" ON blood_requests;
DROP POLICY IF EXISTS "Admins cancel requests" ON blood_requests;

-- Recreate policies
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors view own requests"
ON blood_requests FOR SELECT
TO authenticated
USING (auth.uid() = donor_id);

CREATE POLICY "Donors update own requests"
ON blood_requests FOR UPDATE
TO authenticated
USING (auth.uid() = donor_id);

CREATE POLICY "Admins can insert requests"
ON blood_requests FOR INSERT
TO authenticated
WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Admins view sent requests"
ON blood_requests FOR SELECT
TO authenticated
USING (admin_id = auth.uid());

CREATE POLICY "Admins cancel requests"
ON blood_requests FOR UPDATE
TO authenticated
USING (admin_id = auth.uid());

-- Verify
SELECT column_name FROM information_schema.columns WHERE table_name='blood_requests';
SELECT policyname, roles, cmd, qual FROM pg_policies WHERE tablename='blood_requests';
