// Returns the practitioner's current subscription row (or null if none).
import { getServiceClient, getUserClient } from '../_shared/stripe.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'GET' && req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Missing auth' }, 401);

    const userClient = getUserClient(auth);
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Unauthenticated' }, 401);

    const svc = getServiceClient();
    const { data: sub } = await svc
      .from('practitioner_subscriptions')
      .select('status, current_period_end, cancel_at_period_end, trial_end, stripe_price_id')
      .eq('user_id', user.id)
      .maybeSingle();

    return json({ subscription: sub ?? null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('get-practitioner-subscription error:', msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
