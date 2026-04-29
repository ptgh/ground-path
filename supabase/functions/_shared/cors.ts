/**
 * Shared CORS helper.
 *
 * Reflects the request `Origin` header back when it matches one of:
 *   - ALLOWED_ORIGINS (production + localhost dev)
 *   - *.lovable.app (catches branch / preview deploy URLs)
 *
 * Otherwise emits NO `Access-Control-Allow-Origin` header so the browser
 * blocks the response. Always sets standard Allow-Headers / Allow-Methods
 * and `Vary: Origin` so caches behave correctly.
 *
 * Edge-to-edge invokes (one function calling another via fetch or
 * supabase.functions.invoke) typically send no Origin header — the helper
 * returns the safe header set without an Allow-Origin, which is fine
 * because those calls don't go through the browser CORS check.
 */

export const ALLOWED_ORIGINS = [
  'https://groundpath.com.au',
  'https://www.groundpath.com.au',
  'https://ground-path.lovable.app',
  'http://localhost:8080',
  'http://localhost:5173',
] as const;

const LOVABLE_PREVIEW_RE = /^[a-z0-9-]+\.lovable\.app$/i;

export function corsHeadersFor(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-cron-trigger, x-cron-secret',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  };
  if (!origin) return headers;
  try {
    const url = new URL(origin);
    const isAllowlisted = (ALLOWED_ORIGINS as readonly string[]).includes(origin);
    const isLovablePreview = LOVABLE_PREVIEW_RE.test(url.hostname);
    if (isAllowlisted || isLovablePreview) {
      headers['Access-Control-Allow-Origin'] = origin;
    }
  } catch {
    // Malformed Origin — refuse silently (no Allow-Origin emitted)
  }
  return headers;
}

/** Convenience: pull Origin from a Request and build CORS headers. */
export function corsHeadersForRequest(req: Request): Record<string, string> {
  return corsHeadersFor(req.headers.get('origin'));
}
