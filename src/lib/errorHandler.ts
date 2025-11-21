/**
 * Global error handler for unhandled errors
 */

interface ErrorContext {
  userId?: string;
  userEmail?: string;
  url?: string;
  timestamp?: string;
  userAgent?: string;
}

let errorTrackingEnabled = false;

/**
 * Initialize error tracking
 */
export function initErrorTracking(enabled: boolean) {
  errorTrackingEnabled = enabled;
}

/**
 * Log error to error tracking service
 */
export function logError(error: Error, context?: ErrorContext) {
  const errorData = {
    message: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('Error logged:', errorData);
  }

  // Send to error tracking service in production
  if (import.meta.env.PROD && errorTrackingEnabled) {
    // This will be implemented when Sentry is set up
    // For now, we'll store errors in a way that can be sent later
    sendErrorToService(errorData);
  }
}

/**
 * Send error to error tracking service (Sentry)
 * 
 * Note: @sentry/react must be installed for this to work
 */
function sendErrorToService(errorData: unknown) {
  // Dynamic import to avoid bundling Sentry if not configured
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    import('@sentry/react')
      .then((Sentry) => {
        if (errorData instanceof Error) {
          Sentry.captureException(errorData, {
            extra: errorData,
          });
        } else {
          Sentry.captureMessage(String(errorData), 'error');
        }
      })
      .catch(() => {
        // Silently fail if Sentry not installed
      });
  }
}

/**
 * Handle unhandled promise rejections
 */
export function setupGlobalErrorHandlers() {
  // Handle unhandled errors
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), {
      url: event.filename,
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    logError(error, {
      url: window.location.href,
    });
  });
}

/**
 * Safe async wrapper that catches errors
 */
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  onError?: (error: Error) => void
): Promise<T | null> {
  try {
    const result = await asyncFn();
    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logError(err);
    
    if (onError) {
      onError(err);
    }
    
    return null;
  }
}

