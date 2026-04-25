import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, ShieldCheck, MapPin, Calendar, MessageCircle, Video, ArrowLeft, Clock, Mail, Phone, X, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBookingMode, HALAXY_EXTERNAL_URL } from '@/hooks/useBookingMode';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { getNextAvailableSlots, type UpcomingSlot } from '@/lib/availability';
import InlineBookingPanel from '@/components/booking/InlineBookingPanel';
import {
  buildProfessionalIdentities,
  formatIdentitiesLine,
} from '@/lib/professionalIdentities';

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
  aasw_membership_number: string | null;
  swe_registration_number: string | null;
  ahpra_number: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp_number: string | null;
  preferred_contact_method: string | null;
}

interface RegistrationRow {
  body_name: string;
  registration_number: string | null;
  years_as_practitioner: number | null;
}

interface MyBookingRow {
  id: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  status: string;
}

/**
 * Defensive parser for booking_requests rows. The hub page renders these
 * directly into the UI, so we never want a missing/null column or a renamed
 * field to crash the section. We coerce safely and drop unusable rows.
 */
const parseMyBooking = (raw: unknown): MyBookingRow | null => {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === 'string' ? r.id : null;
  const requested_date = typeof r.requested_date === 'string' ? r.requested_date : null;
  const requested_start_time = typeof r.requested_start_time === 'string' ? r.requested_start_time : null;
  if (!id || !requested_date || !requested_start_time) return null;
  return {
    id,
    requested_date,
    requested_start_time,
    requested_end_time:
      typeof r.requested_end_time === 'string' && r.requested_end_time.length > 0
        ? r.requested_end_time
        : requested_start_time,
    status: typeof r.status === 'string' && r.status.length > 0 ? r.status : 'pending',
  };
};

