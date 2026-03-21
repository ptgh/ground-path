import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Linkedin, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
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
          registration_number: registrationNumber || null,
          verification_status: 'pending_review',
        })
        .eq('user_id', session.user.id);

      if (error) throw error;

      toast({
        title: 'Registration submitted',
        description: 'Your professional registration is now pending review.',
      });
      setTimeout(() => navigate('/practitioner/dashboard', { replace: true }), 1500);
    } catch (error: any) {
      toast({ title: 'Submission failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 pt-24">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Complete practitioner verification</CardTitle>
            <CardDescription>
              Choose one verification method to complete your setup and unlock practitioner features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isVerified && (
              <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Verification complete. Redirecting to your dashboard...</span>
              </div>
            )}

            {linkedInStatus === 'failed' && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium text-destructive">LinkedIn verification failed. Please try again.</span>
              </div>
            )}

            {!isVerified && (
              <>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-primary" />
                    Option 1: Verify with LinkedIn
                  </h3>
                  <Button
                    onClick={handleLinkedInVerify}
                    variant="outline"
                    className="w-full gap-2 rounded-xl"
                    disabled={linkedInLoading}
                  >
                    {linkedInLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Linkedin className="h-4 w-4 text-primary" />
                    Verify Professional Status with LinkedIn
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    LinkedIn is used only for verification and returns you to your existing account.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Option 2: Enter professional registration number
                  </h3>
                  <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
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
      </main>
      <Footer />
    </div>
  );
};

export default PractitionerVerify;
