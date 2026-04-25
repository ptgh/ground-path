import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Calendar as CalendarIcon,
  Clock,
  ShieldCheck,
  Loader2,
  Video,
  CheckCircle2,
  MapPin,
  AlertTriangle,
  Heart,
  X,
  ArrowLeft,
  CreditCard,
} from 'lucide-react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import PreSessionCheckIn, { type CheckInData } from '@/components/booking/PreSessionCheckIn';
import AddCardForm from '@/components/billing/AddCardForm';
import { useSavedCards } from '@/hooks/useSavedCards';
import { gsap } from 'gsap';
import { cn } from '@/lib/utils';
import {
  buildProfessionalIdentities,
  formatIdentitiesLine,
  type ProfessionalIdentity,
} from '@/lib/professionalIdentities';

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

interface AvailabilityBlock {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  label: string;
}

interface Booking {
  id: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  status: string;
  created_at: string;
  practitioner_notes: string | null;
}

const formatProfessionLabel = (profession: string) =>
  profession.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const formatTimeLabel = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
};

function generateSlots(startTime: string, endTime: string, sessionMinutes: number, bufferMinutes: number): TimeSlot[] {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startTotal = sh * 60 + sm;
  const endTotal = eh * 60 + em;
  const slots: TimeSlot[] = [];
  let cursor = startTotal;
  while (cursor + sessionMinutes <= endTotal) {
    const slotEnd = cursor + sessionMinutes;
    const startStr = `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`;
    const endStr = `${String(Math.floor(slotEnd / 60)).padStart(2, '0')}:${String(slotEnd % 60).padStart(2, '0')}`;
    slots.push({ startTime: startStr, endTime: endStr, label: `${formatTimeLabel(startStr)} – ${formatTimeLabel(endStr)}` });
    cursor = slotEnd + bufferMinutes;
  }
  return slots;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  confirmed: { label: 'Confirmed', variant: 'default' },
  declined: { label: 'Declined', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'outline' },
  completed: { label: 'Completed', variant: 'outline' },
};

