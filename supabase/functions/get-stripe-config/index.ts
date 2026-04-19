// Returns the Stripe publishable key (safe to expose to the browser).
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const key = Deno.env.get('STRIPE_PUBLISHABLE_KEY');
  if (!key) {
    return new Response(JSON.stringify({ error: 'Not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify({ publishableKey: key }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
