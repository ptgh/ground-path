import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  profession?: string;
  license_number?: string;
  registration_number?: string;
  registration_body?: string;
  registration_expiry?: string;
  registration_country?: string;
  aasw_membership_number?: string;
  swe_registration_number?: string;
  ahpra_number?: string;
  ahpra_profession?: string;
  years_experience?: number;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_expiry?: string;
  cpd_hours_current_year?: number;
  cpd_requirements?: number;
  practice_location?: string;
  website_url?: string;
  linkedin_profile?: string;
  preferred_contact_method?: string;
  contact_email?: string;
  contact_phone?: string;
  whatsapp_number?: string;
  specializations?: string[];
  qualifications?: string[];
  supervisor_details?: unknown;
  emergency_contact?: unknown;
  booking_integration?: unknown;
  user_type?: string;
  verification_status?: string;
  verification_method?: string;
  professional_verified?: boolean;
  organisation?: string;
  linkedin_verified_data?: unknown;
  notification_preferences?: unknown;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user' | 'social_worker' | 'mental_health_professional';
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  loading: boolean;
  profileLoading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isModerator: () => boolean;
  isSocialWorker: () => boolean;
  isMentalHealthProfessional: () => boolean;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      setProfileLoading(true);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      setProfile(profileData);
      setRoles(rolesData || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let initialized = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        if (initialized && event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setRoles([]);
          setProfileLoading(false);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        initialized = true;
        
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          queueMicrotask(() => {
            if (mounted) {
              fetchProfile(session.user.id);
            }
          });
        } else if (!session) {
          setProfile(null);
          setRoles([]);
          setProfileLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      initialized = true;
      
      if (session?.user) {
        queueMicrotask(() => {
          if (mounted) {
            fetchProfile(session.user.id);
          }
        });
      } else {
        setProfileLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('profiles')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(updates as any)
      .eq('user_id', user.id);

    if (error) throw error;
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const hasRole = useCallback((role: string) => {
    return roles.some(r => r.role === role);
  }, [roles]);

  const isAdmin = useCallback(() => hasRole('admin'), [hasRole]);
  const isModerator = useCallback(() => hasRole('moderator') || hasRole('admin'), [hasRole]);
  const isSocialWorker = useCallback(() => hasRole('social_worker'), [hasRole]);
  const isMentalHealthProfessional = useCallback(() => hasRole('mental_health_professional'), [hasRole]);

  const refetchProfile = useCallback(() => {
    return user ? fetchProfile(user.id) : Promise.resolve();
  }, [user, fetchProfile]);

  const value: AuthContextValue = {
    user,
    session,
    profile,
    roles,
    loading,
    profileLoading,
    signOut,
    updateProfile,
    hasRole,
    isAdmin,
    isModerator,
    isSocialWorker,
    isMentalHealthProfessional,
    refetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
