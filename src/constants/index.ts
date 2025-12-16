import { BloodType, CityData } from '@/types';

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.10.186:5002',
  TIMEOUT: 10000,
  ENDPOINTS: {
    // Auth
    SIGNUP: '/api/auth/signup',
    LOGIN: '/api/auth/login',
    CHECK_EMAIL: '/api/auth/check-email',
    CHECK_PHONE: '/api/auth/check-phone',
    
    // Donor
    PROFILE: '/api/donor/profile',
    SEARCH: '/api/donor/search',
    REQUEST: '/api/donor/request',
    REQUESTS: '/api/donor/requests',
    HISTORY: '/api/donor/history',
    
    // Admin
    ADMIN_LOGIN: '/api/admin/login',
    ADMIN_REQUESTS: '/api/admin/requests',
    ADMIN_STATS: '/api/admin/stats',
    ADMIN_DONORS: '/api/admin/donors',
  },
};

// Blood Groups
export const BLOOD_GROUPS: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Bangladesh Cities and Areas
export const BD_CITIES: CityData[] = [
  {
    name: 'Dhaka',
    areas: ['Dhanmondi', 'Mirpur', 'Uttara', 'Gulshan', 'Banani', 'Mohakhali', 'Motijheel', 'Farmgate', 'Shahbag', 'Tejgaon'],
  },
  {
    name: 'Chattogram',
    areas: ['Agrabad', 'Pahartali', 'Panchlaish', 'Kotwali', 'Halishahar', 'Khulshi', 'Nasirabad'],
  },
  {
    name: 'Khulna',
    areas: ['Sonadanga', 'Khalishpur', 'Daulatpur', 'Khan Jahan Ali', 'Boyra'],
  },
  {
    name: 'Rajshahi',
    areas: ['Boalia', 'Rajpara', 'Motihar', 'Shah Makhdum', 'Sapura'],
  },
  {
    name: 'Sylhet',
    areas: ['Zindabazar', 'Shibganj', 'Amberkhana', 'Subid Bazar', 'Lamabazar'],
  },
  {
    name: 'Barishal',
    areas: ['Band Road', 'Port Road', 'C&B Road', 'Kawnia'],
  },
  {
    name: 'Rangpur',
    areas: ['Dhap', 'Jahaj Company More', 'Lalbag', 'Station Road'],
  },
  {
    name: 'Mymensingh',
    areas: ['Ganginar Par', 'Town Hall', 'Charpara', 'Maskanda'],
  },
];

// Theme Colors
export const COLORS = {
  primary: '#DC2626',
  primaryDark: '#B91C1C',
  primaryLight: '#FEE2E2',
  secondary: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#3B82F6',
  
  background: '#FFFFFF',
  surface: '#F9FAFB',
  card: '#FFFFFF',
  
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textLight: '#D1D5DB',
  
  border: '#E5E7EB',
  divider: '#F3F4F6',
  
  white: '#FFFFFF',
  black: '#000000',
};

// Typography
export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

// Border Radius
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Animation Durations
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Admin Credentials
export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

// Donation Eligibility (days)
export const DONATION_ELIGIBILITY_DAYS = 90;

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
};

// Validation Rules
export const VALIDATION = {
  password: {
    minLength: 6,
    maxLength: 50,
  },
  name: {
    minLength: 2,
    maxLength: 100,
  },
  phone: {
    minLength: 10,
    maxLength: 15,
  },
};
