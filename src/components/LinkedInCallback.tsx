import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const LinkedInCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');

  useEffect(() => {
    const handleLinkedInCallback = async () => {
      const clearStoredVerificationState = () => {
        sessionStorage.removeItem('linkedin_verify_user_id');
        sessionStorage.removeItem('linkedin_verify_email');
        sessionStorage.removeItem('linkedin_verify_access_token');
        sessionStorage.removeItem('linkedin_verify_refresh_token');
      };

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session) {
          sessionStorage.setItem('linkedin_verification', 'failed');
          navigate('/practitioner/verify', { replace: true });
          return;
        }

        const originalUserId = sessionStorage.getItem('linkedin_verify_user_id');
        const originalEmail = sessionStorage.getItem('linkedin_verify_email');
        const originalAccessToken = sessionStorage.getItem('linkedin_verify_access_token');
        const originalRefreshToken = sessionStorage.getItem('linkedin_verify_refresh_token');
        const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (!originalUserId || !isValidUUID(originalUserId)) {
          sessionStorage.setItem('linkedin_verification', 'failed');
          await supabase.auth.signOut();
          clearStoredVerificationState();
          navigate('/practitioner/verify', { replace: true });
          return;
        }

        const user = session.user;
        const linkedInIdentity = user.identities?.find(
          (identity) => identity.provider === 'linkedin_oidc' || identity.provider === 'linkedin'
        );

        const linkedInData = linkedInIdentity?.identity_data || {};
        const publicProfileUrl = [
          linkedInData.profile_url,
          linkedInData.public_profile_url,
          linkedInData.profile,
        ].find((value) => typeof value === 'string' && value.includes('linkedin.com')) || '';
        const fullName = linkedInData.full_name || linkedInData.name || '';
        const jobTitle = linkedInData.job_title || linkedInData.headline || '';
        const industry = linkedInData.industry || '';

        const professionalKeywords = [
          'social worker', 'psychologist', 'therapist', 'mental health',
          'counsellor', 'counselor', 'community worker', 'case manager',
        ];

        const searchText = `${jobTitle} ${industry} ${fullName}`.toLowerCase();
        const isVerifiedProfessional = professionalKeywords.some((kw) =>
          searchText.includes(kw)
        );

        // Check if display_name needs populating
        let displayNameToSet: string | null = null;
        if (fullName) {
          const { data: currentProfile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', originalUserId)
            .single();

          if (!currentProfile?.display_name) {
            displayNameToSet = fullName;
          }
        }

        // Use SECURITY DEFINER function to bypass RLS
        // (authenticated as LinkedIn user, updating original user's profile)
        const { error: rpcError } = await supabase.rpc('verify_practitioner_linkedin', {
          p_user_id: originalUserId,
          p_professional_verified: isVerifiedProfessional,
          p_verification_status: isVerifiedProfessional ? 'verified' : 'pending_review',
          p_linkedin_verified_data: {
            linkedin_id: linkedInIdentity?.id || null,
            linkedin_email: user.email || null,
            full_name: fullName,
            job_title: jobTitle,
            industry,
            profile_url: publicProfileUrl || null,
            verified_at: new Date().toISOString(),
            is_professional_match: isVerifiedProfessional,
          },
          p_linkedin_profile: publicProfileUrl || null,
          p_display_name: displayNameToSet,
        });

        if (rpcError) {
          console.error('[LinkedInCallback] verify_practitioner_linkedin RPC failed:', {
            code: rpcError.code,
            message: rpcError.message,
            details: rpcError.details,
            originalUserId,
            authenticatedAs: session.user.id,
          });
          sessionStorage.setItem('linkedin_verification', 'failed');
          await supabase.auth.signOut();
          clearStoredVerificationState();
          navigate('/practitioner/verify', { replace: true });
          return;
        }
        sessionStorage.setItem('linkedin_verification', 'success');
        await supabase.auth.signOut();

        if (originalAccessToken && originalRefreshToken) {
          const { error: restoreError } = await supabase.auth.setSession({
            access_token: originalAccessToken,
            refresh_token: originalRefreshToken,
          });

          if (restoreError) {
            sessionStorage.setItem('linkedin_verification', 'failed');
            if (originalEmail) {
              sessionStorage.setItem('linkedin_verify_return_email', originalEmail);
            }
            clearStoredVerificationState();
            navigate('/practitioner/auth', { replace: true });
            return;
          }
        }

        clearStoredVerificationState();
        navigate('/practitioner/verify', { replace: true });
      } catch {
        setStatus('error');
        sessionStorage.setItem('linkedin_verification', 'failed');
        clearStoredVerificationState();
        setTimeout(() => navigate('/practitioner/verify', { replace: true }), 1500);
      }
    };

    void handleLinkedInCallback();
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
