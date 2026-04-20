// Returns the practitioner's Connect account status (or null if not started).
// Refreshes from Stripe so the UI sees the latest charges_enabled / payouts_enabled.
import { getStripe, getServiceClient, getUserClient } from '../_shared/stripe.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Missing auth' }, 401);

    const userClient = getUserClient(auth);
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Unauthenticated' }, 401);

    const svc = getServiceClient();
    const { data: row } = await svc
      .from('practitioner_connect_accounts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!row) return json({ account: null });

    // Refresh from Stripe so the dashboard always reflects the live state
    try {
      const stripe = getStripe();
      const account = await stripe.accounts.retrieve(row.stripe_account_id);
      const updated = {
        charges_enabled: !!account.charges_enabled,
        payouts_enabled: !!account.payouts_enabled,
        details_submitted: !!account.details_submitted,
        requirements_currently_due: account.requirements?.currently_due ?? [],
      };
      await svc.from('practitioner_connect_accounts').update(updated).eq('user_id', user.id);
      return json({ account: { ...row, ...updated } });
    } catch (refreshErr) {
      const message = refreshErr instanceof Error ? refreshErr.message : String(refreshErr);
      if (message.toLowerCase().includes('no such account')) {
        await svc.from('practitioner_connect_accounts').delete().eq('user_id', user.id);
        return json({ account: null });
      }

      console.warn('Stripe refresh failed, returning cached row:', refreshErr);
      return json({ account: row });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('get-connect-account-status error:', msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
