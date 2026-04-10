import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Clock,
  Users,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Video,
  CheckCircle2,
  Loader2,
  Trash2,
} from 'lucide-react';
import CalendarTilePopover from '@/components/booking/CalendarTilePopover';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/* ─── Types ─── */
interface AvailabilitySlot {
  id: string;
  day: number;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
}

interface BookingRequest {
  id: string;
  client_user_id: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  duration_minutes: number;
  status: string;
  session_type: string;
  notes: string | null;
  created_at: string;
  client_name?: string;
}

interface AvailabilitySettings {
  workingDays: boolean[];
  startHour: number;
  endHour: number;
  sessionDuration: number;
  bufferMinutes: number;
}

type BookingView = 'calendar' | 'sessions' | 'settings';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);

const DEFAULT_SETTINGS: AvailabilitySettings = {
  workingDays: [true, true, true, true, true, false, false],
  startHour: 9,
  endHour: 17,
  sessionDuration: 50,
  bufferMinutes: 10,
};

const statusStyle = (s: string) => {
  switch (s) {
    case 'confirmed': return 'bg-sage-100 text-sage-800';
    case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'completed': return 'bg-muted text-muted-foreground';
    case 'cancelled': return 'bg-destructive/10 text-destructive';
    default: return '';
  }
};

const parseTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return { h, m };
};

