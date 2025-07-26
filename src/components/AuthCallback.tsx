import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current session after OAuth redirect
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/practitioner/auth');
          return;
        }

        if (session) {
          console.log('OAuth callback successful, redirecting to dashboard');
          navigate('/practitioner/dashboard');
        } else {
          console.log('No session found, redirecting to auth');
          navigate('/practitioner/auth');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        navigate('/practitioner/auth');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Processing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;