const formatTimeLabel = (t: string | null | undefined) => {
  if (!t || typeof t !== 'string' || !t.includes(':')) return '—';
  const [h, m] = t.slice(0, 5).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return '—';
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
};

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
  const [myBookings, setMyBookings] = useState<MyBookingRow[]>([]);
  const [bookingsRefreshTick, setBookingsRefreshTick] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<MyBookingRow | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  // Load the signed-in user's bookings with this practitioner so the hub
  // shows everything in one place (avoids the old need to visit /book).
  useEffect(() => {
    if (!user || !userId) {
      setMyBookings([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('booking_requests')
        .select('id, requested_date, requested_start_time, requested_end_time, status')
        .eq('client_user_id', user.id)
        .eq('practitioner_id', userId)
        .order('requested_date', { ascending: false })
        .limit(10);
      if (cancelled) return;
      const safe = (data ?? [])
        .map(parseMyBooking)
        .filter((b): b is MyBookingRow => b !== null);
      setMyBookings(safe);
    })();
    return () => { cancelled = true; };
  }, [user, userId, bookingsRefreshTick]);

  const handleReschedule = () => {
    // Reschedule = pick a new slot below; the old request stays visible until
    // the user cancels it. Keeps the flow simple and avoids data loss.
    toast.info('Pick a new time below — your existing request will stay visible until you cancel it.');
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setActionBusyId(cancelTarget.id);
    const { error } = await supabase
      .from('booking_requests')
      .update({ status: 'cancelled' })
      .eq('id', cancelTarget.id);
    setActionBusyId(null);
    if (error) {
      toast.error('Could not cancel — please try again or message your practitioner.');
      return;
    }
    toast.success('Booking request cancelled.');
    setCancelTarget(null);
    setBookingsRefreshTick(t => t + 1);
  };

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const profilePromise = supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, profession, bio, specializations, qualifications, practice_location, professional_verified, verification_status, directory_approved, user_type, halaxy_integration, years_experience, aasw_membership_number, swe_registration_number, ahpra_number, contact_email, contact_phone, whatsapp_number, preferred_contact_method')
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
    // Booking lives inline below — just scroll to it.
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const identities = profile
    ? buildProfessionalIdentities({
        profession: profile.profession,
        aaswNumber: profile.aasw_membership_number,
        sweNumber: profile.swe_registration_number,
        ahpraNumber: profile.ahpra_number,
        registrations: registrations.map(r => ({
          body_name: r.body_name,
          registration_number: r.registration_number,
        })),
      })
    : [];

  const preferredChannel = profile?.preferred_contact_method ?? 'email';
  const isPreferred = (channel: string) =>
    preferredChannel === channel || (channel !== 'whatsapp' && preferredChannel === 'both');
  const whatsappLink = profile?.whatsapp_number
    ? `https://wa.me/${profile.whatsapp_number.replace(/[^0-9]/g, '')}`
    : null;

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
                      {(identities.length > 0 || profile.profession) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {identities.length > 0
                            ? formatIdentitiesLine(identities)
                            : formatProfessionLabel(profile.profession!)}
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

                      <div className="flex flex-wrap gap-2 mt-5">
                        <Button onClick={handleBook} className="gap-1.5">
                          <Calendar className="h-4 w-4" /> Book with {displayName.split(' ')[0]}
                        </Button>
                        <Button variant="outline" onClick={handleMessage} className="gap-1.5">
                          <MessageCircle className="h-4 w-4" /> Message
                        </Button>
                      </div>

                      {(profile.contact_email || profile.contact_phone || profile.whatsapp_number) && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {profile.contact_email && (
                            <a
                              href={`mailto:${profile.contact_email}`}
                              className={`inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border transition-colors ${
                                isPreferred('email')
                                  ? 'border-primary/40 bg-primary/5 text-primary'
                                  : 'border-border text-muted-foreground hover:bg-muted/40'
                              }`}
                            >
                              <Mail className="h-3 w-3" /> Email
                              {isPreferred('email') && <span className="text-[10px] uppercase tracking-wide">Preferred</span>}
                            </a>
                          )}
                          {profile.contact_phone && (
                            <a
                              href={`tel:${profile.contact_phone.replace(/\s/g, '')}`}
                              className={`inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border transition-colors ${
                                isPreferred('phone')
                                  ? 'border-primary/40 bg-primary/5 text-primary'
                                  : 'border-border text-muted-foreground hover:bg-muted/40'
                              }`}
                            >
                              <Phone className="h-3 w-3" /> Call
                              {isPreferred('phone') && <span className="text-[10px] uppercase tracking-wide">Preferred</span>}
                            </a>
                          )}
                          {whatsappLink && (
                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border transition-colors ${
                                isPreferred('whatsapp')
                                  ? 'border-primary/40 bg-primary/5 text-primary'
                                  : 'border-border text-muted-foreground hover:bg-muted/40'
                              }`}
                            >
                              <MessageCircle className="h-3 w-3" /> WhatsApp
                              {isPreferred('whatsapp') && <span className="text-[10px] uppercase tracking-wide">Preferred</span>}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Anchor nav — quick jumps within the hub */}
              <nav aria-label="On this page" className="sticky top-20 z-10 -mx-4 px-4 sm:mx-0 sm:px-0 bg-background/85 backdrop-blur-sm border-y sm:border sm:rounded-md py-2">
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                  {profile.bio && (
                    <li><a href="#about" className="hover:text-primary transition-colors">About</a></li>
                  )}
                  {(profile.specializations?.length || profile.qualifications?.length) ? (
                    <li><a href="#areas" className="hover:text-primary transition-colors">Areas & qualifications</a></li>
                  ) : null}
                  {registrations.length > 0 && (
                    <li><a href="#registrations" className="hover:text-primary transition-colors">Registrations</a></li>
                  )}
                  {user && myBookings.length > 0 && (
                    <li><a href="#your-bookings" className="hover:text-primary transition-colors">Your bookings</a></li>
                  )}
                  <li><a href="#booking" className="font-medium text-primary hover:underline">Book →</a></li>
                </ul>
              </nav>

              {profile.bio && (
                <Card id="about" className="scroll-mt-32">
                  <CardHeader><CardTitle className="text-lg">About</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">{profile.bio}</p>
                  </CardContent>
                </Card>
              )}

              {(profile.specializations?.length || profile.qualifications?.length) && (
                <Card id="areas" className="scroll-mt-32">
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
                <Card id="registrations" className="scroll-mt-32">
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

              {user && myBookings.length > 0 && (
                <Card id="your-bookings" className="scroll-mt-32">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Your bookings with {displayName.split(' ')[0]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {myBookings.slice(0, 5).map(b => {
                        // Defensive date parse — invalid date strings won't crash the row.
                        const parsed = new Date(`${b.requested_date}T00:00:00`);
                        const dateLabel = Number.isNaN(parsed.getTime())
                          ? b.requested_date
                          : parsed.toLocaleDateString(undefined, {
                              weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                            });
                        const statusColor =
                          b.status === 'confirmed' ? 'text-primary border-primary/40 bg-primary/5'
                          : b.status === 'pending' ? 'text-amber-700 border-amber-300 bg-amber-50'
                          : 'text-muted-foreground border-border bg-muted/40';
                        const isActive = b.status === 'pending' || b.status === 'confirmed';
                        const isBusy = actionBusyId === b.id;
                        return (
                          <li
                            key={b.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 rounded-md border border-border bg-card px-3 py-2.5 text-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-foreground truncate">{dateLabel}</p>
                                <span className={`text-[11px] uppercase tracking-wide rounded-full px-2 py-0.5 border ${statusColor}`}>
                                  {b.status}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatTimeLabel(b.requested_start_time)} – {formatTimeLabel(b.requested_end_time)}
                              </p>
                            </div>
                            {isActive && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleReschedule}
                                  disabled={isBusy}
                                  className="h-8 px-2 text-xs gap-1"
                                >
                                  <CalendarClock className="h-3.5 w-3.5" /> Reschedule
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setCancelTarget(b)}
                                  disabled={isBusy}
                                  className="h-8 px-2 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {bookingMode !== 'halaxy' && (
                <Card id="booking" className="scroll-mt-32">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Book a session with {displayName.split(' ')[0]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <InlineBookingPanel
                      practitionerId={profile.user_id}
                      practitionerName={displayName}
                      halaxyIntegration={profile.halaxy_integration}
                      authRedirectPath={`/practitioner/${profile.user_id}#booking`}
                    />
                  </CardContent>
                </Card>
              )}

              {bookingMode === 'halaxy' && (
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
              )}
            </div>
          )}
        </div>
      </main>

      {/* Sticky mobile CTA — addresses "user may miss the booking" on long profiles */}
      {!loading && profile && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur-sm px-4 py-3 shadow-[0_-4px_12px_-6px_rgba(0,0,0,0.08)]">
          <Button onClick={handleBook} className="w-full gap-1.5" size="lg">
            <Calendar className="h-4 w-4" /> Book with {displayName.split(' ')[0]}
          </Button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PractitionerProfile;
