-- ================================================
-- CREATE USER REPORTS TABLE
-- ================================================
-- This table stores reports submitted by users about other users
-- Admins can review and take action on these reports

-- Create user_reports table
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user ON user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_created_at ON user_reports(created_at DESC);

-- Add comments
COMMENT ON TABLE user_reports IS 'Stores user reports submitted by donors about other users';
COMMENT ON COLUMN user_reports.reporter_id IS 'User who submitted the report';
COMMENT ON COLUMN user_reports.reported_user_id IS 'User being reported';
COMMENT ON COLUMN user_reports.reason IS 'Detailed reason for the report';
COMMENT ON COLUMN user_reports.category IS 'Report category (e.g., inappropriate_behavior, fake_profile, spam)';
COMMENT ON COLUMN user_reports.status IS 'Current status of the report';
COMMENT ON COLUMN user_reports.admin_notes IS 'Notes added by admin when reviewing';
COMMENT ON COLUMN user_reports.reviewed_by IS 'Admin who reviewed the report';

-- Enable RLS
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create reports" ON user_reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON user_reports;

-- Policy: Users can create reports
CREATE POLICY "Users can create reports"
  ON user_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can view their own reports
CREATE POLICY "Users can view their own reports"
  ON user_reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- Policy: Admins can view all reports (no RLS for admins - handled at application level)
-- Note: Admins table should have RLS disabled for admin operations

-- Verify table creation
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_reports'
ORDER BY ordinal_position;
