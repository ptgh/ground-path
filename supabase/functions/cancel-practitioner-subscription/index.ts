// Sets cancel_at_period_end=true on the practitioner's active Stripe subscription.
// They keep access until current_period_end, then their listing hides.
import { getStripe, getServiceClient, getUserClient } from '../_shared/stripe.ts';

import { corsHeadersFor } from '../_shared/cors.ts';
Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Missing auth' }, 401);

    const userClient = getUserClient(auth);
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Unauthenticated' }, 401);

    const svc = getServiceClient();
    const { data: sub } = await svc
      .from('practitioner_subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!sub?.stripe_subscription_id) return json({ error: 'No active subscription' }, 404);

    const stripe = getStripe();
    await stripe.subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: true });

    await svc
      .from('practitioner_subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('user_id', user.id);

    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('cancel-practitioner-subscription error:', msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
