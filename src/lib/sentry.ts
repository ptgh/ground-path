/**
 * Sentry browser SDK init — third leg of observability.
 *
 * Complements the existing m365_audit_log (causal: what happened) and Teams
 * alerts (what to react to). Sentry covers the "what broke" surface — uncaught
 * exceptions, stack traces, breadcrumbs — that is otherwise invisible.
 *
 * Privacy posture (this is a mental health practice):
 *   - NO session replay. Not on errors, not sampled. Recording user
 *     interactions, even masked, is a posture we explicitly avoid.
 *   - User identification is ID-only. Never email or name.
 *   - beforeSend scrubs email addresses and phone numbers from event
 *     messages and exception values via regex before transmission.
 *
 * Activation: silently no-ops when VITE_SENTRY_DSN is empty / undefined so
 * the app never breaks before the user populates the secret. Dev builds DO
 * report when DSN is set (environment: 'development') so we can verify the
 * pipeline end-to-end before going live.
 */
import * as Sentry from '@sentry/react';

let initialized = false;

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// Match common AU + international phone formats; intentionally conservative.
const PHONE_RE = /(\+?\d[\d\s\-().]{7,}\d)/g;

function scrubPII(input: string | undefined | null): string | undefined {
  if (!input) return input ?? undefined;
  return input
    .replace(EMAIL_RE, '[email redacted]')
    .replace(PHONE_RE, '[phone redacted]');
}

// Sentry DSN is a public client identifier (like the Supabase anon key) — safe
// to ship in browser JS. Hardcoded here because Lovable does not expose a
// build-time env mechanism for VITE_* values, and Sentry confirms DSNs are
// not secrets. To rotate, replace this string and redeploy.
const SENTRY_DSN = 'https://5d25d2faf4c976b8691ae5e7b1397b03@o4511307835703296.ingest.de.sentry.io/4511307840487504';

export function initSentry() {
  if (initialized) return;
  const dsn = SENTRY_DSN;
  // Empty DSN = silent no-op. Do NOT throw — app must still boot.
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: (import.meta.env.VITE_APP_VERSION as string | undefined) ?? undefined,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.captureConsoleIntegration({ levels: ['error'] }),
    ],
    tracesSampleRate: 0.1,
    // No session replay — privacy posture for mental-health practice.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
    beforeSend(event, hint) {
      // Drop benign noise.
      const err = hint.originalException;
      if (err instanceof Error && /ResizeObserver|AbortError|cancelled/i.test(err.message)) {
        return null;
      }

      // Scrub PII from message + exception values.
      if (event.message) {
        event.message = scrubPII(event.message) ?? event.message;
      }
      if (event.exception?.values) {
        event.exception.values = event.exception.values.map((v) => ({
          ...v,
          value: scrubPII(v.value) ?? v.value,
        }));
      }
      // Strip request data — query strings can carry tokens / emails.
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
        if (event.request.query_string) {
          event.request.query_string = scrubPII(
            typeof event.request.query_string === 'string'
              ? event.request.query_string
              : String(event.request.query_string),
          ) ?? '';
        }
      }
      return event;
    },
  });

  initialized = true;
}

/** Identify the current user. ID-only — never pass email or name. */
export function identifyUser(userId: string | null) {
  if (!initialized) return;
  Sentry.setUser(userId ? { id: userId } : null);
}

export { Sentry };
