import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, FileText, Loader2, User as UserIcon } from 'lucide-react';
import { gsap } from 'gsap';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fullName, shortName, initials, isProfileIncomplete } from '@/lib/displayName';

interface ClientPreviewPopoverProps {
  clientUserId: string;
  trigger: React.ReactNode;
  align?: 'start' | 'center' | 'end';
}

interface PreviewData {
  display_name: string | null;
  avatar_url: string | null;
  lastBooking: { date: string; time: string } | null;
  nextBooking: { date: string; time: string } | null;
  recentForms: { type: string; date: string }[];
}

export const ClientPreviewPopover = ({ clientUserId, trigger, align = 'start' }: ClientPreviewPopoverProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || data) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // Use safe RPC — only returns name/avatar if caller has a conversation
        // or booking with this user. Sensitive PII (contact info, AHPRA, etc.)
        // is never exposed via messaging context.
        const { data: rpcData } = await supabase
          .rpc('get_messaging_profile', { _user_id: clientUserId });
        const profile = Array.isArray(rpcData) ? rpcData[0] : rpcData;

        const today = new Date().toISOString().split('T')[0];
        const { data: pastB } = await supabase
          .from('booking_requests')
          .select('requested_date, requested_start_time, status')
          .eq('client_user_id', clientUserId)
          .lt('requested_date', today)
          .order('requested_date', { ascending: false })
          .limit(1);
        const { data: futureB } = await supabase
          .from('booking_requests')
          .select('requested_date, requested_start_time, status')
          .eq('client_user_id', clientUserId)
          .gte('requested_date', today)
          .order('requested_date', { ascending: true })
          .limit(1);

        // Recent form submissions linked by client record (practitioner-owned)
        const { data: { user } } = await supabase.auth.getUser();
        let forms: { type: string; date: string }[] = [];
        if (user) {
          const { data: clientRow } = await supabase
            .from('clients')
            .select('id')
            .eq('practitioner_id', user.id)
            .maybeSingle();
          if (clientRow) {
            const { data: subs } = await supabase
              .from('form_submissions')
              .select('form_type, created_at')
              .eq('practitioner_id', user.id)
              .eq('client_id', clientRow.id)
              .order('created_at', { ascending: false })
              .limit(3);
            forms = (subs || []).map((s) => ({
              type: s.form_type,
              date: s.created_at ? format(new Date(s.created_at), 'PP') : '',
            }));
          }
        }

        if (cancelled) return;
        setData({
          display_name: profile?.display_name || null,
          avatar_url: profile?.avatar_url || null,
          lastBooking: pastB?.[0]
            ? { date: format(new Date(pastB[0].requested_date), 'PP'), time: pastB[0].requested_start_time }
            : null,
          nextBooking: futureB?.[0]
            ? { date: format(new Date(futureB[0].requested_date), 'PP'), time: futureB[0].requested_start_time }
            : null,
          recentForms: forms,
        });
      } catch (err) {
        console.error('ClientPreviewPopover load error', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, clientUserId, data]);

  useEffect(() => {
    if (open && contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 8, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'power3.out' },
      );
    }
  }, [open, data]);

  const incomplete = isProfileIncomplete(data?.display_name);
  const fullDisplay = fullName({ displayName: data?.display_name, userId: clientUserId, role: 'client' });
  const shortDisplay = shortName({ displayName: data?.display_name, userId: clientUserId, role: 'client' });
  const initialsLabel = initials(data?.display_name);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={align} className="w-80 p-0 overflow-hidden" sideOffset={8}>
        <div ref={contentRef}>
          <div className="bg-gradient-to-br from-sage-50 to-background p-4 border-b border-border">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={data?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">{initialsLabel}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-sm truncate">{fullDisplay}</h4>
                  <Badge variant="outline" className="h-5 text-[10px] border-sage-300 text-sage-700">
                    Client
                  </Badge>
                </div>
                {!incomplete && data?.display_name && shortDisplay !== fullDisplay && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">Shown in chat as “{shortDisplay}”</p>
                )}
                {loading && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading details…
                  </div>
                )}
              </div>
            </div>
          </div>

          {!loading && data && (
            <div className="p-4 space-y-3 text-xs">
              {incomplete && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-800">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Profile incomplete</p>
                    <p className="text-[11px] text-amber-700/90">
                      This client hasn't filled in their name yet. They appear as <span className="font-mono">{shortDisplay}</span> in your inbox.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-border bg-muted/40 p-2">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide">
                    <Calendar className="h-3 w-3" /> Last
                  </div>
                  <p className="text-xs font-medium mt-0.5">
                    {data.lastBooking ? `${data.lastBooking.date}` : '—'}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-muted/40 p-2">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide">
                    <Calendar className="h-3 w-3" /> Next
                  </div>
                  <p className="text-xs font-medium mt-0.5">
                    {data.nextBooking ? `${data.nextBooking.date}` : '—'}
                  </p>
                </div>
              </div>

              {data.recentForms.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                    <FileText className="h-3 w-3" /> Recent forms
                  </div>
                  <ul className="space-y-1">
                    {data.recentForms.map((f, i) => (
                      <li key={i} className="flex justify-between text-xs">
                        <span className="font-medium">{f.type}</span>
                        <span className="text-muted-foreground">{f.date}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-1.5 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 text-xs"
                  onClick={() => { setOpen(false); navigate('/dashboard?tab=clients'); }}
                >
                  <UserIcon className="h-3 w-3 mr-1" /> Profile
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 text-xs"
                  onClick={() => { setOpen(false); navigate('/dashboard?tab=forms'); }}
                >
                  <FileText className="h-3 w-3 mr-1" /> Forms
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
