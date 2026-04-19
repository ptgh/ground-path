import { useEffect, useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';

let cached: Promise<Stripe | null> | null = null;

/** Lazily loads Stripe.js with the publishable key fetched from the edge function. */
export function useStripeLoader(): Promise<Stripe | null> | null {
  const [promise, setPromise] = useState<Promise<Stripe | null> | null>(cached);

  useEffect(() => {
    if (cached) return;
    cached = (async () => {
      const { data, error } = await supabase.functions.invoke('get-stripe-config');
      if (error || !data?.publishableKey) {
        console.error('Failed to load Stripe config:', error);
        return null;
      }
      return loadStripe(data.publishableKey);
    })();
    setPromise(cached);
  }, []);

  return promise;
}
