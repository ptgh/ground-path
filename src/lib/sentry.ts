// Sentry browser SDK init — only activates in production builds with VITE_SENTRY_DSN set.
// Captures uncaught errors, console.error / console.warn, and session replays on errors.
import * as Sentry from '@sentry/react';

let initialized = false;

export function initSentry() {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  // Skip init in dev or when DSN missing — keeps local console clean.
  if (!dsn || import.meta.env.MODE === 'development') return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: (import.meta.env.VITE_APP_VERSION as string | undefined) ?? undefined,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.captureConsoleIntegration({ levels: ['error', 'warn'] }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    // Drop expected/noisy errors before they reach Sentry.
    beforeSend(event, hint) {
      const err = hint.originalException;
      if (err instanceof Error) {
        // Filter benign ResizeObserver warnings + cancelled fetches
        if (/ResizeObserver|AbortError|cancelled/i.test(err.message)) return null;
      }
      return event;
    },
  });

  initialized = true;
}

export { Sentry };
