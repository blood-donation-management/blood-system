# Quick Switch Guide: MongoDB ↔ Supabase

## 🎯 How to Switch from MongoDB to Supabase

### Step 1: Install Dependencies (1 minute)

```powershell
cd d:\projects\BloodDonationAppmainCopy\backend
npm install @supabase/supabase-js
```

### Step 2: Update .env File (2 minutes)

Edit `backend/.env` and add:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Keep existing
JWT_SECRET=change_me_dev_only
PORT=5002
HOST=localhost
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Step 3: Switch Server File (30 seconds)

**Option A: Rename files**
```powershell
cd d:\projects\BloodDonationAppmainCopy\backend

# Backup MongoDB version
Move-Item server.js server-mongodb.js

# Use Supabase version
Move-Item server-supabase.js server.js
```

**Option B: Copy content**
```powershell
# Or just copy the content of server-supabase.js to server.js
Copy-Item server-supabase.js server.js -Force
```

### Step 4: Start Backend (10 seconds)

```powershell
npm run dev
```

You're done! Your backend is now using Supabase PostgreSQL.

---

## 🔄 How to Switch Back to MongoDB

```powershell
cd d:\projects\BloodDonationAppmainCopy\backend

# Restore MongoDB version
Move-Item server-mongodb.js server.js -Force

# Start backend
npm run dev
```

---

## 📋 Files Created

### New Files (Keep These)
- ✅ `backend/config/supabase.js` - Supabase client configuration
- ✅ `backend/server-supabase.js` - Complete Supabase backend
- ✅ `MONGODB_TO_SUPABASE_MIGRATION.md` - Full migration guide

### Original Files (Unchanged)
- ✅ `backend/server.js` - Original MongoDB backend (can rename to server-mongodb.js)
- ✅ `backend/package.json` - Dependencies (will have both mongoose and @supabase/supabase-js)

---

## ⚡ Quick Comparison

| Feature | MongoDB (Current) | Supabase (New) |
|---------|------------------|----------------|
| **Database** | MongoDB Atlas | PostgreSQL |
| **File** | `server.js` (or `server-mongodb.js`) | `server-supabase.js` |
| **Client** | Mongoose ODM | Supabase JS Client |
| **IDs** | ObjectID (24 char hex) | UUID (36 char) |
| **Fields** | camelCase | snake_case (converted to camelCase in API) |
| **Setup** | MongoDB Atlas account | Supabase account |
| **Free Tier** | 512 MB storage | 500 MB database, 1 GB file storage |

---

## 🧪 Testing After Switch

### Test Endpoints

**1. Health Check**
```bash
curl http://localhost:5002/
```
Expected: `{ "message": "Blood Donation Management System API - Supabase Edition" }`

**2. Signup**
```bash
curl -X POST http://localhost:5002/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123","bloodGroup":"A+","location":"Dhaka","phoneNumber":"01712345678"}'
```

**3. Login**
```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 🗂️ Database Schema Comparison

### MongoDB Collections → Supabase Tables

| MongoDB | Supabase | Notes |
|---------|----------|-------|
| `donors` collection | `donors` table | UUIDs instead of ObjectIDs |
| `admins` collection | `admins` table | Same structure |
| `bloodrequests` collection | `blood_requests` table | snake_case fields |
| `messages` collection | `messages` table | snake_case fields |

### Field Name Changes

```javascript
// MongoDB (camelCase)
bloodGroup, phoneNumber, lastDonationDate, requesterId, donorId

// Supabase Database (snake_case)
blood_group, phone_number, last_donation_date, requester_id, donor_id

// API Response (camelCase) - auto-converted
bloodGroup, phoneNumber, lastDonationDate, requesterId, donorId
```

**Note:** The Supabase backend automatically converts between snake_case (database) and camelCase (API), so your frontend code doesn't need to change!

---

## 🚨 Important Notes

### 1. IDs are Different
- **MongoDB:** Uses ObjectID (e.g., `507f1f77bcf86cd799439011`)
- **Supabase:** Uses UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)

Your existing data won't automatically transfer. You need to:
- Either migrate data (see `MONGODB_TO_SUPABASE_MIGRATION.md` Step 6)
- Or start fresh with Supabase

### 2. Frontend Compatibility
The Supabase backend maintains the same API response format (camelCase), so **no frontend changes needed**!

### 3. Both Can Coexist
You can keep both `server-mongodb.js` and `server-supabase.js` and switch between them:

```powershell
# Use MongoDB
Copy-Item server-mongodb.js server.js -Force; npm run dev

# Use Supabase
Copy-Item server-supabase.js server.js -Force; npm run dev
```

---

## 📚 Need More Help?

- **Full migration steps:** See `MONGODB_TO_SUPABASE_MIGRATION.md`
- **Supabase setup:** Step 1-3 of migration guide
- **Query examples:** See migration guide Quick Reference section
- **Troubleshooting:** Check Supabase dashboard logs

---

## ✅ Checklist

Before switching to Supabase, ensure:

- [ ] Created Supabase project at https://supabase.com
- [ ] Created database tables (SQL from migration guide)
- [ ] Got Supabase URL and Service Key
- [ ] Updated `backend/.env` with Supabase credentials
- [ ] Installed `@supabase/supabase-js` package
- [ ] Created `backend/config/supabase.js`
- [ ] Renamed `server.js` to `server-mongodb.js` (backup)
- [ ] Renamed `server-supabase.js` to `server.js`
- [ ] Tested signup/login endpoints

---

**You're ready to use Supabase! 🚀**
