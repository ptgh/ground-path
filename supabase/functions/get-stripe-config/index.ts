// Returns the Stripe publishable key (safe to expose to the browser).
import { corsHeadersFor } from '../_shared/cors.ts';
Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const key = Deno.env.get('STRIPE_PUBLISHABLE_KEY');
  if (!key) {
    return new Response(JSON.stringify({ error: 'Not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify({ publishableKey: key }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
