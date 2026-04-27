/**
 * ms-outlook-triage
 *
 * Pulls the latest unread messages from the connect@ inbox and returns
 * them to the M365 Hub UI with a one-line AI summary per message.
 * Admin + allow-list gated.
 */
import {
  m365CorsHeaders,
  jsonResponse,
  requireM365Caller,
  writeAudit,
  gatewayFetch,
} from '../_shared/m365.ts';

interface OutlookMessage {
  id: string;
  subject: string;
  from?: { emailAddress?: { address?: string; name?: string } };
  receivedDateTime?: string;
  bodyPreview?: string;
  isRead?: boolean;
  webLink?: string;
}

interface MessagesResponse { value: OutlookMessage[] }

async function summarise(text: string): Promise<string> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey || !text) return text.slice(0, 140);
  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Summarise this email in ONE short sentence (max 140 chars). No greetings, no fluff.' },
          { role: 'user', content: text.slice(0, 3000) },
        ],
        max_tokens: 80,
        temperature: 0.2,
      }),
    });
    if (!res.ok) return text.slice(0, 140);
    const json = await res.json();
    return (json.choices?.[0]?.message?.content ?? text).trim().slice(0, 200);
  } catch { return text.slice(0, 140); }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: m365CorsHeaders });

  const guard = await requireM365Caller(req);
  if (!guard.ok) return jsonResponse({ error: guard.error }, guard.status ?? 500);

  try {
    const data = await gatewayFetch<MessagesResponse>(
      'microsoft_outlook',
      "/me/messages?$top=10&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,isRead,webLink&$filter=isRead eq false",
    );

    // Summarise in parallel (rate-limit small N is fine)
    const items = await Promise.all(
      (data.value ?? []).map(async (m) => ({
        id: m.id,
        subject: m.subject ?? '(no subject)',
        from: m.from?.emailAddress?.address ?? null,
        fromName: m.from?.emailAddress?.name ?? null,
        receivedAt: m.receivedDateTime,
        webLink: m.webLink,
        summary: await summarise(m.bodyPreview ?? m.subject ?? ''),
      })),
    );

    await writeAudit(
      guard.caller!.serviceClient,
      guard.caller!,
      {
        function_name: 'ms-outlook-triage',
        action: 'list_unread',
        status: 'success',
        request_metadata: { count: items.length },
      },
      req,
    );
    return jsonResponse({ messages: items });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await writeAudit(
      guard.caller!.serviceClient,
      guard.caller!,
      {
        function_name: 'ms-outlook-triage',
        action: 'list_unread',
        status: 'error',
        error_message: msg,
      },
      req,
    );
    return jsonResponse({ error: msg }, 502);
  }
});
