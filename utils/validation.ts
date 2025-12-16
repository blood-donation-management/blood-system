export function isValidEmail(email: string): boolean {
  // Simple, reliable email format check
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
