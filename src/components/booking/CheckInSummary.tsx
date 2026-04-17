import { useEffect, useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CheckInSummaryProps {
  bookingRequestId: string;
  /** When true, renders inline compact pill summary; when false, full block */
  compact?: boolean;
}

interface CheckIn {
  mood_score: number | null;
  mood_tags: string[] | null;
  desired_outcome: string | null;
  notes_for_practitioner: string | null;
}

const MOOD_EMOJI: Record<number, string> = { 1: '😔', 2: '😕', 3: '😐', 4: '🙂', 5: '😊' };
const MOOD_LABEL: Record<number, string> = { 1: 'Low', 2: 'Down', 3: 'Okay', 4: 'Good', 5: 'Great' };

const CheckInSummary = ({ bookingRequestId, compact = false }: CheckInSummaryProps) => {
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from('booking_checkins')
        .select('mood_score, mood_tags, desired_outcome, notes_for_practitioner')
        .eq('booking_request_id', bookingRequestId)
        .maybeSingle();
      if (!cancelled) {
        setCheckIn(data);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [bookingRequestId]);

  if (loading) {
    return compact ? null : (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
        <Loader2 className="h-3 w-3 animate-spin" /> Loading check-in…
      </div>
    );
  }

  if (!checkIn) return null;

  const hasContent =
    checkIn.mood_score !== null ||
    (checkIn.mood_tags && checkIn.mood_tags.length > 0) ||
    checkIn.desired_outcome ||
    checkIn.notes_for_practitioner;

  if (!hasContent) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-primary/80">
        <Heart className="h-3 w-3" />
        <span>Check-in shared</span>
        {checkIn.mood_score && <span className="ml-0.5">{MOOD_EMOJI[checkIn.mood_score]}</span>}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Heart className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
          Pre-session check-in
        </span>
      </div>

      {checkIn.mood_score !== null && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Mood:</span>
          <span className="text-base leading-none">{MOOD_EMOJI[checkIn.mood_score]}</span>
          <span className="text-foreground font-medium">{MOOD_LABEL[checkIn.mood_score]}</span>
        </div>
      )}

      {checkIn.mood_tags && checkIn.mood_tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Feeling:</span>
          {checkIn.mood_tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {checkIn.desired_outcome && (
        <div className="text-xs">
          <p className="text-muted-foreground">Hoping for:</p>
          <p className="text-foreground/90 italic mt-0.5">"{checkIn.desired_outcome}"</p>
        </div>
      )}

      {checkIn.notes_for_practitioner && (
        <div className="text-xs">
          <p className="text-muted-foreground">For you to know:</p>
          <p className="text-foreground/90 italic mt-0.5">"{checkIn.notes_for_practitioner}"</p>
        </div>
      )}
    </div>
  );
};

export default CheckInSummary;
