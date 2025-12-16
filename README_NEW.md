# Blood Donation Management System

A full-stack mobile app for managing blood donations.

- Frontend: React Native (Expo + Expo Router)
- Backend: Node.js/Express + MongoDB (Atlas or local)

---

## Quick Start (Windows)

```powershell
# 1) Install Node.js (if not installed): https://nodejs.org/en
node -v

# 2) Clone the project
git clone <your-repo-url>
cd BloodDonate

# 3) Install frontend dependencies (root)
npm install

# 4) Install backend dependencies
cd backend
npm install

# 5) Start the backend (keep this terminal running)
npm run dev

# 6) In a NEW terminal at project root, start Expo on LAN
cd ..
npx expo start --lan
# Open Expo Go on your Android device and scan the QR
```

Make sure your `.env` at project root has `EXPO_PUBLIC_API_URL` set to your PC's LAN IP, e.g. `http://192.168.1.50:5000`.

## Prerequisites

- Node.js 18+ and npm
- Git
- Android device with Expo Go installed (or Android emulator)
- MongoDB
  - MongoDB Atlas connection URI (recommended), or
  - Local MongoDB running on `mongodb://127.0.0.1:27017`

---

## 1) Clone and install

```bash
# Clone
git clone <your-repo-url>
cd BloodDonate

# Install frontend deps (root)
npm install

# Install backend deps
cd backend
npm install
```

---

## 2) Configure environment variables

Verify/update the `.env` file at the project root (`BloodDonate/.env`). If it doesn't exist (e.g., on a fresh clone), create it. The backend is configured to load this root `.env`.

Simple steps:
1. Open the file `BloodDonate/.env` in a text editor (e.g., Notepad).
2. Make sure all keys below exist. If a key is missing, add it.
3. Set `EXPO_PUBLIC_API_URL` to your PC's LAN IP, not `localhost`.
4. Save the file.
5. Restart the backend and Expo after any change.

Required variables:

```env
# Backend
PORT=5000
HOST=0.0.0.0
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<a-strong-random-secret>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Frontend
# IMPORTANT: Use your computer LAN IP (not localhost) so Expo Go on phone can reach your backend
# Example: http://192.168.1.50:5000
EXPO_PUBLIC_API_URL=http://<YOUR-LAN-IP>:5000
```

Notes:
- If using MongoDB Atlas, set `MONGODB_URI` like: `mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority`.
- Keep `JWT_SECRET` private.
- `EXPO_PUBLIC_API_URL` is read by the frontend at runtime; it must point to the backend URL reachable from your phone.

### Find your LAN IP for EXPO_PUBLIC_API_URL

- Windows PowerShell:
  ```powershell
  ipconfig | findstr /R /C:"IPv4 Address"
  ```
- Then set `EXPO_PUBLIC_API_URL` to `http://<that-ip>:5000`

After editing `.env`, restart both:
- Backend: `cd backend && npm run dev`
- Frontend (Metro): stop and run `npx expo start --lan` again

---

## 3) Run the backend

Open a terminal:

```bash
cd backend
npm run dev
```

If it starts successfully, you should see something like:
- Server listening on `http://<YOUR-LAN-IP>:5000`
- Connected to MongoDB

---

## 4) Run the frontend (Expo)

Open a new terminal at the project root:

```bash
# From project root
npx expo start --lan
```

Then:
- Open the Expo Go app on your Android device.
- Ensure the phone and computer are on the same Wi‑Fi network.
- Scan the QR code shown in the terminal/DevTools.

If the app loads but cannot reach the backend, double‑check:
- `EXPO_PUBLIC_API_URL` in `BloodDonate/.env` uses your LAN IP (not localhost).
- The backend is running and reachable at that IP and port.

---

## 5) Default accounts

- Admin
  - Username: `admin`
  - Password: `admin123`

User accounts are created via Signup in the app.

---

## Project scripts (common)

Frontend (root):
- `npx expo start` – start Metro bundler
- `npx expo start --lan` – start on LAN (recommended for device testing)

Backend (`backend/`):
- `npm run dev` – start Express server in watch mode

---

## Troubleshooting

- Cannot connect to backend from phone
  - Ensure `EXPO_PUBLIC_API_URL` is `http://<YOUR-LAN-IP>:5000` (not localhost)
  - Backend running and not blocked by firewall
  - Phone and computer are on the same network

- Port 5000 already in use
  - Stop the process using port 5000 or change `PORT` in `.env` and update `EXPO_PUBLIC_API_URL`

- MongoDB connection error (ECONNREFUSED or AUTH failed)
  - Verify `MONGODB_URI` and credentials
  - For local MongoDB, ensure the service is running

- Expo/Metro cache issues
  - Restart with cache clear: `npx expo start -c`

- Bundling warnings about Expo versions
  - You can update packages to the suggested versions later; not required to run

---

## Tech stack (summary)

Frontend
- React Native, Expo SDK 53
- Expo Router
- Expo Secure Store (token storage)
- Lucide React Native (icons)

Backend
- Node.js, Express
- MongoDB + Mongoose
- JWT for auth, bcryptjs for hashing
- CORS enabled

---

## Folder structure (simplified)

```
BloodDonate/
├─ app/                 # Expo Router app directory
├─ backend/             # Node/Express API server
├─ services/            # Frontend API services
├─ utils/               # Frontend utilities
├─ .env                 # Shared env (backend reads this)
└─ README.md
```

---

## Production notes

- Use MongoDB Atlas or a managed database.
- Change all default secrets and admin credentials.
- Serve the backend behind HTTPS and a proper reverse proxy.
- Build a standalone app if needed (EAS Build) and host the API publicly.
