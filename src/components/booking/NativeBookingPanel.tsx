import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Video, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const formatTime = (t: string) => {
  const [h] = t.split(':').map(Number);
  return h > 12 ? `${h - 12}:00 PM` : h === 12 ? '12:00 PM' : `${h}:00 AM`;
};

interface Slot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const NativeBookingPanel = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      // Fetch availability from all practitioners in native_beta mode
      const { data: practitioners } = await supabase
        .from('profiles')
        .select('user_id, halaxy_integration')
        .eq('user_type', 'practitioner')
        .eq('directory_approved', true);

      const betaPractitioners = (practitioners || []).filter(p => {
        const integration = p.halaxy_integration as { session_mode?: string } | null;
        return integration?.session_mode === 'native_beta';
      });

      if (betaPractitioners.length === 0) {
        setLoading(false);
        return;
      }

      const practitionerIds = betaPractitioners.map(p => p.user_id);
      const { data: avail } = await supabase
        .from('practitioner_availability')
        .select('*')
        .in('practitioner_id', practitionerIds)
        .order('day_of_week', { ascending: true });

      if (avail) setSlots(avail);
      setLoading(false);
    };
    load();
  }, []);

  const handleRequest = async () => {
    if (!selectedSlot || !user) {
      if (!user) {
        toast.error('Please sign in to request a booking');
        return;
      }
      return;
    }

    const slot = slots.find(s => s.id === selectedSlot);
    if (!slot) return;

    setSubmitting(true);

    // Find the practitioner for this slot
    const { data: slotData } = await supabase
      .from('practitioner_availability')
      .select('practitioner_id')
      .eq('id', slot.id)
      .single();

    if (!slotData) {
      toast.error('Could not find practitioner');
      setSubmitting(false);
      return;
    }

    // Calculate next occurrence of this day
    const today = new Date();
    const todayDow = (today.getDay() + 6) % 7; // Convert to Mon=0
    let daysUntil = slot.day_of_week - todayDow;
    if (daysUntil <= 0) daysUntil += 7;
    const requestedDate = new Date(today);
    requestedDate.setDate(today.getDate() + daysUntil);
    const dateStr = requestedDate.toISOString().split('T')[0];

    const { error } = await supabase
      .from('booking_requests')
      .insert({
        practitioner_id: slotData.practitioner_id,
        client_user_id: user.id,
        requested_date: dateStr,
        requested_start_time: slot.start_time,
        requested_end_time: slot.end_time,
        duration_minutes: 50,
        session_type: 'video',
      });

    setSubmitting(false);

    if (error) {
      toast.error('Failed to submit booking request');
      return;
    }

    toast.success('Booking request submitted! Your practitioner will confirm shortly.');
    setSelectedSlot(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="border-amber-200 bg-amber-50/60">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 text-sm">
          <span className="font-semibold">Beta Booking</span> — Groundpath's native booking system is in early testing. Your request will be reviewed by your practitioner.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Book a Session
            </CardTitle>
            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">
              Native Beta
            </Badge>
          </div>
          <CardDescription>
            Select an available time below to request a session with your practitioner.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {slots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {slots.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.id === selectedSlot ? null : slot.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    selectedSlot === slot.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{DAYS[slot.day_of_week]}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(slot.start_time)} – {formatTime(slot.end_time)}</p>
                  </div>
                  {selectedSlot === slot.id && (
                    <CheckCircle2 className="h-4 w-4 text-primary ml-auto flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No availability set yet. Check back soon.</p>
            </div>
          )}

          <Button
            onClick={handleRequest}
            disabled={!selectedSlot || submitting}
            className="w-full"
            size="lg"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4 mr-2" />
            )}
            Request Booking
          </Button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Video className="h-3.5 w-3.5" />
            <span>Sessions conducted via secure video — Microsoft Teams integration coming soon.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NativeBookingPanel;
