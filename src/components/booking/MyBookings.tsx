import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Loader2, Video, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Booking {
  id: string;
  practitioner_id: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  duration_minutes: number;
  status: string;
  session_type: string;
  notes: string | null;
  practitioner_notes: string | null;
  created_at: string;
  practitioner_name?: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  confirmed: { label: 'Confirmed', variant: 'default' },
  declined: { label: 'Declined', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'outline' },
  completed: { label: 'Completed', variant: 'outline' },
};

const formatTime = (t: string) => {
  const [h] = t.split(':').map(Number);
  return h > 12 ? `${h - 12}:00 PM` : h === 12 ? '12:00 PM' : `${h}:00 AM`;
};

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data, error } = await supabase
        .from('booking_requests')
        .select('*')
        .eq('client_user_id', user.id)
        .order('requested_date', { ascending: false });

      if (error) {
        console.error('Error loading bookings:', error);
        setLoading(false);
        return;
      }

      // Fetch practitioner names
      const practitionerIds = [...new Set((data || []).map(b => b.practitioner_id))];
      let nameMap: Record<string, string> = {};
      if (practitionerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', practitionerIds);
        nameMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p.display_name || 'Practitioner']));
      }

      setBookings((data || []).map(b => ({ ...b, practitioner_name: nameMap[b.practitioner_id] || 'Practitioner' })));
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel('my-bookings')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'booking_requests',
        filter: `client_user_id=eq.${user.id}`,
      }, () => { load(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    const { error } = await supabase
      .from('booking_requests')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      toast.error('Failed to cancel booking');
    } else {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking request cancelled');

      // Notify practitioner of cancellation (best-effort)
      supabase.functions.invoke('booking-notification', {
        body: { type: 'client_cancellation', bookingId: id },
      }).catch(err => console.error('Cancellation notification error:', err));
    }
    setCancellingId(null);
  };

  const today = new Date().toISOString().split('T')[0];
  const pending = bookings.filter(b => b.status === 'pending');
  const confirmed = bookings.filter(b => b.status === 'confirmed' && b.requested_date >= today);
  const past = bookings.filter(b =>
    b.requested_date < today || ['declined', 'cancelled', 'completed'].includes(b.status)
  );

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const cfg = statusConfig[booking.status] || statusConfig.pending;
    const canCancel = booking.status === 'pending';
    const meetingUrl = (booking as Record<string, unknown>).meeting_url as string | undefined;
    const meetingStatus = (booking as Record<string, unknown>).meeting_status as string | undefined;
    const isConfirmedWithMeeting = booking.status === 'confirmed' && meetingUrl && meetingStatus === 'created';
    const isMeetingPending = booking.status === 'confirmed' && meetingStatus && meetingStatus !== 'created' && meetingStatus !== 'none';

    return (
      <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Calendar className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {format(new Date(booking.requested_date + 'T00:00:00'), 'EEE, d MMM yyyy')}
            </p>
            <Badge variant={cfg.variant} className="text-[10px] shrink-0">{cfg.label}</Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(booking.requested_start_time)} – {formatTime(booking.requested_end_time)}
            </span>
            <span className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              {booking.session_type}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">with {booking.practitioner_name}</p>
          {booking.practitioner_notes && (
            <p className="text-xs text-muted-foreground italic mt-1">
              Note: {booking.practitioner_notes}
            </p>
          )}
          {isConfirmedWithMeeting && (
            <a
              href={meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Video className="h-3.5 w-3.5" />
              Join Session
            </a>
          )}
          {isMeetingPending && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Meeting setup in progress — details will appear here shortly
            </p>
          )}
          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] text-destructive hover:text-destructive mt-1"
              disabled={cancellingId === booking.id}
              onClick={() => handleCancel(booking.id)}
            >
              {cancellingId === booking.id ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <X className="h-3 w-3 mr-1" />
              )}
              Cancel Request
            </Button>
          )}
        </div>
      </div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-6">
      <Calendar className="h-7 w-7 mx-auto text-muted-foreground/30 mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          My Bookings
        </CardTitle>
        <CardDescription>Track your session requests and upcoming appointments</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1 text-xs">
              Pending {pending.length > 0 && `(${pending.length})`}
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="flex-1 text-xs">
              Upcoming {confirmed.length > 0 && `(${confirmed.length})`}
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1 text-xs">
              Past
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="space-y-2 mt-3">
            {pending.length > 0
              ? pending.map(b => <BookingCard key={b.id} booking={b} />)
              : <EmptyState message="No pending requests" />}
          </TabsContent>
          <TabsContent value="confirmed" className="space-y-2 mt-3">
            {confirmed.length > 0
              ? confirmed.map(b => <BookingCard key={b.id} booking={b} />)
              : <EmptyState message="No upcoming sessions" />}
          </TabsContent>
          <TabsContent value="past" className="space-y-2 mt-3">
            {past.length > 0
              ? past.map(b => <BookingCard key={b.id} booking={b} />)
              : <EmptyState message="No past sessions" />}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MyBookings;
