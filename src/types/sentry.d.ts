/**
 * Type declarations for optional @sentry/react dependency
 * This allows the code to compile even if @sentry/react is not installed
 */

declare module '@sentry/react' {
  export function init(options: {
    dsn: string;
    integrations?: unknown[];
    tracesSampleRate?: number;
    replaysSessionSampleRate?: number;
    replaysOnErrorSampleRate?: number;
    environment?: string;
  }): void;

  export function setUser(user: {
    id: string;
    email?: string;
    username?: string;
  } | null): void;

  export function captureException(error: Error, options?: {
    extra?: unknown;
    tags?: Record<string, string>;
  }): void;

  export function captureMessage(message: string, level?: 'error' | 'warning' | 'info'): void;

  export function browserTracingIntegration(): unknown;
  export function replayIntegration(options?: {
    maskAllText?: boolean;
    blockAllMedia?: boolean;
  }): unknown;

  export function withSentryRouting<T>(component: T): T;
}

