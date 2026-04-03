import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/** Production origins always permitted. */
export const ALLOWED_ORIGINS = [
  'https://groundpath.com.au',
  'https://www.groundpath.com.au',
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
