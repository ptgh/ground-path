import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SessionMode = 'halaxy' | 'native_beta';

interface HalaxyIntegration {
  session_mode?: SessionMode;
  [key: string]: unknown;
}

/**
 * Fetches the active booking mode for the first directory-approved practitioner.
 * If `native_beta`, public booking CTAs route to the Groundpath in-house flow.
 * Falls back to 'halaxy' when no practitioner is in beta or on error.
 */
export const useBookingMode = (): { mode: SessionMode | null; loading: boolean } => {
  // Start as null so consumers can render a skeleton instead of flashing
  // the wrong UI (Halaxy iframe) before the real mode resolves.
  const [mode, setMode] = useState<SessionMode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        // Look across all approved practitioners — if ANY is in native_beta,
        // route public CTAs to the in-house flow.
        const { data } = await supabase
          .from('profiles')
          .select('halaxy_integration')
          .eq('user_type', 'practitioner')
          .eq('directory_approved', true);

        if (cancelled) return;

        const anyNative = (data ?? []).some(p => {
          const integration = p.halaxy_integration as HalaxyIntegration | null;
          return integration?.session_mode === 'native_beta';
        });
        setMode(anyNative ? 'native_beta' : 'halaxy');
      } catch {
        if (!cancelled) setMode('halaxy');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, []);

  return { mode, loading };
};

export const HALAXY_EXTERNAL_URL = 'https://www.halaxy.com/profile/groundpath/location/1353667';
