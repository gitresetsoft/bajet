/**
 * Input validation and sanitization utilities
 * Provides security-focused validation for user inputs
 */

/**
 * Sanitizes a string by removing potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 1000); // Limit length
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

/**
 * Validates budget name
 */
export function isValidBudgetName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 100;
}

/**
 * Validates member name/email
 */
export function isValidMemberName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  // Allow email format or regular name (1-50 chars)
  return (isValidEmail(trimmed) || (trimmed.length >= 1 && trimmed.length <= 50));
}

/**
 * Validates commitment group/item name
 */
export function isValidCommitmentName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 100;
}

/**
 * Validates monetary amount
 */
export function isValidAmount(amount: number | string): boolean {
  if (typeof amount === 'string') {
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) return false;
    amount = parsed;
  }
  
  if (typeof amount !== 'number') return false;
  if (isNaN(amount) || !isFinite(amount)) return false;
  
  // Allow amounts from 0 to 999,999,999.99
  return amount >= 0 && amount <= 999999999.99;
}

/**
 * Sanitizes and validates monetary amount
 */
export function sanitizeAmount(amount: number | string): number {
  if (typeof amount === 'string') {
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) return 0;
    return Math.max(0, Math.min(999999999.99, Math.round(parsed * 100) / 100));
  }
  
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    return 0;
  }
  
  return Math.max(0, Math.min(999999999.99, Math.round(amount * 100) / 100));
}

/**
 * Validates password strength
 */
export function isValidPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates year
 */
export function isValidYear(year: number): boolean {
  if (typeof year !== 'number' || isNaN(year)) return false;
  const currentYear = new Date().getFullYear();
  return year >= currentYear && year <= currentYear + 10;
}

/**
 * Validates month name
 */
export function isValidMonth(month: string): boolean {
  const validMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return validMonths.includes(month);
}

/**
 * Sanitizes object keys to prevent prototype pollution
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as T;
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Prevent prototype pollution
      if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
        sanitized[key] = obj[key];
      }
    }
  }
  
  return sanitized;
}

/**
 * Validates UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

