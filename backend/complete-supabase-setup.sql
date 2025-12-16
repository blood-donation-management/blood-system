-- Complete Supabase Database Setup for Blood Donation App
-- Run this in Supabase SQL Editor: https://wwhfxrgjeparrccoojjb.supabase.co

-- 1. Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create donors table
CREATE TABLE IF NOT EXISTS donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  location TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  last_donation_date TIMESTAMP WITH TIME ZONE,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT blood_group_check CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))
);

-- 3. Create blood_requests table
CREATE TABLE IF NOT EXISTS blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  units_needed INTEGER NOT NULL DEFAULT 1,
  hospital TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  urgency_level TEXT NOT NULL DEFAULT 'normal',
  additional_info TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by UUID REFERENCES donors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT blood_group_check CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  CONSTRAINT urgency_check CHECK (urgency_level IN ('normal', 'urgent', 'critical')),
  CONSTRAINT status_check CHECK (status IN ('pending', 'fulfilled', 'cancelled'))
);

-- 4. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT notifications_type_check CHECK (type IN ('request', 'match', 'urgent', 'system'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_donors_email ON donors(email);
CREATE INDEX IF NOT EXISTS idx_donors_blood_group ON donors(blood_group);
CREATE INDEX IF NOT EXISTS idx_donors_location ON donors(location);
CREATE INDEX IF NOT EXISTS idx_blood_requests_blood_group ON blood_requests(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_donor_id ON notifications(donor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Service role can access admins" ON admins;
DROP POLICY IF EXISTS "Service role can access donors" ON donors;
DROP POLICY IF EXISTS "Service role can access blood_requests" ON blood_requests;
DROP POLICY IF EXISTS "Service role can access notifications" ON notifications;

-- RLS Policies for admins
CREATE POLICY "Service role can access admins" ON admins
  FOR ALL USING (true);

-- RLS Policies for donors
CREATE POLICY "Service role can access donors" ON donors
  FOR ALL USING (true);

-- RLS Policies for blood_requests
CREATE POLICY "Service role can access blood_requests" ON blood_requests
  FOR ALL USING (true);

-- RLS Policies for notifications
CREATE POLICY "Service role can access notifications" ON notifications
  FOR ALL USING (true);

-- Success message
SELECT 'Database setup complete! All tables created successfully.' AS message;
