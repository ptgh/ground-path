/**
 * ms-teams-notify
 *
 * Posts a message into a Microsoft Teams channel chat (via the connector
 * gateway, on behalf of connect@groundpath.com.au). Used for ops alerts
 * (e.g. "KB sync complete", "new high-priority lead", "weekly recap").
 *
 * Inputs:
 *   - teamId     (Microsoft 365 group id of the team)
 *   - channelId  (id of the channel within the team)
 *   - subject    (optional bold heading)
 *   - bodyHtml   (HTML body, kept short — Teams renders inline)
 *   - importance ('normal' | 'high' | 'urgent')
 */
import { z } from 'https://esm.sh/zod@3.23.8';
import {
  m365CorsHeaders,
  jsonResponse,
  requireM365Caller,
  writeAudit,
  fireAndForgetOpsLog,
  gatewayFetch,
} from '../_shared/m365.ts';

/**
 * Body accepts either explicit teamId/channelId, OR a configKey prefix that
 * resolves both from the m365_integration_config table. Example:
 *   { configKey: 'teams.alerts', subject, bodyHtml }
 * Resolves to keys `teams.alerts.team_id` and `teams.alerts.channel_id`.
 * This keeps channel routing out of the codebase and editable via the DB.
 */
const BodySchema = z.object({
  teamId: z.string().min(1).max(120).optional(),
  channelId: z.string().min(1).max(200).optional(),
  configKey: z.string().min(1).max(120).optional(),
  subject: z.string().max(200).optional(),
  bodyHtml: z.string().min(1).max(20000),
  importance: z.enum(['normal', 'high', 'urgent']).default('normal'),
}).refine(
  (v) => (v.teamId && v.channelId) || v.configKey,
  { message: 'Provide either { teamId + channelId } or { configKey }' },
);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: m365CorsHeaders(req) });

  const guard = await requireM365Caller(req);
  if (!guard.ok) return jsonResponse({ error: guard.error }, guard.status ?? 500);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, 400);
  let { teamId, channelId } = parsed.data;
  const { configKey, subject, bodyHtml, importance } = parsed.data;

  // Resolve from config table when configKey is provided.
  if (configKey && (!teamId || !channelId)) {
    const teamKey = `${configKey}.team_id`;
    const channelKey = `${configKey}.channel_id`;
    const { data: rows, error: cfgErr } = await guard.caller!.serviceClient
      .from('m365_integration_config')
      .select('key, value')
      .in('key', [teamKey, channelKey]);
    if (cfgErr) return jsonResponse({ error: `Config lookup failed: ${cfgErr.message}` }, 500);
    teamId = rows?.find((r) => r.key === teamKey)?.value;
    channelId = rows?.find((r) => r.key === channelKey)?.value;
    if (!teamId || !channelId) {
      return jsonResponse(
        { error: `Missing config rows for ${teamKey} and/or ${channelKey}` },
        400,
      );
    }
  }

  const startedAt = Date.now();
  try {
    const payload = {
      subject: subject ?? null,
      importance,
      body: { contentType: 'html', content: bodyHtml },
    };

    const result = await gatewayFetch<{ id: string; webUrl?: string }>(
      'microsoft_teams',
      `/teams/${encodeURIComponent(teamId!)}/channels/${encodeURIComponent(channelId!)}/messages`,
      { method: 'POST', body: JSON.stringify(payload) },
    );

    const duration = Date.now() - startedAt;
    await writeAudit(
      guard.caller!.serviceClient,
      guard.caller!,
      {
        function_name: 'ms-teams-notify',
        action: 'post_message',
        target: `${teamId}/${channelId}`,
        status: 'success',
        request_metadata: { messageId: result.id, importance, duration_ms: duration },
      },
      req,
    );
    // Fire-and-forget: OpsLog is a secondary audit, not on critical path.
    fireAndForgetOpsLog(guard.caller!.serviceClient, guard.caller!, {
      function_name: 'ms-teams-notify',
      action: 'post_message',
      target: `${teamId}/${channelId}`,
      status: 'success',
      duration_ms: duration,
      notes: `messageId=${result.id} importance=${importance}${subject ? ` subject="${subject}"` : ''}`,
    });

    return jsonResponse({ ok: true, messageId: result.id, webUrl: result.webUrl ?? null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const duration = Date.now() - startedAt;
    await writeAudit(
      guard.caller!.serviceClient,
      guard.caller!,
      {
        function_name: 'ms-teams-notify',
        action: 'post_message',
        target: `${teamId}/${channelId}`,
        status: 'error',
        error_message: msg,
      },
      req,
    );
    fireAndForgetOpsLog(guard.caller!.serviceClient, guard.caller!, {
      function_name: 'ms-teams-notify',
      action: 'post_message',
      target: `${teamId}/${channelId}`,
      status: 'error',
      duration_ms: duration,
      notes: msg.slice(0, 400),
    });
    return jsonResponse({ error: msg }, 502);
  }
});
