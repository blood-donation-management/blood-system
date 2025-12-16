-- ================================================
-- BLOOD REQUESTS SYSTEM
-- ================================================
-- Admins can send requests to donors; donors can accept/decline.
-- On accept, a donation is recorded and donor's eligibility updates.

-- Step 1: Create blood_requests table
CREATE TABLE IF NOT EXISTS blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  desired_donation_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  hospital TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | declined | cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blood_requests_donor_id ON blood_requests(donor_id);
CREATE INDEX IF NOT EXISTS idx_blood_requests_admin_id ON blood_requests(admin_id);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status);

-- Enable RLS
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Donor can view/respond to own requests
CREATE POLICY "Donors view own requests"
ON blood_requests FOR SELECT
TO authenticated
USING (auth.uid() = donor_id);

CREATE POLICY "Donors update own requests"
ON blood_requests FOR UPDATE
TO authenticated
USING (auth.uid() = donor_id);

-- Admins can insert and view the requests they send
CREATE POLICY "Admins can insert requests"
ON blood_requests FOR INSERT
TO authenticated
WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Admins view sent requests"
ON blood_requests FOR SELECT
TO authenticated
USING (admin_id = auth.uid());

-- Optional: Admins can update status to cancelled
CREATE POLICY "Admins cancel requests"
ON blood_requests FOR UPDATE
TO authenticated
USING (admin_id = auth.uid());

-- ================================================
-- Triggers (optional): maintain updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blood_requests_updated_at ON blood_requests;
CREATE TRIGGER trg_blood_requests_updated_at
BEFORE UPDATE ON blood_requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ================================================
-- Verification
SELECT table_name FROM information_schema.tables WHERE table_name='blood_requests';
SELECT policyname, roles, cmd FROM pg_policies WHERE tablename='blood_requests';
