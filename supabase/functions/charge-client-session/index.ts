// Practitioner-initiated charge for a completed session.
// Creates a Stripe Invoice (so the client gets a hosted receipt), then pays it
// off-session using the client's default saved card. Sends a Resend email with
// the hosted invoice link on success.
import { getStripe, getServiceClient, getUserClient } from '../_shared/stripe.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendInvoiceEmail(opts: {
  to: string;
  clientName?: string;
  practitionerName?: string;
  amountFormatted: string;
  hostedInvoiceUrl: string;
}) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping invoice email');
    return;
  }

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1f2937;">
      <h1 style="font-size:20px;font-weight:600;color:#7B9B85;margin:0 0 16px;">groundpath</h1>
      <p style="font-size:16px;line-height:1.5;margin:0 0 16px;">Hello${opts.clientName ? ' ' + opts.clientName : ''},</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
        Thank you for your session${opts.practitionerName ? ' with ' + opts.practitionerName : ''}.
        Your card on file has been charged <strong>${opts.amountFormatted}</strong>.
      </p>
      <p style="margin:24px 0;">
        <a href="${opts.hostedInvoiceUrl}" style="background:#7B9B85;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:500;">View receipt</a>
      </p>
      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:24px 0 0;">
        If you have any questions about this charge, please reply to this email or contact your practitioner directly.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px;" />
      <p style="font-size:12px;color:#9ca3af;margin:0;">groundpath — grounded mental health support</p>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'groundpath <onboarding@resend.dev>',
      to: [opts.to],
      subject: `Receipt for your session — ${opts.amountFormatted}`,
      html,
    }),
  }).catch(err => console.error('Resend send error:', err));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    const userClient = getUserClient(authHeader);
    const { data: { user: practitioner } } = await userClient.auth.getUser();
    if (!practitioner) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { bookingRequestId, clientUserId, amountCents: overrideAmount, description } = body;
    if (!clientUserId) return new Response(JSON.stringify({ error: 'clientUserId required' }), { status: 400, headers: corsHeaders });

    const svc = getServiceClient();

    // Get practitioner's session rate
    const { data: practProfile } = await svc.from('profiles')
      .select('display_name, session_rate_cents, currency')
      .eq('user_id', practitioner.id).maybeSingle();

    const amountCents = overrideAmount ?? practProfile?.session_rate_cents;
    if (!amountCents || amountCents < 50) {
      return new Response(JSON.stringify({ error: 'Practitioner has not set a session rate' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const currency = (practProfile?.currency || 'aud').toLowerCase();

    // Get client's Stripe customer + default payment method
    const { data: custRow } = await svc.from('stripe_customers').select('stripe_customer_id').eq('user_id', clientUserId).maybeSingle();
    if (!custRow) return new Response(JSON.stringify({ error: 'Client has no card on file' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const stripe = getStripe();
    const customer = await stripe.customers.retrieve(custRow.stripe_customer_id);
    const defaultPm = (customer as any).invoice_settings?.default_payment_method;
    if (!defaultPm) {
      // Fall back to first available card
      const cards = await stripe.paymentMethods.list({ customer: custRow.stripe_customer_id, type: 'card', limit: 1 });
      if (cards.data.length === 0) {
        return new Response(JSON.stringify({ error: 'Client has no card on file' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Insert local charge row (pending)
    const { data: chargeRow, error: insertErr } = await svc.from('session_charges').insert({
      booking_request_id: bookingRequestId ?? null,
      practitioner_id: practitioner.id,
      client_user_id: clientUserId,
      amount_cents: amountCents,
      currency,
      status: 'pending',
      description: description ?? 'Counselling session',
    }).select('id').single();
    if (insertErr || !chargeRow) throw new Error('Failed to record charge');

    // Create + finalize + pay invoice (gives client a hosted receipt link)
    try {
      await stripe.invoiceItems.create({
        customer: custRow.stripe_customer_id,
        amount: amountCents,
        currency,
        description: description ?? 'Counselling session',
      });
      const invoice = await stripe.invoices.create({
        customer: custRow.stripe_customer_id,
        collection_method: 'charge_automatically',
        auto_advance: false,
        metadata: { booking_request_id: bookingRequestId ?? '', charge_row_id: chargeRow.id },
      });
      const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
      const paid = await stripe.invoices.pay(finalized.id);

      await svc.from('session_charges').update({
        status: 'succeeded',
        stripe_invoice_id: paid.id,
        stripe_payment_intent_id: typeof paid.payment_intent === 'string' ? paid.payment_intent : paid.payment_intent?.id,
        hosted_invoice_url: paid.hosted_invoice_url,
        stripe_receipt_url: (paid as any).charge ? null : null,
        charged_at: new Date().toISOString(),
      }).eq('id', chargeRow.id);

      // Send email
      const { data: clientUserData } = await svc.auth.admin.getUserById(clientUserId);
      const { data: clientProfile } = await svc.from('profiles').select('display_name').eq('user_id', clientUserId).maybeSingle();
      const clientEmail = clientUserData?.user?.email;
      if (clientEmail && paid.hosted_invoice_url) {
        const formatter = new Intl.NumberFormat('en-AU', { style: 'currency', currency: currency.toUpperCase() });
        await sendInvoiceEmail({
          to: clientEmail,
          clientName: clientProfile?.display_name ?? undefined,
          practitionerName: practProfile?.display_name ?? undefined,
          amountFormatted: formatter.format(amountCents / 100),
          hostedInvoiceUrl: paid.hosted_invoice_url,
        });
      }

      return new Response(JSON.stringify({ success: true, chargeId: chargeRow.id, hostedInvoiceUrl: paid.hosted_invoice_url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (stripeErr) {
      const msg = (stripeErr as Error).message;
      await svc.from('session_charges').update({ status: 'failed', failure_reason: msg }).eq('id', chargeRow.id);
      return new Response(JSON.stringify({ error: msg, chargeId: chargeRow.id }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (err) {
    console.error('charge-client-session error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
