import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Stethoscope, ShieldCheck, AlertCircle, CheckCircle2, Linkedin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const REGISTRATION_BODIES = [
  { value: 'AASW', label: 'AASW - Australian Association of Social Workers' },
  { value: 'AHPRA', label: 'AHPRA - Australian Health Practitioner Regulation Agency' },
  { value: 'ACWA', label: 'ACWA - Australian Community Workers Association' },
  { value: 'APS', label: 'APS - Australian Psychological Society' },
  { value: 'PACFA', label: 'PACFA - Psychotherapy and Counselling Federation of Australia' },
  { value: 'ACA', label: 'ACA - Australian Counselling Association' },
  { value: 'STUDENT', label: 'Student - Currently Studying' },
  { value: 'OTHER', label: 'Other Registration Body' },
];

const VERIFIED_DOMAINS = ['.gov', '.edu', '.ac.uk', '.ac.au', '.nhs.uk', '.org'];

const PROFESSIONAL_KEYWORDS = [
  'social worker', 'psychologist', 'therapist', 'mental health',
  'counsellor', 'counselor', 'community worker', 'case manager',
];

interface VerificationState {
  professional_verified: boolean;
  verification_method: string;
  verification_status: string;
}

const checkEmailDomain = (email: string): VerificationState => {
  const domain = email.substring(email.lastIndexOf('@') + 1).toLowerCase();
  const isInstitutional = VERIFIED_DOMAINS.some(d => domain.endsWith(d));
  if (isInstitutional) {
    return {
      professional_verified: true,
      verification_method: 'institutional_email',
      verification_status: 'verified',
    };
  }
  return {
    professional_verified: false,
    verification_method: 'personal_email',
    verification_status: 'pending_review',
  };
};

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [userType, setUserType] = useState<'user' | 'practitioner' | ''>('');
  const [registrationBody, setRegistrationBody] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [yearsInPractice, setYearsInPractice] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showResetForm, setShowResetForm] = useState(false);
  const [verification, setVerification] = useState<VerificationState | null>(null);
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

  // Handle OAuth redirects
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        window.location.href = '/practitioner/dashboard';
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Auto-verify email domain for practitioners
  useEffect(() => {
    if (userType === 'practitioner' && email.includes('@')) {
      setVerification(checkEmailDomain(email));
    } else {
      setVerification(null);
    }
  }, [email, userType]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = error.message.includes('Invalid login credentials')
          ? 'Please check your email and password and try again.'
          : error.message.includes('Email not confirmed')
          ? 'Please check your email and click the confirmation link.'
          : error.message;
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
      toast({ title: "Role required", description: "Please select whether you're seeking support or a practitioner.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const metadata: Record<string, any> = {
        display_name: displayName,
        user_type: userType,
      };

      if (userType === 'practitioner') {
        metadata.registration_body = registrationBody || null;
        metadata.registration_number = registrationNumber || null;
        metadata.organisation = organisation || null;
        metadata.years_experience = yearsInPractice ? parseInt(yearsInPractice) : null;
        if (verification) {
          metadata.professional_verified = verification.professional_verified;
          metadata.verification_method = verification.verification_method;
          metadata.verification_status = verification.verification_status;
        }
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/practitioner/dashboard`,
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
        title: "Account created successfully!",
        description: "Please check your email to confirm your account before signing in.",
      });
      setAuthMode('signin');
    } catch {
      toast({ title: "Sign up failed", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInVerify = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'openid profile email',
        },
      });
      if (error) {
        toast({ title: "LinkedIn verification failed", description: error.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "LinkedIn verification failed", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {showResetForm ? 'Reset Password' : 'Groundpath Access'}
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
                    <Label className="text-sm font-semibold">I am...</Label>
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
                          Seeking Support
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
                          A Practitioner
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Standard Fields */}
                  {userType && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input id="displayName" type="text" placeholder="Your Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        {/* Email verification badge */}
                        {userType === 'practitioner' && verification && email.includes('@') && (
                          <div className="mt-2">
                            {verification.professional_verified ? (
                              <Badge className="gap-1 bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Institutional email verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300 bg-amber-50">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Personal email — pending review
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                      </div>
                    </>
                  )}

                  {/* Step 3 & 4: Practitioner fields */}
                  {userType === 'practitioner' && (
                    <div className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <span className="text-sm font-semibold text-foreground">Professional Verification</span>
                      </div>

                      {/* LinkedIn verification */}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2 rounded-xl"
                        onClick={handleLinkedInVerify}
                      >
                        <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                        Verify Professional Status with LinkedIn
                      </Button>

                      <div className="space-y-2">
                        <Label htmlFor="registrationBody">Registration Body</Label>
                        <Select value={registrationBody} onValueChange={setRegistrationBody}>
                          <SelectTrigger id="registrationBody" className="rounded-xl">
                            <SelectValue placeholder="Select your registration body" />
                          </SelectTrigger>
                          <SelectContent>
                            {REGISTRATION_BODIES.map((body) => (
                              <SelectItem key={body.value} value={body.value}>{body.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="registrationNumber">Registration Number (Optional)</Label>
                        <Input id="registrationNumber" className="rounded-xl" placeholder="e.g., AASW123456" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="organisation">Organisation / Employer</Label>
                        <Input id="organisation" className="rounded-xl" placeholder="e.g., NSW Health" value={organisation} onChange={(e) => setOrganisation(e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="yearsInPractice">Years in Practice</Label>
                        <Input id="yearsInPractice" className="rounded-xl" type="number" min="0" max="60" placeholder="e.g., 5" value={yearsInPractice} onChange={(e) => setYearsInPractice(e.target.value)} />
                      </div>
                    </div>
                  )}

                  {userType && (
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
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
