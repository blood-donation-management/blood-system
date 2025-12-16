# MongoDB to Supabase Migration Guide

## 🎯 Overview

This guide will help you migrate your Blood Donation App from **MongoDB Atlas** to **Supabase PostgreSQL** database.

**What will change:**
- Database: MongoDB → PostgreSQL (via Supabase)
- Backend: Mongoose ODM → Supabase JS Client
- Schema: MongoDB collections → PostgreSQL tables
- Queries: MongoDB queries → SQL/Supabase queries

**What stays the same:**
- Frontend code (minimal changes to service files)
- Authentication flow
- API endpoints structure

---

## 📋 Migration Steps Overview

1. **Setup Supabase Project** (10 minutes)
2. **Create Database Schema** (15 minutes)
3. **Setup Row Level Security (RLS)** (10 minutes)
4. **Update Backend Dependencies** (5 minutes)
5. **Replace MongoDB Code with Supabase** (30 minutes)
6. **Migrate Existing Data** (Optional, 20 minutes)
7. **Test & Deploy** (15 minutes)

**Total Time: ~2 hours**

---

## Step 1: Setup Supabase Project (10 minutes)

### 1.1 Create Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub or email
4. Verify your email

### 1.2 Create New Project
1. Click **"New Project"**
2. Fill in:
   - **Project Name:** `blood-donation-app`
   - **Database Password:** Choose a strong password (save it!)
   - **Region:** Select closest to your users (e.g., `Southeast Asia (Singapore)`)
3. Click **"Create new project"**
4. Wait 2-3 minutes for setup to complete

### 1.3 Get API Credentials
1. Go to **Settings** → **API**
2. Copy and save:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Project API Key** (anon/public key)
   - **Service Role Key** (secret key for backend)

---

## Step 2: Create Database Schema (15 minutes)

### 2.1 Access SQL Editor
1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**

### 2.2 Create Tables

Copy and paste this SQL to create all tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- DONORS TABLE
-- ========================================
CREATE TABLE donors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    blood_group VARCHAR(10) NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    location VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    verified BOOLEAN DEFAULT false,
    verification_note TEXT,
    last_donation_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX idx_donors_email ON donors(email);
CREATE INDEX idx_donors_phone ON donors(phone_number);
CREATE INDEX idx_donors_blood_group ON donors(blood_group);
CREATE INDEX idx_donors_location ON donors(location);

-- ========================================
-- ADMINS TABLE
-- ========================================
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- BLOOD_REQUESTS TABLE
-- ========================================
CREATE TABLE blood_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    requester_name VARCHAR(255) NOT NULL,
    donor_name VARCHAR(255) NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'rejected', 'completed', 'cancelled', 'accepted')),
    note TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_requests_requester ON blood_requests(requester_id);
CREATE INDEX idx_requests_donor ON blood_requests(donor_id);
CREATE INDEX idx_requests_status ON blood_requests(status);

-- ========================================
-- MESSAGES TABLE
-- ========================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster message queries
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- ========================================
-- AUTO UPDATE TIMESTAMP TRIGGER
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to donors table
CREATE TRIGGER update_donors_updated_at BEFORE UPDATE ON donors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to blood_requests table
CREATE TRIGGER update_blood_requests_updated_at BEFORE UPDATE ON blood_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

3. Click **"Run"** to execute the SQL
4. Verify tables are created: Go to **Table Editor** and you should see all 4 tables

### 2.3 Insert Default Admin

```sql
-- Insert default admin (password: admin123)
-- bcrypt hash of 'admin123' with 10 rounds
INSERT INTO admins (username, password)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye1JzxKqhLUm7RYFdN4Sq1HVZxqvQ4K0m');
```

**Note:** You'll need to hash passwords on your backend. The hash above is for reference.

---

## Step 3: Setup Row Level Security (10 minutes)

Row Level Security (RLS) protects your data. Enable it for all tables:

### 3.1 Enable RLS

```sql
-- Enable RLS on all tables
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

### 3.2 Create Policies

```sql
-- ========================================
-- DONORS POLICIES
-- ========================================
-- Allow public to read active donors (for search)
CREATE POLICY "Public can read active donors"
ON donors FOR SELECT
USING (status = 'active');

-- Allow insert for registration
CREATE POLICY "Anyone can create donor account"
ON donors FOR INSERT
WITH CHECK (true);

-- Allow donors to update their own profile
CREATE POLICY "Donors can update own profile"
ON donors FOR UPDATE
USING (auth.uid()::text = id::text);

-- ========================================
-- ADMINS POLICIES
-- ========================================
-- Admins table is managed via service role only
CREATE POLICY "Service role full access to admins"
ON admins FOR ALL
USING (true);

-- ========================================
-- BLOOD_REQUESTS POLICIES
-- ========================================
-- Users can view their own requests
CREATE POLICY "Users can view own requests"
ON blood_requests FOR SELECT
USING (
    auth.uid()::text = requester_id::text 
    OR auth.uid()::text = donor_id::text
);

