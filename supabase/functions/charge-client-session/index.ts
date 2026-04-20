// Practitioner-initiated charge for a completed session.
// Creates a Stripe Invoice (so the client gets a hosted receipt), then pays it
// off-session using the client's default saved card.
//
// Stripe Connect split:
//   - Platform fee: 5% + A$1.00 (taken via application_fee_amount)
//   - Net to practitioner: invoice total − platform fee − Stripe processing
//   - If practitioner has Connect active → invoice is created on_behalf_of their account,
//     funds settle directly to them, application fee comes to groundpath.
//   - If practitioner is NOT Connect-ready → invoice is created on the platform account,
//     funds are held in groundpath's balance and transferred manually once they onboard.
import { getStripe, getServiceClient, getUserClient } from '../_shared/stripe.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLATFORM_FEE_PERCENT = 0.05;       // 5%
const PLATFORM_FEE_FIXED_CENTS = 100;    // A$1.00

function calculatePlatformFeeCents(amountCents: number): number {
  return Math.round(amountCents * PLATFORM_FEE_PERCENT) + PLATFORM_FEE_FIXED_CENTS;
}

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
    <div style="background-color:#f3f4f6;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d4ddd4;border-radius:12px;overflow:hidden;">
        <div style="background:#ffffff;text-align:center;padding:24px 16px 16px;border-bottom:1px solid #d4ddd4;">
          <img src="https://groundpath.com.au/email/groundpath-logo.png" width="44" height="44" alt="groundpath" style="display:inline-block;width:44px;height:44px;border-radius:50%;border:0;outline:none;text-decoration:none;" />
        </div>
        <div style="padding:24px 32px 32px;color:#1f2937;">
          <h1 style="font-size:20px;font-weight:600;color:#0a0f1a;margin:0 0 16px;text-align:center;letter-spacing:-0.01em;">Receipt for your session</h1>
          <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Hello${opts.clientName ? ' ' + opts.clientName : ''},</p>
          <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
            Thank you for your session${opts.practitionerName ? ' with ' + opts.practitionerName : ''}.
            Your card on file has been charged <strong>${opts.amountFormatted}</strong>.
          </p>
          <p style="margin:24px 0;text-align:center;">
            <a href="${opts.hostedInvoiceUrl}" style="background:#4a7c4f;color:white;padding:12px 32px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:500;font-size:14px;">View receipt</a>
          </p>
          <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:24px 0 0;">
            If you have any questions about this charge, please reply to this email or contact your practitioner directly.
          </p>
        </div>
      </div>
      <p style="text-align:center;font-size:11px;color:#9ca3af;margin:16px 0 0;">groundpath — grounded mental health support · groundpath.com.au</p>
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
      const cards = await stripe.paymentMethods.list({ customer: custRow.stripe_customer_id, type: 'card', limit: 1 });
      if (cards.data.length === 0) {
        return new Response(JSON.stringify({ error: 'Client has no card on file' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Look up practitioner's Connect account (if any)
    const { data: connectRow } = await svc
      .from('practitioner_connect_accounts')
      .select('stripe_account_id, charges_enabled, payouts_enabled')
      .eq('user_id', practitioner.id)
      .maybeSingle();
    const connectReady = !!connectRow?.charges_enabled && !!connectRow?.payouts_enabled;
    const platformFeeCents = calculatePlatformFeeCents(amountCents);

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

    try {
      await stripe.invoiceItems.create({
        customer: custRow.stripe_customer_id,
        amount: amountCents,
        currency,
        description: description ?? 'Counselling session',
      });

      // Build invoice. If Connect-ready, route funds + take application fee.
      const invoiceParams: Record<string, unknown> = {
        customer: custRow.stripe_customer_id,
        collection_method: 'charge_automatically',
        auto_advance: false,
        metadata: {
          booking_request_id: bookingRequestId ?? '',
          charge_row_id: chargeRow.id,
          practitioner_id: practitioner.id,
          platform_fee_cents: String(platformFeeCents),
          connect_ready: connectReady ? 'true' : 'false',
        },
      };

      if (connectReady && connectRow?.stripe_account_id) {
        invoiceParams.on_behalf_of = connectRow.stripe_account_id;
        invoiceParams.transfer_data = { destination: connectRow.stripe_account_id };
        invoiceParams.application_fee_amount = platformFeeCents;
      }

      const invoice = await stripe.invoices.create(invoiceParams);
      const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
      const paid = await stripe.invoices.pay(finalized.id);

      await svc.from('session_charges').update({
        status: 'succeeded',
        stripe_invoice_id: paid.id,
        stripe_payment_intent_id: typeof paid.payment_intent === 'string' ? paid.payment_intent : paid.payment_intent?.id,
        hosted_invoice_url: paid.hosted_invoice_url,
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

      return new Response(JSON.stringify({
        success: true,
        chargeId: chargeRow.id,
        hostedInvoiceUrl: paid.hosted_invoice_url,
        connectReady,
        platformFeeCents,
        heldOnPlatform: !connectReady,
      }), {
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
