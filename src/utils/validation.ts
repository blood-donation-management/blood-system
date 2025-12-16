import { VALIDATION } from '@/constants';

export function isValidEmail(email: string): boolean {
  // Simple, reliable email format check
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  return password.length >= VALIDATION.password.minLength && 
         password.length <= VALIDATION.password.maxLength;
}

export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= VALIDATION.phone.minLength && 
         cleanPhone.length <= VALIDATION.phone.maxLength;
}

export function isValidName(name: string): boolean {
  return name.trim().length >= VALIDATION.name.minLength && 
         name.trim().length <= VALIDATION.name.maxLength;
}
