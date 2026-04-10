import { format, addDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Video, Ban, CheckCircle2, User, CalendarX, CalendarCheck } from 'lucide-react';

interface BookingInfo {
  id: string;
  status: string;
  requested_start_time: string;
  requested_end_time: string;
  duration_minutes: number;
  session_type: string;
  notes: string | null;
  client_user_id: string;
}

interface CalendarTilePopoverProps {
  weekStart: Date;
  dayIdx: number;
  hour: number;
  isAvailable: boolean;
  booking: BookingInfo | null;
  onToggleAvailability: (dayIdx: number, hour: number, currentlyAvailable: boolean) => void;
  onConfirmBooking?: (bookingId: string) => void;
  onDeclineBooking?: (bookingId: string) => void;
  children: React.ReactNode;
}

const formatHour = (h: number) =>
  h > 12 ? `${h - 12}:00 PM` : h === 12 ? '12:00 PM' : `${h}:00 AM`;

const statusLabel: Record<string, { text: string; className: string }> = {
  pending: { text: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { text: 'Confirmed', className: 'bg-sage-100 text-sage-800' },
  completed: { text: 'Completed', className: 'bg-muted text-muted-foreground' },
  cancelled: { text: 'Cancelled', className: 'bg-destructive/10 text-destructive' },
};

const CalendarTilePopover = ({
  weekStart,
  dayIdx,
  hour,
  isAvailable,
  booking,
  onToggleAvailability,
  onConfirmBooking,
  onDeclineBooking,
  children,
}: CalendarTilePopoverProps) => {
  const date = addDays(weekStart, dayIdx);
  const dayLabel = format(date, 'EEEE, d MMM');

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64 p-0" side="right" align="start" sideOffset={4}>
        {/* Header */}
        <div className="px-3 pt-3 pb-2">
          <p className="text-xs font-medium text-muted-foreground">{dayLabel}</p>
          <p className="text-sm font-semibold">{formatHour(hour)} – {formatHour(hour + 1)}</p>
        </div>

        <Separator />

        <div className="p-3 space-y-3">
          {/* Status indicator */}
          {booking ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Video className="h-3.5 w-3.5 text-sage-600" />
                <span className="text-xs font-medium">Session Booked</span>
                <Badge variant="outline" className={`text-[10px] ml-auto ${statusLabel[booking.status]?.className ?? ''}`}>
                  {statusLabel[booking.status]?.text ?? booking.status}
                </Badge>
              </div>

              <div className="rounded-lg bg-muted/40 p-2 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {booking.requested_start_time.slice(0, 5)} – {booking.requested_end_time.slice(0, 5)} · {booking.duration_minutes} min
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  Client session
                </div>
                {booking.notes && (
                  <p className="text-[11px] text-muted-foreground/70 pt-0.5">{booking.notes}</p>
                )}
              </div>

              {booking.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs text-sage-700 border-sage-300"
                    onClick={() => onConfirmBooking?.(booking.id)}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 h-7 text-xs text-destructive"
                    onClick={() => onDeclineBooking?.(booking.id)}
                  >
                    <Ban className="h-3 w-3 mr-1" /> Decline
                  </Button>
                </div>
              )}
            </div>
          ) : isAvailable ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-3.5 w-3.5 text-sage-600" />
                <span className="text-xs font-medium text-sage-700">Available</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                This slot is open for client bookings. No sessions scheduled.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-xs text-destructive/80 hover:text-destructive hover:border-destructive/40"
                onClick={() => onToggleAvailability(dayIdx, hour, true)}
              >
                <Ban className="h-3 w-3 mr-1" /> Block This Hour
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarX className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Unavailable</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                This slot is blocked. Clients cannot book during this time.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-xs text-sage-700 hover:border-sage-400"
                onClick={() => onToggleAvailability(dayIdx, hour, false)}
              >
                <CalendarCheck className="h-3 w-3 mr-1" /> Make Available
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CalendarTilePopover;
