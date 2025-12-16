# 🎯 Supabase Migration - Quick Reference Card

> **Keep this handy while migrating!**

---

## ⚡ 3-Minute Setup

```powershell
# 1. Install
npm install @supabase/supabase-js

# 2. Configure .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# 3. Switch & Run
Move-Item server.js server-mongodb.js
Move-Item server-supabase.js server.js
npm run dev
```

---

## 📝 SQL Quick Copy

```sql
-- Run this in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE donors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    location VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    verified BOOLEAN DEFAULT false,
    verification_note TEXT,
    last_donation_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE blood_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    requester_name VARCHAR(255) NOT NULL,
    donor_name VARCHAR(255) NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    note TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_donors_email ON donors(email);
CREATE INDEX idx_donors_phone ON donors(phone_number);
CREATE INDEX idx_requests_requester ON blood_requests(requester_id);
CREATE INDEX idx_requests_donor ON blood_requests(donor_id);
```

---

## 🔄 Query Conversion Cheat Sheet

| MongoDB | Supabase |
|---------|----------|
| `Donor.findOne({ email })` | `supabase.from('donors').select('*').eq('email', email).single()` |
| `Donor.create({ name, email })` | `supabase.from('donors').insert({ name, email }).select().single()` |
| `Donor.findById(id)` | `supabase.from('donors').select('*').eq('id', id).single()` |
| `Donor.find({ status: 'active' })` | `supabase.from('donors').select('*').eq('status', 'active')` |
| `Donor.findByIdAndUpdate(id, data)` | `supabase.from('donors').update(data).eq('id', id).select()` |
| `Donor.findByIdAndDelete(id)` | `supabase.from('donors').delete().eq('id', id)` |
| `Donor.find().sort({ createdAt: -1 })` | `supabase.from('donors').select('*').order('created_at', { ascending: false })` |
| `Donor.find().limit(20)` | `supabase.from('donors').select('*').limit(20)` |

---

## 🗂️ Field Name Mapping

```javascript
// MongoDB (camelCase) → Supabase DB (snake_case)
bloodGroup        → blood_group
phoneNumber       → phone_number
lastDonationDate  → last_donation_date
verificationNote  → verification_note
createdAt         → created_at
updatedAt         → updated_at
requesterId       → requester_id
donorId           → donor_id
requesterName     → requester_name
donorName         → donor_name
senderId          → sender_id
receiverId        → receiver_id

// Note: Backend auto-converts to camelCase in API responses!
```

---

## 🧪 Test Commands

```powershell
# Health Check
curl http://localhost:5002/

# Signup
curl -X POST http://localhost:5002/api/auth/signup -H "Content-Type: application/json" -d '{\"name\":\"Test\",\"email\":\"test@test.com\",\"password\":\"test123\",\"bloodGroup\":\"A+\",\"location\":\"Dhaka\",\"phoneNumber\":\"01712345678\"}'

# Login
curl -X POST http://localhost:5002/api/auth/login -H "Content-Type: application/json" -d '{\"email\":\"test@test.com\",\"password\":\"test123\"}'
```

---

## 🔧 Troubleshooting

| Error | Fix |
|-------|-----|
| "Missing credentials" | Add `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` to `.env` |
| "Table not found" | Run SQL schema in Supabase dashboard |
| "Column doesn't exist" | Check snake_case vs camelCase |
| "Foreign key violation" | Ensure related records exist |
| "RLS policy error" | Using service key bypasses RLS |

---

## 📚 Documentation Quick Links

```
⭐ Start:     MIGRATION_INDEX.md
⚡ Quick:     SUPABASE_QUICK_SWITCH.md
📖 Complete:  MONGODB_TO_SUPABASE_MIGRATION.md
🔍 Compare:   SUPABASE_VS_MONGODB.md
🎨 Visual:    ARCHITECTURE_DIAGRAMS.md
📊 Summary:   SUPABASE_MIGRATION_SUMMARY.md
```

---

## ✅ Checklist

**Setup:**
- [ ] Created Supabase account
- [ ] Created project
- [ ] Saved URL and Service Key
- [ ] Ran SQL schema
- [ ] Installed npm package
- [ ] Updated .env
- [ ] Switched server file

**Testing:**
- [ ] Health check works
- [ ] Signup works
- [ ] Login works
- [ ] Search works
- [ ] Requests work
- [ ] Admin works
- [ ] Frontend compatible

---

## 🎯 Key Differences

| Aspect | MongoDB | Supabase |
|--------|---------|----------|
| **Type** | NoSQL | PostgreSQL |
| **IDs** | ObjectID (24 chars) | UUID (36 chars) |
| **Fields** | camelCase | snake_case |
| **Queries** | `.find()` | `.select()` |
| **Insert** | `.create()` | `.insert()` |
| **Update** | `.findByIdAndUpdate()` | `.update().eq()` |

---

## 💡 Pro Tips

1. **Keep MongoDB backup** during transition
2. **Use Supabase dashboard** to verify data
3. **Check network tab** for API calls
4. **Monitor logs** in backend and Supabase
5. **Test locally first** before production

---

## 🚀 One-Liner Switch

```powershell
npm i @supabase/supabase-js; Move-Item server.js server-mongodb.js; Move-Item server-supabase.js server.js; npm run dev
```

---

## 📞 Help

- **Stuck?** Read MIGRATION_INDEX.md
- **Need examples?** See SUPABASE_VS_MONGODB.md
- **Visual learner?** Check ARCHITECTURE_DIAGRAMS.md
- **External help:** https://discord.supabase.com

---

**Print this card or keep it open while migrating! 🎯**
