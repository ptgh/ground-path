import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    } catch (error) {
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
      <div className="w-full max-w-md space-y-4">
        <Link
          to="/practitioner/auth"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
        <Card className="w-full shadow-sm border-border/60">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="flex justify-center">
              <div className={`p-5 rounded-full ${verified ? 'bg-primary/10' : 'bg-muted'}`}>
                {verified ? (
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                ) : (
                  <Mail className="h-12 w-12 text-primary animate-pulse" />
                )}
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-xl font-semibold text-foreground">
                {verified ? 'Email Verified!' : 'Verify Your Email'}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {verified
                  ? 'Finishing your signup now…'
                  : 'We sent a confirmation link to your email. Click the link to verify your account.'}
              </p>
            </div>

            {!verified ? (
              <>
                <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">What to do next</p>
                      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Check your inbox (and spam folder)</li>
                        <li>Click the verification link</li>
                        <li>You'll be redirected automatically</li>
                      </ol>
                    </div>
                  </div>
                </div>
                <Button onClick={handleResend} variant="outline" className="w-full" disabled={resendLoading}>
                  {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Resend Verification Email
                </Button>
                <Button variant="ghost" className="w-full text-muted-foreground text-sm" onClick={() => navigate('/practitioner/auth', { replace: true })}>
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
    </div>
  );
};

export default VerifyEmail;
