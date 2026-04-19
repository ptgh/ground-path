// Shared Stripe helpers for Groundpath edge functions.
import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function getStripe(): Stripe {
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { apiVersion: '2024-11-20.acacia' as any, httpClient: Stripe.createFetchHttpClient() });
}

export function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

export function getUserClient(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
}

/** Get or create a Stripe customer for a Supabase user. */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string | undefined,
  displayName: string | undefined,
): Promise<string> {
  const stripe = getStripe();
  const svc = getServiceClient();

  const { data: existing } = await svc
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const customer = await stripe.customers.create({
    email,
    name: displayName,
    metadata: { supabase_user_id: userId },
  });

  await svc.from('stripe_customers').insert({
    user_id: userId,
    stripe_customer_id: customer.id,
  });

  return customer.id;
}
