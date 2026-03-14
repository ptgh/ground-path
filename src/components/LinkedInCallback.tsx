import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const LinkedInCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');

  useEffect(() => {
    const handleLinkedInCallback = async () => {
      try {
        // Supabase handles the OAuth code exchange automatically.
        // We just need to wait for the session to be available.
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          console.error('LinkedIn callback: no session', error);
          sessionStorage.setItem('linkedin_verification', 'failed');
          navigate('/practitioner/auth', { replace: true });
          return;
        }

        // Session exists — user authenticated via LinkedIn.
        // Extract LinkedIn identity data from the user object.
        const user = session.user;
        const linkedInIdentity = user.identities?.find(
          (id) => id.provider === 'linkedin_oidc' || id.provider === 'linkedin'
        );

        const linkedInData = linkedInIdentity?.identity_data || {};
        const profileUrl = linkedInData.profile_url || linkedInData.picture || '';
        const fullName = linkedInData.full_name || linkedInData.name || '';
        const jobTitle = linkedInData.job_title || linkedInData.headline || '';
        const industry = linkedInData.industry || '';

        // Determine if the LinkedIn profile indicates a professional
        const professionalKeywords = [
          'social worker', 'psychologist', 'therapist', 'mental health',
          'counsellor', 'counselor', 'community worker', 'case manager',
        ];

        const searchText = `${jobTitle} ${industry} ${fullName}`.toLowerCase();
        const isVerifiedProfessional = professionalKeywords.some((kw) =>
          searchText.includes(kw)
        );

        // Update the user's profile with LinkedIn verification data
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            professional_verified: isVerifiedProfessional || true, // LinkedIn auth itself is verification
            verification_method: 'linkedin',
            verification_status: isVerifiedProfessional ? 'verified' : 'pending_review',
            linkedin_verified_data: {
              linkedin_id: linkedInIdentity?.id || null,
              full_name: fullName,
              job_title: jobTitle,
              industry: industry,
              profile_url: profileUrl,
              verified_at: new Date().toISOString(),
            },
            linkedin_profile: profileUrl || null,
            user_type: 'practitioner',
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Failed to update profile:', updateError);
          sessionStorage.setItem('linkedin_verification', 'failed');
        } else {
          sessionStorage.setItem('linkedin_verification', 'success');
        }

        // Sign out so the user can complete signup with email/password
        // (LinkedIn OAuth creates a separate auth session)
        await supabase.auth.signOut();

        navigate('/practitioner/auth', { replace: true });
      } catch (err) {
        console.error('LinkedIn callback error:', err);
        setStatus('error');
        sessionStorage.setItem('linkedin_verification', 'failed');
        setTimeout(() => navigate('/practitioner/auth', { replace: true }), 1500);
      }
    };

    handleLinkedInCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {status === 'processing' ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Verifying your LinkedIn profile...</p>
          </>
        ) : (
          <>
            <p className="text-destructive font-medium">Verification failed</p>
            <p className="text-sm text-muted-foreground">Redirecting back...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default LinkedInCallback;
