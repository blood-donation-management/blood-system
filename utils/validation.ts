export function isValidEmail(email: string): boolean {
  // RFC 5322 compliant email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const trimmedEmail = email.trim();
  
  // Basic format check
  if (!emailRegex.test(trimmedEmail)) {
    return false;
  }
  
  // Additional checks
  const [localPart, domain] = trimmedEmail.split('@');
  
  // Local part (before @) shouldn't start or end with a dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }
  
  // No consecutive dots
  if (localPart.includes('..') || domain.includes('..')) {
    return false;
  }
  
  // Domain should have at least one dot and proper TLD
  if (!domain.includes('.') || domain.split('.').some(part => part.length === 0)) {
    return false;
  }
  
  return true;
}

export function isValidBangladeshPhone(phone: string): boolean {
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Must be exactly 11 digits
  if (cleanPhone.length !== 11) {
    return false;
  }
  
  // Must start with 01 (Bangladesh mobile numbers)
  if (!cleanPhone.startsWith('01')) {
    return false;
  }
  
  // Valid operator prefixes (3rd digit):
  // Grameenphone: 3, 4, 5, 6, 7, 8, 9
  // Banglalink: 3, 4, 9
  // Robi: 3, 8
  // Airtel: 6
  // Teletalk: 5
  const validPrefixes = ['013', '014', '015', '016', '017', '018', '019'];
  const prefix = cleanPhone.substring(0, 3);
  
  return validPrefixes.includes(prefix);
}
