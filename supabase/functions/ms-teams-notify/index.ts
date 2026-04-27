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
  gatewayFetch,
} from '../_shared/m365.ts';

const BodySchema = z.object({
  teamId: z.string().min(1).max(120),
  channelId: z.string().min(1).max(120),
  subject: z.string().max(200).optional(),
  bodyHtml: z.string().min(1).max(20000),
  importance: z.enum(['normal', 'high', 'urgent']).default('normal'),
});

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: m365CorsHeaders });

  const guard = await requireM365Caller(req);
  if (!guard.ok) return jsonResponse({ error: guard.error }, guard.status ?? 500);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, 400);
  const { teamId, channelId, subject, bodyHtml, importance } = parsed.data;

  try {
    const payload = {
      subject: subject ?? null,
      importance,
      body: { contentType: 'html', content: bodyHtml },
    };

    const result = await gatewayFetch<{ id: string; webUrl?: string }>(
      'microsoft_teams',
      `/teams/${teamId}/channels/${channelId}/messages`,
      { method: 'POST', body: JSON.stringify(payload) },
    );

    await writeAudit(
      guard.caller!.serviceClient,
      guard.caller!,
      {
        function_name: 'ms-teams-notify',
        action: 'post_message',
        target: `${teamId}/${channelId}`,
        status: 'success',
        request_metadata: { messageId: result.id, importance },
      },
      req,
    );

    return jsonResponse({ ok: true, messageId: result.id, webUrl: result.webUrl ?? null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
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
    return jsonResponse({ error: msg }, 502);
  }
});
