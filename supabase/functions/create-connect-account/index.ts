// Creates (or reuses) a Stripe Connect Express account for a practitioner
// and returns an onboarding link they open in a new tab.
import { getStripe, getServiceClient, getUserClient } from '../_shared/stripe.ts';

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

    const svc = getServiceClient();

    // Practitioner gate
    const { data: profile } = await svc
      .from('profiles')
      .select('user_type, display_name')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!profile || profile.user_type !== 'practitioner') {
      return json({ error: 'Only practitioners can connect a payout account' }, 403);
    }

    const stripe = getStripe();

    // Reuse existing Connect account if one is on file
    const { data: existing } = await svc
      .from('practitioner_connect_accounts')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let accountId = existing?.stripe_account_id;

    if (accountId) {
      try {
        await stripe.accounts.retrieve(accountId);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.toLowerCase().includes('no such account')) {
          await svc.from('practitioner_connect_accounts').delete().eq('user_id', user.id);
          accountId = undefined;
        } else {
          throw err;
        }
      }
    }

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'AU',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          mcc: '8099', // Health practitioners not elsewhere classified
          name: profile.display_name ?? undefined,
          product_description: 'Counselling and mental health sessions delivered via groundpath.',
        },
        settings: {
          payouts: { schedule: { interval: 'weekly', weekly_anchor: 'friday' } },
        },
        metadata: { supabase_user_id: user.id },
      });
      accountId = account.id;

      await svc.from('practitioner_connect_accounts').insert({
        user_id: user.id,
        stripe_account_id: accountId,
        country: 'AU',
        default_currency: 'aud',
      });
    }

    const body = (await req.json().catch(() => ({}))) as { returnUrl?: string; refreshUrl?: string };
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || '';
    const returnUrl = body.returnUrl || `${origin}/dashboard?tab=billing&connect=return`;
    const refreshUrl = body.refreshUrl || `${origin}/dashboard?tab=billing&connect=refresh`;

    const link = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      return_url: returnUrl,
      refresh_url: refreshUrl,
    });

    return json({ url: link.url, accountId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('create-connect-account error:', msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
