// Inline booking panel — embeds calendar + slot selection for a single practitioner.
// Used by both PractitionerProfile (rich credentials hub) and Book (directory + booking).
//
// Keeps the heavy booking lifecycle (auth gate → check-in → card capture → submit)
// inside one well-tested place. Consumers just supply the practitioner and a few
// optional callbacks. We deliberately do NOT re-implement the auth/card/check-in
// flow on the profile page — this panel owns it.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  Video,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSavedCards } from '@/hooks/useSavedCards';
import PreSessionCheckIn, { type CheckInData } from '@/components/booking/PreSessionCheckIn';
import AddCardForm from '@/components/billing/AddCardForm';
import { getNextAvailableSlots, type UpcomingSlot } from '@/lib/availability';

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

interface Props {
  practitionerId: string;
  practitionerName: string;
  /** Optional integration object for session duration / buffer overrides. */
  bookingIntegration?: Record<string, unknown> | null;
  /** Where to redirect on auth gate. Defaults to current path. */
  authRedirectPath?: string;
}

const formatTimeLabel = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
};

const generateSlots = (
  startTime: string,
  endTime: string,
  sessionMinutes: number,
  bufferMinutes: number,
): TimeSlot[] => {
  const [sh, sm] = startTime.slice(0, 5).split(':').map(Number);
  const [eh, em] = endTime.slice(0, 5).split(':').map(Number);
  const startTotal = sh * 60 + sm;
  const endTotal = eh * 60 + em;
  const out: TimeSlot[] = [];
  let cursor = startTotal;
  while (cursor + sessionMinutes <= endTotal) {
    const slotEnd = cursor + sessionMinutes;
    const startStr = `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`;
    const endStr = `${String(Math.floor(slotEnd / 60)).padStart(2, '0')}:${String(slotEnd % 60).padStart(2, '0')}`;
    out.push({ startTime: startStr, endTime: endStr, label: `${formatTimeLabel(startStr)} – ${formatTimeLabel(endStr)}` });
    cursor = slotEnd + bufferMinutes;
  }
  return out;
};

