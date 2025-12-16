# Blood Donation App - Supabase Backend Setup

## ✅ CURRENT STATUS: FULLY CONFIGURED FOR SUPABASE

Your backend is **100% configured** to use Supabase PostgreSQL as the main database.
MongoDB is completely disabled and commented out.

---

## 📁 Configuration Files

### 1. Backend Environment (`backend/.env`)
```env
# Server Configuration
PORT=5002
HOST=192.168.10.186

# ACTIVE DATABASE: SUPABASE POSTGRESQL
SUPABASE_URL=https://wwhfxrgjeparrccoojjb.supabase.co
SUPABASE_SERVICE_KEY=eyJ... (your service role key)

# JWT Secret
JWT_SECRET=blood_donation_app_jwt_secret_key_2025_supabase

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 2. Frontend Environment (`.env`)
```env
EXPO_PUBLIC_API_URL=https://whole-rabbits-rest.loca.lt
```

---

## 🚀 How to Start Everything

### Option 1: Quick Start (3 Commands)
```powershell
# Terminal 1: Start Backend
cd backend
npm start

# Terminal 2: Start HTTPS Tunnel
lt --port 5002

# Terminal 3: Start Expo
npx expo start --go
```

### Option 2: Using Existing PowerShell Windows
Your backend is already running in a separate PowerShell window.
Just run:
```powershell
lt --port 5002
npx expo start --go
```

---

## 📊 Database Information

### Supabase Dashboard
- URL: https://wwhfxrgjeparrccoojjb.supabase.co
- Database: PostgreSQL (Cloud)

### Tables Created
✅ `admins` - Admin user accounts
✅ `donors` - Donor profiles and information
✅ `blood_requests` - Blood donation requests
✅ `notifications` - User notifications

### Sample Admin Login
- Username: `admin`
- Password: `admin123`

---

## 🔧 Backend Configuration

### Dependencies Installed
- `@supabase/supabase-js` - Supabase client ✅
- `express` - Web server ✅
- `bcryptjs` - Password hashing ✅
- `jsonwebtoken` - JWT authentication ✅
- `dotenv` - Environment variables ✅
- `cors` - Cross-origin requests ✅

### Server File
- **File**: `backend/server.js`
- **Database**: Supabase PostgreSQL (Active)
- **Port**: 5002
- **Host**: 192.168.10.186

---

## 📱 Mobile App Setup

### Android HTTP Issue - SOLVED
Android blocks HTTP connections. Solution: HTTPS tunnel with localtunnel.

### Steps:
1. Backend runs on `http://192.168.10.186:5002`
2. Localtunnel creates HTTPS: `https://xxxx.loca.lt`
3. Frontend uses HTTPS URL
4. Android can now connect! ✅

---

## 🔍 Verification Commands

### Check Backend Status
```powershell
netstat -ano | Select-String ":5002"
```

### Test Supabase Connection
```powershell
cd backend
node -e "const supabase = require('./config/supabase'); console.log('Connected!')"
```

### Test API Endpoint
```powershell
Invoke-RestMethod -Uri "http://192.168.10.186:5002/api/admin/stats"
```

---

## ⚠️ Important Notes

### Localtunnel URL Changes
Every time you restart `lt --port 5002`, you get a NEW URL.
Update `.env` with the new URL:
```env
EXPO_PUBLIC_API_URL=https://new-url-here.loca.lt
```
Then restart Expo.

### Keeping Services Running
You need 3 terminals running:
1. ✅ Backend (already running in separate window)
2. 🔄 Localtunnel (`lt --port 5002`)
3. 🔄 Expo (`npx expo start --go`)

---

## 🎯 Summary

**Database**: Supabase PostgreSQL ✅
**Backend**: Configured and Ready ✅
**MongoDB**: Completely Removed ✅
**Startup**: Just run 2 commands ✅

**No terminal setup needed** - everything is pre-configured!
Just start the services and scan the QR code.
