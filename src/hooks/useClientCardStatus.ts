import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns a Set of client user_ids that have at least one card on file.
 * Lightweight: queries payment_methods directly (RLS allows the user to see
 * their own; for practitioners we rely on a service-side aggregate via the
 * `list-client-card-status` edge function).
 */
export function useClientCardStatus(clientUserIds: string[]) {
  const [withCard, setWithCard] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientUserIds.length === 0) {
      setWithCard(new Set());
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.functions.invoke('list-client-card-status', {
        body: { clientUserIds },
      });
      if (cancelled) return;
      if (!error && data?.withCard && Array.isArray(data.withCard)) {
        setWithCard(new Set(data.withCard as string[]));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // Stable key so we don't re-fetch on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientUserIds.join(',')]);

  return { withCard, loading };
}