const InlineBookingPanel = ({ practitionerId, practitionerName, bookingIntegration, authRedirectPath }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cards, loading: cardsLoading, refresh: refreshCards } = useSavedCards();

  const [availability, setAvailability] = useState<AvailabilityBlock[]>([]);
  const [existingBookings, setExistingBookings] = useState<{ requested_date: string; requested_start_time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [cardCaptureOpen, setCardCaptureOpen] = useState(false);
  const [pendingCheckIn, setPendingCheckIn] = useState<CheckInData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rateInfo, setRateInfo] = useState<{ minRate: number } | null>(null);

  const settings = (() => {
    const saved = (bookingIntegration as Record<string, unknown> | null | undefined)?.availability_settings as
      | Record<string, unknown>
      | undefined;
    return {
      sessionDuration: (saved?.sessionDuration as number) || 50,
      bufferMinutes: (saved?.bufferMinutes as number) || 10,
    };
  })();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [avRes, bkRes, profileRes] = await Promise.all([
        supabase
          .from('practitioner_availability')
          .select('day_of_week, start_time, end_time')
          .eq('practitioner_id', practitionerId),
        supabase
          .from('booking_requests')
          .select('requested_date, requested_start_time')
          .eq('practitioner_id', practitionerId)
          .in('status', ['pending', 'confirmed']),
        supabase
          .from('profiles')
          .select('session_rate_cents, duration_rates')
          .eq('user_id', practitionerId)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setAvailability((avRes.data ?? []) as AvailabilityBlock[]);
      setExistingBookings((bkRes.data ?? []) as { requested_date: string; requested_start_time: string }[]);
      
      if (profileRes.data) {
        const rates = profileRes.data.duration_rates as Record<string, number> | null;
        const standard = profileRes.data.session_rate_cents;
        const allRates = rates ? Object.values(rates) : [];
        if (standard) allRates.push(standard);
        if (allRates.length > 0) {
          setRateInfo({ minRate: Math.min(...allRates) / 100 });
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [practitionerId]);

  const availableDays = new Set(availability.map((a) => a.day_of_week));
  const isDateAvailable = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return false;
    const jsDow = date.getDay();
    const dow = jsDow === 0 ? 6 : jsDow - 1;
    return availableDays.has(dow);
  };

  const slots = (() => {
    if (!selectedDate) return [];
    const jsDow = selectedDate.getDay();
    const dow = jsDow === 0 ? 6 : jsDow - 1;
    const blocks = availability.filter((a) => a.day_of_week === dow);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const all = blocks.flatMap((b) => generateSlots(b.start_time, b.end_time, settings.sessionDuration, settings.bufferMinutes));
    return all.filter(
      (s) => !existingBookings.some((eb) => eb.requested_date === dateStr && eb.requested_start_time === s.startTime),
    );
  })();

  const handleRequest = () => {
    if (!selectedSlot || !selectedDate) return;
    if (!user) {
      sessionStorage.setItem(
        'pending_booking_selection',
        JSON.stringify({
          practitionerId,
          date: format(selectedDate, 'yyyy-MM-dd'),
          slot: selectedSlot,
        }),
      );
      const redirect = authRedirectPath ?? `/book?practitioner=${practitionerId}`;
      navigate(`/auth?redirect=${encodeURIComponent(redirect)}&intent=book`);
      return;
    }
    setCheckInOpen(true);
  };

  const handleCheckInComplete = async (data: CheckInData) => {
    if (!user) return;
    let currentCards = cards;
    if (cardsLoading || currentCards.length === 0) {
      const { data: pmData } = await supabase.functions.invoke('list-payment-methods');
      currentCards = pmData?.paymentMethods ?? currentCards;
    }
    if (currentCards.length === 0) {
      setPendingCheckIn(data);
      setCheckInOpen(false);
      setCardCaptureOpen(true);
      return;
    }
    await submit(data);
  };

  const handleCardCaptured = async () => {
    setCardCaptureOpen(false);
    await refreshCards();
    if (pendingCheckIn) {
      await submit(pendingCheckIn);
      setPendingCheckIn(null);
    }
  };

  const submit = async (data: CheckInData) => {
    if (!selectedSlot || !selectedDate || !user) return;
    setSubmitting(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const { data: existing } = await supabase
      .from('booking_requests')
      .select('id')
      .eq('practitioner_id', practitionerId)
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
        practitioner_id: practitionerId,
        client_user_id: user.id,
        requested_date: dateStr,
        requested_start_time: selectedSlot.startTime,
        requested_end_time: selectedSlot.endTime,
        duration_minutes: settings.sessionDuration,
        session_type: 'video',
      })
      .select('id')
      .single();

    if (error || !inserted) {
      setSubmitting(false);
      toast.error('Failed to submit booking request');
      return;
    }

    const hasCheckInContent =
      data.mood_score !== null ||
      data.mood_tags.length > 0 ||
      data.desired_outcome.trim() !== '' ||
      data.notes_for_practitioner.trim() !== '';

    if (hasCheckInContent) {
      await supabase.from('booking_checkins').insert({
        booking_request_id: inserted.id,
        client_user_id: user.id,
        practitioner_id: practitionerId,
        mood_score: data.mood_score,
        mood_tags: data.mood_tags,
        desired_outcome: data.desired_outcome.trim() || null,
        notes_for_practitioner: data.notes_for_practitioner.trim() || null,
      });
    }

    supabase.functions
      .invoke('booking-notification', {
        body: {
          practitionerId,
          requestedDate: format(selectedDate, 'EEE, d MMM yyyy'),
          requestedTime: selectedSlot.label,
        },
      })
      .catch(() => undefined);

    setSubmitting(false);
    setCheckInOpen(false);
    toast.success('You took a brave step today — your booking request is in.');
    setSelectedSlot(null);
    setSelectedDate(undefined);

    const { data: refreshed } = await supabase
      .from('booking_requests')
      .select('requested_date, requested_start_time')
      .eq('practitioner_id', practitionerId)
      .in('status', ['pending', 'confirmed']);
    if (refreshed) setExistingBookings(refreshed);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (availability.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">
            {practitionerName} hasn't published availability yet. Send a message to enquire about times.
          </p>
        </CardContent>
      </Card>
    );
  }

  const quickSlots: UpcomingSlot[] = getNextAvailableSlots(availability, existingBookings, {
    limit: 4,
    sessionMinutes: settings.sessionDuration,
    bufferMinutes: settings.bufferMinutes,
  });

  const pickQuickSlot = (s: UpcomingSlot) => {
    setSelectedDate(s.date);
    setSelectedSlot({ startTime: s.startTime, endTime: s.endTime, label: `${formatTimeLabel(s.startTime)} – ${formatTimeLabel(s.endTime)}` });
    toast.success(`Selected ${format(s.date, 'EEE d MMM')} at ${formatTimeLabel(s.startTime)} — review & confirm below.`);
    // Scroll the booking confirmation into view on small screens
    setTimeout(() => {
      document.getElementById('inline-booking-confirm')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  return (
    <>
      {quickSlots.length > 0 && (
        <Card className="mb-4 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Next available — quick pick
              </h3>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">One tap to select</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {quickSlots.map((s, i) => {
                const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(s.date, 'yyyy-MM-dd') && selectedSlot?.startTime === s.startTime;
                return (
                  <button
                    key={`${s.label}-${i}`}
                    onClick={() => pickQuickSlot(s)}
                    className={cn(
                      'flex flex-col items-start gap-0.5 px-3 py-2 rounded-md border text-xs transition-colors text-left',
                      isSelected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                        : 'border-border bg-background hover:border-primary/40 hover:bg-muted/40',
                    )}
                  >
                    <span className="font-medium text-foreground">{format(s.date, 'EEE d MMM')}</span>
                    <span className="text-muted-foreground">{formatTimeLabel(s.startTime)}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <Card className="w-fit">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" /> Select a date
            </h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                setSelectedDate(d);
                setSelectedSlot(null);
              }}
              disabled={(d) => !isDateAvailable(d)}
              className={cn('p-3 pointer-events-auto')}
              fromDate={new Date()}
              toDate={addDays(new Date(), 60)}
            />
          </CardContent>
        </Card>

        <div>
          {selectedDate ? (
            slots.length > 0 ? (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Available times — {format(selectedDate, 'EEE, d MMM')}
                    </h3>
                    {rateInfo && (
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                        From ${rateInfo.minRate} / {settings.sessionDuration} min
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                    {slots.map((s) => (
                      <button
                        key={s.startTime}
                        onClick={() => setSelectedSlot(selectedSlot?.startTime === s.startTime ? null : s)}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                          selectedSlot?.startTime === s.startTime
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30 font-medium'
                            : 'border-border hover:border-primary/40 hover:bg-muted/30'
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {s.label}
                        {selectedSlot?.startTime === s.startTime && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>
                  {selectedSlot && (
                    <div id="inline-booking-confirm" className="mb-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                        You're booking
                      </p>
                      <p className="text-sm font-semibold text-foreground">{practitionerName}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(selectedDate, 'EEE, d MMM yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {selectedSlot.label}
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          {settings.sessionDuration} min video
                        </span>
                      </div>
                    </div>
                  )}
                  <Button onClick={handleRequest} disabled={!selectedSlot || submitting} className="w-full" size="lg">
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarIcon className="h-4 w-4 mr-2" />}
                    {user ? 'Continue to check-in' : 'Sign in to book'}
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

      <PreSessionCheckIn
        open={checkInOpen}
        onOpenChange={setCheckInOpen}
        onComplete={handleCheckInComplete}
        submitting={submitting}
      />

      <Dialog
        open={cardCaptureOpen}
        onOpenChange={(open) => {
          setCardCaptureOpen(open);
          if (!open) setPendingCheckIn(null);
        }}
      >
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
            onCancel={() => {
              setCardCaptureOpen(false);
              setPendingCheckIn(null);
            }}
            submitLabel="Save card & confirm booking"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InlineBookingPanel;
