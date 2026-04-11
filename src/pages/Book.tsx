import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import {
  Calendar as CalendarIcon,
  Clock,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Video,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { gsap } from 'gsap';
import { cn } from '@/lib/utils';

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

const formatProfessionLabel = (profession: string) =>
  profession.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const formatTimeLabel = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
};

/** Split an availability block into discrete slots */
function generateSlots(
  startTime: string,
  endTime: string,
  sessionMinutes: number,
  bufferMinutes: number,
): TimeSlot[] {
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
    slots.push({
      startTime: startStr,
      endTime: endStr,
      label: `${formatTimeLabel(startStr)} – ${formatTimeLabel(endStr)}`,
    });
    cursor = slotEnd + bufferMinutes;
  }

  return slots;
}

const Book = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const preselectedId = searchParams.get('practitioner');

  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPractitioner, setSelectedPractitioner] = useState<Practitioner | null>(null);
  const [availability, setAvailability] = useState<AvailabilityBlock[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existingBookings, setExistingBookings] = useState<{ requested_date: string; requested_start_time: string }[]>([]);

  const listRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<HTMLDivElement>(null);

  // Load practitioners
  useEffect(() => {
    const fetch = async () => {
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

        if (preselectedId) {
          const found = nativePractitioners.find(p => p.user_id === preselectedId);
          if (found) setSelectedPractitioner(found);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [preselectedId]);

  // GSAP entrance for practitioner cards
  useEffect(() => {
    if (!loading && practitioners.length > 0 && listRef.current && !selectedPractitioner) {
      const cards = listRef.current.querySelectorAll('.book-practitioner-card');
      gsap.fromTo(cards,
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' },
      );
    }
  }, [loading, practitioners.length, selectedPractitioner]);

  // GSAP slide-in for calendar
  useEffect(() => {
    if (selectedPractitioner && calendarRef.current) {
      gsap.fromTo(calendarRef.current,
        { opacity: 0, x: 60 },
        { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' },
      );
    }
  }, [selectedPractitioner]);

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

  // Load availability when practitioner selected
  useEffect(() => {
    if (!selectedPractitioner) return;
    setSelectedDate(undefined);
    setSelectedSlot(null);

    const load = async () => {
      const [avRes, bkRes] = await Promise.all([
        supabase
          .from('practitioner_availability')
          .select('day_of_week, start_time, end_time')
          .eq('practitioner_id', selectedPractitioner.user_id),
        supabase
          .from('booking_requests')
          .select('requested_date, requested_start_time')
          .eq('practitioner_id', selectedPractitioner.user_id)
          .in('status', ['pending', 'confirmed']),
      ]);

      if (avRes.data) setAvailability(avRes.data);
      if (bkRes.data) setExistingBookings(bkRes.data);
    };
    load();
  }, [selectedPractitioner]);

  // Get practitioner settings
  const getSettings = () => {
    const integration = selectedPractitioner?.halaxy_integration;
    const saved = (integration as Record<string, unknown>)?.availability_settings as Record<string, unknown> | undefined;
    return {
      sessionDuration: (saved?.sessionDuration as number) || 50,
      bufferMinutes: (saved?.bufferMinutes as number) || 10,
    };
  };

  // Which days of week have availability
  const availableDaysOfWeek = new Set(availability.map(a => a.day_of_week));

  const isDateAvailable = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return false;
    // Convert JS day (0=Sun) to our format (0=Mon)
    const jsDow = date.getDay();
    const dow = jsDow === 0 ? 6 : jsDow - 1;
    return availableDaysOfWeek.has(dow);
  };

  // Get slots for selected date
  const getSlotsForDate = (): TimeSlot[] => {
    if (!selectedDate || !selectedPractitioner) return [];
    const jsDow = selectedDate.getDay();
    const dow = jsDow === 0 ? 6 : jsDow - 1;
    const blocks = availability.filter(a => a.day_of_week === dow);
    const { sessionDuration, bufferMinutes } = getSettings();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const allSlots = blocks.flatMap(b => generateSlots(b.start_time, b.end_time, sessionDuration, bufferMinutes));

    // Filter out already booked slots
    return allSlots.filter(slot =>
      !existingBookings.some(eb => eb.requested_date === dateStr && eb.requested_start_time === slot.startTime),
    );
  };

  const handleSelectPractitioner = (p: Practitioner) => {
    setSelectedPractitioner(p);
  };

  const handleBack = () => {
    if (selectedDate) {
      setSelectedDate(undefined);
      setSelectedSlot(null);
    } else if (selectedPractitioner) {
      setSelectedPractitioner(null);
      setAvailability([]);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !selectedDate || !selectedPractitioner || !user) {
      if (!user) {
        toast.error('Please sign in to book a session');
        navigate(`/practitioner/auth?redirect=/book?practitioner=${selectedPractitioner?.user_id}`);
      }
      return;
    }

    setSubmitting(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    // Double-booking check
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
      return;
    }

    const { error } = await supabase.from('booking_requests').insert({
      practitioner_id: selectedPractitioner.user_id,
      client_user_id: user.id,
      requested_date: dateStr,
      requested_start_time: selectedSlot.startTime,
      requested_end_time: selectedSlot.endTime,
      duration_minutes: getSettings().sessionDuration,
      session_type: 'video',
    });

    setSubmitting(false);

    if (error) {
      toast.error('Failed to submit booking request');
      return;
    }

    // Notify practitioner (best-effort)
    supabase.functions.invoke('booking-notification', {
      body: {
        practitionerId: selectedPractitioner.user_id,
        requestedDate: format(selectedDate, 'EEE, d MMM yyyy'),
        requestedTime: selectedSlot.label,
      },
    }).catch(err => console.error('Booking notification error:', err));

    toast.success('Booking request submitted! Your practitioner will confirm shortly.');
    setSelectedSlot(null);
    setSelectedDate(undefined);
    setSelectedPractitioner(null);
  };

  const slots = getSlotsForDate();

  return (
    <div className="min-h-screen bg-background">
      <SEO path="/book" />
      <Header />
      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            {selectedPractitioner && (
              <Button variant="ghost" size="sm" onClick={handleBack} className="mb-3 -ml-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4 mr-1" />
                {selectedDate ? 'Back to calendar' : 'Back to practitioners'}
              </Button>
            )}
            <h1 className="text-3xl font-bold text-foreground">Book a Session</h1>
            <p className="text-muted-foreground mt-1">
              {!selectedPractitioner
                ? 'Choose a practitioner to see available times.'
                : !selectedDate
                  ? `Select a date with ${selectedPractitioner.display_name}`
                  : `Choose a time on ${format(selectedDate, 'EEEE, d MMMM yyyy')}`}
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
          ) : !selectedPractitioner ? (
            /* ═══ Practitioner Selection ═══ */
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
          ) : (
            /* ═══ Calendar + Slot Selection ═══ */
            <div ref={calendarRef} className="grid gap-6 md:grid-cols-[auto_1fr]">
              {/* Calendar */}
              <Card className="w-fit">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={selectedPractitioner.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {selectedPractitioner.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{selectedPractitioner.display_name}</p>
                      <p className="text-xs text-muted-foreground">{getSettings().sessionDuration} min sessions</p>
                    </div>
                  </div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setSelectedSlot(null);
                    }}
                    disabled={(date) => !isDateAvailable(date)}
                    className={cn("p-3 pointer-events-auto")}
                    fromDate={new Date()}
                    toDate={addDays(new Date(), 60)}
                  />
                </CardContent>
              </Card>

              {/* Time slots */}
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

                        <Button
                          onClick={handleBook}
                          disabled={!selectedSlot || submitting}
                          className="w-full"
                          size="lg"
                        >
                          {submitting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CalendarIcon className="h-4 w-4 mr-2" />
                          )}
                          {user ? 'Request Booking' : 'Sign in to Book'}
                        </Button>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                          <Video className="h-3.5 w-3.5" />
                          <span>Sessions conducted via secure video call.</span>
                        </div>
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
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Book;
