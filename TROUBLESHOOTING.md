# 🔧 Troubleshooting Guide

## Common Errors and Solutions

### ❌ Error: "Failed to fetch profile: Cannot coerce the result to a single JSON object"

**Cause**: This error occurs when:
1. User signed up but donor profile wasn't created in the `donors` table
2. User is authenticated but has no corresponding donor record
3. Supabase Auth user ID doesn't match donor table ID

**Solutions**:

#### Solution 1: Check if donor profile exists
```sql
-- Run this in Supabase SQL Editor
-- Replace 'user-auth-id-here' with the actual user ID from auth.users

SELECT * FROM donors WHERE id = 'user-auth-id-here';
```

If no record exists, the user needs to sign up again or manually create their profile.

#### Solution 2: Manually create donor profile for existing auth user
```sql
-- First, get the user ID from auth.users
SELECT id, email FROM auth.users WHERE email = 'user@example.com';

-- Then insert donor profile using that ID
INSERT INTO donors (
    id,
    name,
    email,
    blood_group,
    location,
    phone_number,
    status,
    verified,
    created_at
) VALUES (
    'paste-user-id-from-above',
    'John Doe',
    'user@example.com',
    'A+',
    'Dhaka, Bangladesh',
    '+8801234567890',
    'active',
    false,
    NOW()
);
```

#### Solution 3: Clear app data and sign up fresh
1. Uninstall the app or clear app data
2. Sign up with a new account
3. Check the database to verify both auth.users and donors records are created

---

### ❌ Error: "User not authenticated"

**Cause**: User session expired or not logged in

**Solutions**:
1. Log out and log in again
2. Check if Supabase session is valid:
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

---

### ❌ Error: "Profile not found. Please complete your registration."

**Cause**: Auth user exists but no donor record

**Solution**: 
1. Logout and signup again
2. Or manually create donor profile using Solution 2 above

---

### 🔍 Debugging Steps

#### 1. Check Supabase Connection
```typescript
// Add this to any screen to test connection
import { supabase } from '@/config/supabase';

const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('donors')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
    } else {
      console.log('✅ Supabase connected successfully');
    }
  } catch (err) {
    console.error('Connection test failed:', err);
  }
};
```

#### 2. Check Auth Status
```typescript
import { supabase } from '@/config/supabase';

const checkAuth = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('Current User:', user);
  console.log('Auth Error:', error);
};
```

#### 3. Check Donor Profile
```typescript
import { supabase } from '@/config/supabase';

const checkProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data, error } = await supabase
      .from('donors')
      .select('*')
      .eq('id', user.id);
    
    console.log('Donor Profile:', data);
    console.log('Profile Error:', error);
  }
};
```

---

### 🗃️ Database Setup Verification

#### Check if all tables exist:
```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- `admins`
- `donors`
- `blood_requests`
- `notifications` (optional)

#### Check donors table structure:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'donors'
ORDER BY ordinal_position;
```

Expected columns:
- `id` (uuid, NOT NULL)
- `name` (varchar, NOT NULL)
- `email` (varchar, NOT NULL)
- `blood_group` (varchar, NOT NULL)
- `location` (varchar, NOT NULL)
- `phone_number` (varchar, NOT NULL)
- `status` (varchar, default 'active')
- `verified` (boolean, default false)
- `verification_note` (text, nullable)
- `last_donation_date` (timestamp, nullable)
- `created_at` (timestamp, default NOW())
- `updated_at` (timestamp, default NOW())

---

### 🔐 RLS (Row Level Security) Check

**Note**: RLS should be **disabled** on the `admins` table for direct admin login.

```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

To disable RLS on admins table:
```sql
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
```

---

### 📱 App-Specific Issues

#### Issue: Blank screen after login
**Solution**: 
1. Check console for errors
2. Verify profile is loading: add console.log in loadProfile
3. Clear app cache and restart

#### Issue: "Network request failed"
**Solution**:
1. Check internet connection
2. Verify Supabase URL and anon key in `config/supabase.ts`
3. Make sure Supabase project is active (not paused)

#### Issue: Fields showing undefined
**Solution**: Check field names match Supabase schema:
- Use `blood_group` not `bloodGroup`
- Use `phone_number` not `phoneNumber`
- Use `created_at` not `createdAt`

---

### 🧪 Test Accounts

#### Create test donor account:
```sql
-- First create auth user in Supabase Dashboard > Authentication > Users
-- Then create donor profile:

INSERT INTO donors (
    id,
    name,
    email,
    blood_group,
    location,
    phone_number,
    status,
    verified,
    created_at
) VALUES (
    'auth-user-id-from-supabase-auth',
    'Test User',
    'test@example.com',
    'O+',
    'Dhaka',
    '+8801234567890',
    'active',
    true,
    NOW()
);
```

#### Create test admin account:
```sql
-- First install bcrypt in Supabase SQL Editor or use bcrypt online tool
-- Password: admin123
-- Bcrypt hash: $2a$10$rEwBqHZPWfPJKT7VEq3HxuLZ6YP6hqF3JhxQ8vJQK8MkDqJKGmhLi

INSERT INTO admins (username, password)
VALUES ('admin', '$2a$10$rEwBqHZPWfPJKT7VEq3HxuLZ6YP6hqF3JhxQ8vJQK8MkDqJKGmhLi');
```

---

### 📊 Common SQL Queries

#### Count all donors:
```sql
SELECT COUNT(*) FROM donors;
```

#### Count blood requests by status:
```sql
SELECT status, COUNT(*) 
FROM blood_requests 
GROUP BY status;
```

#### Find donors by blood group:
```sql
SELECT name, location, phone_number 
FROM donors 
WHERE blood_group = 'O+' 
AND status = 'active';
```

#### View recent requests:
```sql
SELECT 
    br.*,
    d1.name as requester_name,
    d2.name as donor_name
FROM blood_requests br
JOIN donors d1 ON br.requester_id = d1.id
JOIN donors d2 ON br.donor_id = d2.id
ORDER BY br.created_at DESC
LIMIT 10;
```

---

### 🚑 Emergency Recovery

#### Reset everything and start fresh:

1. **Delete all data**:
```sql
TRUNCATE blood_requests CASCADE;
TRUNCATE donors CASCADE;
TRUNCATE admins CASCADE;
```

2. **Recreate admin account**:
```sql
INSERT INTO admins (username, password)
VALUES ('admin', '$2a$10$rEwBqHZPWfPJKT7VEq3HxuLZ6YP6hqF3JhxQ8vJQK8MkDqJKGmhLi');
```

3. **Sign up new user account** through the app

4. **Verify profile created**:
```sql
SELECT * FROM donors ORDER BY created_at DESC LIMIT 1;
```

---

### 📞 Support Checklist

Before asking for help, provide:
1. ✅ Error message (full text)
2. ✅ Console logs
3. ✅ Which screen/action triggered the error
4. ✅ Database table existence check results
5. ✅ Auth user status (logged in/out)
6. ✅ Donor profile existence check

---

### 🎯 Quick Fixes Summary

| Problem | Quick Fix |
|---------|-----------|
| Profile not loading | Logout → Signup fresh |
| Auth error | Clear app data → Login again |
| Network failed | Check Supabase credentials |
| Undefined fields | Check snake_case naming |
| Admin login failed | Verify bcrypt password hash |
| RLS error on admins | Disable RLS: `ALTER TABLE admins DISABLE ROW LEVEL SECURITY;` |

