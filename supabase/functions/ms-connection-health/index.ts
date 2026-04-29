/**
 * ms-connection-health
 *
 * Verifies each linked Microsoft connector via the gateway's
 * /api/v1/verify_credentials endpoint, returning a status per connector.
 * Admin + allow-list gated.
 */
import {
  m365CorsHeaders,
  jsonResponse,
  requireM365Caller,
  writeAudit,
  M365_GATEWAY_BASE,
  type MsConnector,
} from '../_shared/m365.ts';

interface ConnectorStatus {
  connector: MsConnector;
  configured: boolean;
  outcome: 'verified' | 'skipped' | 'failed' | 'not_configured' | 'unreachable';
  latency_ms?: number;
  error?: string;
}

const CONNECTORS: { connector: MsConnector; envKey: string }[] = [
  { connector: 'microsoft_outlook', envKey: 'MICROSOFT_OUTLOOK_API_KEY' },
  { connector: 'microsoft_excel', envKey: 'MICROSOFT_EXCEL_API_KEY' },
  { connector: 'microsoft_onedrive', envKey: 'MICROSOFT_ONEDRIVE_API_KEY' },
  { connector: 'microsoft_onenote', envKey: 'MICROSOFT_ONENOTE_API_KEY' },
  { connector: 'microsoft_powerpoint', envKey: 'MICROSOFT_POWERPOINT_API_KEY' },
  { connector: 'microsoft_word', envKey: 'MICROSOFT_WORD_API_KEY' },
  { connector: 'microsoft_teams', envKey: 'MICROSOFT_TEAMS_API_KEY' },
];

async function verifyOne(connector: MsConnector, envKey: string): Promise<ConnectorStatus> {
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  const connKey = Deno.env.get(envKey);
  if (!lovableKey || !connKey) {
    return { connector, configured: false, outcome: 'not_configured' };
  }

  try {
    const res = await fetch(`${M365_GATEWAY_BASE}/api/v1/verify_credentials`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'X-Connection-Api-Key': connKey,
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        connector,
        configured: true,
        outcome: 'unreachable',
        error: body?.message ?? `HTTP ${res.status}`,
      };
    }
    return {
      connector,
      configured: true,
      outcome: body.outcome ?? 'verified',
      latency_ms: body.latency_ms,
      error: body.error,
    };
  } catch (err) {
    return {
      connector,
      configured: true,
      outcome: 'unreachable',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: m365CorsHeaders(req) });

  const guard = await requireM365Caller(req);
  if (!guard.ok) return jsonResponse({ error: guard.error }, guard.status ?? 500, req);

  const results = await Promise.all(
    CONNECTORS.map(({ connector, envKey }) => verifyOne(connector, envKey)),
  );

  const overallOk = results.every((r) =>
    r.outcome === 'verified' || r.outcome === 'skipped'
  );

  await writeAudit(
    guard.caller!.serviceClient,
    guard.caller!,
    {
      function_name: 'ms-connection-health',
      action: 'verify_all',
      status: overallOk ? 'success' : 'error',
      request_metadata: { results },
    },
    req,
  );

  return jsonResponse({ ok: overallOk, connectors: results, checked_at: new Date().toISOString() }, req);
});
