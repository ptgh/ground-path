/**
 * contact-form-submit
 *
 * Public, unauthenticated endpoint that the website contact form calls.
 * It is the ONLY edge function the browser hits for contact submissions.
 *
 * Responsibilities:
 *   1. Validate the payload (mirrors src/lib/validation.ts contactFormSchema)
 *   2. Per-IP rate-limit (3 / 5 minutes, sliding window in-memory)
 *   3. Insert the row into contact_forms with a server-generated UUID
 *   4. Fire-and-forget invokes of the three protected internal functions
 *      using the cron-secret pattern (browser never sees the secret)
 *   5. Audit row in m365_audit_log
 *
 * Auth: NONE on inbound. verify_jwt = false in supabase/config.toml.
 * The protected downstream functions remain locked behind their guards.
 */
import { z } from 'https://esm.sh/zod@3.23.8';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

// ----- CORS (public endpoint — uses shared allowlist + *.lovable.app preview match) -----
import { corsHeadersFor } from '../_shared/cors.ts';

function jsonResponse(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// ----- Validation: minimal sanitisation, mirrors frontend schema -----
function sanitizeHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/\bon\w+\s*=/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .trim();
}

const BodySchema = z.object({
  name: z.string().min(2).max(100)
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters')
    .transform(sanitizeHtml),
  email: z.string().email().max(254).transform((v) => v.toLowerCase()),
  subject: z.string().min(1).max(200).transform(sanitizeHtml),
  message: z.string().min(1).max(2000).transform(sanitizeHtml),
  intake_type: z.enum(['client', 'practitioner', 'other']),
});

// ----- In-memory sliding-window rate limit, keyed by IP -----
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const ipHits = new Map<string, number[]>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const history = (ipHits.get(ip) ?? []).filter((t) => t > cutoff);
  if (history.length >= RATE_LIMIT_MAX) {
    const retryAfterMs = history[0] + RATE_LIMIT_WINDOW_MS - now;
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }
  history.push(now);
  ipHits.set(ip, history);
  return { allowed: true, retryAfterSec: 0 };
}

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') ?? '';
  return xff.split(',')[0]?.trim() || 'unknown';
}

// ----- Internal invokes (cron-secret pattern) -----
function fireAndForget(p: Promise<unknown> | PromiseLike<unknown>): void {
  const wrapped = Promise.resolve(p).catch((err) =>
    console.error('contact-form-submit fire-and-forget swallowed:', err),
  );
  // deno-lint-ignore no-explicit-any
  const er = (globalThis as any).EdgeRuntime;
  if (er && typeof er.waitUntil === 'function') {
    try { er.waitUntil(wrapped); } catch { /* ignore */ }
  }
}

async function invokeProtected(
  functionName: string,
  body: unknown,
  ctx: { supabaseUrl: string; anonKey: string; cronSecret: string },
): Promise<void> {
  try {
    const res = await fetch(`${ctx.supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ctx.anonKey}`,
        'X-Cron-Trigger': 'contact-form-submit',
        'X-Cron-Secret': ctx.cronSecret,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[contact-form-submit] ${functionName} HTTP ${res.status}: ${text.slice(0, 300)}`);
    }
  } catch (err) {
    console.error(`[contact-form-submit] ${functionName} threw:`, err);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;').replace(/'/g, '&#39;');
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const cors = corsHeadersFor(origin);

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, cors);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const cronSecret = Deno.env.get('CRON_TRIGGER_SECRET');
  if (!supabaseUrl || !anonKey || !serviceKey || !cronSecret) {
    console.error('contact-form-submit: missing env');
    return jsonResponse({ error: 'Server not configured' }, 500, cors);
  }

  // Rate-limit by IP first to cheaply reject floods.
  const ip = clientIp(req);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again shortly.' }),
      { status: 429, headers: { ...cors, 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  // Parse + validate body.
  let raw: unknown;
  try { raw = await req.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400, cors); }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonResponse({ error: 'Invalid form payload', details: parsed.error.flatten().fieldErrors }, 400, cors);
  }
  const data = parsed.data;

  const serviceClient = createClient(supabaseUrl, serviceKey);
  const contactFormId = crypto.randomUUID();
  const submittedAt = new Date().toISOString();

  // INSERT row server-side.
  const { error: insertErr } = await serviceClient
    .from('contact_forms')
    .insert([{
      id: contactFormId,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      intake_type: data.intake_type,
      intake_source: 'form',
      status: 'new',
      acknowledgement_status: 'pending',
      created_at: submittedAt,
      updated_at: submittedAt,
    }]);

  if (insertErr) {
    console.error('contact-form-submit insert failed:', insertErr);
    // Best-effort audit on insert failure.
    fireAndForget(serviceClient.from('m365_audit_log').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      user_email: 'public-form',
      function_name: 'contact-form-submit',
      action: 'submit',
      target: data.email,
      status: 'error',
      error_message: insertErr.message,
      request_metadata: { intake_type: data.intake_type },
    }));
    return jsonResponse({ error: 'Could not save your message. Please try again shortly.' }, 500, cors);
  }

  const ctx = { supabaseUrl, anonKey, cronSecret };

  // 1) Admin notification email (existing send-email contact_form template).
  fireAndForget(invokeProtected('send-email', {
    type: 'contact_form',
    to: 'admin@groundpath.com.au',
    data: {
      id: contactFormId,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      intake_type: data.intake_type,
      intake_source: 'form',
      created_at: submittedAt,
    },
  }, ctx));

  // 2) Teams ops-alert.
  const importance = data.intake_type === 'client' || data.intake_type === 'practitioner' ? 'high' : 'normal';
  const bodyHtml = `
<p><b>From:</b> ${escapeHtml(data.name)} (${escapeHtml(data.email)})</p>
<p><b>Type:</b> ${escapeHtml(data.intake_type)} &middot; <b>Source:</b> form</p>
<p><b>Subject:</b> ${escapeHtml(data.subject)}</p>
<p><b>Message:</b></p>
<p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
<p><i>Submitted at ${escapeHtml(submittedAt)}</i></p>`.trim();

  fireAndForget(invokeProtected('ms-teams-notify', {
    configKey: 'teams.alerts',
    subject: `New ${data.intake_type} via form — ${data.subject}`,
    bodyHtml,
    importance,
  }, ctx));

  // 3) Acknowledgement email.
  fireAndForget(invokeProtected('send-contact-acknowledgement', {
    contact_form_id: contactFormId,
  }, ctx));

  // Audit row for this function (downstream functions write their own).
  fireAndForget(serviceClient.from('m365_audit_log').insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    user_email: 'public-form',
    function_name: 'contact-form-submit',
    action: 'submit',
    target: data.email,
    status: 'success',
    request_metadata: {
      contact_form_id: contactFormId,
      intake_type: data.intake_type,
      ip_present: ip !== 'unknown',
    },
  }));

  return jsonResponse({ ok: true, contact_form_id: contactFormId }, 200, cors);
});
