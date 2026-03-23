import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Stethoscope, Mail, CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

type AccountType = 'user' | 'practitioner' | '';
type VerificationState = 'none' | 'pending' | 'complete';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<AccountType>('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showResetForm, setShowResetForm] = useState(false);
  const [verificationState, setVerificationState] = useState<VerificationState>('none');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verifiedUserType, setVerifiedUserType] = useState<'user' | 'practitioner'>('user');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const getStoredUserType = (): 'user' | 'practitioner' =>
    sessionStorage.getItem('pending_signup_user_type') === 'practitioner' ? 'practitioner' : 'user';

  const clearPendingSignup = () => {
    sessionStorage.removeItem('pending_signup_email');
    sessionStorage.removeItem('pending_signup_user_type');
  };

  const showPendingVerification = (nextEmail: string, nextUserType: 'user' | 'practitioner') => {
    setVerificationEmail(nextEmail);
    setVerifiedUserType(nextUserType);
    setVerificationState('pending');
    setAuthMode('signup');
    setShowResetForm(false);
  };

  const showCompletedVerification = (nextEmail: string, nextUserType: 'user' | 'practitioner') => {
    setVerificationEmail(nextEmail);
    setVerifiedUserType(nextUserType);
    setVerificationState('complete');
    setAuthMode('signup');
    setShowResetForm(false);
    setPassword('');
  };

  const completeVerifiedFlow = () => {
    clearPendingSignup();
    if (verifiedUserType === 'practitioner') {
      navigate('/practitioner/verify', { replace: true });
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Detect password recovery mode
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        setShowResetForm(false);
        setVerificationState('none');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please make sure both passwords match.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: 'Password too short', description: 'Password must be at least 8 characters.', variant: 'destructive' });
      return;
    }
    setRecoveryLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Password updated', description: 'Your password has been changed. You are now signed in.' });
      setIsRecoveryMode(false);
      setNewPassword('');
      setConfirmPassword('');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profileData } = await supabase.from('profiles').select('user_type').eq('user_id', session.user.id).single();
        const effectiveUserType = profileData?.user_type || session.user.user_metadata?.user_type;
        navigate(effectiveUserType === 'practitioner' ? '/practitioner/dashboard' : '/', { replace: true });
      }
    } catch {
      toast({ title: 'Update failed', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setRecoveryLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const signupComplete = params.get('signup') === 'complete';

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.email_confirmed_at && signupComplete) {
        const nextUserType = session.user.user_metadata?.user_type === 'practitioner' ? 'practitioner' : 'user';
        sessionStorage.setItem('pending_signup_email', session.user.email || '');
        sessionStorage.setItem('pending_signup_user_type', nextUserType);
        showCompletedVerification(session.user.email || '', nextUserType);
        return;
      }

      if (session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', session.user.id)
          .single();

        const effectiveUserType = profileData?.user_type || session.user.user_metadata?.user_type;
        navigate(effectiveUserType === 'practitioner' ? '/practitioner/dashboard' : '/', { replace: true });
        return;
      }

      const pendingEmail = sessionStorage.getItem('pending_signup_email');
      if (pendingEmail) {
        showPendingVerification(pendingEmail, getStoredUserType());
      }
    };

    void checkAuth();
  }, [location.search, navigate]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        const provider = session.user.app_metadata?.provider;
        const nextUserType = session.user.user_metadata?.user_type === 'practitioner' ? 'practitioner' : 'user';
        const pendingEmail = session.user.email || sessionStorage.getItem('pending_signup_email') || '';

        if (provider === 'email' && (sessionStorage.getItem('pending_signup_email') || location.search.includes('signup=complete'))) {
          sessionStorage.setItem('pending_signup_email', pendingEmail);
          sessionStorage.setItem('pending_signup_user_type', nextUserType);
          showCompletedVerification(pendingEmail, nextUserType);
          toast({
            title: 'Email verified',
            description:
              nextUserType === 'practitioner'
                ? 'Your account is ready. Continue to complete practitioner verification.'
                : 'Your account is ready and you are now signed in.',
          });
          return;
        }

        if (provider && provider !== 'email') {
          navigate('/practitioner/dashboard', { replace: true });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [location.search, navigate, toast]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
      if (error) {
        const msg = error.message.includes('Invalid login credentials')
          ? 'Please check your email and password and try again.'
          : error.message.includes('Email not confirmed')
          ? 'Please verify your email first. Check your inbox for the confirmation link.'
          : error.message.includes('Too many requests')
          ? 'Too many attempts. Please wait a moment and try again.'
          : error.message.includes('Network')
          ? 'Network error. Please check your connection and try again.'
          : 'Something went wrong. Please try again.';
        toast({ title: 'Sign in failed', description: msg, variant: 'destructive' });
        return;
      }

      toast({ title: 'Welcome back!', description: 'You have been signed in successfully.' });
      const { data: profileData } = await supabase.from('profiles').select('user_type').eq('user_id', data.user!.id).single();
      const effectiveUserType = profileData?.user_type || data.user?.user_metadata?.user_type;
      navigate(effectiveUserType === 'practitioner' ? '/practitioner/dashboard' : '/', { replace: true });
    } catch {
      toast({ title: 'Sign in failed', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast({ title: 'Email required', description: 'Please enter your email address.', variant: 'destructive' });
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/practitioner/auth`,
      });
      if (error) {
        toast({ title: 'Reset failed', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Check your email', description: "We've sent you a password reset link." });
      setShowResetForm(false);
    } catch {
      toast({ title: 'Reset failed', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userType) {
      toast({ title: 'Role required', description: "Please select whether you're a client or practitioner.", variant: 'destructive' });
      return;
    }

    const trimmedEmail = email.trim();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/practitioner/auth/callback?flow=signup`,
          data: {
            user_type: userType,
            display_name: fullName.trim(),
          },
        },
      });

      if (error) {
        const msg = error.message.includes('User already registered')
          ? 'An account with this email already exists. Please sign in instead.'
          : error.message.includes('Password should be')
          ? 'Password should be at least 8 characters long.'
          : 'Something went wrong. Please try again.';
        toast({ title: 'Sign up failed', description: msg, variant: 'destructive' });
        return;
      }

      sessionStorage.setItem('pending_signup_email', trimmedEmail);
      sessionStorage.setItem('pending_signup_user_type', userType);
      showPendingVerification(trimmedEmail, userType === 'practitioner' ? 'practitioner' : 'user');
      toast({
        title: 'Check your inbox',
        description: 'We sent your verification email. Stay on this page until your account is confirmed.',
      });
    } catch {
      toast({ title: 'Sign up failed', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = verificationEmail || email.trim();
    if (!targetEmail) {
      toast({ title: 'Email required', description: 'Please enter your email address first.', variant: 'destructive' });
      return;
    }

    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/practitioner/auth/callback?flow=signup`,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Verification email sent',
        description: 'Please use the latest email in your inbox to complete signup.',
      });
      setResendCooldown(60);
    } catch (error: any) {
      toast({
        title: 'Failed to resend',
        description: error.message || 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleUseDifferentEmail = () => {
    clearPendingSignup();
    setVerificationState('none');
    setVerificationEmail('');
    setPassword('');
  };

  const renderVerificationContent = () => (
    <div className="space-y-4">
      <div className="flex justify-center mb-4">
        <div className="bg-primary/10 p-4 rounded-full">
          {verificationState === 'complete' ? (
            <CheckCircle2 className="h-10 w-10 text-primary" />
          ) : (
            <Mail className="h-10 w-10 text-primary" />
          )}
        </div>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {verificationState === 'complete' ? 'Your account is ready' : 'Check your email'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {verificationState === 'complete'
            ? verifiedUserType === 'practitioner'
              ? 'Your email is verified and you are signed in. Continue to finish practitioner verification.'
              : 'Your email is verified and you are signed in. Continue to the site.'
            : `We sent a verification link to ${verificationEmail}. Keep this page open while you finish signup.`}
        </p>
      </div>

      {verificationState === 'pending' ? (
        <>
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Once you confirm the email, we will bring you straight into the next step.
            </p>
          </div>
          <Button onClick={handleResendVerification} variant="outline" className="w-full" disabled={resendLoading || resendCooldown > 0}>
            {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
          </Button>
          <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={handleUseDifferentEmail}>
            Use a Different Email
          </Button>
        </>
      ) : (
        <Button onClick={completeVerifiedFlow} className="w-full">
          {verifiedUserType === 'practitioner' ? 'Continue to Professional Verification' : 'Go to Site'}
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {isRecoveryMode ? 'Reset Password' : showResetForm ? 'Reset Password' : verificationState === 'none' ? 'groundpath' : 'Finish your signup'}
          </CardTitle>
          <CardDescription>
            {isRecoveryMode
              ? 'Enter your new password below'
              : showResetForm
              ? 'Enter your email to receive a password reset link'
              : verificationState === 'none'
              ? 'Sign in or create an account to get started'
              : 'A smoother, verified signup flow.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRecoveryMode ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div className="text-center space-y-2 mb-4">
                <h2 className="text-xl font-bold text-foreground">Set a New Password</h2>
                <p className="text-sm text-muted-foreground">Choose a strong password for your account.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
              </div>
              <Button type="submit" className="w-full" disabled={recoveryLoading}>
                {recoveryLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          ) : showResetForm ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={resetLoading}>
                {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
              <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => setShowResetForm(false)}>
                Back to Sign In
              </Button>
            </form>
          ) : verificationState !== 'none' ? (
            renderVerificationContent()
          ) : (
            <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'signin' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                  <Button type="button" variant="link" className="w-full text-sm text-muted-foreground" onClick={() => setShowResetForm(true)}>
                    Forgot your password?
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">I am a...</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setUserType('user')}
                        className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                          userType === 'user'
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <User className={`h-7 w-7 ${userType === 'user' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium ${userType === 'user' ? 'text-primary' : 'text-foreground'}`}>
                          Client
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserType('practitioner')}
                        className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                          userType === 'practitioner'
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <Stethoscope className={`h-7 w-7 ${userType === 'practitioner' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium ${userType === 'practitioner' ? 'text-primary' : 'text-foreground'}`}>
                          Practitioner
                        </span>
                      </button>
                    </div>
                  </div>

                  {userType && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-fullname">Full Name</Label>
                        <Input id="signup-fullname" type="text" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Account
                      </Button>
                    </>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
