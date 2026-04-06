import { useState, useEffect } from 'react';
import SEO from '@/components/SEO';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Linkedin, ShieldCheck, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const REGISTRATION_BODIES = [
  { value: 'AASW', label: 'AASW - Australian Association of Social Workers' },
  { value: 'AHPRA', label: 'AHPRA - Australian Health Practitioner Regulation Agency' },
  { value: 'ACWA', label: 'ACWA - Australian Community Workers Association' },
  { value: 'APS', label: 'APS - Australian Psychological Society' },
  { value: 'PACFA', label: 'PACFA - Psychotherapy and Counselling Federation of Australia' },
  { value: 'ACA', label: 'ACA - Australian Counselling Association' },
  { value: 'HCPC', label: 'HCPC - Health and Care Professions Council (UK)' },
  { value: 'OTHER', label: 'Other Registration Body' },
];

const PractitionerVerify = () => {
  const [registrationBody, setRegistrationBody] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  const [linkedInStatus, setLinkedInStatus] = useState<'success' | 'failed' | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const result = sessionStorage.getItem('linkedin_verification');

    if (result === 'success' || result === 'failed') {
      setLinkedInStatus(result);
      sessionStorage.removeItem('linkedin_verification');
      sessionStorage.removeItem('linkedin_verify_return_email');

      if (result === 'success') {
        setIsVerified(true);
        toast({
          title: 'LinkedIn verification successful',
          description: 'Your professional status has been verified. Redirecting to your dashboard...',
        });
        setTimeout(() => navigate('/practitioner/dashboard', { replace: true }), 3000);
      } else {
        toast({
          title: 'LinkedIn verification failed',
          description: 'Please try again or use your registration details instead.',
          variant: 'destructive',
        });
      }
    }
  }, [toast, navigate]);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setCheckingStatus(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('professional_verified, verification_status')
          .eq('user_id', session.user.id)
          .single();

        if (profile?.professional_verified || profile?.verification_status === 'verified') {
          setIsVerified(true);
          navigate('/practitioner/dashboard', { replace: true });
          return;
        }
      } finally {
        setCheckingStatus(false);
      }
    };

    void checkVerificationStatus();
  }, [navigate]);

  const handleLinkedInVerify = async () => {
    setLinkedInLoading(true);
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession) {
        toast({ title: 'Not authenticated', description: 'Please sign in first.', variant: 'destructive' });
        navigate('/practitioner/auth', { replace: true });
        return;
      }

      sessionStorage.setItem('linkedin_verify_user_id', currentSession.user.id);
      sessionStorage.setItem('linkedin_verify_email', currentSession.user.email || '');
      sessionStorage.setItem('linkedin_verify_access_token', currentSession.access_token);
      sessionStorage.setItem('linkedin_verify_refresh_token', currentSession.refresh_token);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'openid profile email',
        },
      });

      if (error) {
        sessionStorage.removeItem('linkedin_verify_user_id');
        sessionStorage.removeItem('linkedin_verify_email');
        sessionStorage.removeItem('linkedin_verify_access_token');
        sessionStorage.removeItem('linkedin_verify_refresh_token');
        toast({ title: 'LinkedIn verification failed', description: error.message, variant: 'destructive' });
      }
    } catch {
      sessionStorage.removeItem('linkedin_verify_user_id');
      sessionStorage.removeItem('linkedin_verify_email');
      sessionStorage.removeItem('linkedin_verify_access_token');
      sessionStorage.removeItem('linkedin_verify_refresh_token');
      toast({ title: 'LinkedIn verification failed', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setLinkedInLoading(false);
    }
  };

  const handleRegistrationSubmit = async () => {
    if (!registrationBody) {
      toast({ title: 'Registration body required', description: 'Please select a registration body.', variant: 'destructive' });
      return;
    }

    const trimmedNumber = registrationNumber.trim();
    if (trimmedNumber && trimmedNumber.length < 3) {
      toast({ title: 'Invalid registration number', description: 'Registration number must be at least 3 characters.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate('/practitioner/auth', { replace: true });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          registration_body: registrationBody,
          registration_number: trimmedNumber || null,
          verification_status: 'pending_review',
        })
        .eq('user_id', session.user.id);

      if (error) throw error;

      const { error: roleError } = await supabase.rpc('upgrade_practitioner_role', {
        p_user_id: session.user.id,
      });

      if (roleError) {
        console.warn('[PractitionerVerify] Role upgrade failed:', roleError.message);
      }
      toast({
        title: 'Registration submitted',
        description: 'Your professional registration is now pending review.',
      });
      setTimeout(() => navigate('/practitioner/dashboard', { replace: true }), 1500);
    } catch (error) {
      toast({ title: 'Submission failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Checking verification status…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
      <SEO title="Practitioner Verification" noindex />
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 pt-24 pb-12">
        <div className="w-full max-w-lg space-y-4">
            <Card className="w-full shadow-sm border-border/50">
             <CardContent className="pt-8 pb-8 space-y-6">
              {/* Header */}
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className="bg-primary/10 p-5 rounded-full">
                    <ShieldCheck className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h1 className="text-xl font-semibold text-foreground tracking-tight">Complete practitioner verification</h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Choose one verification method to unlock practitioner features.
                  </p>
                </div>
              </div>

              {/* Status banners */}
              {isVerified && (
                <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-foreground block">Verification complete</span>
                    <span className="text-xs text-muted-foreground">Redirecting to your dashboard…</span>
                  </div>
                </div>
              )}

              {linkedInStatus === 'failed' && (
                <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                  <span className="text-sm text-destructive">LinkedIn verification failed. Please try again or use registration details.</span>
                </div>
              )}

              {!isVerified && (
                <>
                  {/* Option 1: LinkedIn */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-[11px] font-semibold text-primary">1</span>
                      <h3 className="text-sm font-semibold text-foreground">Verify with LinkedIn</h3>
                      <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full ml-auto">Instant</span>
                    </div>
                    <Button
                      onClick={handleLinkedInVerify}
                      variant="outline"
                      className="w-full gap-2 rounded-xl h-11"
                      disabled={linkedInLoading}
                    >
                      {linkedInLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                      )}
                      Verify with LinkedIn
                    </Button>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      LinkedIn is used only for identity verification. You'll be returned to your existing account.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-3 text-muted-foreground">or</span>
                    </div>
                  </div>

                  {/* Option 2: Registration */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">2</span>
                      <h3 className="text-sm font-semibold text-foreground">Professional registration</h3>
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full ml-auto">Manual review</span>
                    </div>
                    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
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
                        <Label htmlFor="registrationNumber">Registration Number</Label>
                        <Input
                          id="registrationNumber"
                          className="rounded-xl"
                          placeholder="e.g., AASW123456"
                          value={registrationNumber}
                          onChange={(e) => setRegistrationNumber(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleRegistrationSubmit}
                        className="w-full"
                        size="lg"
                        disabled={loading || !registrationBody}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit for Review
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Trust footer */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Your data is kept secure and confidential</span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PractitionerVerify;
