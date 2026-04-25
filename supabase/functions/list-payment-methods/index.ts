// Returns the authenticated user's saved cards (synced fresh from Stripe).
import { getStripe, getServiceClient, getUserClient } from '../_shared/stripe.ts';
import type Stripe from 'npm:stripe@17.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userClient = getUserClient(authHeader);
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const svc = getServiceClient();
    const { data: row } = await svc.from('stripe_customers').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();

    if (!row) return new Response(JSON.stringify({ paymentMethods: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const stripe = getStripe();
    const [cards, customer] = await Promise.all([
      stripe.paymentMethods.list({ customer: row.stripe_customer_id, type: 'card' }),
      stripe.customers.retrieve(row.stripe_customer_id),
    ]);
    const defaultPmId = (customer as Stripe.Customer).invoice_settings?.default_payment_method ?? null;

    const result = cards.data.map(pm => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      exp_month: pm.card?.exp_month,
      exp_year: pm.card?.exp_year,
      is_default: pm.id === defaultPmId,
    }));

    return new Response(JSON.stringify({ paymentMethods: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('list-payment-methods error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
