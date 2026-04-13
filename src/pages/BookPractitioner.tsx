import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar as CalendarIcon,
  Clock,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Video,
  CheckCircle2,
  MapPin,
  ChevronRight,
  Heart,
  X,
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

const BookPractitioner = () => {
  const { practitionerId } = useParams<{ practitionerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<AvailabilityBlock[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existingBookings, setExistingBookings] = useState<{ requested_date: string; requested_start_time: string }[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const pageRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<HTMLDivElement>(null);

  // Load practitioner + availability
  useEffect(() => {
    if (!practitionerId) return;
    const load = async () => {
      const [profRes, avRes, bkRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, profession, bio, specializations, practice_location, professional_verified, halaxy_integration')
          .eq('user_id', practitionerId)
          .single(),
        supabase
          .from('practitioner_availability')
          .select('day_of_week, start_time, end_time')
          .eq('practitioner_id', practitionerId),
        supabase
          .from('booking_requests')
          .select('requested_date, requested_start_time')
          .eq('practitioner_id', practitionerId)
          .in('status', ['pending', 'confirmed']),
      ]);
      if (profRes.data) setPractitioner(profRes.data as Practitioner);
      if (avRes.data) setAvailability(avRes.data);
      if (bkRes.data) setExistingBookings(bkRes.data);
      setLoading(false);
    };
    load();
  }, [practitionerId]);

  // Load user's bookings with this practitioner
  useEffect(() => {
    if (!user || !practitionerId) return;
    const load = async () => {
      const { data } = await supabase
        .from('booking_requests')
        .select('id, requested_date, requested_start_time, requested_end_time, status, created_at, practitioner_notes')
        .eq('client_user_id', user.id)
        .eq('practitioner_id', practitionerId)
        .order('requested_date', { ascending: false });
      if (data) setMyBookings(data);
    };
    load();
  }, [user, practitionerId]);

  // GSAP entrance
  useEffect(() => {
    if (!loading && pageRef.current) {
      gsap.fromTo(pageRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
      );
    }
  }, [loading]);

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

  const getSettings = () => {
    const integration = practitioner?.halaxy_integration;
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
    if (!selectedDate || !practitioner) return [];
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

  const handleBook = async () => {
    if (!selectedSlot || !selectedDate || !practitioner || !user) {
      if (!user) {
        toast.error('Please sign in to book a session');
        navigate(`/practitioner/auth?redirect=/book/${practitioner?.user_id}`);
      }
      return;
    }
    setSubmitting(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const { data: existing } = await supabase
      .from('booking_requests')
      .select('id')
      .eq('practitioner_id', practitioner.user_id)
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
      practitioner_id: practitioner.user_id,
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

    supabase.functions.invoke('booking-notification', {
      body: {
        practitionerId: practitioner.user_id,
        requestedDate: format(selectedDate, 'EEE, d MMM yyyy'),
        requestedTime: selectedSlot.label,
      },
    }).catch(err => console.error('Booking notification error:', err));

    toast.success('Booking request submitted! Your practitioner will confirm shortly.');
    setSelectedSlot(null);
    setSelectedDate(undefined);

    // Refresh bookings
    if (user) {
      const { data } = await supabase
        .from('booking_requests')
        .select('id, requested_date, requested_start_time, requested_end_time, status, created_at, practitioner_notes')
        .eq('client_user_id', user.id)
        .eq('practitioner_id', practitioner.user_id)
        .order('requested_date', { ascending: false });
      if (data) setMyBookings(data);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!practitioner) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 px-4 text-center">
          <p className="text-muted-foreground">Practitioner not found.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate('/book')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to practitioners
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO path={`/book/${practitioner.user_id}`} />
      <Header />
      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div ref={pageRef} className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
            <Link to="/book" className="hover:text-foreground transition-colors">Book</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium truncate">{practitioner.display_name}</span>
          </nav>

          {/* Practitioner Profile Card */}
          <Card className="mb-6">
            <CardContent className="p-5 sm:p-6">
              <div className="flex gap-4">
                <Avatar className="h-16 w-16 flex-shrink-0">
                  <AvatarImage src={practitioner.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    {practitioner.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground truncate">{practitioner.display_name}</h1>
                    {practitioner.professional_verified && <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />}
                  </div>
                  {practitioner.profession && (
                    <p className="text-sm text-muted-foreground">{formatProfessionLabel(practitioner.profession)}</p>
                  )}
                  {practitioner.practice_location && (
                    <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> {practitioner.practice_location}
                    </p>
                  )}
                </div>
              </div>
              {practitioner.bio && (
                <>
                  <Separator className="my-4" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{practitioner.bio}</p>
                </>
              )}
              {practitioner.specializations && practitioner.specializations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {practitioner.specializations.map(spec => (
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

          {/* Main Content: Calendar + Slots / Bookings */}
          <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
            {/* Calendar */}
            <Card className="w-fit">
              <CardContent className="p-4">
                <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" /> Select a Date
                </h2>
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
                      <Button onClick={handleBook} disabled={!selectedSlot || submitting} className="w-full" size="lg">
                        {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarIcon className="h-4 w-4 mr-2" />}
                        {user ? 'Request Booking' : 'Sign in to Book'}
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
                <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" /> Your Sessions
                </h2>
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookPractitioner;
