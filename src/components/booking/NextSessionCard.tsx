import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Clock, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface NextBooking {
  id: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  practitioner_name: string;
  meeting_status: string | null;
}

const formatTime = (t: string) => {
  const [hRaw, mRaw] = t.split(':').map(Number);
  const h = hRaw || 0;
  const mm = (mRaw || 0).toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${mm} ${period}`;
};

export const NextSessionCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<NextBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('booking_requests')
        .select('id, requested_date, requested_start_time, requested_end_time, practitioner_id, meeting_status')
        .eq('client_user_id', user.id)
        .eq('status', 'confirmed')
        .gte('requested_date', today)
        .order('requested_date', { ascending: true })
        .order('requested_start_time', { ascending: true })
        .limit(1);

      if (!data || data.length === 0) {
        setBooking(null);
        setLoading(false);
        return;
      }

      const b = data[0];
      const { data: prof } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', b.practitioner_id)
        .maybeSingle();

      setBooking({
        id: b.id,
        requested_date: b.requested_date,
        requested_start_time: b.requested_start_time,
        requested_end_time: b.requested_end_time,
        practitioner_name: prof?.display_name || 'your practitioner',
        meeting_status: b.meeting_status,
      });
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel('next-session')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'booking_requests',
        filter: `client_user_id=eq.${user.id}`,
      }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (!booking) return;
    const tick = () => {
      const start = new Date(`${booking.requested_date}T${booking.requested_start_time}`);
      const end = new Date(`${booking.requested_date}T${booking.requested_end_time}`);
      const now = new Date();
      const diffMin = Math.round((start.getTime() - now.getTime()) / 60000);
      if (now >= start && now <= end) setCountdown('Live now');
      else if (diffMin > 0 && diffMin < 60) setCountdown(`Starts in ${diffMin} min`);
      else if (diffMin >= 60 && diffMin < 1440) setCountdown(`Starts in ${Math.round(diffMin / 60)} h`);
      else setCountdown('');
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [booking]);

  if (loading || !booking) return null;

  const start = new Date(`${booking.requested_date}T${booking.requested_start_time}`);
  const end = new Date(`${booking.requested_date}T${booking.requested_end_time}`);
  const now = new Date();
  const isJoinable = now >= new Date(start.getTime() - 10 * 60000) && now <= end;
  const meetingReady = booking.meeting_status === 'created';

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Video className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                Next Session
              </span>
              {countdown && (
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {countdown}
                </span>
              )}
            </div>
            <p className="text-base font-medium text-foreground">
              with {booking.practitioner_name}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(start, 'EEE, d MMM')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(booking.requested_start_time)} – {formatTime(booking.requested_end_time)}
              </span>
            </div>
          </div>
          <Button
            size="lg"
            className="w-full sm:w-auto min-h-[44px]"
            disabled={!meetingReady}
            onClick={() => navigate(`/session/${booking.id}`)}
          >
            {!meetingReady ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Setting up…
              </>
            ) : (
              <>
                <Video className="h-4 w-4 mr-2" />
                {isJoinable ? 'Join Session' : 'Open Session'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NextSessionCard;
