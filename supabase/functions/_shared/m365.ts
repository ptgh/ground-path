/**
 * Shared helpers for Microsoft 365 edge functions.
 *
 * Responsibilities:
 *   - Build connector-gateway URLs and headers for any Microsoft connector.
 *   - Verify the caller is an authenticated admin AND on the M365 allow-list.
 *   - Write to the m365_audit_log for every action.
 *
 * Security model: defence in depth.
 *   1) JWT must be valid (`verifyAuth` from _shared/auth.ts).
 *   2) Caller must hold the `admin` role.
 *   3) Caller's email must appear in `m365_authorised_emails` (seeded with
 *      `connect@groundpath.com.au` — the org Microsoft account).
 */
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

export const M365_GATEWAY_BASE = 'https://connector-gateway.lovable.dev';

export type MsConnector =
  | 'microsoft_outlook'
  | 'microsoft_excel'
  | 'microsoft_onedrive'
  | 'microsoft_onenote'
  | 'microsoft_powerpoint'
  | 'microsoft_word'
  | 'microsoft_teams';

const CONNECTOR_KEY_ENV: Record<MsConnector, string> = {
  microsoft_outlook: 'MICROSOFT_OUTLOOK_API_KEY',
  microsoft_excel: 'MICROSOFT_EXCEL_API_KEY',
  microsoft_onedrive: 'MICROSOFT_ONEDRIVE_API_KEY',
  microsoft_onenote: 'MICROSOFT_ONENOTE_API_KEY',
  microsoft_powerpoint: 'MICROSOFT_POWERPOINT_API_KEY',
  microsoft_word: 'MICROSOFT_WORD_API_KEY',
  microsoft_teams: 'MICROSOFT_TEAMS_API_KEY',
};

/** Build base URL for a connector's gateway. */
export function gatewayUrl(connector: MsConnector, path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${M365_GATEWAY_BASE}/${connector}${cleanPath}`;
}

/**
 * Build required gateway headers for the given connector.
 * Throws if either LOVABLE_API_KEY or the connector key is missing.
 */
export function gatewayHeaders(
  connector: MsConnector,
  extra: Record<string, string> = {},
): Record<string, string> {
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableKey) throw new Error('LOVABLE_API_KEY is not configured');

  const keyName = CONNECTOR_KEY_ENV[connector];
  const key = Deno.env.get(keyName);
  if (!key) throw new Error(`${keyName} is not configured`);

  return {
    'Authorization': `Bearer ${lovableKey}`,
    'X-Connection-Api-Key': key,
    ...extra,
  };
}

/**
 * Make a Microsoft Graph call via the connector gateway and return parsed JSON.
 * Throws a descriptive error on non-2xx, including HTTP status and body.
 */
export async function gatewayFetch<T = unknown>(
  connector: MsConnector,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = gatewayUrl(connector, path);
  const headers = gatewayHeaders(connector, {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined ?? {}),
  });

  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`[${connector}] ${res.status} ${res.statusText}: ${text.slice(0, 500)}`);
  }
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/**
 * Make a gateway call expecting a binary response (e.g. file download).
 */
export async function gatewayFetchBinary(
  connector: MsConnector,
  path: string,
  init: RequestInit = {},
): Promise<Uint8Array> {
  const url = gatewayUrl(connector, path);
  const headers = gatewayHeaders(connector, init.headers as Record<string, string> | undefined);
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`[${connector}] ${res.status} ${res.statusText}: ${errText.slice(0, 500)}`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

/* ============================================================
 *  Caller authorisation
 * ============================================================ */

export interface M365Caller {
  userId: string;
  email: string | null;
  serviceClient: SupabaseClient;
}

export interface M365GuardResult {
  ok: boolean;
  caller?: M365Caller;
  status?: number;
  error?: string;
}

/**
 * Verifies the JWT on the request, then confirms:
 *   - user has `admin` role
 *   - user's email is in `m365_authorised_emails`
 *
 * Returns a service-role Supabase client so callers can perform privileged work.
 */
export async function requireM365Caller(req: Request): Promise<M365GuardResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return { ok: false, status: 500, error: 'Supabase env not configured' };
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Missing or malformed Authorization header' };
  }

  // Verify JWT via anon client + caller's token
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return { ok: false, status: 401, error: 'Invalid or expired token' };

  const serviceClient = createClient(supabaseUrl, serviceKey);

  // is_m365_authorised checks both admin role AND allow-list in one query
  const { data: authorised, error: rpcErr } = await serviceClient.rpc(
    'is_m365_authorised',
    { _user_id: user.id },
  );
  if (rpcErr) {
    return { ok: false, status: 500, error: `Authorisation check failed: ${rpcErr.message}` };
  }
  if (!authorised) {
    return { ok: false, status: 403, error: 'M365 access requires admin role and allow-listed email' };
  }

  return {
    ok: true,
    caller: { userId: user.id, email: user.email ?? null, serviceClient },
  };
}

/* ============================================================
 *  Audit log
 * ============================================================ */

export interface AuditEntry {
  function_name: string;
  action: string;
  status: 'success' | 'error' | 'denied';
  target?: string | null;
  error_message?: string | null;
  request_metadata?: Record<string, unknown>;
}

/**
 * Insert a row into m365_audit_log. Failures are logged but never thrown,
 * so audit problems never break the user's actual request.
 */
export async function writeAudit(
  serviceClient: SupabaseClient,
  caller: { userId?: string | null; email?: string | null } | null,
  entry: AuditEntry,
  req?: Request,
): Promise<void> {
  try {
    const ipHash = req ? await sha256(req.headers.get('x-forwarded-for') ?? '') : null;
    const uaHash = req ? await sha256(req.headers.get('user-agent') ?? '') : null;
    await serviceClient.from('m365_audit_log').insert({
      user_id: caller?.userId ?? null,
      user_email: caller?.email ?? null,
      function_name: entry.function_name,
      action: entry.action,
      target: entry.target ?? null,
      status: entry.status,
      error_message: entry.error_message ?? null,
      request_metadata: entry.request_metadata ?? {},
      ip_hash: ipHash,
      user_agent_hash: uaHash,
    });
  } catch (err) {
    console.error('writeAudit failed (non-fatal):', err);
  }
}

async function sha256(input: string): Promise<string | null> {
  if (!input) return null;
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/* ============================================================
 *  CORS
 * ============================================================ */

export const m365CorsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...m365CorsHeaders, 'Content-Type': 'application/json' },
  });
}
