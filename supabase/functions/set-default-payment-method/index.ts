// Marks one of the user's saved cards as the default for future charges.
import { getStripe, getServiceClient, getUserClient } from '../_shared/stripe.ts';

import { corsHeadersFor } from '../_shared/cors.ts';
Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    const userClient = getUserClient(authHeader);
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const { paymentMethodId } = await req.json();
    if (!paymentMethodId) return new Response(JSON.stringify({ error: 'paymentMethodId required' }), { status: 400, headers: corsHeaders });

    const svc = getServiceClient();
    const { data: row } = await svc.from('stripe_customers').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
    if (!row) return new Response(JSON.stringify({ error: 'No customer' }), { status: 404, headers: corsHeaders });

    const stripe = getStripe();
    // Verify ownership
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (pm.customer !== row.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    await stripe.customers.update(row.stripe_customer_id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Mirror in local table
    await svc.from('payment_methods').update({ is_default: false }).eq('user_id', user.id);
    await svc.from('payment_methods').update({ is_default: true }).eq('stripe_payment_method_id', paymentMethodId);

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('set-default-payment-method error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
