# Blood Donation Management System - Project Development Document

## 📋 Executive Summary

The **Blood Donation Management System** is a comprehensive mobile and web application designed to streamline blood donation processes. It connects blood donors with recipients, allows administrators to manage donor information, and provides real-time blood request tracking. Built with modern technologies, the system ensures secure authentication, efficient data management, and user-friendly interfaces for both donors and administrators.

---

## 🎯 Project Objectives

1. **Connect Blood Donors & Recipients**: Enable efficient matching between blood donors and those in need
2. **Centralized Donor Management**: Maintain a comprehensive database of verified blood donors
3. **Admin Control & Monitoring**: Provide administrators with tools to manage donors, requests, and system data
4. **Accessibility**: Make the system available to both mobile users and web browsers
5. **Security**: Implement robust authentication and data protection mechanisms
6. **Scalability**: Design architecture to support growth and additional features

---

## 🏗️ System Architecture

### Technology Stack

#### Frontend (Mobile & Web)
- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Language**: TypeScript
- **Styling**: React Native StyleSheet (Native styling)
- **UI Icons**: Lucide React Native
- **Authentication**: Expo Secure Store
- **Image Handling**: Expo Image Picker, React Native View Shot
- **Features**:
  - Cross-platform (iOS, Android, Web)
  - Native performance with React Native
  - Modern gesture handling with React Native Gesture Handler
  - Secure token storage

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing
- **API Style**: RESTful
- **Development**: Nodemon for hot reload

#### Database
- **Platform**: MongoDB Atlas (Cloud)
- **Collections**:
  - Donors
  - Admins
  - Blood Requests
  - Messages
  - Users
- **Advantages**:
  - Scalable cloud infrastructure
  - Automatic backups
  - Built-in security

---

## 📦 Project Structure

```
BloodDonationApp/
│
├── app/                                    # Frontend Application
│   ├── _layout.tsx                        # Root navigation layout
│   ├── +not-found.tsx                     # 404 page
│   │
│   ├── (tabs)/                            # Donor main app (tab navigation)
│   │   ├── _layout.tsx                    # Tab navigation setup
│   │   ├── index.tsx                      # Home/Dashboard
│   │   ├── search.tsx                     # Search donors by blood group & location
│   │   ├── history.tsx                    # Donation history
│   │   ├── profile.tsx                    # User profile management
│   │   ├── profile_fixed.tsx              # Alternative profile variant
│   │   └── requests.tsx                   # Blood requests management
│   │
│   ├── admin/                             # Admin panel
│   │   ├── _layout.tsx                    # Admin navigation with gesture support
│   │   ├── index.tsx                      # Admin dashboard
│   │   ├── profile.tsx                    # Admin profile settings
│   │   │
│   │   └── donors/                        # Donor management
│   │       ├── _layout.tsx                # Donors navigation
│   │       ├── index.tsx                  # Donors list (searchable, filterable)
│   │       └── [id].tsx                   # Individual donor profile view
│   │
│   └── auth/                              # Authentication
│       ├── login.tsx                      # Donor login
│       ├── signup.tsx                     # Donor registration
│       └── admin-login.tsx                # Admin login
│
├── backend/                               # Backend Server
│   ├── server.js                          # Main Express server
│   ├── package.json                       # Backend dependencies
│   └── uploads/                           # Profile image storage
│       └── profiles/                      # User profile images
│
├── services/                              # API Services
│   ├── AuthService.ts                     # Authentication (login, signup, logout)
│   ├── AdminService.ts                    # Admin operations
│   ├── DonorService.ts                    # Donor operations
│   └── BloodRequestService.ts             # Blood request management
│
├── hooks/                                 # Custom React Hooks
│   └── useFrameworkReady.ts               # Framework initialization hook
│
├── utils/                                 # Utility Functions
│   └── validation.ts                      # Input validation helpers
│
├── assets/                                # Static Assets
│   └── images/                            # App images and icons
│
├── package.json                           # Frontend dependencies
├── tsconfig.json                          # TypeScript configuration
├── app.json                               # Expo configuration
└── .env                                   # Environment variables
```

