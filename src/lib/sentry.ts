/**
 * Sentry initialization for error tracking
 * Only initializes in production when DSN is provided
 * 
 * Note: @sentry/react must be installed for this to work
 * Install with: npm install @sentry/react
 */

export function initSentry() {
  // Only initialize in production with DSN
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    // Dynamic import to avoid bundling Sentry if not installed
    import('@sentry/react')
      .then((Sentry) => {
        Sentry.init({
          dsn: import.meta.env.VITE_SENTRY_DSN,
          integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
              maskAllText: true,
              blockAllMedia: true,
            }),
          ],
          // Performance Monitoring
          tracesSampleRate: 0.1, // 10% of transactions (adjust based on traffic)
          // Session Replay
          replaysSessionSampleRate: 0.1, // 10% of sessions
          replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
          environment: import.meta.env.MODE,
        });
      })
      .catch(() => {
        // Silently fail if Sentry is not installed
        // This allows the app to work without Sentry
      });
  }
}

/**
 * Set user context for error tracking
 * 
 * Note: @sentry/react must be installed for this to work
 */
export function setSentryUser(user: { id: string; email?: string; name?: string } | null) {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    import('@sentry/react')
      .then((Sentry) => {
        if (user) {
          Sentry.setUser({
            id: user.id,
            email: user.email,
            username: user.name,
          });
        } else {
          Sentry.setUser(null);
        }
      })
      .catch(() => {
        // Silently fail if Sentry not installed
      });
  }
}

