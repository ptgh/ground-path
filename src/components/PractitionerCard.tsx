import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Calendar, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { gsap } from 'gsap';
import {
  buildProfessionalIdentities,
  formatIdentitiesLine,
} from '@/lib/professionalIdentities';

interface RegistrationRow {
  user_id: string;
  body_name: string;
  registration_number: string | null;
}

interface Practitioner {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  profession: string | null;
  bio: string | null;
  specializations: string[] | null;
  practice_location: string | null;
  professional_verified: boolean;
  aasw_membership_number?: string | null;
  swe_registration_number?: string | null;
  ahpra_number?: string | null;
  registrations?: { body_name: string; registration_number: string | null }[];
}

const PractitionerCard = ({ practitioner }: { practitioner: Practitioner }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const onEnter = () => gsap.to(el, { scale: 1.02, y: -4, duration: 0.3, ease: 'power2.out' });
    const onLeave = () => gsap.to(el, { scale: 1, y: 0, duration: 0.3, ease: 'power2.out' });
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mouseenter', onEnter); el.removeEventListener('mouseleave', onLeave); };
  }, []);

  const identities = buildProfessionalIdentities({
    profession: practitioner.profession,
    aaswNumber: practitioner.aasw_membership_number,
    sweNumber: practitioner.swe_registration_number,
    ahpraNumber: practitioner.ahpra_number,
    registrations: practitioner.registrations ?? [],
  });
  const identityLine = identities.length > 0 ? formatIdentitiesLine(identities) : null;

  const handleMessage = () => {
    if (!user) {
      navigate(`/practitioner/auth?redirect=/messages?practitioner=${practitioner.user_id}`);
      return;
    }
    navigate(`/messages?practitioner=${practitioner.user_id}`);
  };

  const goToHub = (anchor?: string) => {
    navigate(`/practitioner/${practitioner.user_id}${anchor ? `#${anchor}` : ''}`);
  };

  return (
    <Card ref={cardRef} className="overflow-hidden transition-shadow hover:shadow-lg border-border/50">
      <CardContent className="p-5">
        <div className="flex gap-4">
          <Avatar className="h-14 w-14 flex-shrink-0">
            <AvatarImage src={practitioner.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {practitioner.display_name?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <button
              type="button"
              onClick={() => goToHub()}
              className="flex items-center gap-2 text-left group"
            >
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{practitioner.display_name}</h3>
              {practitioner.professional_verified && (
                <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </button>
            {identityLine && (
              <p className="text-sm text-muted-foreground">{identityLine}</p>
            )}
            {practitioner.practice_location && (
              <p className="text-xs text-muted-foreground/70">{practitioner.practice_location}</p>
            )}
            {practitioner.specializations && practitioner.specializations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {practitioner.specializations.slice(0, 4).map((spec) => (
                  <Badge key={spec} variant="secondary" className="text-[11px] px-2 py-0">
                    {spec}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={handleMessage} size="sm" className="flex-1 gap-1.5">
            <MessageCircle className="h-4 w-4" />
            Message
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => goToHub('booking')}
          >
            <Calendar className="h-4 w-4" />
            Book
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const PractitionerList = () => {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPractitioners = async () => {
      try {
        const { data, error } = await supabase
          // Read from the public-safe view; the underlying profiles table
          // is now locked down by RLS to protect practitioner PII.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from('profiles_public' as any)
          .select('user_id, display_name, avatar_url, profession, bio, specializations, practice_location, professional_verified, aasw_membership_number, swe_registration_number, ahpra_number')
          .order('professional_verified', { ascending: false });

        if (!error && data) {
          const ids = data.map(p => p.user_id);
          let regs: RegistrationRow[] = [];
          if (ids.length > 0) {
            const { data: regData } = await supabase
              .from('practitioner_registrations')
              .select('user_id, body_name, registration_number')
              .in('user_id', ids);
            regs = (regData ?? []) as RegistrationRow[];
          }
          const byUser = new Map<string, { body_name: string; registration_number: string | null }[]>();
          for (const r of regs) {
            const arr = byUser.get(r.user_id) ?? [];
            arr.push({ body_name: r.body_name, registration_number: r.registration_number });
            byUser.set(r.user_id, arr);
          }
          setPractitioners(
            data.map(p => ({ ...p, registrations: byUser.get(p.user_id) ?? [] })) as Practitioner[],
          );
        }
      } catch (err) {
        console.error('Error fetching practitioners:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPractitioners();
  }, []);

  useEffect(() => {
    if (!loading && practitioners.length > 0 && listRef.current) {
      const cards = listRef.current.querySelectorAll('.practitioner-card');
      gsap.fromTo(cards, 
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [loading, practitioners.length]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading practitioners">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex gap-4">
                <div className="h-14 w-14 rounded-full bg-muted animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-muted/70 rounded animate-pulse" />
                  <div className="flex gap-1.5 pt-1">
                    <div className="h-4 w-12 bg-muted rounded-full animate-pulse" />
                    <div className="h-4 w-16 bg-muted rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="h-9 flex-1 bg-muted rounded animate-pulse" />
                <div className="h-9 flex-1 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (practitioners.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-lg bg-muted/20">
        <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-foreground font-medium mb-1">Practitioners coming soon</p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          We're onboarding qualified mental health professionals. Join our mailing list to be notified when bookings open.
        </p>
      </div>
    );
  }

  return (
    <div ref={listRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {practitioners.map((p) => (
        <div key={p.user_id} className="practitioner-card">
          <PractitionerCard practitioner={p} />
        </div>
      ))}
    </div>
  );
};

export default PractitionerCard;