---

## 🔑 Core Features

### 1. Authentication System

#### Donor Registration
- **Fields**: Name, Email, Password, Blood Group, Location, Phone Number
- **Validation**: Email uniqueness, password strength, phone format
- **Security**: Passwords hashed with bcryptjs (10-round salt)
- **Storage**: MongoDB with encrypted passwords
- **Flow**: Signup → Email verification (optional) → Login

#### Donor Login
- **Credentials**: Email & Password
- **Security**: JWT token generation with 7-day expiration
- **Token Storage**: Secure storage using Expo Secure Store
- **Session Management**: Automatic logout on token expiration

#### Admin Login
- **Credentials**: Username & Password
- **Default Admin**: Created on first server startup
- **Security**: Separate admin authentication pathway
- **Permissions**: Full system access

### 2. Donor Features

#### Profile Management
- **View Profile**: Display all donor information
- **Edit Profile**: Update name, location, phone number
- **Blood Type Info**: Detailed information about blood type compatibility
- **Donation History**: Track previous donations and eligibility
- **Blood Type Card**: Visual display of blood group with icon

#### Blood Type Information
- **Compatibility Details**: Shows who can receive/donate
- **Donation Guidelines**: 90-day waiting period, age/weight requirements
- **Health Benefits**: Information about cardiovascular benefits
- **Why Donate**: Educational content about blood donation importance

#### Search Functionality
- **Search Donors**: Find donors by blood group and location
- **Filters**: Multiple filter options for precise searching
- **Location-Based**: Proximity-based donor discovery
- **Real-Time Results**: Instant search results

#### Blood Requests
- **Send Requests**: Request blood from specific donors
- **View Requests**: Check received and sent requests
- **Request Status**: Track pending, accepted, rejected, completed requests
- **Message Integration**: In-app messaging with donors

#### Profile Security
- **Change Password**: Secure password update with validation
- **Current Password Verification**: Confirm identity before password change
- **Password Requirements**: Minimum 6 characters, match confirmation
- **Session Security**: Token-based authentication

### 3. Admin Features

#### Dashboard
- **Active Statistics**: Real-time counts of active requests
- **Total Donors**: Overall donor count in system
- **Blood Group Distribution**: Visualization of donors by blood type
- **Long-Press Screenshot**: Capture dashboard for reporting

#### Donor Management
- **View All Donors**: Complete donor list with pagination
- **Search & Filter**: Find donors by name, blood group, location, status
- **Donor Details**: View complete donor information
- **Update Donor**: Edit donor information
- **Change Donor Status**: Activate/suspend accounts
- **Verify Donors**: Mark donors as verified
- **Delete Donors**: Remove donors from system

#### Blood Request Tracking
- **View All Requests**: Monitor all blood requests
- **Request Details**: See request status and parties involved
- **Sorting & Filtering**: Organize requests by status, date, blood type

#### Admin Profile
- **View Settings**: Admin account information
- **Change Password**: Update admin password securely
- **Profile Picture**: Upload and manage profile image
- **Account Security**: Multiple security options

### 4. Screenshot & Export Features

#### Donor Features
- **Capture Profile**: Take screenshot of profile for sharing
- **Export Data**: Save profile information as image

#### Admin Features
- **Dashboard Screenshot**: Long-press on header (500ms) to capture dashboard
- **Request Reports**: Capture request lists for documentation
- **Statistics Export**: Save dashboard statistics as images

---

## 🔐 Security Implementation

### Authentication & Authorization

1. **Password Security**
   - Hash Algorithm: bcryptjs with 10-round salt
   - Minimum Length: 6 characters
   - Never Stored in Plain Text
   - Verification: Always compared against hash

2. **Token Management**
   - Type: JWT (JSON Web Tokens)
   - Secret: Environment variable (JWT_SECRET)
   - Expiration: 7 days for regular users
   - Storage: Secure storage (Expo Secure Store)
   - Transmission: Bearer token in Authorization header

