# Blood Donation Management System

A full stack blood donation management application built with **React Native, Expo, Node.js, Express and Supabase**.

The system connects blood donors with people who need blood through donor discovery, blood requests, eligibility tracking, messaging and administrative management.

## Overview

The Blood Donation Management System provides a centralized platform for managing blood donors and blood donation requests.

The application allows users to:

* Create and manage donor profiles
* Search eligible donors by blood group and location
* Send and manage blood donation requests
* Track donation eligibility
* Communicate through donor messaging
* Manage donor accounts through an administrative panel
* Monitor blood requests and donor statistics

The project is designed as a mobile first application with a REST API backend and Supabase PostgreSQL database.

## Core Features

### Donor Features

* Donor registration and login
* Secure password hashing
* JWT based authentication
* Donor profile management
* Blood group and location information
* Phone and email validation
* Donor search
* Blood group filtering
* Location based donor search
* Donation eligibility tracking
* Blood request creation
* Blood request history
* Request rejection
* Donor messaging
* Conversation management
* Read status for messages
* Secure authentication token storage

### Donation Eligibility

The system includes a donation eligibility mechanism based on the donor's previous donation date.

A donor becomes eligible when at least **90 days** have passed since the previous donation.

The system can provide:

* Current eligibility status
* Last donation information
* Remaining days until eligibility
* Eligibility filtering during donor search

This helps prevent requests from being sent to donors who are currently ineligible according to the application's configured rule.

### Admin Features

The administrative system provides tools for managing the platform.

Administrators can:

* View registered donors
* Search and filter donors
* View donor details
* Update donor information
* Manage donor status
* Verify donor accounts
* Delete donor accounts
* View blood donation requests
* Monitor request statistics
* View donor distribution by blood group
* Manage administrator account credentials

### Messaging

The application includes a donor messaging system that supports:

* Sending messages
* Conversation retrieval
* Conversation lists
* Message read status
* Donor to donor communication

### Request Management

Blood requests are tracked throughout their lifecycle.

The system includes protection against duplicate pending requests between the same requester and donor.

Requests store relevant information including:

* Requester
* Donor
* Blood group
* Location
* Request status
* Request timestamps

## System Architecture

```text
┌──────────────────────────────┐
│      React Native / Expo     │
│                              │
│  Authentication              │
│  Donor Search                │
│  Profiles                    │
│  Blood Requests              │
│  Messaging                   │
│  Admin Interface             │
└──────────────┬───────────────┘
               │
               │ REST API
               ▼
┌──────────────────────────────┐
│       Node.js + Express      │
│                              │
│  Authentication              │
│  Donor Management            │
│  Eligibility Logic            │
│  Request Management          │
│  Messaging                   │
│  Admin Operations            │
└──────────────┬───────────────┘
               │
               │ Supabase Client
               ▼
┌──────────────────────────────┐
│       Supabase PostgreSQL    │
│                              │
│  Donors                      │
│  Blood Requests              │
│  Messages                    │
│  Admin Data                  │
└──────────────────────────────┘
```

## Technology Stack

### Frontend

* React 19.1
* React Native 0.81.5
* Expo SDK 54
* Expo Router 6
* TypeScript
* React Navigation
* Lucide React Native
* Expo Secure Store
* Async Storage
* Expo Camera
* Expo Image Picker
* React Native Web

### Backend

* Node.js
* Express.js
* Supabase JavaScript Client
* PostgreSQL through Supabase
* JWT
* bcryptjs
* CORS
* dotenv

### Development Tools

* TypeScript
* ESLint
* Prettier
* Nodemon
* Expo CLI
* EAS

## Project Structure

```text
blood-system/
│
├── app/                    # Expo Router application screens
├── assets/                 # Images and application assets
├── backend/                # Node.js and Express backend
│   ├── config/             # Backend configuration
│   ├── server.js           # API server
│   └── package.json        # Backend dependencies
│
├── config/                 # Application configuration
├── hooks/                  # Reusable React hooks
├── services/               # API and service layer
├── src/                    # Application source code
├── sql/                    # Database scripts and migrations
├── utils/                  # Utility functions
│
├── app.json                # Expo configuration
├── package.json            # Frontend dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── eslint.config.js        # ESLint configuration
└── README.md               # Project documentation
```

## Getting Started

### Prerequisites

Install the following before running the project:

* Node.js
* npm
* Expo Go for mobile testing

For Android native development, Android Studio and the Android SDK may also be required.

