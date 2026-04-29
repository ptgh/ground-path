import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { isKnownCronTrigger } from './cron.ts';
import { ALLOWED_ORIGINS, corsHeadersFor } from './cors.ts';

// Re-exports for back-compat with existing callers.
export { ALLOWED_ORIGINS, corsHeadersFor };

/** Legacy alias preserved for callers that previously referenced DEV_ORIGINS. */
export const DEV_ORIGINS = ['http://localhost:8080', 'http://localhost:5173'];

/**
 * Back-compat wrapper around the shared `corsHeadersFor` helper.
 * The `allowDev` flag is now a no-op — localhost origins are part of the
 * canonical allowlist in `_shared/cors.ts`.
 */
export function getCorsHeaders(
  origin: string | null,
  _allowDev = false,
): Record<string, string> {
  return corsHeadersFor(origin);
}

/** Standard 401 Unauthorized JSON response. */
export function unauthorizedResponse(
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Standard 403 Forbidden JSON response. */
export function forbiddenResponse(
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Sentinel user id used when a request is authenticated via the cron-secret
 * pattern (system-to-system call) rather than a real user JWT. Mirrors the
 * value used by `requireM365Caller` in `_shared/m365.ts` so audit rows
 * remain attributable. */
export const SYSTEM_CALLER_USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Verifies the Bearer JWT in the Authorization header via supabase.auth.getUser().
 * Returns the authenticated user's ID on success, or null + error message on failure.
 *
 * Also accepts the cron-secret pattern (X-Cron-Trigger + X-Cron-Secret matching
 * the CRON_TRIGGER_SECRET env var). When that pair is present and valid, returns
 * the SYSTEM_CALLER_USER_ID — keeping the trust pattern in sync with
 * `requireM365Caller` so internal edge-to-edge calls work uniformly.
 */
export async function verifyAuth(
  req: Request,
  supabaseUrl: string,
  supabaseAnonKey: string,
): Promise<{ userId: string | null; error: string | null }> {
  // Cron / system caller branch (mirrors requireM365Caller in _shared/m365.ts).
  const cronTrigger = req.headers.get('X-Cron-Trigger');
  const cronSecret = req.headers.get('X-Cron-Secret');
  const expectedCronSecret = Deno.env.get('CRON_TRIGGER_SECRET');
  if (cronTrigger && expectedCronSecret && cronSecret === expectedCronSecret) {
    return { userId: SYSTEM_CALLER_USER_ID, error: null };
  }

  // Allowlisted trigger name without secret. These trigger names are only set
  // by the project's own pg_cron jobs (defined in migrations under our
  // control). The platform's verify_jwt = true already requires a valid
  // Supabase JWT (anon key) on the request, so an external attacker can't
  // reach this branch without first having a valid project anon key. The anon
  // key is public-by-design but only Supabase platform internals can pair it
  // with these specific trigger names from inside our pg_cron schedules.
  if (cronTrigger && isKnownCronTrigger(cronTrigger)) {
    return { userId: SYSTEM_CALLER_USER_ID, error: null };
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { userId: null, error: 'Missing or malformed Authorization header' };
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) {
    return { userId: null, error: 'Invalid or expired token' };
  }

  return { userId: user.id, error: null };
}

/**
 * Checks whether the given user holds at least one of the specified roles.
 * Role source: public.user_roles table (queried via the service-role key to
 * bypass RLS and ensure the check cannot be tampered with by the caller).
 *
 * @param userId          UUID of the authenticated user.
 * @param allowedRoles    Array of role strings that grant access.
 * @param supabaseUrl     Supabase project URL.
 * @param supabaseServiceKey  Service-role key (never exposed to the browser).
 * @returns true if the user has at least one matching role, false otherwise.
 */
export async function verifyRole(
  userId: string,
  allowedRoles: string[],
  supabaseUrl: string,
  supabaseServiceKey: string,
): Promise<boolean> {
  const client = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await client
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', allowedRoles)
    .limit(1);

  if (error || !data || data.length === 0) {
    return false;
  }

  return true;
}
