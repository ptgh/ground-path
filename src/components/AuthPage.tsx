import { useState, useEffect } from 'react';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Stethoscope, Mail, CheckCircle2, ArrowLeft, Lock, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { getSafeRedirect } from '@/lib/safeRedirect';

type AccountType = 'user' | 'practitioner' | '';
type VerificationState = 'none' | 'pending' | 'complete';

const PasswordStrength = ({ password }: { password: string }) => {
  if (!password) return null;
  const checks = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
  ];
  const strength = checks.filter(c => c.met).length;
  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex gap-1">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= strength
                ? strength === 1 ? 'bg-destructive' : strength === 2 ? 'bg-amber-400' : 'bg-primary'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {checks.map(c => (
          <span key={c.label} className={`text-[11px] ${c.met ? 'text-primary' : 'text-muted-foreground'}`}>
            {c.met ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const PasswordInput = ({
  id,
  value,
  onChange,
  placeholder = '••••••••',
  showToggle = true,
  show,
  onToggle,
  ...props
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  showToggle?: boolean;
  show?: boolean;
  onToggle?: () => void;
} & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="relative">
    <Input
      id={id}
      type={show ? 'text' : 'password'}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="pr-10"
      {...props}
    />
    {showToggle && value && (
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    )}
  </div>
);

interface AuthPageProps {
  /** Pre-select Client or Practitioner on signup, hides the toggle when set. */
  defaultUserType?: 'user' | 'practitioner';
}

const AuthPage = ({ defaultUserType }: AuthPageProps = {}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<AccountType>(defaultUserType ?? '');
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
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
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
    const safeRedirect = getSafeRedirect(location.search);
    if (safeRedirect) {
      navigate(safeRedirect, { replace: true });
      return;
    }
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
        navigate(effectiveUserType === 'practitioner' ? '/practitioner/dashboard' : '/dashboard', { replace: true });
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
        navigate(effectiveUserType === 'practitioner' ? '/practitioner/dashboard' : '/dashboard', { replace: true });
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
      const safeRedirect = getSafeRedirect(location.search);
      if (safeRedirect) {
        navigate(safeRedirect, { replace: true });
        return;
      }
      const { data: profileData } = await supabase.from('profiles').select('user_type').eq('user_id', data.user!.id).single();
      const effectiveUserType = profileData?.user_type || data.user?.user_metadata?.user_type;
      navigate(effectiveUserType === 'practitioner' ? '/practitioner/dashboard' : '/dashboard', { replace: true });
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
    } catch (error) {
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

  const handleOAuthSignIn = async (provider: 'apple' | 'google', isSignup: boolean) => {
    try {
      if (isSignup) {
        sessionStorage.setItem('pending_oauth_flow', 'signup');
        sessionStorage.setItem(
          'pending_oauth_user_type',
          userType === 'practitioner' ? 'practitioner' : 'user',
        );
      } else {
        sessionStorage.removeItem('pending_oauth_flow');
        sessionStorage.removeItem('pending_oauth_user_type');
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/practitioner/auth/callback?flow=oauth`,
          ...(provider === 'google'
            ? { queryParams: { access_type: 'offline', prompt: 'consent' } }
            : {}),
        },
      });
      if (error) {
        sessionStorage.removeItem('pending_oauth_flow');
        sessionStorage.removeItem('pending_oauth_user_type');
        toast({
          title: 'Sign-in failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch {
      sessionStorage.removeItem('pending_oauth_flow');
      sessionStorage.removeItem('pending_oauth_user_type');
      toast({
        title: 'Sign-in failed',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const GoogleIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );

  const AppleIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 384 512" aria-hidden="true" fill="currentColor">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM256.6 105.1c20.5-24.3 18.6-46.4 18-54.4-18.1 1-39 12.3-50.9 26.2-13.1 14.9-20.8 33.3-19.1 53.9 19.6 1.5 37.5-8.6 52-25.7z"/>
    </svg>
  );

  const renderOAuthSection = (mode: 'signin' | 'signup') => {
    const isSignup = mode === 'signup';
    // On signup tab, hide OAuth when practitioner is selected
    if (isSignup && userType === 'practitioner') {
      return (
        <div className="rounded-lg border border-primary/10 bg-primary/5 px-3.5 py-2.5 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Practitioners: please use email/password. You'll complete LinkedIn verification after signup.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Button
            type="button"
            onClick={() => handleOAuthSignIn('apple', isSignup)}
            className="w-full bg-foreground text-background hover:bg-foreground/90"
            size="lg"
          >
            <AppleIcon />
            <span className="ml-2">Continue with Apple</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthSignIn('google', isSignup)}
            className="w-full"
            size="lg"
          >
            <GoogleIcon />
            <span className="ml-2">Continue with Google</span>
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed px-2">
          We only receive your name and email. We never receive your contacts, calendar, or browsing data.
        </p>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground">or continue with email</span>
          </div>
        </div>
      </div>
    );
  };


  const renderVerificationContent = () => (
    <div className="space-y-5">
      <div className="flex justify-center">
        <div className={`p-5 rounded-full ${verificationState === 'complete' ? 'bg-primary/10' : 'bg-muted'}`}>
          {verificationState === 'complete' ? (
            <CheckCircle2 className="h-12 w-12 text-primary" />
          ) : (
            <Mail className="h-12 w-12 text-primary animate-pulse" />
          )}
        </div>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          {verificationState === 'complete' ? 'Your account is ready' : 'Check your email'}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {verificationState === 'complete'
            ? verifiedUserType === 'practitioner'
              ? 'Your email is verified. Continue to finish practitioner verification.'
              : "Your email is verified. You're all set to continue."
            : <>We sent a verification link to <span className="font-medium text-foreground">{verificationEmail}</span>. Keep this page open.</>}
        </p>
      </div>

      {verificationState === 'pending' ? (
        <>
          <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 space-y-2">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Next steps</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Open the email we just sent</li>
                  <li>Click the confirmation link</li>
                  <li>You'll be brought back here automatically</li>
                </ol>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-3">
              Didn't receive it? Check your spam folder, or resend below.
            </p>
          </div>
          <Button onClick={handleResendVerification} variant="outline" className="w-full" disabled={resendLoading || resendCooldown > 0}>
            {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
          </Button>
          <Button type="button" variant="ghost" className="w-full text-muted-foreground text-sm" onClick={handleUseDifferentEmail}>
            Use a different email
          </Button>
        </>
      ) : (
        <Button onClick={completeVerifiedFlow} className="w-full" size="lg">
          {verifiedUserType === 'practitioner' ? 'Continue to Professional Verification' : 'Go to Dashboard'}
        </Button>
      )}
    </div>
  );

  const renderRecoveryForm = () => (
    <form onSubmit={handleUpdatePassword} className="space-y-5">
      <div className="flex justify-center">
        <div className="bg-primary/10 p-5 rounded-full">
          <KeyRound className="h-12 w-12 text-primary" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Set a New Password</h2>
        <p className="text-sm text-muted-foreground">Choose a strong password for your account.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <PasswordInput
          id="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          show={showNewPassword}
          onToggle={() => setShowNewPassword(!showNewPassword)}
        />
        <PasswordStrength password={newPassword} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <PasswordInput
          id="confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          showToggle={false}
        />
        {confirmPassword && newPassword !== confirmPassword && (
          <p className="text-xs text-destructive">Passwords do not match</p>
        )}
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={recoveryLoading || newPassword.length < 8 || newPassword !== confirmPassword}>
        {recoveryLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update Password
      </Button>
    </form>
  );

  const renderResetForm = () => (
    <form onSubmit={handlePasswordReset} className="space-y-5">
      <div className="flex justify-center">
        <div className="bg-muted p-5 rounded-full">
          <Mail className="h-12 w-12 text-primary" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Reset your password</h2>
        <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email address</Label>
        <Input id="reset-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={resetLoading}>
        {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send Reset Link
      </Button>
      <Button type="button" variant="ghost" className="w-full text-muted-foreground text-sm" onClick={() => setShowResetForm(false)}>
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Back to sign in
      </Button>
    </form>
  );

  const renderSignIn = () => (
    <div className="space-y-5">
      {renderOAuthSection('signin')}
      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={() => setShowResetForm(true)}
              className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Forgot password?
            </button>
          </div>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            show={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
          Sign In
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <button type="button" onClick={() => setAuthMode('signup')} className="text-primary font-medium hover:underline">
            Create one
          </button>
        </p>
      </form>
    </div>
  );

  const renderSignUp = () => (
    <form onSubmit={handleSignUp} className="space-y-5">
      {!defaultUserType && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">I am joining as a…</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setUserType('user')}
              className={`flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 transition-all duration-200 ${
                userType === 'user'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
              }`}
            >
              <div className={`p-2.5 rounded-full ${userType === 'user' ? 'bg-primary/10' : 'bg-muted'}`}>
                <User className={`h-6 w-6 ${userType === 'user' ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-center">
                <span className={`text-sm font-medium block ${userType === 'user' ? 'text-primary' : 'text-foreground'}`}>
                  Client
                </span>
                <span className="text-[11px] text-muted-foreground">Seeking support</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setUserType('practitioner')}
              className={`flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 transition-all duration-200 ${
                userType === 'practitioner'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
              }`}
            >
              <div className={`p-2.5 rounded-full ${userType === 'practitioner' ? 'bg-primary/10' : 'bg-muted'}`}>
                <Stethoscope className={`h-6 w-6 ${userType === 'practitioner' ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-center">
                <span className={`text-sm font-medium block ${userType === 'practitioner' ? 'text-primary' : 'text-foreground'}`}>
                  Practitioner
                </span>
                <span className="text-[11px] text-muted-foreground">Providing care</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {userType && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {userType === 'practitioner' && (
            <div className="rounded-lg border border-primary/10 bg-primary/5 px-3.5 py-2.5 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                After signing up, you'll complete a professional verification step before accessing practitioner features.
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="signup-fullname">Full name</Label>
            <Input id="signup-fullname" type="text" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email address</Label>
            <Input id="signup-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <PasswordInput
              id="signup-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
            <PasswordStrength password={password} />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading || password.length < 8}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Create Account
          </Button>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button type="button" onClick={() => setAuthMode('signin')} className="text-primary font-medium hover:underline">
          Sign in
        </button>
      </p>
    </form>
  );

  const getTitle = () => {
    if (isRecoveryMode) return 'Reset Password';
    if (showResetForm) return 'Reset Password';
    if (verificationState !== 'none') return '';
    return '';
  };

  const getDescription = () => {
    if (isRecoveryMode) return 'Enter your new password below';
    if (showResetForm) return '';
    if (verificationState !== 'none') return '';
    return '';
  };

  const showHeader = isRecoveryMode || (verificationState === 'none' && !showResetForm);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <SEO title="Sign In" path="/practitioner/auth" noindex />
      <div className="w-full max-w-md space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <Card className="w-full shadow-sm border-border/50">
          {showHeader && (
            <CardHeader className="space-y-1.5 text-center pb-2">
              <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
                {isRecoveryMode ? 'Reset Password' : 'groundpath'}
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {isRecoveryMode
                  ? 'Enter your new password below'
                  : authMode === 'signin'
                    ? 'Welcome back. Sign in to continue.'
                    : 'Create your account to get started.'}
              </CardDescription>
            </CardHeader>
          )}
          {!showHeader && verificationState === 'none' && !showResetForm && (
            <div className="pt-6" />
          )}
          <CardContent className={showHeader ? 'pt-4' : 'pt-6'}>
            {isRecoveryMode ? (
              renderRecoveryForm()
            ) : showResetForm ? (
              renderResetForm()
            ) : verificationState !== 'none' ? (
              renderVerificationContent()
            ) : authMode === 'signin' ? (
              renderSignIn()
            ) : (
              renderSignUp()
            )}
          </CardContent>
        </Card>

        {/* Trust footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          <span>Secured with end-to-end encryption</span>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
