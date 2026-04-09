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
export const useBookingMode = (): { mode: SessionMode; loading: boolean } => {
  const [mode, setMode] = useState<SessionMode>('halaxy');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('halaxy_integration')
          .eq('user_type', 'practitioner')
          .eq('directory_approved', true)
          .limit(1)
          .maybeSingle();

        const integration = data?.halaxy_integration as HalaxyIntegration | null;
        if (integration?.session_mode === 'native_beta') {
          setMode('native_beta');
        }
      } catch {
        // default to halaxy
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { mode, loading };
};

export const HALAXY_EXTERNAL_URL = 'https://www.halaxy.com/profile/groundpath/location/1353667';
