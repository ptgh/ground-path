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
        // Get the LinkedIn OAuth session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          console.error('LinkedIn callback: no session', error);
          sessionStorage.setItem('linkedin_verification', 'failed');
          navigate('/practitioner/verify', { replace: true });
          return;
        }

        // Retrieve the ORIGINAL user's ID that initiated the verification
        const originalUserId = sessionStorage.getItem('linkedin_verify_user_id');
        const originalEmail = sessionStorage.getItem('linkedin_verify_email');
        const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        sessionStorage.removeItem('linkedin_verify_user_id');
        sessionStorage.removeItem('linkedin_verify_email');

        if (!originalUserId || !isValidUUID(originalUserId)) {
          // No original user context — this might be a direct LinkedIn login attempt
          // or session data was lost. Treat as failed verification.
          console.error('LinkedIn callback: invalid or missing original user_id');
          sessionStorage.setItem('linkedin_verification', 'failed');
          await supabase.auth.signOut();
          navigate('/practitioner/verify', { replace: true });
          return;
        }

        // Extract LinkedIn identity data from the OAuth session
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

        // Update the ORIGINAL user's profile (not the LinkedIn OAuth user)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            professional_verified: true,
            verification_method: 'linkedin',
            verification_status: isVerifiedProfessional ? 'verified' : 'pending_review',
            linkedin_verified_data: {
              linkedin_id: linkedInIdentity?.id || null,
              linkedin_email: user.email || null,
              full_name: fullName,
              job_title: jobTitle,
              industry: industry,
              profile_url: profileUrl,
              verified_at: new Date().toISOString(),
              is_professional_match: isVerifiedProfessional,
            },
            linkedin_profile: profileUrl || null,
          })
          .eq('user_id', originalUserId);

        if (updateError) {
          console.error('Failed to update original user profile:', updateError);
          sessionStorage.setItem('linkedin_verification', 'failed');
        } else {
          console.log('LinkedIn verification saved for original user:', originalUserId);
          sessionStorage.setItem('linkedin_verification', 'success');
        }

        // Sign out the LinkedIn OAuth session (it's a different user)
        await supabase.auth.signOut();

        // Store original email so the user can re-authenticate easily
        if (originalEmail) {
          sessionStorage.setItem('linkedin_verify_return_email', originalEmail);
        }

        navigate('/practitioner/verify', { replace: true });
      } catch (err) {
        console.error('LinkedIn callback error:', err);
        setStatus('error');
        sessionStorage.setItem('linkedin_verification', 'failed');
        sessionStorage.removeItem('linkedin_verify_user_id');
        sessionStorage.removeItem('linkedin_verify_email');
        setTimeout(() => navigate('/practitioner/verify', { replace: true }), 1500);
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
