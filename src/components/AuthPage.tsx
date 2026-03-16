import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'user' | 'practitioner' | ''>('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showResetForm, setShowResetForm] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check authentication state on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/practitioner/dashboard');
      }
    };
    checkAuth();
  }, [navigate]);

  // Handle OAuth callback redirects only (not signup/signin)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only handle OAuth provider callbacks — not email/password signup or signin
      if (event === 'SIGNED_IN' && session?.user?.app_metadata?.provider && session.user.app_metadata.provider !== 'email') {
        if (session.user.email_confirmed_at) {
          navigate('/practitioner/dashboard');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

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
        toast({ title: "Sign in failed", description: msg, variant: "destructive" });
        return;
      }
      toast({ title: "Welcome back!", description: "You have been signed in successfully." });
      navigate('/practitioner/dashboard');
    } catch {
      toast({ title: "Sign in failed", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/practitioner/auth`,
      });
      if (error) {
        toast({ title: "Reset failed", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Check your email", description: "We've sent you a password reset link." });
      setShowResetForm(false);
    } catch {
      toast({ title: "Reset failed", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userType) {
      toast({ title: "Role required", description: "Please select whether you're a client or practitioner.", variant: "destructive" });
      return;
    }
    const trimmedEmail = email.trim();
    setLoading(true);
    try {
      const metadata: Record<string, any> = {
        user_type: userType,
      };

      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
          data: metadata,
        },
      });

      if (error) {
        const msg = error.message.includes('User already registered')
          ? 'An account with this email already exists. Please sign in instead.'
          : error.message.includes('Password should be')
          ? 'Password should be at least 6 characters long.'
          : error.message;
        toast({ title: "Sign up failed", description: msg, variant: "destructive" });
        return;
      }

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
      navigate('/verify-email');
    } catch {
      toast({ title: "Sign up failed", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {showResetForm ? 'Reset Password' : 'groundpath'}
          </CardTitle>
          <CardDescription>
            {showResetForm
              ? "Enter your email to receive a password reset link"
              : "Sign in or create an account to get started"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showResetForm ? (
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
                  {/* Step 1: Role Selection */}
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

                  {/* Step 2: Email & Password */}
                  {userType && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
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
