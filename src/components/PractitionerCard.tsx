import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Calendar, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBookingMode, HALAXY_EXTERNAL_URL } from '@/hooks/useBookingMode';
import { scrollToSectionWithOffset } from '@/lib/utils';
import { gsap } from 'gsap';

interface Practitioner {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  profession: string | null;
  bio: string | null;
  specializations: string[] | null;
  practice_location: string | null;
  professional_verified: boolean;
}

const formatProfessionLabel = (profession: string) =>
  profession
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const PractitionerCard = ({ practitioner }: { practitioner: Practitioner }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mode: bookingMode } = useBookingMode();
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

  const handleMessage = () => {
    if (!user) {
      navigate(`/practitioner/auth?redirect=/messages?practitioner=${practitioner.user_id}`);
      return;
    }
    navigate(`/messages?practitioner=${practitioner.user_id}`);
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
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">{practitioner.display_name}</h3>
              {practitioner.professional_verified && (
                <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </div>
            {practitioner.profession && (
              <p className="text-sm text-muted-foreground">{formatProfessionLabel(practitioner.profession)}</p>
            )}
            {practitioner.practice_location && (
              <p className="text-xs text-muted-foreground/70">{practitioner.practice_location}</p>
            )}
            {practitioner.bio && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{practitioner.bio}</p>
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
            onClick={() => {
              if (bookingMode === 'native_beta') {
                scrollToSectionWithOffset('booking', 96);
              } else {
                window.open(HALAXY_EXTERNAL_URL, '_blank');
              }
            }}
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
          .from('profiles')
          .select('user_id, display_name, avatar_url, profession, bio, specializations, practice_location, professional_verified')
          .eq('user_type', 'practitioner')
          .eq('directory_approved', true)
          .in('verification_status', ['verified', 'pending_review'])
          .order('professional_verified', { ascending: false });

        if (!error && data) {
          setPractitioners(data as Practitioner[]);
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
      <div className="flex justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (practitioners.length === 0) return null;

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
