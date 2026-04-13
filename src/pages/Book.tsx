import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar as CalendarIcon,
  ShieldCheck,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
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
  halaxy_integration: Record<string, unknown> | null;
}

const formatProfessionLabel = (profession: string) =>
  profession.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const Book = () => {
  const navigate = useNavigate();
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, profession, bio, specializations, practice_location, professional_verified, halaxy_integration')
        .eq('user_type', 'practitioner')
        .eq('directory_approved', true)
        .in('verification_status', ['verified', 'pending_review']);

      if (data) {
        const nativePractitioners = data.filter(p => {
          const integration = p.halaxy_integration as Record<string, unknown> | null;
          return integration?.session_mode === 'native_beta';
        }) as Practitioner[];
        setPractitioners(nativePractitioners);
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!loading && practitioners.length > 0 && listRef.current) {
      const cards = listRef.current.querySelectorAll('.book-practitioner-card');
      gsap.fromTo(cards,
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' },
      );
    }
  }, [loading, practitioners.length]);

  return (
    <div className="min-h-screen bg-background">
      <SEO path="/book" />
      <Header />
      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Book a Session</h1>
            <p className="text-muted-foreground mt-1">
              Choose a practitioner to view their availability and book a session.
            </p>
          </div>

          <Alert className="border-amber-200 bg-amber-50/60 mb-6">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              <span className="font-semibold">Beta Booking</span> — Groundpath's native booking system is in early testing.
            </AlertDescription>
          </Alert>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div ref={listRef} className="grid gap-4 sm:grid-cols-2">
              {practitioners.length > 0 ? practitioners.map(p => (
                <button
                  key={p.user_id}
                  onClick={() => navigate(`/book/${p.user_id}`)}
                  className="book-practitioner-card text-left"
                >
                  <Card className="overflow-hidden transition-all hover:shadow-lg hover:border-primary/40 border-border/50 cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex gap-4">
                        <Avatar className="h-14 w-14 flex-shrink-0">
                          <AvatarImage src={p.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                            {p.display_name?.charAt(0)?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground truncate">{p.display_name}</h3>
                            {p.professional_verified && <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />}
                          </div>
                          {p.profession && (
                            <p className="text-sm text-muted-foreground">{formatProfessionLabel(p.profession)}</p>
                          )}
                          {p.practice_location && (
                            <p className="text-xs text-muted-foreground/70">{p.practice_location}</p>
                          )}
                          {p.specializations && p.specializations.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {p.specializations.slice(0, 3).map(spec => (
                                <Badge key={spec} variant="secondary" className="text-[11px] px-2 py-0">{spec}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              )) : (
                <div className="col-span-full text-center py-16">
                  <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No practitioners have enabled online booking yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Book;
