// Creates a Stripe Checkout Session for a practitioner's A$25/month directory listing.
// Uses STRIPE_PRACTITIONER_PRICE_ID (must be a recurring AUD price in Stripe).
import { getStripe, getServiceClient, getUserClient, getOrCreateStripeCustomer } from '../_shared/stripe.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Missing auth' }, 401);

    const userClient = getUserClient(auth);
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Unauthenticated' }, 401);

    const priceId = Deno.env.get('STRIPE_PRACTITIONER_PRICE_ID');
    if (!priceId) return json({ error: 'STRIPE_PRACTITIONER_PRICE_ID not configured' }, 500);

    const svc = getServiceClient();
    const { data: profile } = await svc
      .from('profiles')
      .select('display_name, user_type, verification_status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile || profile.user_type !== 'practitioner') {
      return json({ error: 'Only practitioners can subscribe' }, 403);
    }

    const customerId = await getOrCreateStripeCustomer(user.id, user.email, profile.display_name ?? undefined);

    const body = (await req.json().catch(() => ({}))) as { successUrl?: string; cancelUrl?: string };
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || '';
    const successUrl = body.successUrl || `${origin}/dashboard?tab=billing&sub=success`;
    const cancelUrl = body.cancelUrl || `${origin}/dashboard?tab=billing&sub=cancelled`;

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { supabase_user_id: user.id, kind: 'practitioner_directory' },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });

    return json({ url: session.url, sessionId: session.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('create-practitioner-subscription error:', msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
