// Type definitions for Blood Donation App

export interface User {
  _id: string;
  name: string;
  email: string;
  bloodGroup: BloodType;
  location: string;
  phoneNumber: string;
  status?: 'active' | 'suspended';
  verified?: boolean;
  verificationNote?: string;
  lastDonationDate?: string;
  createdAt: string;
}

export interface DonorProfile extends User {
  eligible?: boolean;
  daysUntilEligible?: number;
  avgRating?: number | null;
  ratingCount?: number;
}

export interface BloodRequest {
  _id: string;
  requesterId: string;
  donorId: string;
  requesterName: string;
  donorName: string;
  bloodGroup: BloodType;
  location: string;
  status: RequestStatus;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminStats {
  activeRequests: number;
  totalDonors: number;
  donorsByBloodGroup: Record<BloodType, number>;
}

export interface AuthResponse {
  token: string;
  user?: User;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string>;
}

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

export interface SearchParams {
  location: string;
  bloodGroup?: BloodType;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  bloodGroup: BloodType;
  location: string;
  phoneNumber: string;
}

export interface UpdateProfileData {
  name: string;
  location: string;
  phoneNumber: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface LocationData {
  city: string;
  area: string;
}

export interface CityData {
  name: string;
  areas: string[];
}