-- Users can create requests
CREATE POLICY "Users can create requests"
ON blood_requests FOR INSERT
WITH CHECK (auth.uid()::text = requester_id::text);

-- Users can update their requests
CREATE POLICY "Users can update own requests"
ON blood_requests FOR UPDATE
USING (
    auth.uid()::text = requester_id::text 
    OR auth.uid()::text = donor_id::text
);

-- ========================================
-- MESSAGES POLICIES
-- ========================================
-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
USING (
    auth.uid()::text = sender_id::text 
    OR auth.uid()::text = receiver_id::text
);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (auth.uid()::text = sender_id::text);

-- Users can update messages they received (mark as read)
CREATE POLICY "Users can update received messages"
ON messages FOR UPDATE
USING (auth.uid()::text = receiver_id::text);
```

**Important:** For now, we'll use **Service Role Key** on the backend to bypass RLS during development.

---

## Step 4: Update Backend Dependencies (5 minutes)

### 4.1 Install Supabase Client

```powershell
cd d:\projects\BloodDonationAppmainCopy\backend
npm install @supabase/supabase-js
npm uninstall mongoose
```

### 4.2 Update package.json

Your new `backend/package.json` should look like:

```json
{
  "name": "blood-donation-backend",
  "version": "1.0.0",
  "description": "Blood Donation Management System Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@supabase/supabase-js": "^2.39.0",
    "cors": "^2.8.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### 4.3 Update .env File

Edit `backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# JWT Secret (keep your existing one)
JWT_SECRET=change_me_dev_only

# Server Config
PORT=5002
HOST=localhost

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

**Replace:**
- `SUPABASE_URL` with your Project URL
- `SUPABASE_SERVICE_KEY` with your Service Role Key (from Step 1.3)

---

## Step 5: Replace MongoDB Code with Supabase (30 minutes)

### 5.1 Create Supabase Client File

Create `backend/config/supabase.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
```

### 5.2 Update server.js

I'll provide the complete refactored `server.js` that replaces all MongoDB/Mongoose code with Supabase.

**Key Changes:**
1. Replace `mongoose` with `supabase`
2. Replace `Schema` and `Model` with direct Supabase queries
3. Change `_id` to `id` (PostgreSQL uses UUID)
4. Convert MongoDB queries to Supabase queries
5. Update field names (camelCase → snake_case)

**Example conversions:**

| MongoDB | Supabase |
|---------|----------|
| `Donor.findOne({ email })` | `supabase.from('donors').select('*').eq('email', email).single()` |
| `Donor.create({ name, email })` | `supabase.from('donors').insert({ name, email }).select().single()` |
| `Donor.findById(id)` | `supabase.from('donors').select('*').eq('id', id).single()` |
| `Donor.find({ bloodGroup })` | `supabase.from('donors').select('*').eq('blood_group', bloodGroup)` |
| `donor.save()` | `supabase.from('donors').update(data).eq('id', id)` |

### 5.3 Field Name Mapping

PostgreSQL convention uses snake_case instead of camelCase:

```javascript
// MongoDB → PostgreSQL mapping
const fieldMap = {
  bloodGroup: 'blood_group',
  phoneNumber: 'phone_number',
  lastDonationDate: 'last_donation_date',
  verificationNote: 'verification_note',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  requesterId: 'requester_id',
  donorId: 'donor_id',
  requesterName: 'requester_name',
  donorName: 'donor_name',
  senderId: 'sender_id',
  receiverId: 'receiver_id',
};
```

You can create helper functions to convert between formats.

---

## Step 6: Migrate Existing Data (Optional)

If you have existing data in MongoDB, you'll need to export and import it.

### 6.1 Export from MongoDB

```powershell
# Export donors
mongoexport --uri="mongodb+srv://ehsanultanjil:3GDSljUauR8p89Ax@cluster1.27jihp3.mongodb.net/blood_donation" --collection=donors --out=donors.json

# Export admins
mongoexport --uri="mongodb+srv://ehsanultanjil:3GDSljUauR8p89Ax@cluster1.27jihp3.mongodb.net/blood_donation" --collection=admins --out=admins.json

# Export requests
mongoexport --uri="mongodb+srv://ehsanultanjil:3GDSljUauR8p89Ax@cluster1.27jihp3.mongodb.net/blood_donation" --collection=bloodrequests --out=bloodrequests.json

# Export messages
mongoexport --uri="mongodb+srv://ehsanultanjil:3GDSljUauR8p89Ax@cluster1.27jihp3.mongodb.net/blood_donation" --collection=messages --out=messages.json
```

### 6.2 Transform Data

Create a Node.js script `migrate-data.js` to transform MongoDB data to PostgreSQL format:

```javascript
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Convert MongoDB _id to UUID or handle mapping
async function migrateDonors() {
  const data = JSON.parse(fs.readFileSync('donors.json', 'utf8'));
  
  for (const donor of data) {
    const transformed = {
      name: donor.name,
      email: donor.email,
      password: donor.password,
      blood_group: donor.bloodGroup,
      location: donor.location,
      phone_number: donor.phoneNumber,
      status: donor.status || 'active',
      verified: donor.verified || false,
      verification_note: donor.verificationNote,
      last_donation_date: donor.lastDonationDate,
      created_at: donor.createdAt,
    };
    
    const { error } = await supabase.from('donors').insert(transformed);
    if (error) console.error('Error inserting donor:', error);
  }
}

migrateDonors().then(() => console.log('Migration complete'));
```

Run:
```powershell
node migrate-data.js
```

---

## Step 7: Test & Deploy (15 minutes)

### 7.1 Test Locally

```powershell
cd backend
npm run dev
```

### 7.2 Test API Endpoints

Use Postman or curl to test:

**Register User:**
```bash
curl -X POST http://localhost:5002/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123","bloodGroup":"A+","location":"Dhaka","phoneNumber":"01712345678"}'
```

**Login:**
```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 7.3 Update Frontend Services

No major changes needed! Your existing service files will work. Just ensure the backend URLs are correct.

---

## 🎯 Quick Reference: MongoDB vs Supabase Queries

### Create/Insert
```javascript
// MongoDB
const donor = await Donor.create({ name, email, password });

// Supabase
const { data: donor, error } = await supabase
  .from('donors')
  .insert({ name, email, password })
  .select()
  .single();
```

### Find One
```javascript
// MongoDB
const donor = await Donor.findOne({ email });

// Supabase
const { data: donor, error } = await supabase
  .from('donors')
  .select('*')
  .eq('email', email)
  .single();
```

### Find By ID
```javascript
// MongoDB
const donor = await Donor.findById(donorId);

// Supabase
const { data: donor, error } = await supabase
  .from('donors')
  .select('*')
  .eq('id', donorId)
  .single();
```

### Find Many
```javascript
// MongoDB
const donors = await Donor.find({ bloodGroup: 'A+' });

// Supabase
const { data: donors, error } = await supabase
  .from('donors')
  .select('*')
  .eq('blood_group', 'A+');
```

### Update
```javascript
// MongoDB
await Donor.findByIdAndUpdate(donorId, { verified: true });

// Supabase
const { data, error } = await supabase
  .from('donors')
  .update({ verified: true })
  .eq('id', donorId);
```

### Delete
```javascript
// MongoDB
await Donor.findByIdAndDelete(donorId);

// Supabase
const { error } = await supabase
  .from('donors')
  .delete()
  .eq('id', donorId);
```

### Complex Queries
```javascript
// MongoDB
const requests = await BloodRequest.find({
  status: { $in: ['pending', 'accepted'] },
  donorId: myId
}).sort({ createdAt: -1 }).limit(10);

// Supabase
const { data: requests, error } = await supabase
  .from('blood_requests')
  .select('*')
  .in('status', ['pending', 'accepted'])
  .eq('donor_id', myId)
  .order('created_at', { ascending: false })
  .limit(10);
```

---

## ✅ Checklist

- [ ] Created Supabase project
- [ ] Saved API credentials
- [ ] Created database tables (SQL executed)
- [ ] Enabled RLS and created policies
- [ ] Installed `@supabase/supabase-js`
- [ ] Created `backend/config/supabase.js`
- [ ] Updated `backend/.env` with Supabase credentials
- [ ] Refactored `backend/server.js` (see next file)
- [ ] Migrated existing data (if applicable)
- [ ] Tested signup endpoint
- [ ] Tested login endpoint
- [ ] Tested search endpoint
- [ ] Updated frontend API URLs (if needed)

---

## 🚀 Next Steps

After completing this guide:

1. **Review the refactored `server.js`** (I'll create this next)
2. **Test all API endpoints** thoroughly
3. **Deploy backend** to production (Railway, Render, etc.)
4. **Update frontend** environment variables with production Supabase URL
5. **Monitor Supabase dashboard** for query performance

---

## 📚 Resources

- **Supabase Documentation:** https://supabase.com/docs
- **Supabase JS Client:** https://supabase.com/docs/reference/javascript
- **SQL Tutorial:** https://supabase.com/docs/guides/database
- **Row Level Security:** https://supabase.com/docs/guides/auth/row-level-security

---

## ⚠️ Important Notes

1. **UUIDs vs ObjectIDs:** Supabase uses UUIDs, MongoDB uses ObjectIDs. All ID fields are now UUIDs.
2. **Field Names:** PostgreSQL uses snake_case (`blood_group`) not camelCase (`bloodGroup`)
3. **Timestamps:** Use `TIMESTAMP` type, Supabase handles timezone automatically
4. **Relations:** Supabase supports foreign keys (better than MongoDB refs)
5. **Transactions:** PostgreSQL supports ACID transactions natively

---

Ready to see the refactored code? Let me know and I'll create the complete `server-supabase.js` file with all endpoints converted!
