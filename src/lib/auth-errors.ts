export interface AuthError {
  code: string;
  message: string;
  display: string;
}

export const AUTH_ERRORS: Record<string, AuthError> = {
  // Network/Connection errors
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network connection failed',
    display: 'Unable to connect. Please check your internet connection and try again.'
  },
  
  // Authentication errors
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid login credentials',
    display: 'Invalid email or password. Please check your credentials and try again.'
  },
  
  EMAIL_NOT_CONFIRMED: {
    code: 'EMAIL_NOT_CONFIRMED',
    message: 'Email not confirmed',
    display: 'Please check your email and click the confirmation link before signing in.'
  },
  
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'User not found',
    display: 'No account found with this email address.'
  },
  
  WEAK_PASSWORD: {
    code: 'WEAK_PASSWORD',
    message: 'Password is too weak',
    display: 'Password must be at least 6 characters long.'
  },
  
  EMAIL_ALREADY_EXISTS: {
    code: 'EMAIL_ALREADY_EXISTS',
    message: 'Email already exists',
    display: 'An account with this email already exists. Please sign in instead.'
  },
  
  INVALID_EMAIL: {
    code: 'INVALID_EMAIL',
    message: 'Invalid email format',
    display: 'Please enter a valid email address.'
  },
  
  TOO_MANY_REQUESTS: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests',
    display: 'Too many attempts. Please wait a moment before trying again.'
  },
  
  SESSION_EXPIRED: {
    code: 'SESSION_EXPIRED',
    message: 'Session expired',
    display: 'Your session has expired. Please sign in again.'
  },
  
  // Generic errors
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    display: 'Something went wrong. Please try again later.'
  },
  
  SIGNUP_FAILED: {
    code: 'SIGNUP_FAILED',
    message: 'Sign up failed',
    display: 'Unable to create your account. Please try again.'
  },
  
  LOGIN_FAILED: {
    code: 'LOGIN_FAILED',
    message: 'Login failed',
    display: 'Unable to sign you in. Please try again.'
  },
  
  LOGOUT_FAILED: {
    code: 'LOGOUT_FAILED',
    message: 'Logout failed',
    display: 'Unable to sign you out. Please try again.'
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAuthError(error: any): AuthError {
  if (!error) return AUTH_ERRORS.UNKNOWN_ERROR;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || '';
  
  // Map Supabase error codes to our error constants
  if (errorCode === 'invalid_credentials' || errorMessage.includes('invalid login credentials')) {
    return AUTH_ERRORS.INVALID_CREDENTIALS;
  }
  
  if (errorCode === 'email_not_confirmed' || errorMessage.includes('email not confirmed')) {
    return AUTH_ERRORS.EMAIL_NOT_CONFIRMED;
  }
  
  if (errorCode === 'user_not_found' || errorMessage.includes('user not found')) {
    return AUTH_ERRORS.USER_NOT_FOUND;
  }
  
  if (errorCode === 'weak_password' || errorMessage.includes('password should be at least')) {
    return AUTH_ERRORS.WEAK_PASSWORD;
  }
  
  if (errorCode === 'email_address_invalid' || errorMessage.includes('invalid email')) {
    return AUTH_ERRORS.INVALID_EMAIL;
  }
  
  if (errorCode === 'user_already_registered' || errorMessage.includes('already registered')) {
    return AUTH_ERRORS.EMAIL_ALREADY_EXISTS;
  }
  
  if (errorCode === 'too_many_requests' || errorMessage.includes('too many requests')) {
    return AUTH_ERRORS.TOO_MANY_REQUESTS;
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return AUTH_ERRORS.NETWORK_ERROR;
  }
  
  return AUTH_ERRORS.UNKNOWN_ERROR;
}
