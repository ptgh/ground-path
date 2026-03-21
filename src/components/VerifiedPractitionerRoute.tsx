import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const VerifiedPractitionerRoute = ({ children }: { children: ReactNode }) => {
  const { user, profile, loading, profileLoading } = useAuth();

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/practitioner/auth" replace />;
  }

  // Wait for profile before gating
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect unverified practitioners to verification page
  const userType = profile.user_type || user.user_metadata?.user_type;
  if (
    userType === 'practitioner' &&
    (!profile.verification_status || profile.verification_status === 'unverified')
  ) {
    return <Navigate to="/practitioner/verify" replace />;
  }

  return <>{children}</>;
};

export default VerifiedPractitionerRoute;
