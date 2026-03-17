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

        const userType = session.user.user_metadata?.user_type === 'practitioner' ? 'practitioner' : 'user';

        if (flow === 'signup' || session.user.app_metadata?.provider === 'email') {
          sessionStorage.setItem('pending_signup_email', session.user.email || '');
          sessionStorage.setItem('pending_signup_user_type', userType);
          navigate(`/practitioner/auth?signup=complete&type=${userType}`, { replace: true });
          return;
        }

        navigate('/practitioner/dashboard', { replace: true });
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
