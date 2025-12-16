-- ================================================
-- CREATE TEST DONORS
-- ================================================
-- This will create multiple test donors with various blood groups
-- for testing the app functionality

-- Step 1: Check existing donors
SELECT COUNT(*) as current_donor_count FROM donors;

-- Step 2: Insert test donors with different blood groups
-- Note: These are test accounts, not linked to Supabase Auth users

-- Test Donor 1: O+ (Most common)
INSERT INTO donors (name, email, blood_group, location, phone_number, status, verified)
VALUES ('John Smith', 'john.smith@test.com', 'O+', 'Gulshan, Dhaka', '01712345001', 'active', true);

-- Test Donor 2: O- (Universal donor)
INSERT INTO donors (name, email, blood_group, location, phone_number, status, verified)
VALUES ('Sarah Johnson', 'sarah.j@test.com', 'O-', 'Banani, Dhaka', '01712345002', 'active', true);

-- Test Donor 3: A+
INSERT INTO donors (name, email, blood_group, location, phone_number, status, verified)
VALUES ('Michael Brown', 'michael.b@test.com', 'A+', 'Dhanmondi, Dhaka', '01712345003', 'active', true);

-- Test Donor 4: A-
INSERT INTO donors (name, email, blood_group, location, phone_number, status, verified)
VALUES ('Emily Davis', 'emily.d@test.com', 'A-', 'Mirpur, Dhaka', '01712345004', 'active', true);

-- Test Donor 5: B+
INSERT INTO donors (name, email, blood_group, location, phone_number, status, verified)
VALUES ('David Wilson', 'david.w@test.com', 'B+', 'Uttara, Dhaka', '01712345005', 'active', true);

-- Test Donor 6: B-
INSERT INTO donors (name, email, blood_group, location, phone_number, status, verified)
VALUES ('Jessica Martinez', 'jessica.m@test.com', 'B-', 'Mohammadpur, Dhaka', '01712345006', 'active', true);

-- Test Donor 7: AB+ (Universal recipient)
INSERT INTO donors (name, email, blood_group, location, phone_number, status, verified)
VALUES ('Robert Garcia', 'robert.g@test.com', 'AB+', 'Badda, Dhaka', '01712345007', 'active', true);

-- Test Donor 8: AB-
INSERT INTO donors (name, email, blood_group, location, phone_number, status, verified)
VALUES ('Amanda Lopez', 'amanda.l@test.com', 'AB-', 'Khilgaon, Dhaka', '01712345008', 'active', true);

-- Test Donor 9: Another O+ in different location
INSERT INTO donors (name, email, blood_group, location, phone_number, status, verified)
VALUES ('James Anderson', 'james.a@test.com', 'O+', 'Tejgaon, Dhaka', '01712345009', 'active', true);

-- Test Donor 10: Another A+ in different location
INSERT INTO donors (name, email, blood_group, location, phone_number, status, verified)
VALUES ('Maria Rodriguez', 'maria.r@test.com', 'A+', 'Kalabagan, Dhaka', '01712345010', 'active', true);

-- Test Donor 11: B+ with different area
INSERT INTO donors (name, email, blood_group, location, phone_number, status, verified)
VALUES ('Christopher Lee', 'chris.l@test.com', 'B+', 'Farmgate, Dhaka', '01712345011', 'active', true);

-- Test Donor 12: O- in another area
INSERT INTO donors (name, email, blood_group, location, phone_number, status, verified)
VALUES ('Jennifer White', 'jennifer.w@test.com', 'O-', 'Panthapath, Dhaka', '01712345012', 'active', true);

-- Step 3: Verify all test donors were created
SELECT id, name, email, blood_group, location, phone_number, status, verified, created_at
FROM donors
WHERE email LIKE '%@test.com'
ORDER BY blood_group, name;

-- Step 4: Count donors by blood group
SELECT blood_group, COUNT(*) as donor_count
FROM donors
WHERE email LIKE '%@test.com'
GROUP BY blood_group
ORDER BY blood_group;

-- Step 5: Total test donor count
SELECT COUNT(*) as total_test_donors
FROM donors
WHERE email LIKE '%@test.com';

-- ================================================
-- CLEANUP (Optional)
-- ================================================
-- To remove all test donors later, uncomment and run:
-- DELETE FROM donors WHERE email LIKE '%@test.com';
