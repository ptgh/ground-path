/**
 * ms-outlook-triage
 *
 * Pulls the latest unread messages from the connect@ inbox and:
 *   1. AI-summarises each (one-line) for the admin UI
 *   2. AI-classifies each as 'client' | 'practitioner' | 'other'
 *   3. Persists each new email as a contact_forms row (intake_source='inbox')
 *      with dedup via external_message_id = Graph message id
 *   4. Posts a Teams ops-alerts notification for each new row
 *   5. Marks the email as read in Outlook (only AFTER persist + Teams succeed)
 *   6. Writes a per-message audit row + the existing list_unread audit row
 *
 * Sequencing rule: persist → notify → consume. If Teams fails, we DO NOT
 * mark-as-read so the next cron pass retries. Dedup ensures no duplicates.
 *
 * Auth: admin JWT (interactive Load inbox button) OR cron via
 * X-Cron-Trigger + X-Cron-Secret headers (handled by requireM365Caller).
 *
 * Return shape preserved: { messages: [...] } for the admin hub UI.
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

type IntakeType = 'client' | 'practitioner' | 'other';

function escapeHtml(s: string): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

async function classify(subject: string, body: string): Promise<IntakeType> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return 'other';
  try {
    const text = `Subject: ${subject}\n\n${body}`.slice(0, 3000);
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content:
              'Classify this email as one of: client (someone seeking counselling, social work, or NDIS mental health support — including referrals from plan managers, GPs, or family members writing on behalf of a person), practitioner (a clinician asking about joining the Groundpath platform), other (everything else — spam, vendor pitches, billing, admin). Reply with ONE word only: client, practitioner, or other.',
          },
          { role: 'user', content: text },
        ],
        max_tokens: 4,
        temperature: 0,
      }),
    });
    if (!res.ok) return 'other';
    const json = await res.json();
    const raw = (json.choices?.[0]?.message?.content ?? '').trim().toLowerCase().replace(/[^a-z]/g, '');
    if (raw === 'client' || raw === 'practitioner' || raw === 'other') return raw;
    return 'other';
  } catch {
    return 'other';
  }
}

async function postTeamsAlert(
  args: {
    intakeType: IntakeType;
    subject: string;
    fromName: string;
    fromAddress: string;
    summary: string;
    receivedDateTime: string | undefined;
    webLink: string | undefined;
  },
): Promise<boolean> {
  try {
    const importance = args.intakeType === 'other' ? 'normal' : 'high';
    const subj = args.subject || '(no subject)';
    const link = args.webLink
      ? `<p><a href="${escapeHtml(args.webLink)}">Open in Outlook</a></p>`
      : '';
    const bodyHtml = `
<p><b>From:</b> ${escapeHtml(args.fromName)} (${escapeHtml(args.fromAddress)})</p>
<p><b>Type:</b> ${escapeHtml(args.intakeType)} &middot; <b>Source:</b> inbox</p>
<p><b>Subject:</b> ${escapeHtml(subj)}</p>
<p><b>Summary:</b> ${escapeHtml(args.summary)}</p>
${link}
<p><i>Received at ${escapeHtml(args.receivedDateTime ?? '')}</i></p>`.trim();

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const cronSecret = Deno.env.get('CRON_TRIGGER_SECRET');
    if (!supabaseUrl || !anonKey || !cronSecret) {
      console.error('Teams notify: missing env (SUPABASE_URL/ANON_KEY/CRON_TRIGGER_SECRET)');
      return false;
    }

    const res = await fetch(`${supabaseUrl}/functions/v1/ms-teams-notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'X-Cron-Trigger': 'ms-outlook-triage',
        'X-Cron-Secret': cronSecret,
      },
      body: JSON.stringify({
        configKey: 'teams.alerts',
        subject: `New ${args.intakeType} via inbox — ${subj}`,
        bodyHtml,
        importance,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`Teams notify HTTP ${res.status}: ${errText.slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Teams notify threw:', err);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: m365CorsHeaders });

  const guard = await requireM365Caller(req);
  if (!guard.ok) return jsonResponse({ error: guard.error }, guard.status ?? 500);
  const caller = guard.caller!;
  const serviceClient = caller.serviceClient;

  try {
    const data = await gatewayFetch<MessagesResponse>(
      'microsoft_outlook',
      "/me/messages?$top=10&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,isRead,webLink&$filter=isRead eq false",
    );

    const rawMessages = data.value ?? [];

    // Process each message: summarise + classify in parallel, then persist + notify + mark-read sequentially per message.
    const items = await Promise.all(
      rawMessages.map(async (m) => {
        const subject = m.subject ?? '(no subject)';
        const fromAddress = m.from?.emailAddress?.address ?? '';
        const fromName = m.from?.emailAddress?.name ?? fromAddress ?? 'Unknown sender';
        const bodyPreview = m.bodyPreview ?? '';

        // Run summary + classification in parallel.
        const [summary, classification] = await Promise.all([
          summarise(bodyPreview || subject),
          classify(subject, bodyPreview),
        ]);

        let deduped = false;
        let teamsNotified = false;
        let captureStatus: 'success' | 'error' = 'success';
        let captureError: string | null = null;

        try {
          // Dedup check
          const { data: existing, error: dedupErr } = await serviceClient
            .from('contact_forms')
            .select('id')
            .eq('external_message_id', m.id)
            .maybeSingle();
          if (dedupErr) throw new Error(`Dedup check failed: ${dedupErr.message}`);

          if (existing) {
            // Already captured. Skip insert + Teams, but mark as read so cron stops re-seeing it.
            deduped = true;
            try {
              await gatewayFetch('microsoft_outlook', `/me/messages/${encodeURIComponent(m.id)}`, {
                method: 'PATCH',
                body: JSON.stringify({ isRead: true }),
              });
            } catch (markErr) {
              console.error(`Mark-as-read failed for deduped ${m.id}:`, markErr);
            }
          } else {
            // Insert the contact_forms row.
            const { error: insertErr } = await serviceClient.from('contact_forms').insert({
              name: fromName || fromAddress || 'Unknown sender',
              email: fromAddress || 'unknown@unknown',
              subject: subject,
              message: bodyPreview || '(empty body)',
              status: 'new',
              intake_type: classification,
              intake_source: 'inbox',
              external_message_id: m.id,
            });
            if (insertErr) throw new Error(`Insert failed: ${insertErr.message}`);

            // Teams notify (must succeed before we mark-as-read).
            teamsNotified = await postTeamsAlert(serviceClient, {
              intakeType: classification,
              subject,
              fromName,
              fromAddress,
              summary,
              receivedDateTime: m.receivedDateTime,
              webLink: m.webLink,
            });

            if (teamsNotified) {
              try {
                await gatewayFetch('microsoft_outlook', `/me/messages/${encodeURIComponent(m.id)}`, {
                  method: 'PATCH',
                  body: JSON.stringify({ isRead: true }),
                });
              } catch (markErr) {
                console.error(`Mark-as-read failed for ${m.id}:`, markErr);
                // Persisted + notified but not consumed: dedup will guard the next pass.
              }
            } else {
              // Persisted but Teams failed → leave unread, dedup will prevent double-insert next pass.
              captureStatus = 'error';
              captureError = 'Teams notify failed';
            }
          }
        } catch (err) {
          captureStatus = 'error';
          captureError = err instanceof Error ? err.message : String(err);
          console.error(`capture_inbound failed for ${m.id}:`, err);
        }

        // Per-message audit row
        await writeAudit(
          serviceClient,
          caller,
          {
            function_name: 'ms-outlook-triage',
            action: 'capture_inbound',
            target: m.id,
            status: captureStatus,
            error_message: captureError,
            request_metadata: {
              messageId: m.id,
              classification,
              deduped,
              teamsNotified,
            },
          },
          req,
        );

        return {
          id: m.id,
          subject,
          from: fromAddress || null,
          fromName,
          receivedAt: m.receivedDateTime,
          webLink: m.webLink,
          summary,
          classification,
          deduped,
          teamsNotified,
        };
      }),
    );

    await writeAudit(
      serviceClient,
      caller,
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
      serviceClient,
      caller,
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
