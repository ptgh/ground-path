/**
 * send-contact-acknowledgement
 *
 * Sends the appropriate auto-ack email for a single contact_forms row.
 * Idempotent: a conditional UPDATE that flips status `pending` -> `sent`
 * (or `failed`) atomically claims the row. If two callers race, only one
 * wins the claim and actually sends.
 *
 * Auth: admin JWT (manual retry from UI) OR cron-secret (internal callers
 * from contactForms.ts and ms-outlook-triage), via requireM365Caller.
 *
 * Body: { contact_form_id: uuid }
 * Returns: { ok, contact_form_id, status, skipped?, reason?, error? }
 */
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

import {
  m365CorsHeaders, jsonResponse, requireM365Caller, writeAudit,
} from '../_shared/m365.ts';

import { ClientAckEmail, clientAckText, clientAckSubject } from './_templates/client.tsx';
import { PractitionerAckEmail, practitionerAckText, practitionerAckSubject } from './_templates/practitioner.tsx';
import { OtherAckEmail, otherAckText, otherAckSubject } from './_templates/other.tsx';

type IntakeType = 'client' | 'practitioner' | 'other';

interface ContactRow {
  id: string;
  name: string | null;
  email: string;
  intake_type: IntakeType;
  intake_source: string | null;
  acknowledgement_status: 'pending' | 'sent' | 'failed' | 'skipped' | null;
  acknowledged_at: string | null;
}

const FROM = 'Groundpath <connect@groundpath.com.au>';
const REPLY_TO = 'connect@groundpath.com.au';

async function renderTemplate(intakeType: IntakeType, name?: string): Promise<{ subject: string; html: string; text: string }> {
  if (intakeType === 'client') {
    const html = await renderAsync(React.createElement(ClientAckEmail, { name }));
    return { subject: clientAckSubject, html, text: clientAckText(name) };
  }
  if (intakeType === 'practitioner') {
    const html = await renderAsync(React.createElement(PractitionerAckEmail, { name }));
    return { subject: practitionerAckSubject, html, text: practitionerAckText(name) };
  }
  const html = await renderAsync(React.createElement(OtherAckEmail, { name }));
  return { subject: otherAckSubject, html, text: otherAckText(name) };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: m365CorsHeaders(req) });

  const guard = await requireM365Caller(req);
  if (!guard.ok) return jsonResponse({ error: guard.error }, guard.status ?? 500, req);
  const caller = guard.caller!;
  const serviceClient = caller.serviceClient;

  let contactFormId: string;
  let force = false;
  try {
    const body = await req.json();
    contactFormId = String(body?.contact_form_id ?? '').trim();
    force = body?.force === true;
    if (!contactFormId || !/^[0-9a-f-]{36}$/i.test(contactFormId)) {
      return jsonResponse({ error: 'contact_form_id (uuid) required' }, 400, req);
    }
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400, req);
  }

  // Look up the row first so we know intake_type / recipient.
  const { data: row, error: fetchErr } = await serviceClient
    .from('contact_forms')
    .select('id, name, email, intake_type, intake_source, acknowledgement_status')
    .eq('id', contactFormId)
    .maybeSingle<ContactRow>();

  if (fetchErr) {
    return jsonResponse({ error: `Lookup failed: ${fetchErr.message}` }, 500, req);
  }
  if (!row) {
    return jsonResponse({ error: 'contact_forms row not found' }, 404, req);
  }

  if (!force && row.acknowledgement_status && row.acknowledgement_status !== 'pending') {
    await writeAudit(serviceClient, caller, {
      function_name: 'send-contact-acknowledgement',
      action: 'send_ack',
      target: row.email,
      status: 'success',
      request_metadata: {
        contact_form_id: row.id,
        intake_type: row.intake_type,
        intake_source: row.intake_source,
        skipped: true,
        reason: `already ${row.acknowledgement_status}`,
        forced_resend: false,
      },
    }, req);
    return jsonResponse({
      ok: true,
      skipped: true,
      forced: false,
      contact_form_id: row.id,
      status: row.acknowledgement_status,
      reason: 'already_acknowledged',
      acknowledged_at: row.acknowledgement_status === 'sent' ? (row as ContactRow & { acknowledged_at?: string | null }).acknowledged_at ?? null : null,
    }, req);
  }

  // Atomic claim: only one caller can flip pending -> in-flight. We use
  // 'sent' provisionally to win the race, then revert to 'failed' if Resend
  // call fails. Force mode bypasses the claim entirely — the admin has
  // already acknowledged via the UI confirmation that they want to send a
  // duplicate, and the row is already in a terminal state ('sent'/'failed').
  const probeAt = new Date().toISOString();
  if (!force) {
    const { data: claimed, error: claimErr } = await serviceClient
      .from('contact_forms')
      .update({ acknowledged_at: probeAt })
      .eq('id', row.id)
      .eq('acknowledgement_status', 'pending')
      .is('acknowledged_at', null)
      .select('id');

    if (claimErr) {
      return jsonResponse({ error: `Claim failed: ${claimErr.message}` }, 500, req);
    }
    if (!claimed || claimed.length === 0) {
      // Lost the race or status changed under us.
      return jsonResponse({
        ok: true, skipped: true, forced: false, contact_form_id: row.id,
        status: 'pending', reason: 'lost-race-or-already-claimed',
      }, req);
    }
  }

  // Render + send.
  const intakeType: IntakeType = (['client', 'practitioner', 'other'] as IntakeType[])
    .includes(row.intake_type) ? row.intake_type : 'other';
  const recipientName = (row.name ?? '').trim().split(/\s+/)[0] || undefined;

  const resendKey = Deno.env.get('RESEND_API_KEY');

  let sendOk = false;
  let sendErr: string | null = null;
  let resendId: string | null = null;

  if (!resendKey) {
    sendErr = 'RESEND_API_KEY not configured (dev-mode skip)';
    console.warn(sendErr);
  } else {
    try {
      const { subject, html, text } = await renderTemplate(intakeType, recipientName);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM,
          to: [row.email],
          reply_to: REPLY_TO,
          subject,
          html,
          text,
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        sendErr = `Resend HTTP ${res.status}: ${errText.slice(0, 400)}`;
      } else {
        const json = await res.json().catch(() => ({}));
        resendId = json?.id ?? null;
        sendOk = true;
      }
    } catch (err) {
      sendErr = err instanceof Error ? err.message : String(err);
    }
  }

  // Finalise status.
  const finalStatus = sendOk ? 'sent' : 'failed';
  const finalAckAt = sendOk ? probeAt : null;
  const { error: finalErr } = await serviceClient
    .from('contact_forms')
    .update({
      acknowledgement_status: finalStatus,
      acknowledged_at: finalAckAt,
      acknowledgement_error: sendErr,
    })
    .eq('id', row.id);
  if (finalErr) {
    console.error('Failed to write final status (will retry next pass):', finalErr);
  }

  await writeAudit(serviceClient, caller, {
    function_name: 'send-contact-acknowledgement',
    action: 'send_ack',
    target: row.email,
    status: sendOk ? 'success' : 'error',
    error_message: sendErr,
    request_metadata: {
      contact_form_id: row.id,
      intake_type: intakeType,
      intake_source: row.intake_source,
      resend_id: resendId,
    },
  }, req);

  return jsonResponse({
    ok: sendOk,
    contact_form_id: row.id,
    status: finalStatus,
    error: sendErr,
  }, sendOk ? 200 : 502, req);
});
