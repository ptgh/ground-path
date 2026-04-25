import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ShieldCheck, MapPin, Calendar, MessageCircle, Video, ArrowLeft, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBookingMode, HALAXY_EXTERNAL_URL } from '@/hooks/useBookingMode';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { getNextAvailableSlots, type UpcomingSlot } from '@/lib/availability';

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  profession: string | null;
  bio: string | null;
  specializations: string[] | null;
  qualifications: string[] | null;
  practice_location: string | null;
  professional_verified: boolean | null;
  verification_status: string | null;
  directory_approved: boolean | null;
  user_type: string | null;
  halaxy_integration: Record<string, unknown> | null;
  years_experience: number | null;
}

interface RegistrationRow {
  body_name: string;
  registration_number: string | null;
  years_as_practitioner: number | null;
}

const formatProfessionLabel = (profession: string) =>
  profession.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const PractitionerProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mode: bookingMode } = useBookingMode();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const profilePromise = supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, profession, bio, specializations, qualifications, practice_location, professional_verified, verification_status, directory_approved, user_type, halaxy_integration, years_experience')
          .eq('user_id', userId)
          .maybeSingle();
        const regsPromise = supabase
          .from('practitioner_registrations')
          .select('body_name, registration_number, years_as_practitioner')
          .eq('user_id', userId);
        const availPromise = supabase
          .from('practitioner_availability')
          .select('day_of_week, start_time, end_time')
          .eq('practitioner_id', userId);
        const bookingsPromise = supabase
          .from('booking_requests')
          .select('requested_date, requested_start_time')
          .eq('practitioner_id', userId)
          .in('status', ['pending', 'confirmed']);

        const [pRes, rRes, aRes, bRes] = await Promise.all([
          profilePromise, regsPromise, availPromise, bookingsPromise,
        ]);

        if (cancelled) return;

        const p = pRes.data as ProfileRow | null;
        if (!p || p.user_type !== 'practitioner' || !p.directory_approved) {
          setNotFound(true);
          return;
        }
        setProfile(p);
        setRegistrations((rRes.data ?? []) as RegistrationRow[]);
        setUpcoming(
          getNextAvailableSlots(
            (aRes.data ?? []) as { day_of_week: number; start_time: string; end_time: string }[],
            (bRes.data ?? []) as { requested_date: string; requested_start_time: string }[],
            { limit: 4 },
          ),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const handleBook = () => {
    if (!profile) return;
    if (bookingMode === 'halaxy') {
      window.open(HALAXY_EXTERNAL_URL, '_blank');
      return;
    }
    navigate(`/book?practitioner=${profile.user_id}`);
  };

  const handleMessage = () => {
    if (!profile) return;
    if (!user) {
      navigate(`/practitioner/auth?redirect=/messages?practitioner=${profile.user_id}`);
      return;
    }
    navigate(`/messages?practitioner=${profile.user_id}`);
  };

  const displayName = profile?.display_name ?? 'Practitioner';
  const hasInPerson = !!profile?.practice_location;
  const seoTitle = profile ? `${displayName} — ${profile.profession ? formatProfessionLabel(profile.profession) : 'Practitioner'} | groundpath` : 'Practitioner';

  const personJsonLd = profile
    ? {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: displayName,
        jobTitle: profile.profession ? formatProfessionLabel(profile.profession) : undefined,
        image: profile.avatar_url ?? undefined,
        url: typeof window !== 'undefined' ? `${window.location.origin}/practitioner/${profile.user_id}` : undefined,
        address: { '@type': 'PostalAddress', addressCountry: 'AU', addressLocality: profile.practice_location ?? undefined },
      }
    : undefined;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={seoTitle}
        description={profile?.bio?.slice(0, 155) ?? 'A verified mental health practitioner on groundpath.'}
        jsonLd={personJsonLd}
      />
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          {loading && (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!loading && notFound && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <p className="text-foreground font-medium mb-1">Practitioner not found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  This profile may no longer be active or hasn't been approved yet.
                </p>
                <Button onClick={() => navigate('/book')}>See all practitioners</Button>
              </CardContent>
            </Card>
          )}

          {!loading && profile && (
            <div className="space-y-6">
              <Card className="overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <Avatar className="h-24 w-24 sm:h-28 sm:w-28 shrink-0">
                      <AvatarImage src={profile.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl sm:text-3xl font-light text-foreground">{displayName}</h1>
                        {profile.professional_verified && (
                          <span className="inline-flex items-center gap-1 text-xs text-primary">
                            <ShieldCheck className="h-4 w-4" /> Verified
                          </span>
                        )}
                      </div>
                      {profile.profession && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatProfessionLabel(profile.profession)}
                          {profile.years_experience ? ` · ${profile.years_experience}+ yrs experience` : ''}
                        </p>
                      )}
                      {profile.practice_location && (
                        <p className="text-xs text-muted-foreground/80 mt-1 inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {profile.practice_location}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded-full px-2 py-1">
                          <Video className="h-3 w-3" /> Telehealth
                        </span>
                        {hasInPerson && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded-full px-2 py-1">
                            <MapPin className="h-3 w-3" /> In-person
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 mt-5">
                        <Button onClick={handleBook} className="gap-1.5">
                          <Calendar className="h-4 w-4" /> Book with {displayName.split(' ')[0]}
                        </Button>
                        <Button variant="outline" onClick={handleMessage} className="gap-1.5">
                          <MessageCircle className="h-4 w-4" /> Message
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {profile.bio && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">About</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">{profile.bio}</p>
                  </CardContent>
                </Card>
              )}

              {(profile.specializations?.length || profile.qualifications?.length) && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Areas & qualifications</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {profile.specializations?.length ? (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Specialisations</p>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.specializations.map(s => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {profile.qualifications?.length ? (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Qualifications</p>
                        <ul className="text-sm text-foreground/80 list-disc pl-5 space-y-1">
                          {profile.qualifications.map(q => <li key={q}>{q}</li>)}
                        </ul>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )}

              {registrations.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Registrations</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="text-sm text-foreground/80 space-y-1">
                      {registrations.map((r, i) => (
                        <li key={`${r.body_name}-${i}`}>
                          <span className="font-medium">{r.body_name}</span>
                          {r.registration_number ? <span className="text-muted-foreground"> · {r.registration_number}</span> : null}
                          {r.years_as_practitioner ? <span className="text-muted-foreground"> · {r.years_as_practitioner} yrs</span> : null}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Upcoming availability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcoming.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No public availability listed in the next two weeks.{' '}
                      <Link to="/book" className="text-primary underline">Browse all practitioners</Link>{' '}
                      or <button onClick={handleMessage} className="text-primary underline">send a message</button>.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {upcoming.map((s, i) => (
                        <button
                          key={i}
                          onClick={handleBook}
                          className="w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-md border border-border hover:border-primary/40 hover:bg-muted/40 transition-colors text-sm"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            {s.label}
                          </span>
                          <span className="text-xs text-muted-foreground">Book →</span>
                        </button>
                      ))}
                      <p className="text-[11px] text-muted-foreground/70 pt-1">
                        Times shown in your local timezone. Final confirmation by the practitioner.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PractitionerProfile;
