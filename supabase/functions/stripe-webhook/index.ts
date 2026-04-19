// Stripe webhook handler — keeps local payment_methods + session_charges in sync.
// Public endpoint (no JWT). Validates Stripe signature.
import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno';
import { getStripe, getServiceClient } from '../_shared/stripe.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const sig = req.headers.get('stripe-signature');
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!sig || !secret) return new Response('Missing signature', { status: 400 });

  const body = await req.text();
  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, secret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  const svc = getServiceClient();

  try {
    switch (event.type) {
      case 'setup_intent.succeeded': {
        const si = event.data.object as Stripe.SetupIntent;
        const pmId = typeof si.payment_method === 'string' ? si.payment_method : si.payment_method?.id;
        const customerId = typeof si.customer === 'string' ? si.customer : si.customer?.id;
        if (!pmId || !customerId) break;

        const { data: custRow } = await svc.from('stripe_customers').select('user_id').eq('stripe_customer_id', customerId).maybeSingle();
        if (!custRow) break;

        const pm = await stripe.paymentMethods.retrieve(pmId);

        // If this is the user's first card, mark it as default
        const { data: existing } = await svc.from('payment_methods').select('id').eq('user_id', custRow.user_id);
        const isFirst = !existing || existing.length === 0;

        if (isFirst) {
          await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: pmId } });
        }

        await svc.from('payment_methods').upsert({
          user_id: custRow.user_id,
          stripe_payment_method_id: pmId,
          brand: pm.card?.brand,
          last4: pm.card?.last4,
          exp_month: pm.card?.exp_month,
          exp_year: pm.card?.exp_year,
          is_default: isFirst,
        }, { onConflict: 'stripe_payment_method_id' });
        break;
      }

      case 'payment_method.attached': {
        const pm = event.data.object as Stripe.PaymentMethod;
        const customerId = typeof pm.customer === 'string' ? pm.customer : pm.customer?.id;
        if (!customerId) break;
        const { data: custRow } = await svc.from('stripe_customers').select('user_id').eq('stripe_customer_id', customerId).maybeSingle();
        if (!custRow) break;
        await svc.from('payment_methods').upsert({
          user_id: custRow.user_id,
          stripe_payment_method_id: pm.id,
          brand: pm.card?.brand,
          last4: pm.card?.last4,
          exp_month: pm.card?.exp_month,
          exp_year: pm.card?.exp_year,
        }, { onConflict: 'stripe_payment_method_id' });
        break;
      }

      case 'payment_method.detached': {
        const pm = event.data.object as Stripe.PaymentMethod;
        await svc.from('payment_methods').delete().eq('stripe_payment_method_id', pm.id);
        break;
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const charge = pi.latest_charge && typeof pi.latest_charge !== 'string' ? pi.latest_charge : null;
        await svc.from('session_charges').update({
          status: 'succeeded',
          charged_at: new Date(pi.created * 1000).toISOString(),
          stripe_receipt_url: charge?.receipt_url ?? null,
        }).eq('stripe_payment_intent_id', pi.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await svc.from('session_charges').update({
          status: 'failed',
          failure_reason: pi.last_payment_error?.message ?? 'Payment failed',
        }).eq('stripe_payment_intent_id', pi.id);
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    // Still return 200 so Stripe doesn't retry indefinitely on our internal errors
  }

  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
