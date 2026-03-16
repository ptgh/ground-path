import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import Logo from '@/components/Logo';

const VerifyEmail = () => {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const scheduleRedirect = (userType?: string) => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }

      redirectTimer.current = setTimeout(() => {
        if (userType === 'practitioner') {
          navigate('/practitioner/verify', { replace: true });
        } else {
          navigate('/practitioner/dashboard', { replace: true });
        }
      }, 1500);
    };

    // Listen for auth state changes — email confirmation triggers SIGNED_IN
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        setVerified(true);
        const userType = session.user.user_metadata?.user_type;
        scheduleRedirect(userType);
      }
    });

    // Check if already verified
    const checkVerification = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        setVerified(true);
        const userType = session.user.user_metadata?.user_type;
        scheduleRedirect(userType);
      }
    };
    checkVerification();

    return () => {
      subscription.unsubscribe();
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [navigate]);

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: session.user.email,
        });
        if (error) throw error;
        toast({
          title: 'Verification email sent',
          description: 'Please check your inbox for the confirmation link.',
        });
      } else {
        toast({
          title: 'No active session',
          description: 'Please sign up again.',
          variant: 'destructive',
        });
        navigate('/practitioner/auth');
      }
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
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
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
              ? 'Redirecting you now...'
              : 'We sent a confirmation link to your email. Please check your inbox and click the link to verify your account.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!verified && (
            <>
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email? Check your spam folder or click below to resend.
                </p>
              </div>
              <Button
                onClick={handleResend}
                variant="outline"
                className="w-full"
                disabled={resendLoading}
              >
                {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resend Verification Email
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => navigate('/practitioner/auth')}
              >
                Back to Sign In
              </Button>
            </>
          )}
          {verified && (
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