### 1. Clone the Repository

```bash
git clone https://github.com/blood-donation-management/blood-system.git
cd blood-system
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create your environment configuration based on the provided example:

```bash
copy .env.example .env
```

For macOS/Linux:

```bash
cp .env.example .env
```

Configure the required Supabase and API settings in the environment file.

**Never commit real credentials, API keys or secrets to GitHub.**

### 4. Install Backend Dependencies

```bash
cd backend
npm install
```

Return to the project root when needed:

```bash
cd ..
```

### 5. Start the Backend

From the backend directory:

```bash
cd backend
npm run dev
```

The backend uses the configured environment variables and defaults to port `5002` when no custom port is provided.

### 6. Start the Expo Application

From the project root:

```bash
npm run dev
```

Then open the application using:

* Expo Go
* Android emulator
* iOS simulator
* Web browser

## Available Scripts

### Frontend

```bash
npm run start
```

Starts Expo using Expo Go.

```bash
npm run dev
```

Starts the Expo development environment.

```bash
npm run build:web
```

Creates a web export.

```bash
npm run lint
```

Runs ESLint.

```bash
npm run android
```

Runs the Android development build.

```bash
npm run ios
```

Runs the iOS development build.

### Backend

From the `backend` directory:

```bash
npm start
```

Starts the production Node.js server.

```bash
npm run dev
```

Starts the development server using Nodemon.

## API Overview

### Authentication

```text
GET  /api/auth/check-email
GET  /api/auth/check-phone
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/change-password
```

### Donor Operations

```text
GET   /api/donor/profile
PUT   /api/donor/profile
GET   /api/donor/search
GET   /api/donor/eligibility/:donorId
POST  /api/donor/request
GET   /api/donor/requests
PATCH /api/donor/requests/:id/reject
```

### Messaging

```text
POST  /api/messages
GET   /api/messages/conversation
GET   /api/messages/conversations
PATCH /api/messages/:id/read
```

### Administration

```text
POST   /api/admin/login
POST   /api/admin/change-password
GET    /api/admin/donors
GET    /api/admin/donors/:id
PATCH  /api/admin/donors/:id
PATCH  /api/admin/donors/:id/status
PATCH  /api/admin/donors/:id/verify
DELETE /api/admin/donors/:id
GET    /api/admin/requests
GET    /api/admin/stats
```

## Authentication & Security

The application implements several security related mechanisms:

* Password hashing using bcryptjs
* JWT based authentication
* Secure token storage through Expo Secure Store
* Authentication middleware for protected donor operations
* Input validation
* Email and phone availability checks
* Environment based configuration
* CORS configuration
* Password change functionality
* Protection against duplicate pending requests

### Environment Security

Sensitive configuration should be stored in `.env` files and must not be committed to the repository.

The repository's `.gitignore` excludes environment files such as:

```text
.env
.env.local
```

If a secret is accidentally committed, it should be rotated immediately.

## Database

The current backend uses **Supabase PostgreSQL** through the Supabase JavaScript client.

The database supports the application's main entities including donor information, blood donation requests, messaging and administrative data.

Database related scripts and migration resources are maintained under:

```text
sql/
```

## Application Configuration

The current Expo application is configured with:

```text
Application Name: Blood Donation
Version: 2.0.0
Expo SDK: 54
Android Package: com.blooddonation.app
```

The application also supports web builds through Expo.

## Development History

The project has evolved during development from an earlier MongoDB based backend architecture to the current Supabase PostgreSQL based architecture.

Some legacy documentation and dependencies may remain in the repository because of this migration history.

The current backend implementation should be treated as the source of truth when documentation differs from older migration documents.

## Documentation

Additional project documentation is available in the repository, including:

* Architecture documentation
* Implementation notes
* Database migration documentation
* Supabase migration documentation
* Availability system documentation
* Admin management documentation
* Notification tracking
* Troubleshooting guides
* Project development notes
* Presentation materials
* Quick reference documentation

## Future Improvements

Potential future improvements include:

* Push notifications
* Advanced donor verification
* Real time messaging
* Location based donor discovery
* Donation history analytics
* Improved administrator authorization controls
* Automated testing
* CI/CD integration
* Production deployment configuration
* Improved monitoring and logging

## Project Status

**Status: Active Development**

The project is being developed as a full stack blood donation management solution using a mobile application, REST API and cloud database architecture.

## License

This project is intended for educational and development purposes.
