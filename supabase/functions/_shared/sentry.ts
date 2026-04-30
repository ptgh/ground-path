/**
 * Edge-function Sentry shim.
 *
 * Why this exists alongside the audit chain:
 *   - m365_audit_log (Postgres) is the *causal* record: every invocation,
 *     success or failure, written explicitly via writeAudit. It tells the
 *     success story.
 *   - OpsLog Excel is the secondary, human-readable mirror.
 *   - Teams alerts are *what to react to* — high-importance ops signals.
 *   - Sentry is the *failure* surface — uncaught exceptions with stack
 *     traces, breadcrumbs, and tags for debugging. It tells the failure
 *     story and is otherwise invisible from the audit chain.
 *
 * Design rules:
 *   - Idempotent init. Silent no-op when SENTRY_DSN_EDGE is missing so
 *     functions never break before the secret is populated.
 *   - Per-function explicit captureEdgeError calls — no auto-wrapping
 *     middleware. Same explicit / opt-in pattern as writeAudit.
 *   - Does NOT replace writeAudit. Sentry fires on exception; the audit
 *     row is still written in the same catch block.
 *
 * Privacy posture (mental health practice):
 *   - User identification by ID only, never email or name.
 *   - PII scrubbing on err.message via the same regex shape as the
 *     frontend (emails + phone numbers).
 */
// deno-lint-ignore-file no-explicit-any
import * as Sentry from 'npm:@sentry/node@8.47.0';

let initialized = false;

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(\+?\d[\d\s\-().]{7,}\d)/g;

function scrubPII(input: string | undefined | null): string {
  if (!input) return '';
  return String(input)
    .replace(EMAIL_RE, '[email redacted]')
    .replace(PHONE_RE, '[phone redacted]');
}

/** Initialise Sentry once per cold start. No-op if DSN env var is missing. */
export function initSentry(): void {
  if (initialized) return;
  const dsn = Deno.env.get('SENTRY_DSN_EDGE');
  if (!dsn) return;

  try {
    Sentry.init({
      dsn,
      environment: Deno.env.get('SENTRY_ENVIRONMENT') ?? 'production',
      tracesSampleRate: 0,
      sendDefaultPii: false,
      beforeSend(event) {
        if (event.message) event.message = scrubPII(event.message);
        if (event.exception?.values) {
          event.exception.values = event.exception.values.map((v) => ({
            ...v,
            value: scrubPII(v.value),
          }));
        }
        return event;
      },
    });
    initialized = true;
  } catch (err) {
    console.error('Sentry edge init failed (non-fatal):', err);
  }
}

/**
 * Capture an exception with edge-function context. Safe to call even when
 * Sentry isn't initialised (silently no-ops). Always returns void; never
 * throws — observability must not break the request.
 */
export function captureEdgeError(
  err: unknown,
  context: {
    function_name: string;
    triggered_by?: string | null;
    [key: string]: unknown;
  },
): void {
  if (!initialized) {
    initSentry();
    if (!initialized) return;
  }
  try {
    const error = err instanceof Error ? err : new Error(String(err));
    // Defensive scrub on the message itself in case beforeSend misses it.
    error.message = scrubPII(error.message);

    Sentry.withScope((scope) => {
      scope.setTag('function_name', context.function_name);
      if (context.triggered_by) scope.setTag('triggered_by', context.triggered_by);
      const { function_name: _fn, triggered_by: _tb, ...extras } = context;
      if (Object.keys(extras).length > 0) {
        scope.setContext('edge_function', extras as Record<string, unknown>);
      }
      Sentry.captureException(error);
    });
  } catch (innerErr) {
    console.error('captureEdgeError failed (non-fatal):', innerErr);
  }
}
