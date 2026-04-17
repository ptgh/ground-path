import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Video, ExternalLink, Loader2, ArrowLeft, ShieldCheck, Mic, Headphones } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface Booking {
  id: string;
  client_user_id: string;
  practitioner_id: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  duration_minutes: number;
  status: string;
  meeting_url: string | null;
  meeting_status: string | null;
  practitioner_notes: string | null;
}

const formatTime = (t: string) => {
  const [hRaw, mRaw] = t.split(':').map(Number);
  const h = hRaw || 0;
  const m = mRaw || 0;
  const mm = m.toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${mm} ${period}`;
};

/**
 * Build a Microsoft Teams `msteams:` deep link from a Graph joinWebUrl.
 * Falls back to the original URL if parsing fails.
 */
const buildTeamsDeepLink = (joinWebUrl: string): string => {
  try {
    const url = new URL(joinWebUrl);
    // Replace the protocol and host with msteams:/l/meetup-join/...
    return `msteams:${url.pathname}${url.search}${url.hash}`;
  } catch {
    return joinWebUrl;
  }
};

const JoinSession = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [partnerName, setPartnerName] = useState<string>('');
  const [now, setNow] = useState(() => new Date());
  const [error, setError] = useState<string | null>(null);

  // Tick every 30s for the countdown
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Load + subscribe to booking
  useEffect(() => {
    if (!bookingId || !user) return;
    let mounted = true;

    const load = async () => {
      const { data, error: bErr } = await supabase
        .from('booking_requests')
        .select('id, client_user_id, practitioner_id, requested_date, requested_start_time, requested_end_time, duration_minutes, status, meeting_url, meeting_status, practitioner_notes')
        .eq('id', bookingId)
        .maybeSingle();

      if (!mounted) return;

      if (bErr || !data) {
        setError('Session not found.');
        setLoading(false);
        return;
      }

      // Authorization: only the client or the practitioner may view
      if (data.client_user_id !== user.id && data.practitioner_id !== user.id) {
        setError('You do not have access to this session.');
        setLoading(false);
        return;
      }

      setBooking(data as Booking);

      // Fetch the other party's display name
      const partnerId = data.client_user_id === user.id ? data.practitioner_id : data.client_user_id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', partnerId)
        .maybeSingle();
      if (mounted) setPartnerName(profile?.display_name || (data.client_user_id === user.id ? 'your practitioner' : 'your client'));
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`session-${bookingId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'booking_requests',
        filter: `id=eq.${bookingId}`,
      }, (payload) => {
        setBooking((prev) => prev ? { ...prev, ...(payload.new as Partial<Booking>) } : prev);
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [bookingId, user]);

  const startsAt = useMemo(() => {
    if (!booking) return null;
    return new Date(`${booking.requested_date}T${booking.requested_start_time}`);
  }, [booking]);

  const endsAt = useMemo(() => {
    if (!booking) return null;
    return new Date(`${booking.requested_date}T${booking.requested_end_time}`);
  }, [booking]);

  const countdownLabel = useMemo(() => {
    if (!startsAt || !endsAt) return '';
    const diffMs = startsAt.getTime() - now.getTime();
    const minsToStart = Math.round(diffMs / 60000);
    if (now >= startsAt && now <= endsAt) return 'Live now';
    if (now > endsAt) return 'Session ended';
    if (minsToStart <= 0) return 'Starting now';
    if (minsToStart < 60) return `Starts in ${minsToStart} min`;
    const hrs = Math.floor(minsToStart / 60);
    const remMins = minsToStart % 60;
    if (hrs < 24) return `Starts in ${hrs}h ${remMins}m`;
    const days = Math.floor(hrs / 24);
    return `Starts in ${days} day${days > 1 ? 's' : ''}`;
  }, [startsAt, endsAt, now]);

  const isJoinable = useMemo(() => {
    if (!startsAt || !endsAt) return false;
    // Allow joining 15 min early through to session end
    const earliest = new Date(startsAt.getTime() - 15 * 60_000);
    return now >= earliest && now <= endsAt;
  }, [startsAt, endsAt, now]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    navigate(`/practitioner/auth?redirect=/session/${bookingId}`, { replace: true });
    return null;
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center space-y-4">
            <p className="text-sm text-muted-foreground">{error || 'Session not found.'}</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1.5" />Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const meetingReady = booking.status === 'confirmed' && booking.meeting_status === 'created' && booking.meeting_url;
  const meetingPending = booking.status === 'confirmed' && (!booking.meeting_status || booking.meeting_status !== 'created');

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:py-10">
      <div className="max-w-xl mx-auto">
        {/* Back link */}
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1.5" />Back to dashboard</Link>
        </Button>

        {/* Hero card */}
        <Card className="overflow-hidden">
          <div className="bg-primary/10 border-b border-border px-5 py-6 sm:px-7 sm:py-8 text-center">
            <Badge variant="outline" className="text-[10px] mb-3 bg-background/80">
              {booking.status === 'confirmed' ? 'Confirmed' : booking.status}
            </Badge>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
              Session with {partnerName}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {format(new Date(booking.requested_date + 'T00:00:00'), 'EEEE, d MMMM yyyy')}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatTime(booking.requested_start_time)} – {formatTime(booking.requested_end_time)}
              {' · '}{booking.duration_minutes} min
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/70 border border-border text-xs font-medium text-foreground">
              <Clock className="h-3 w-3" />
              {countdownLabel}
            </div>
          </div>

          <CardContent className="p-5 sm:p-7 space-y-5">
            {/* Join actions */}
            {meetingReady && (
              <div className="space-y-2.5">
                <a
                  href={buildTeamsDeepLink(booking.meeting_url!)}
                  className="flex items-center justify-center gap-2 w-full min-h-[48px] px-5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  <Video className="h-4 w-4" />
                  Open in Teams app
                </a>
                <a
                  href={booking.meeting_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full min-h-[48px] px-5 rounded-lg border border-border bg-background text-foreground font-medium text-sm hover:bg-muted transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Join in browser
                </a>
                {!isJoinable && (
                  <p className="text-[11px] text-muted-foreground text-center pt-1">
                    The join buttons are active 15 minutes before your session.
                  </p>
                )}
              </div>
            )}

            {meetingPending && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Setting up your secure meeting…</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This page will update automatically as soon as the link is ready. You'll also receive an email.
                </p>
              </div>
            )}

            {booking.status !== 'confirmed' && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                <p className="text-sm font-medium text-foreground capitalize">Status: {booking.status}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {booking.status === 'pending'
                    ? 'Waiting for your practitioner to confirm this booking.'
                    : 'This session is no longer active.'}
                </p>
              </div>
            )}

            {/* How to join */}
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" /> How to join
              </p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex gap-2.5">
                  <Clock className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                  <span>Open this page or the email link about <strong className="text-foreground">5 minutes early</strong>.</span>
                </li>
                <li className="flex gap-2.5">
                  <Mic className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                  <span>Allow your browser or Teams app to access your <strong className="text-foreground">microphone and camera</strong>.</span>
                </li>
                <li className="flex gap-2.5">
                  <Calendar className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                  <span>You'll wait briefly in the lobby until {partnerName} admits you.</span>
                </li>
                <li className="flex gap-2.5">
                  <Headphones className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                  <span>Headphones in a quiet, private space help with sound and confidentiality.</span>
                </li>
              </ul>
            </div>

            {booking.practitioner_notes && (
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-xs font-semibold text-foreground mb-1.5">Note from your practitioner</p>
                <p className="text-sm text-muted-foreground italic">{booking.practitioner_notes}</p>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground text-center pt-1">
              Your conversation is private and confidential. groundpath does not record sessions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JoinSession;
