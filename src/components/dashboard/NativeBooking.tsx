import { useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

/* ─── Types ─── */
interface AvailabilitySlot {
  id: string;
  day: number; // 0=Mon .. 6=Sun
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
}

interface Session {
  id: string;
  clientName: string;
  date: Date;
  duration: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  type: 'video' | 'in-person';
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
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8am-6pm

/* ─── Sample data ─── */
const SAMPLE_AVAILABILITY: AvailabilitySlot[] = [
  { id: '1', day: 0, startHour: 9, startMin: 0, endHour: 12, endMin: 0 },
  { id: '2', day: 0, startHour: 13, startMin: 0, endHour: 17, endMin: 0 },
  { id: '3', day: 1, startHour: 10, startMin: 0, endHour: 16, endMin: 0 },
  { id: '4', day: 2, startHour: 9, startMin: 0, endHour: 13, endMin: 0 },
  { id: '5', day: 3, startHour: 9, startMin: 0, endHour: 17, endMin: 0 },
  { id: '6', day: 4, startHour: 10, startMin: 0, endHour: 14, endMin: 0 },
];

const SAMPLE_SESSIONS: Session[] = [
  { id: '1', clientName: 'Sample Client', date: new Date(), duration: 50, status: 'confirmed', type: 'video' },
];

const DEFAULT_SETTINGS: AvailabilitySettings = {
  workingDays: [true, true, true, true, true, false, false],
  startHour: 9,
  endHour: 17,
  sessionDuration: 50,
  bufferMinutes: 10,
};

/* ─── Status badge helper ─── */
const statusStyle = (s: Session['status']) => {
  switch (s) {
    case 'confirmed': return 'bg-sage-100 text-sage-800';
    case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'completed': return 'bg-muted text-muted-foreground';
    case 'cancelled': return 'bg-destructive/10 text-destructive';
  }
};

/* ═══════════════════════════════════════════ */
const NativeBooking = () => {
  const [view, setView] = useState<BookingView>('calendar');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [availability] = useState<AvailabilitySlot[]>(SAMPLE_AVAILABILITY);
  const [sessions] = useState<Session[]>(SAMPLE_SESSIONS);
  const [settings, setSettings] = useState<AvailabilitySettings>(DEFAULT_SETTINGS);
  const [showAddSlot, setShowAddSlot] = useState(false);

  /* ─── Add-slot form state ─── */
  const [newSlotDay, setNewSlotDay] = useState('0');
  const [newSlotStart, setNewSlotStart] = useState('9');
  const [newSlotEnd, setNewSlotEnd] = useState('12');

  const prevWeek = () => setWeekStart(prev => addDays(prev, -7));
  const nextWeek = () => setWeekStart(prev => addDays(prev, 7));
  const today = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const isSlotAvailable = (day: number, hour: number) =>
    availability.some(s => s.day === day && hour >= s.startHour && hour < s.endHour);

  const isSlotBooked = (day: number, hour: number) => {
    const date = addDays(weekStart, day);
    return sessions.some(s => isSameDay(s.date, date) && s.date.getHours() === hour && s.status !== 'cancelled');
  };

  const handleSaveSettings = () => {
    toast.success('Settings saved locally — database sync coming soon');
  };

  const viewButtons: { key: BookingView; label: string; icon: React.ElementType }[] = [
    { key: 'calendar', label: 'Calendar', icon: Calendar },
    { key: 'sessions', label: 'Sessions', icon: Users },
    { key: 'settings', label: 'Availability', icon: Settings },
  ];

  return (
    <div className="space-y-5">
      {/* Beta banner */}
      <Alert className="border-amber-200 bg-amber-50/60">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 text-sm">
          <span className="font-semibold">Early Beta</span> — This is the foundation of Groundpath's native booking system. Data is not yet persisted to the database.
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
                <Button variant="ghost" size="sm" onClick={today} className="text-xs">
                  Today
                </Button>
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
            {/* Legend */}
            <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-sage-200" /> Available</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-sage-500" /> Booked</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-muted" /> Unavailable</span>
            </div>

            {/* Grid */}
            <div className="overflow-x-auto -mx-2 px-2">
              <div className="min-w-[560px]">
                {/* Day headers */}
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

                {/* Time slots */}
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

            {/* Add availability */}
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
                  <Button size="sm" className="bg-sage-600 hover:bg-sage-700 text-white" onClick={() => { toast.info('Availability slot added (local only)'); setShowAddSlot(false); }}>
                    Add
                  </Button>
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
                Sessions
              </CardTitle>
              <Button size="sm" disabled className="opacity-50 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" /> New Session
                <Badge variant="outline" className="ml-1.5 text-[9px] px-1 py-0">Soon</Badge>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map(session => (
                  <div key={session.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-sage-300 transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-100">
                      {session.type === 'video' ? (
                        <Video className="h-4 w-4 text-sage-700" />
                      ) : (
                        <Users className="h-4 w-4 text-sage-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{session.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(session.date, 'EEE d MMM, h:mma')} · {session.duration} min
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${statusStyle(session.status)}`}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No sessions yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Share your booking link to get started.</p>
              </div>
            )}

            <Separator className="my-4" />

            <div className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Session management features (create, reschedule, cancel) coming in next release.
            </div>
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
            {/* Working Days */}
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

            {/* Working Hours */}
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

            {/* Session Preferences */}
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

            <Button onClick={handleSaveSettings} className="bg-sage-600 hover:bg-sage-700 text-white">
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Save Settings
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NativeBooking;
