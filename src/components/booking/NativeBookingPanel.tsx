import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Video, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Client-facing native booking panel shown when session_mode === 'native_beta'.
 * Replaces the Halaxy embed in the public booking section.
 */

const SAMPLE_SLOTS = [
  { id: '1', day: 'Monday', time: '9:00 AM', duration: 50 },
  { id: '2', day: 'Monday', time: '10:00 AM', duration: 50 },
  { id: '3', day: 'Tuesday', time: '10:00 AM', duration: 50 },
  { id: '4', day: 'Wednesday', time: '9:00 AM', duration: 50 },
  { id: '5', day: 'Thursday', time: '1:00 PM', duration: 50 },
  { id: '6', day: 'Friday', time: '10:00 AM', duration: 50 },
];

const NativeBookingPanel = () => {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const handleRequest = () => {
    if (!selectedSlot) return;
    toast.success('Booking request submitted (beta — not yet saved to database)');
    setSelectedSlot(null);
  };

  return (
    <div className="space-y-4">
      <Alert className="border-amber-200 bg-amber-50/60">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 text-sm">
          <span className="font-semibold">Beta Booking</span> — Groundpath's native booking system is in early testing. Requests are not yet confirmed automatically.
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
          {/* Available slots */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SAMPLE_SLOTS.map(slot => (
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
                  <p className="text-sm font-medium text-foreground">{slot.day}</p>
                  <p className="text-xs text-muted-foreground">{slot.time} · {slot.duration} min</p>
                </div>
                {selectedSlot === slot.id && (
                  <CheckCircle2 className="h-4 w-4 text-primary ml-auto flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* CTA */}
          <Button
            onClick={handleRequest}
            disabled={!selectedSlot}
            className="w-full"
            size="lg"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Request Booking
          </Button>

          {/* Session info */}
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
