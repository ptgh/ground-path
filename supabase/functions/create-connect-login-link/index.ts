// Returns a one-time login link to the practitioner's Stripe Express dashboard
// so they can view payouts, taxes, balances, etc.
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
    const { data: row } = await svc
      .from('practitioner_connect_accounts')
      .select('stripe_account_id, charges_enabled, payouts_enabled')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!row) return json({ error: 'No Connect account on file' }, 404);
    if (!row.charges_enabled || !row.payouts_enabled) {
      return json({ error: 'Onboarding not yet complete' }, 400);
    }

    const stripe = getStripe();
    const link = await stripe.accounts.createLoginLink(row.stripe_account_id);
    return json({ url: link.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('create-connect-login-link error:', msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
