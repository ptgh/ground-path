import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SavedCard {
  id: string;
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
}

export function useSavedCards() {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('list-payment-methods');
    if (!error && data?.paymentMethods) setCards(data.paymentMethods);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { cards, loading, refresh };
}