const Book = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cards, loading: cardsLoading, refresh: refreshCards } = useSavedCards();

  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPractitioner, setSelectedPractitioner] = useState<Practitioner | null>(null);

  // Booking state (only active when practitioner selected)
  const [availability, setAvailability] = useState<AvailabilityBlock[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existingBookings, setExistingBookings] = useState<{ requested_date: string; requested_start_time: string }[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [identities, setIdentities] = useState<ProfessionalIdentity[]>([]);

  // Check-in + card capture flow
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [cardCaptureOpen, setCardCaptureOpen] = useState(false);
  const [pendingCheckIn, setPendingCheckIn] = useState<CheckInData | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const bookingRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<HTMLDivElement>(null);

  // Load practitioners — uses RPC that filters to verified + admin-approved + active subscription
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.rpc('list_bookable_practitioners');
      if (error) console.error('Failed to load practitioners:', error);

      if (data) {
        const nativePractitioners = (data as Practitioner[]).filter(p => {
          const integration = p.halaxy_integration as Record<string, unknown> | null;
          return integration?.session_mode === 'native_beta';
        });
        setPractitioners(nativePractitioners);

        // Deep-link: ?practitioner=<uuid> auto-selects on load.
        const params = new URLSearchParams(window.location.search);
        const requestedId = params.get('practitioner');
        if (requestedId) {
          const match = nativePractitioners.find(p => p.user_id === requestedId);
          if (match) {
            setSelectedPractitioner(match);
          } else {
            toast.message("That practitioner isn't currently bookable. Showing all available practitioners.");
          }
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  // GSAP for practitioner list
  useEffect(() => {
    if (!loading && practitioners.length > 0 && listRef.current && !selectedPractitioner) {
      const cards = listRef.current.querySelectorAll('.book-practitioner-card');
      gsap.fromTo(cards,
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' },
      );
    }
  }, [loading, practitioners.length, selectedPractitioner]);

  // Load availability + bookings + identity credentials when practitioner selected
  useEffect(() => {
    if (!selectedPractitioner) return;
    const load = async () => {
      setLoadingBooking(true);
      const [avRes, bkRes, profileRes, regsRes] = await Promise.all([
        supabase
          .from('practitioner_availability')
          .select('day_of_week, start_time, end_time')
          .eq('practitioner_id', selectedPractitioner.user_id),
        supabase
          .from('booking_requests')
          .select('requested_date, requested_start_time')
          .eq('practitioner_id', selectedPractitioner.user_id)
          .in('status', ['pending', 'confirmed']),
        supabase
          .from('profiles')
          .select('aasw_membership_number, swe_registration_number, ahpra_number')
          .eq('user_id', selectedPractitioner.user_id)
          .maybeSingle(),
        supabase
          .from('practitioner_registrations')
          .select('body_name, registration_number')
          .eq('user_id', selectedPractitioner.user_id),
      ]);
      if (avRes.data) setAvailability(avRes.data);
      if (bkRes.data) setExistingBookings(bkRes.data);
      setIdentities(
        buildProfessionalIdentities({
          profession: selectedPractitioner.profession,
          aaswNumber: profileRes.data?.aasw_membership_number ?? null,
          sweNumber: profileRes.data?.swe_registration_number ?? null,
          ahpraNumber: profileRes.data?.ahpra_number ?? null,
          registrations: (regsRes.data ?? []) as { body_name: string; registration_number: string | null }[],
        }),
      );
      setLoadingBooking(false);
    };
    load();
  }, [selectedPractitioner]);

  // Load user's bookings with selected practitioner
  useEffect(() => {
    if (!user || !selectedPractitioner) return;
    const load = async () => {
      const { data } = await supabase
        .from('booking_requests')
        .select('id, requested_date, requested_start_time, requested_end_time, status, created_at, practitioner_notes')
        .eq('client_user_id', user.id)
        .eq('practitioner_id', selectedPractitioner.user_id)
        .order('requested_date', { ascending: false });
      if (data) setMyBookings(data);
    };
    load();
  }, [user, selectedPractitioner]);

  // GSAP for booking section
  useEffect(() => {
    if (selectedPractitioner && bookingRef.current && !loadingBooking) {
      gsap.fromTo(bookingRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
      );
    }
  }, [selectedPractitioner, loadingBooking]);

  // GSAP for slots
  useEffect(() => {
    if (selectedDate && slotsRef.current) {
      const items = slotsRef.current.querySelectorAll('.slot-btn');
      gsap.fromTo(items,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out' },
      );
    }
  }, [selectedDate]);

  const handleSelectPractitioner = (p: Practitioner) => {
    setSelectedPractitioner(p);
    setSelectedDate(undefined);
    setSelectedSlot(null);
    setMyBookings([]);
    setAvailability([]);
    setExistingBookings([]);
  };

  const handleBackToList = () => {
    setSelectedPractitioner(null);
    setSelectedDate(undefined);
    setSelectedSlot(null);
  };

  const getSettings = () => {
    const integration = selectedPractitioner?.halaxy_integration;
    const saved = (integration as Record<string, unknown>)?.availability_settings as Record<string, unknown> | undefined;
    return {
      sessionDuration: (saved?.sessionDuration as number) || 50,
      bufferMinutes: (saved?.bufferMinutes as number) || 10,
    };
  };

  const availableDaysOfWeek = new Set(availability.map(a => a.day_of_week));

  const isDateAvailable = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return false;
    const jsDow = date.getDay();
    const dow = jsDow === 0 ? 6 : jsDow - 1;
    return availableDaysOfWeek.has(dow);
  };

  const getSlotsForDate = (): TimeSlot[] => {
    if (!selectedDate || !selectedPractitioner) return [];
    const jsDow = selectedDate.getDay();
    const dow = jsDow === 0 ? 6 : jsDow - 1;
    const blocks = availability.filter(a => a.day_of_week === dow);
    const { sessionDuration, bufferMinutes } = getSettings();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const allSlots = blocks.flatMap(b => generateSlots(b.start_time, b.end_time, sessionDuration, bufferMinutes));
    return allSlots.filter(slot =>
      !existingBookings.some(eb => eb.requested_date === dateStr && eb.requested_start_time === slot.startTime),
    );
  };

  // Step 1 — gate auth, then open check-in
  const handleRequestBooking = () => {
    if (!selectedSlot || !selectedDate || !selectedPractitioner) return;
    if (!user) {
      // Persist selection so we can restore it after the auth round-trip
      sessionStorage.setItem('pending_booking_selection', JSON.stringify({
        practitionerId: selectedPractitioner.user_id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        slot: selectedSlot,
      }));
      navigate('/auth?redirect=/book&intent=book');
      return;
    }
    setCheckInOpen(true);
  };

  // Step 2 — check-in complete: verify card on file, otherwise capture one
  const handleCheckInComplete = async (checkInData: CheckInData) => {
    if (!selectedSlot || !selectedDate || !selectedPractitioner || !user) return;

    // Authoritative card check — useSavedCards may still be loading on a fresh sign-up
    let currentCards = cards;
    if (cardsLoading || currentCards.length === 0) {
      const { data } = await supabase.functions.invoke('list-payment-methods');
      currentCards = data?.paymentMethods ?? currentCards;
    }

    if (currentCards.length === 0) {
      setPendingCheckIn(checkInData);
      setCheckInOpen(false);
      setCardCaptureOpen(true);
      return;
    }

    await submitBooking(checkInData);
  };

  // Step 3 — card captured, resume submission
  const handleCardCaptured = async () => {
    setCardCaptureOpen(false);
    await refreshCards();
    if (pendingCheckIn) {
      await submitBooking(pendingCheckIn);
      setPendingCheckIn(null);
    }
  };

  // Final — write booking + check-in, notify both parties
  const submitBooking = async (checkInData: CheckInData) => {
    if (!selectedSlot || !selectedDate || !selectedPractitioner || !user) return;
    setSubmitting(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const { data: existing } = await supabase
      .from('booking_requests')
      .select('id')
      .eq('practitioner_id', selectedPractitioner.user_id)
      .eq('requested_date', dateStr)
      .eq('requested_start_time', selectedSlot.startTime)
      .in('status', ['pending', 'confirmed'])
      .limit(1);

    if (existing && existing.length > 0) {
      toast.error('This slot was just booked. Please select another.');
      setSubmitting(false);
      setCheckInOpen(false);
      return;
    }

    const { data: inserted, error } = await supabase
      .from('booking_requests')
      .insert({
        practitioner_id: selectedPractitioner.user_id,
        client_user_id: user.id,
        requested_date: dateStr,
        requested_start_time: selectedSlot.startTime,
        requested_end_time: selectedSlot.endTime,
        duration_minutes: getSettings().sessionDuration,
        session_type: 'video',
      })
      .select('id')
      .single();

    if (error || !inserted) {
      setSubmitting(false);
      toast.error('Failed to submit booking request');
      return;
    }

    // Save check-in (best-effort — booking already created)
    const hasCheckInContent =
      checkInData.mood_score !== null ||
      checkInData.mood_tags.length > 0 ||
      checkInData.desired_outcome.trim() !== '' ||
      checkInData.notes_for_practitioner.trim() !== '';

    if (hasCheckInContent) {
      const { error: checkInError } = await supabase.from('booking_checkins').insert({
        booking_request_id: inserted.id,
        client_user_id: user.id,
        practitioner_id: selectedPractitioner.user_id,
        mood_score: checkInData.mood_score,
        mood_tags: checkInData.mood_tags,
        desired_outcome: checkInData.desired_outcome.trim() || null,
        notes_for_practitioner: checkInData.notes_for_practitioner.trim() || null,
      });
      if (checkInError) console.error('Check-in save error:', checkInError);
    }

    setSubmitting(false);
    setCheckInOpen(false);

    // Notify practitioner (review request) — best effort
    supabase.functions.invoke('booking-notification', {
      body: {
        practitionerId: selectedPractitioner.user_id,
        requestedDate: format(selectedDate, 'EEE, d MMM yyyy'),
        requestedTime: selectedSlot.label,
      },
    }).catch(err => console.error('Practitioner notification error:', err));

    // Confirm receipt to the client — best effort
    supabase.functions.invoke('booking-notification', {
      body: {
        type: 'client_request_received',
        practitionerId: selectedPractitioner.user_id,
        requestedDate: format(selectedDate, 'EEE, d MMM yyyy'),
        requestedTime: selectedSlot.label,
      },
    }).catch(err => console.error('Client receipt notification error:', err));

    toast.success('You took a brave step today — your booking request is in.');
    setSelectedSlot(null);
    setSelectedDate(undefined);

    // Refresh bookings
    const { data: refreshed } = await supabase
      .from('booking_requests')
      .select('id, requested_date, requested_start_time, requested_end_time, status, created_at, practitioner_notes')
      .eq('client_user_id', user.id)
      .eq('practitioner_id', selectedPractitioner.user_id)
      .order('requested_date', { ascending: false });
    if (refreshed) setMyBookings(refreshed);
  };

  // Auto-resume after returning from /auth with intent=book.
  // Practitioners load asynchronously, so we may need two passes:
  //   1) restore selectedPractitioner from list
  //   2) restore date + slot, then open check-in
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('intent') !== 'book') return;

    const stored = sessionStorage.getItem('pending_booking_selection');
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as {
        practitionerId: string;
        date: string;
        slot: TimeSlot;
      };

      // Pass 1 — practitioner list ready but no practitioner selected yet
      if (!selectedPractitioner) {
        const found = practitioners.find(p => p.user_id === parsed.practitionerId);
        if (found) setSelectedPractitioner(found);
        return;
      }

      // Pass 2 — selected practitioner matches stored one; restore slot
      if (selectedPractitioner.user_id === parsed.practitionerId && !selectedSlot) {
        setSelectedDate(new Date(`${parsed.date}T00:00:00`));
        setSelectedSlot(parsed.slot);
        setTimeout(() => setCheckInOpen(true), 100);
        sessionStorage.removeItem('pending_booking_selection');
        const url = new URL(window.location.href);
        url.searchParams.delete('intent');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      sessionStorage.removeItem('pending_booking_selection');
    }
  }, [user, practitioners, selectedPractitioner, selectedSlot]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    const { error } = await supabase.from('booking_requests').update({ status: 'cancelled' }).eq('id', id);
    if (error) {
      toast.error('Failed to cancel booking');
    } else {
      setMyBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled');
    }
    setCancellingId(null);
  };

  const slots = getSlotsForDate();
  const today = new Date().toISOString().split('T')[0];
  const pendingBookings = myBookings.filter(b => b.status === 'pending');
  const upcomingBookings = myBookings.filter(b => b.status === 'confirmed' && b.requested_date >= today);
  const pastBookings = myBookings.filter(b => b.requested_date < today || ['declined', 'cancelled', 'completed'].includes(b.status));

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Book a Session" path="/book" description="Book a confidential online counselling session with a verified groundpath practitioner across Australia." noindex />
      <Header />
      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            {selectedPractitioner ? (
              <Button variant="ghost" size="sm" onClick={handleBackToList} className="mb-3 -ml-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> All Practitioners
              </Button>
            ) : null}
            <h1 className="text-3xl font-bold text-foreground">Book a Session</h1>
            <p className="text-muted-foreground mt-1">
              {selectedPractitioner
                ? `Book a session with ${selectedPractitioner.display_name}`
                : 'Choose a practitioner to view their availability and book a session.'}
            </p>
          </div>

          <Alert className="border-amber-200 bg-amber-50/60 mb-6">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              <span className="font-semibold">Beta Booking</span> — Groundpath's native booking system is in early testing.
            </AlertDescription>
          </Alert>

          {/* ═══ Practitioner List (no practitioner selected) ═══ */}
          {!selectedPractitioner && (
            <>
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div ref={listRef} className="grid gap-4 sm:grid-cols-2">
                  {practitioners.length > 0 ? practitioners.map(p => (
                    <button
                      key={p.user_id}
                      onClick={() => handleSelectPractitioner(p)}
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
            </>
          )}

          {/* ═══ Practitioner Selected: Profile + Calendar + Slots ═══ */}
          {selectedPractitioner && (
            <div ref={bookingRef}>
              {/* Practitioner Profile Card */}
              <Card className="mb-6">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex gap-4">
                    <Avatar className="h-16 w-16 flex-shrink-0">
                      <AvatarImage src={selectedPractitioner.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                        {selectedPractitioner.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-foreground truncate">{selectedPractitioner.display_name}</h2>
                        {selectedPractitioner.professional_verified && <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />}
                      </div>
                      {selectedPractitioner.profession && (
                        <p className="text-sm text-muted-foreground">{formatProfessionLabel(selectedPractitioner.profession)}</p>
                      )}
                      {selectedPractitioner.practice_location && (
                        <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {selectedPractitioner.practice_location}
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedPractitioner.bio && (
                    <>
                      <Separator className="my-4" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{selectedPractitioner.bio}</p>
                    </>
                  )}
                  {selectedPractitioner.specializations && selectedPractitioner.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {selectedPractitioner.specializations.map(spec => (
                        <Badge key={spec} variant="secondary" className="text-[11px] px-2 py-0.5">{spec}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <Video className="h-3.5 w-3.5" />
                    <span>{getSettings().sessionDuration} min sessions · Secure video call</span>
                  </div>
                </CardContent>
              </Card>

              {loadingBooking ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Calendar + Slots */}
                  <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
                    <Card className="w-fit">
                      <CardContent className="p-4">
                        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-primary" /> Select a Date
                        </h3>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => { setSelectedDate(date); setSelectedSlot(null); }}
                          disabled={(date) => !isDateAvailable(date)}
                          className={cn("p-3 pointer-events-auto")}
                          fromDate={new Date()}
                          toDate={addDays(new Date(), 60)}
                        />
                      </CardContent>
                    </Card>

                    <div ref={slotsRef}>
                      {selectedDate ? (
                        slots.length > 0 ? (
                          <Card>
                            <CardContent className="p-4">
                              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                Available Times — {format(selectedDate, 'EEE, d MMM')}
                              </h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                                {slots.map(slot => (
                                  <button
                                    key={slot.startTime}
                                    onClick={() => setSelectedSlot(selectedSlot?.startTime === slot.startTime ? null : slot)}
                                    className={`slot-btn flex items-center justify-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                                      selectedSlot?.startTime === slot.startTime
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30 font-medium'
                                        : 'border-border hover:border-primary/40 hover:bg-muted/30'
                                    }`}
                                  >
                                    <Clock className="h-3.5 w-3.5 text-primary" />
                                    {slot.label}
                                    {selectedSlot?.startTime === slot.startTime && (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                                    )}
                                  </button>
                                ))}
                              </div>
                              {selectedSlot && selectedDate && selectedPractitioner && (
                                <div className="mb-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">You're booking</p>
                                  <p className="text-sm font-semibold text-foreground">{selectedPractitioner.display_name}</p>
                                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                                    <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" />{format(selectedDate, 'EEE, d MMM yyyy')}</span>
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{selectedSlot.label}</span>
                                    <span className="flex items-center gap-1"><Video className="h-3 w-3" />{getSettings().sessionDuration} min video</span>
                                  </div>
                                </div>
                              )}
                              <Button onClick={handleRequestBooking} disabled={!selectedSlot || submitting} className="w-full" size="lg">
                                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarIcon className="h-4 w-4 mr-2" />}
                                {user ? 'Continue to check-in' : 'Sign in to Book'}
                              </Button>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card>
                            <CardContent className="p-6 text-center">
                              <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                              <p className="text-sm text-muted-foreground">No available slots on this date. Try another day.</p>
                            </CardContent>
                          </Card>
                        )
                      ) : (
                        <Card>
                          <CardContent className="p-6 text-center">
                            <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">Select a highlighted date to see available times.</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>

                  {/* My Bookings with this practitioner */}
                  {user && myBookings.length > 0 && (
                    <Card className="mt-6">
                      <CardContent className="p-4 sm:p-5">
                        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                          <Heart className="h-4 w-4 text-primary" /> Your Sessions
                        </h3>
                        <Tabs defaultValue="pending">
                          <TabsList className="w-full">
                            <TabsTrigger value="pending" className="flex-1 text-xs">
                              Pending {pendingBookings.length > 0 && `(${pendingBookings.length})`}
                            </TabsTrigger>
                            <TabsTrigger value="upcoming" className="flex-1 text-xs">
                              Upcoming {upcomingBookings.length > 0 && `(${upcomingBookings.length})`}
                            </TabsTrigger>
                            <TabsTrigger value="past" className="flex-1 text-xs">Past</TabsTrigger>
                          </TabsList>
                          {(['pending', 'upcoming', 'past'] as const).map(tab => {
                            const list = tab === 'pending' ? pendingBookings : tab === 'upcoming' ? upcomingBookings : pastBookings;
                            return (
                              <TabsContent key={tab} value={tab} className="space-y-2 mt-3">
                                {list.length > 0 ? list.map(b => {
                                  const cfg = statusConfig[b.status] || statusConfig.pending;
                                  return (
                                    <div key={b.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                        <CalendarIcon className="h-4 w-4 text-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                          <p className="text-sm font-medium text-foreground truncate">
                                            {format(new Date(b.requested_date + 'T00:00:00'), 'EEE, d MMM yyyy')}
                                          </p>
                                          <Badge variant={cfg.variant} className="text-[10px] shrink-0">{cfg.label}</Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatTimeLabel(b.requested_start_time)} – {formatTimeLabel(b.requested_end_time)}
                                          </span>
                                        </div>
                                        {b.practitioner_notes && (
                                          <p className="text-xs text-muted-foreground italic">Note: {b.practitioner_notes}</p>
                                        )}
                                        {b.status === 'pending' && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-[11px] text-destructive hover:text-destructive mt-1"
                                            disabled={cancellingId === b.id}
                                            onClick={() => handleCancel(b.id)}
                                          >
                                            {cancellingId === b.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <X className="h-3 w-3 mr-1" />}
                                            Cancel
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }) : (
                                  <div className="text-center py-6">
                                    <CalendarIcon className="h-7 w-7 mx-auto text-muted-foreground/30 mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                      {tab === 'pending' ? 'No pending requests' : tab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions'}
                                    </p>
                                  </div>
                                )}
                              </TabsContent>
                            );
                          })}
                        </Tabs>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <PreSessionCheckIn
        open={checkInOpen}
        onOpenChange={setCheckInOpen}
        onComplete={handleCheckInComplete}
        submitting={submitting}
      />

      <Dialog open={cardCaptureOpen} onOpenChange={(open) => { setCardCaptureOpen(open); if (!open) setPendingCheckIn(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Save a card to confirm your booking
            </DialogTitle>
            <DialogDescription>
              We don't charge anything now. Your practitioner will charge the session fee only after your appointment.
            </DialogDescription>
          </DialogHeader>
          <AddCardForm
            onSuccess={handleCardCaptured}
            onCancel={() => { setCardCaptureOpen(false); setPendingCheckIn(null); }}
            submitLabel="Save card & confirm booking"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Book;
