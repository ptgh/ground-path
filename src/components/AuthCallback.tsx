import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const flow = new URLSearchParams(window.location.search).get('flow');
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session) {
          navigate('/practitioner/auth', { replace: true });
          return;
        }

        const provider = session.user.app_metadata?.provider;

        // Email signup flow (existing behaviour)
        if (flow === 'signup' || provider === 'email') {
          const userType = session.user.user_metadata?.user_type === 'practitioner' ? 'practitioner' : 'user';
          sessionStorage.setItem('pending_signup_email', session.user.email || '');
          sessionStorage.setItem('pending_signup_user_type', userType);
          navigate(`/practitioner/auth?signup=complete&type=${userType}`, { replace: true });
          return;
        }

        // OAuth flow (Apple/Google)
        if (flow === 'oauth' || (provider && provider !== 'email')) {
          const pendingFlow = sessionStorage.getItem('pending_oauth_flow');
          const pendingUserType = sessionStorage.getItem('pending_oauth_user_type');
          const isSignup = pendingFlow === 'signup';
          const intendedUserType: 'user' | 'practitioner' =
            pendingUserType === 'practitioner' ? 'practitioner' : 'user';

          if (isSignup) {
            const meta = session.user.user_metadata || {};
            const resolvedName: string =
              (meta.full_name as string) ||
              (meta.name as string) ||
              [meta.given_name, meta.family_name].filter(Boolean).join(' ').trim() ||
              (session.user.email ? session.user.email.split('@')[0] : '');

            try {
              const { data: existing } = await supabase
                .from('profiles')
                .select('user_type, display_name')
                .eq('user_id', session.user.id)
                .single();

              const updates: Record<string, string> = {};
              if (!existing?.user_type || existing.user_type === 'user') {
                updates.user_type = intendedUserType;
              }
              if (!existing?.display_name && resolvedName) {
                updates.display_name = resolvedName;
              }
              if (Object.keys(updates).length > 0) {
                await supabase.from('profiles').update(updates).eq('user_id', session.user.id);
              }
            } catch (err) {
              console.warn('[AuthCallback] OAuth profile sync failed:', err);
            }
          }

          sessionStorage.removeItem('pending_oauth_flow');
          sessionStorage.removeItem('pending_oauth_user_type');

          // Determine destination from current profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('user_id', session.user.id)
            .single();
          const effectiveUserType = profileData?.user_type || intendedUserType;
          navigate(effectiveUserType === 'practitioner' ? '/practitioner/dashboard' : '/dashboard', {
            replace: true,
          });
          return;
        }

        navigate('/dashboard', { replace: true });
      } catch {
        navigate('/practitioner/auth', { replace: true });
      }
    };

    void handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