3. **Database Security**
   - MongoDB Atlas: Cloud hosting with SSL encryption
   - Connection: Encrypted connection string
   - Access: Environment-based credentials

4. **API Security**
   - CORS: Configured for cross-origin requests
   - Rate Limiting: Available for future implementation
   - Input Validation: Server-side validation for all inputs
   - SQL Injection Prevention: Using MongoDB ODM (Mongoose)

### Data Protection

1. **Personal Information**
   - Encrypted storage in database
   - Secure transmission via HTTPS
   - Access control based on authentication
   - User-level permissions

2. **Sensitive Operations**
   - Password changes require current password
   - Profile updates require authentication
   - Admin operations require admin token

---

## 📱 User Interface Design

### Design Philosophy
- **Material Design Principles**: Clean, intuitive interfaces
- **Color Scheme**: Red & White (blood donation theme)
- **Consistency**: Uniform styling across all screens
- **Accessibility**: Clear typography and adequate contrast
- **Responsive**: Adapts to different screen sizes

### Key UI Components

1. **Navigation**
   - Tab-based navigation for donors (Home, Search, History, Profile, Requests)
   - Stack navigation for authentication
   - Hierarchical navigation for admin panel

2. **Cards & Containers**
   - Profile cards with gradients
   - Information blocks with icons
   - Status badges for eligibility
   - Action buttons with consistent styling

3. **Forms**
   - Input validation with error messages
   - Password visibility toggles
   - Dropdown selectors for blood groups
   - Multi-line text areas for requests

4. **Visual Feedback**
   - Loading indicators
   - Success/error alerts
   - Enabled/disabled button states
   - Touch feedback with opacity changes

---

## 🔄 API Endpoints

### Authentication Endpoints

```
POST /api/auth/signup              - Register new donor
POST /api/auth/login               - Donor login
GET  /api/auth/check-email         - Verify email availability
GET  /api/auth/check-phone         - Verify phone availability
POST /api/auth/change-password     - Change donor password
```

### Donor Endpoints

```
GET  /api/donor/profile            - Get donor profile
PUT  /api/donor/profile            - Update donor profile
GET  /api/donor/search             - Search for donors
GET  /api/donor/requests           - Get donor's requests
POST /api/donor/requests           - Send blood request
```

### Admin Endpoints

```
POST /api/admin/login              - Admin login
GET  /api/admin/stats              - Dashboard statistics
GET  /api/admin/requests           - All blood requests
POST /api/admin/change-password    - Change admin password
GET  /api/admin/donors             - List all donors
GET  /api/admin/donors/:id         - Get donor details
PATCH /api/admin/donors/:id        - Update donor info
PATCH /api/admin/donors/:id/status - Change donor status
PATCH /api/admin/donors/:id/verify - Verify donor
DELETE /api/admin/donors/:id       - Delete donor
```

---

## 📊 Database Schema

### Donor Schema
```
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  bloodGroup: String,
  location: String,
  phoneNumber: String,
  status: String (active/suspended),
  verified: Boolean,
  verificationNote: String,
  lastDonationDate: Date,
  profileImage: String,
  createdAt: Date
}
```

### Admin Schema
```
{
  _id: ObjectId,
  username: String (unique),
  password: String (hashed),
  profileImage: String,
  createdAt: Date
}
```

### Blood Request Schema
```
{
  _id: ObjectId,
  requesterId: ObjectId (ref: Donor),
  donorId: ObjectId (ref: Donor),
  requesterName: String,
  donorName: String,
  bloodGroup: String,
  location: String,
  status: String (pending/rejected/completed/cancelled),
  note: String,
  rating: Number (1-5),
  createdAt: Date,
  updatedAt: Date
}
```

### Message Schema
```
{
  _id: ObjectId,
  senderId: ObjectId (ref: Donor),
  receiverId: ObjectId (ref: Donor),
  text: String,
  read: Boolean,
  createdAt: Date
}
```

---

## 🚀 Deployment & Setup

### Local Development Setup

#### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
# PORT=5002
# HOST=localhost
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/blood_donation
# JWT_SECRET=your_secret_key
# ADMIN_USERNAME=admin
# ADMIN_PASSWORD=admin123

# Start development server
npm run dev
```

#### Frontend Setup
```bash
# Install dependencies
npm install

# Start Expo development server
npm run dev

# Choose platform:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Press 'w' for web browser
```

### Environment Variables

**Backend (.env)**
```
PORT=5002
HOST=localhost
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

**Frontend (.env)**
```
EXPO_PUBLIC_API_URL=http://localhost:5002
```

---

## 📈 Performance Considerations

1. **Database Optimization**
   - Indexed queries for email and username
   - Pagination for donor lists
   - Aggregation for statistics

2. **Frontend Optimization**
   - Lazy loading of screens
   - Image optimization with Expo Image Picker
   - Efficient list rendering with FlatList

3. **API Optimization**
   - JSON response compression
   - Pagination support
   - Selective field queries

---

## 🔮 Future Enhancements

1. **Advanced Features**
   - Real-time notifications for blood requests
   - Geolocation-based donor discovery
   - Video calls between donors and recipients
   - Donation appointment scheduling

2. **Admin Features**
   - Advanced analytics and reporting
   - Bulk donor operations
   - Email notifications
   - SMS alerts

3. **Mobile Features**
   - Offline support with local caching
   - Push notifications
   - QR code for donor verification
   - Integration with health apps

4. **System Features**
   - Multi-language support
   - Accessibility improvements
   - Payment integration for incentives
   - Integration with hospitals

---

## 📚 Technical Documentation

### Dependencies Overview

**Frontend Key Packages:**
- `react-native`: Native mobile framework
- `expo-router`: File-based routing
- `expo-secure-store`: Secure token storage
- `lucide-react-native`: Icon library
- `react-native-view-shot`: Screenshot functionality
- `react-native-gesture-handler`: Gesture recognition

**Backend Key Packages:**
- `express`: Web framework
- `mongoose`: MongoDB ODM
- `jsonwebtoken`: JWT authentication
- `bcryptjs`: Password hashing
- `cors`: Cross-origin resource sharing

---

## 🎓 Development Best Practices

1. **Code Organization**
   - Separation of concerns (services, components, styles)
   - Reusable components and hooks
   - Clear file naming conventions

2. **Error Handling**
   - Try-catch blocks for async operations
   - User-friendly error messages
   - Console logging for debugging

3. **Security**
   - Never hardcode sensitive credentials
   - Always validate user input
   - Use HTTPS in production
   - Regular security audits

4. **Testing Considerations**
   - Test authentication flows
   - Validate all user inputs
   - Test edge cases
   - Cross-platform testing

---

## 📞 Support & Documentation

### Getting Help
- Check existing issues in repository
- Review error logs and console output
- Consult API documentation
- Check database connection settings

### Common Issues
1. **MongoDB Connection Failed**: Verify connection string and network access
2. **Token Expired**: Re-login to get new token
3. **CORS Errors**: Check API URL configuration
4. **Image Upload Failed**: Verify file size and format

---

## ✅ Quality Assurance

### Testing Checklist
- [ ] Donor registration and login flows
- [ ] Admin authentication and authorization
- [ ] Donor search and filtering
- [ ] Blood request creation and management
- [ ] Profile updates and password changes
- [ ] Screenshot capture on all screens
- [ ] Error handling and edge cases
- [ ] Performance with large datasets
- [ ] Security vulnerability testing
- [ ] Cross-platform compatibility

---

## 📄 Conclusion

The Blood Donation Management System represents a modern, full-stack application combining mobile-first development with robust backend infrastructure. It demonstrates professional software engineering practices including secure authentication, scalable architecture, and user-centric design. The system is positioned to make a significant impact in coordinating blood donation efforts and potentially save lives through efficient donor-recipient matching.

**Project Status**: ✅ Core features complete, ready for testing and deployment

---

**Document Version**: 1.0  
**Last Updated**: November 16, 2025  
**Project Timeline**: Ongoing Development
