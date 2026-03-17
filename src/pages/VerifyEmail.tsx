import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';

const VerifyEmail = () => {
  const [resendLoading, setResendLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const moveToCompletion = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.email_confirmed_at) {
        return;
      }

      const userType = session.user.user_metadata?.user_type === 'practitioner' ? 'practitioner' : 'user';
      sessionStorage.setItem('pending_signup_email', session.user.email || '');
      sessionStorage.setItem('pending_signup_user_type', userType);
      setVerified(true);

      redirectTimer.current = setTimeout(() => {
        navigate(`/practitioner/auth?signup=complete&type=${userType}`, { replace: true });
      }, 1200);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        void moveToCompletion();
      }
    });

    void moveToCompletion();

    return () => {
      subscription.unsubscribe();
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [navigate]);

  const handleResend = async () => {
    if (redirectTimer.current) {
      clearTimeout(redirectTimer.current);
      redirectTimer.current = null;
    }

    setResendLoading(true);
    try {
      const storedEmail = sessionStorage.getItem('pending_signup_email');
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const targetEmail = session?.user?.email || storedEmail;

      if (!targetEmail) {
        toast({
          title: 'Email not found',
          description: 'Please sign up again to resend the verification email.',
          variant: 'destructive',
        });
        navigate('/practitioner/auth', { replace: true });
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/practitioner/auth/callback?flow=signup`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Verification email sent',
        description: 'Please check your inbox for the latest confirmation link.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to resend',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              {verified ? (
                <CheckCircle2 className="h-10 w-10 text-primary" />
              ) : (
                <Mail className="h-10 w-10 text-primary" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {verified ? 'Email Verified!' : 'Verify Your Email'}
          </CardTitle>
          <CardDescription>
            {verified
              ? 'Finishing your signup now...'
              : 'We sent a confirmation link to your email. Please check your inbox and click the link to verify your account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!verified ? (
            <>
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Didn&apos;t receive the email? Check your spam folder or click below to resend.
                </p>
              </div>
              <Button onClick={handleResend} variant="outline" className="w-full" disabled={resendLoading}>
                {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resend Verification Email
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => navigate('/practitioner/auth', { replace: true })}>
                Back to Sign In
              </Button>
            </>
          ) : (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
