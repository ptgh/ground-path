// Returns the subset of given client user IDs that have at least one card on file.
// Only callable by authenticated practitioners (any authenticated user is fine —
// the response only reveals "yes/no card", not card details).
import { getServiceClient, getUserClient } from '../_shared/stripe.ts';

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

    const { clientUserIds } = await req.json();
    if (!Array.isArray(clientUserIds) || clientUserIds.length === 0) {
      return new Response(JSON.stringify({ withCard: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const svc = getServiceClient();
    const { data, error } = await svc
      .from('payment_methods')
      .select('user_id')
      .in('user_id', clientUserIds);

    if (error) throw error;

    const withCard = [...new Set((data ?? []).map(r => r.user_id))];
    return new Response(JSON.stringify({ withCard }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('list-client-card-status error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message, withCard: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
