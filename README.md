
# Blood Donation Management System



A comprehensive blood donation management system built with React Native (Expo) frontend and Node.js backend.

## Features

### Frontend (React Native - Expo)
- **Donor Registration & Login**: Secure authentication system for blood donors
- **Admin Dashboard**: Management interface for administrators
- **Donor Search**: Search for donors by location and blood group
- **Profile Management**: Donors can view and update their profiles
- **Blood Request System**: Send requests to specific donors
- **Material Design UI**: Clean white and red theme with modern styling

### Backend (Node.js + Express + MongoDB)
- **RESTful API**: Complete API for all frontend operations
- **MongoDB Atlas Integration**: Cloud database storage
- **JWT Authentication**: Secure token-based authentication
- **Admin System**: Hardcoded admin credentials for management
- **Blood Request Tracking**: Store and manage blood requests

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The backend will run on `http://192.168.10.166:5000`

### Frontend Setup

1. Start the Expo development server:
   ```bash
   npm run dev
   ```

2. Open Expo Go app on your Android device
3. Scan the QR code to load the app

## Admin Credentials

- **Username**: admin
- **Password**: admin123

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new donor
- `POST /api/auth/login` - Donor login
- `POST /api/admin/login` - Admin login

### Donor Operations
- `GET /api/donor/profile` - Get donor profile
- `PUT /api/donor/profile` - Update donor profile
- `GET /api/donor/search` - Search donors
- `POST /api/donor/request` - Send blood request

### Admin Operations
- `GET /api/admin/requests` - Get all blood requests

## Database Schema

### Donors Collection
- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `bloodGroup`: String (required)
- `location`: String (required)
- `phoneNumber`: String (required)
- `createdAt`: Date

### Blood Requests Collection
- `requesterId`: ObjectId (ref: Donor)
- `donorId`: ObjectId (ref: Donor)
- `requesterName`: String
- `donorName`: String
- `bloodGroup`: String
- `location`: String
- `status`: String (default: 'pending')
- `createdAt`: Date

## Technology Stack

### Frontend
- React Native 0.79.1
- Expo SDK 53.0.0
- Expo Router 5.0.2
- Lucide React Native (icons)
- Expo Secure Store (token storage)

### Backend
- Node.js
- Express.js 4.18.2
- MongoDB with Mongoose 8.0.3
- JWT for authentication
- bcryptjs for password hashing
- CORS enabled

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Secure token storage using Expo Secure Store
- Input validation and sanitization
- CORS configuration for cross-origin requests

## Development Notes

- The backend is configured to run on the local network IP (192.168.10.166)
- MongoDB Atlas free cluster is used for data storage
- No push notifications implemented (as requested)
- Admin credentials are hardcoded in the backend for simplicity
- All API endpoints include proper error handling and validation