/* ═══════════════════════════════════════════ */
const NativeBooking = () => {
  const { user } = useAuth();
  const [view, setView] = useState<BookingView>('calendar');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AvailabilitySettings>(DEFAULT_SETTINGS);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotDay, setNewSlotDay] = useState('0');
  const [newSlotStart, setNewSlotStart] = useState('9');
  const [newSlotEnd, setNewSlotEnd] = useState('12');

  // Fetch availability, bookings, and settings from profile
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [avRes, bkRes, profileRes] = await Promise.all([
        supabase
          .from('practitioner_availability')
          .select('*')
          .eq('practitioner_id', user.id),
        supabase
          .from('booking_requests')
          .select('*')
          .eq('practitioner_id', user.id)
          .order('requested_date', { ascending: true }),
        supabase
          .from('profiles')
          .select('halaxy_integration')
          .eq('user_id', user.id)
          .single(),
      ]);

      if (avRes.data) {
        setAvailability(avRes.data.map(row => ({
          id: row.id,
          day: row.day_of_week,
          startHour: parseTime(row.start_time).h,
          startMin: parseTime(row.start_time).m,
          endHour: parseTime(row.end_time).h,
          endMin: parseTime(row.end_time).m,
        })));
      }

      if (bkRes.data) {
        setBookings(bkRes.data);
      }

      // Load persisted settings from profile
      if (profileRes.data?.halaxy_integration) {
        const integration = profileRes.data.halaxy_integration as Record<string, unknown>;
        const saved = integration.availability_settings as Record<string, unknown> | undefined;
        if (saved) {
          setSettings({
            workingDays: (saved.workingDays as boolean[]) ?? DEFAULT_SETTINGS.workingDays,
            startHour: (saved.startHour as number) ?? DEFAULT_SETTINGS.startHour,
            endHour: (saved.endHour as number) ?? DEFAULT_SETTINGS.endHour,
            sessionDuration: (saved.sessionDuration as number) ?? DEFAULT_SETTINGS.sessionDuration,
            bufferMinutes: (saved.bufferMinutes as number) ?? DEFAULT_SETTINGS.bufferMinutes,
          });
        }
      }

      setLoading(false);
    };
    load();
  }, [user]);

  const prevWeek = () => setWeekStart(prev => addDays(prev, -7));
  const nextWeek = () => setWeekStart(prev => addDays(prev, 7));
  const today = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const isSlotAvailable = (day: number, hour: number) =>
    availability.some(s => s.day === day && hour >= s.startHour && hour < s.endHour);

  const isSlotBooked = (day: number, hour: number) => {
    const date = addDays(weekStart, day);
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.some(b =>
      b.requested_date === dateStr &&
      parseTime(b.requested_start_time).h === hour &&
      b.status !== 'cancelled'
    );
  };

  const handleAddSlot = async () => {
    if (!user) return;
    const startH = Number(newSlotStart);
    const endH = Number(newSlotEnd);
    if (endH <= startH) {
      toast.error('End time must be after start time');
      return;
    }

    const { data, error } = await supabase
      .from('practitioner_availability')
      .insert({
        practitioner_id: user.id,
        day_of_week: Number(newSlotDay),
        start_time: `${String(startH).padStart(2, '0')}:00`,
        end_time: `${String(endH).padStart(2, '0')}:00`,
        is_recurring: true,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add availability');
      return;
    }
    if (data) {
      setAvailability(prev => [...prev, {
        id: data.id,
        day: data.day_of_week,
        startHour: parseTime(data.start_time).h,
        startMin: parseTime(data.start_time).m,
        endHour: parseTime(data.end_time).h,
        endMin: parseTime(data.end_time).m,
      }]);
      toast.success('Availability slot added');
      setShowAddSlot(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    const { error } = await supabase
      .from('practitioner_availability')
      .delete()
      .eq('id', id);
    if (!error) {
      setAvailability(prev => prev.filter(s => s.id !== id));
      toast.success('Availability removed');
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('booking_requests')
      .update({ status })
      .eq('id', id);
    if (!error) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      toast.success(`Booking ${status}`);
    }
  };

  const [savingSettings, setSavingSettings] = useState(false);

  const handleSaveSettings = async () => {
    if (!user) return;
    setSavingSettings(true);

    try {
      // 1. Persist settings to profile JSONB
      const { data: profileData } = await supabase
        .from('profiles')
        .select('halaxy_integration')
        .eq('user_id', user.id)
        .single();

      const existing = (profileData?.halaxy_integration as Record<string, unknown>) ?? {};
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          halaxy_integration: {
            ...existing,
            availability_settings: {
              workingDays: settings.workingDays,
              startHour: settings.startHour,
              endHour: settings.endHour,
              sessionDuration: settings.sessionDuration,
              bufferMinutes: settings.bufferMinutes,
            },
          } as unknown as Record<string, never>,
        })
        .eq('user_id', user.id);

      if (profileErr) throw profileErr;

      // 2. Sync availability table: delete old, create from working days
      await supabase
        .from('practitioner_availability')
        .delete()
        .eq('practitioner_id', user.id);

      const slotsToInsert = settings.workingDays
        .map((active, dayIdx) => active ? {
          practitioner_id: user.id,
          day_of_week: dayIdx,
          start_time: `${String(settings.startHour).padStart(2, '0')}:00`,
          end_time: `${String(settings.endHour).padStart(2, '0')}:00`,
          is_recurring: true,
        } : null)
        .filter(Boolean);

      if (slotsToInsert.length > 0) {
        const { data: newSlots, error: slotErr } = await supabase
          .from('practitioner_availability')
          .insert(slotsToInsert)
          .select();
        if (slotErr) throw slotErr;

        if (newSlots) {
          setAvailability(newSlots.map(row => ({
            id: row.id,
            day: row.day_of_week,
            startHour: parseTime(row.start_time).h,
            startMin: parseTime(row.start_time).m,
            endHour: parseTime(row.end_time).h,
            endMin: parseTime(row.end_time).m,
          })));
        }
      } else {
        setAvailability([]);
      }

      toast.success('Settings saved and availability synced');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const viewButtons: { key: BookingView; label: string; icon: React.ElementType }[] = [
    { key: 'calendar', label: 'Calendar', icon: Calendar },
    { key: 'sessions', label: 'Sessions', icon: Users },
    { key: 'settings', label: 'Availability', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Beta banner */}
      <Alert className="border-amber-200 bg-amber-50/60">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 text-sm">
          <span className="font-semibold">Early Beta</span> — Groundpath's native booking system. Availability and booking requests are now saved to the database.
        </AlertDescription>
      </Alert>

      {/* View switcher */}
      <div className="flex items-center gap-2">
        {viewButtons.map(v => (
          <Button
            key={v.key}
            variant={view === v.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView(v.key)}
            className={view === v.key ? 'bg-sage-600 hover:bg-sage-700 text-white' : 'hover:border-sage-300'}
          >
            <v.icon className="h-3.5 w-3.5 mr-1.5" />
            {v.label}
          </Button>
        ))}
        <Badge variant="outline" className="ml-auto text-[10px] border-amber-300 text-amber-700 bg-amber-50">
          Groundpath Native Beta
        </Badge>
      </div>

      {/* ═══ Calendar View ═══ */}
      {view === 'calendar' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-sage-600" />
                Weekly Calendar
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={today} className="text-xs">Today</Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-muted-foreground ml-2 hidden sm:inline">
                  {format(weekStart, 'd MMM')} — {format(addDays(weekStart, 6), 'd MMM yyyy')}
                </span>
              </div>
            </div>
            <CardDescription className="sm:hidden text-xs mt-1">
              {format(weekStart, 'd MMM')} — {format(addDays(weekStart, 6), 'd MMM yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-sage-200" /> Available</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-sage-500" /> Booked</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-muted" /> Unavailable</span>
            </div>

            <div className="overflow-x-auto -mx-2 px-2">
              <div className="min-w-[560px]">
                <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px mb-1">
                  <div />
                  {DAYS.map((day, i) => {
                    const date = addDays(weekStart, i);
                    const isToday = isSameDay(date, new Date());
                    return (
                      <div key={day} className={`text-center py-1.5 text-xs font-medium rounded-md ${isToday ? 'bg-sage-100 text-sage-800' : 'text-muted-foreground'}`}>
                        {day}
                        <div className={`text-[10px] ${isToday ? 'font-semibold' : 'font-normal'}`}>{format(date, 'd')}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px">
                  {HOURS.map(hour => (
                    <>
                      <div key={`label-${hour}`} className="text-[10px] text-muted-foreground py-1 pr-2 text-right tabular-nums">
                        {hour > 12 ? `${hour - 12}pm` : hour === 12 ? '12pm' : `${hour}am`}
                      </div>
                      {DAYS.map((_, dayIdx) => {
                        const booked = isSlotBooked(dayIdx, hour);
                        const available = isSlotAvailable(dayIdx, hour);
                        return (
                          <div
                            key={`${dayIdx}-${hour}`}
                            className={`h-7 rounded-sm border transition-colors ${
                              booked
                                ? 'bg-sage-500 border-sage-600'
                                : available
                                  ? 'bg-sage-100 border-sage-200 hover:bg-sage-200 cursor-pointer'
                                  : 'bg-muted/40 border-border/40'
                            }`}
                          />
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Existing slots list */}
            {availability.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="text-xs font-medium text-muted-foreground">Your Availability Slots</h4>
                {availability.map(slot => (
                  <div key={slot.id} className="flex items-center justify-between p-2 rounded-lg border border-border text-sm">
                    <span>{DAYS[slot.day]} {slot.startHour > 12 ? `${slot.startHour-12}pm` : `${slot.startHour}am`} – {slot.endHour > 12 ? `${slot.endHour-12}pm` : `${slot.endHour}am`}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteSlot(slot.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {showAddSlot ? (
              <div className="flex flex-wrap items-end gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Day</label>
                  <Select value={newSlotDay} onValueChange={setNewSlotDay}>
                    <SelectTrigger className="w-28 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Start</label>
                  <Select value={newSlotStart} onValueChange={setNewSlotStart}>
                    <SelectTrigger className="w-24 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HOURS.map(h => <SelectItem key={h} value={String(h)}>{h > 12 ? `${h-12}pm` : h === 12 ? '12pm' : `${h}am`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">End</label>
                  <Select value={newSlotEnd} onValueChange={setNewSlotEnd}>
                    <SelectTrigger className="w-24 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HOURS.map(h => <SelectItem key={h} value={String(h)}>{h > 12 ? `${h-12}pm` : h === 12 ? '12pm' : `${h}am`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-sage-600 hover:bg-sage-700 text-white" onClick={handleAddSlot}>Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddSlot(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowAddSlot(true)} className="hover:border-sage-300">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Availability
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ Sessions View ═══ */}
      {view === 'sessions' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-sage-600" />
                Booking Requests
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.map(booking => (
                  <div key={booking.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-sage-300 transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-100">
                      <Video className="h-4 w-4 text-sage-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {format(new Date(booking.requested_date), 'EEE d MMM yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.requested_start_time.slice(0, 5)} – {booking.requested_end_time.slice(0, 5)} · {booking.duration_minutes} min
                      </p>
                      {booking.notes && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{booking.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${statusStyle(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                      {booking.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs text-sage-700 border-sage-300" onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}>
                            Confirm
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}>
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No booking requests yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Set your availability — clients will see open slots on the booking page.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ Availability Settings View ═══ */}
      {view === 'settings' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4 text-sage-600" />
              Availability Settings
            </CardTitle>
            <CardDescription className="text-xs">
              Configure your default working hours and session preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Working Days</h4>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day, i) => (
                  <div key={day} className="flex flex-col items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">{day}</span>
                    <Switch
                      checked={settings.workingDays[i]}
                      onCheckedChange={(checked) => {
                        const updated = [...settings.workingDays];
                        updated[i] = checked;
                        setSettings(prev => ({ ...prev, workingDays: updated }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Start Time</label>
                <Select value={String(settings.startHour)} onValueChange={v => setSettings(prev => ({ ...prev, startHour: Number(v) }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 6).map(h => (
                      <SelectItem key={h} value={String(h)}>
                        {h > 12 ? `${h-12}:00 PM` : h === 12 ? '12:00 PM' : `${h}:00 AM`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">End Time</label>
                <Select value={String(settings.endHour)} onValueChange={v => setSettings(prev => ({ ...prev, endHour: Number(v) }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 12).map(h => (
                      <SelectItem key={h} value={String(h)}>
                        {h > 12 ? `${h-12}:00 PM` : '12:00 PM'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Session Duration</label>
                <Select value={String(settings.sessionDuration)} onValueChange={v => setSettings(prev => ({ ...prev, sessionDuration: Number(v) }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="50">50 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Buffer Between Sessions</label>
                <Select value={String(settings.bufferMinutes)} onValueChange={v => setSettings(prev => ({ ...prev, bufferMinutes: Number(v) }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No buffer</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <Button onClick={handleSaveSettings} disabled={savingSettings} className="bg-sage-600 hover:bg-sage-700 text-white">
              {savingSettings ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
              {savingSettings ? 'Saving…' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ═══ Setup Roadmap ═══ */}
      <Card className="border-dashed border-border/70">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4 text-sage-600" />
            Next Setup Steps
          </CardTitle>
          <CardDescription className="text-xs">
            Your roadmap for getting the native booking system fully operational.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { step: 1, label: 'Enable Groundpath Native Beta', done: true },
              { step: 2, label: 'Set working days and hours', done: availability.length > 0 },
              { step: 3, label: 'Add first availability blocks', done: availability.length > 0 },
              { step: 4, label: 'Test client-facing booking flow', done: bookings.length > 0 },
              { step: 5, label: 'Connect Microsoft calendar & video (coming soon)', done: false },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-3">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  item.done ? 'bg-sage-600 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {item.done ? '✓' : item.step}
                </div>
                <span className={`text-sm ${item.done ? 'text-foreground line-through opacity-60' : 'text-foreground'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NativeBooking;
