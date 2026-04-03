import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/** Production origins always permitted. */
export const ALLOWED_ORIGINS = [
  'https://groundpath.com.au',
  'https://www.groundpath.com.au',
  'https://ground-path.lovable.app',
];

/** Additional origins permitted during local development. */
export const DEV_ORIGINS = ['http://localhost:8080'];

/**
 * Returns CORS response headers for the given request origin.
 * Only reflects back origins that are explicitly allowed — never uses `*`.
 * Always includes `Vary: Origin` so intermediate caches handle it correctly.
 *
 * @param origin   Value of the request's `Origin` header (may be null).
 * @param allowDev When true, also permits DEV_ORIGINS (use only on user-facing functions).
 */
export function getCorsHeaders(
  origin: string | null,
  allowDev = false,
): Record<string, string> {
  const allowed = allowDev
    ? [...ALLOWED_ORIGINS, ...DEV_ORIGINS]
    : ALLOWED_ORIGINS;

  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };

  if (origin && allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
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

/**
 * Verifies the Bearer JWT in the Authorization header via supabase.auth.getUser().
 * Returns the authenticated user's ID on success, or null + error message on failure.
 */
export async function verifyAuth(
  req: Request,
  supabaseUrl: string,
  supabaseAnonKey: string,
): Promise<{ userId: string | null; error: string | null }> {
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
