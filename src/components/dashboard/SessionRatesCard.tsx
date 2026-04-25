// SessionRatesCard — per-duration rate matrix (30 / 45 / 50 / 60 min).
//
// The 50-min row is canonical and is mirrored into `profiles.session_rate_cents`
// so existing booking + invoicing logic keeps working untouched. Other durations
// are stored in `profiles.duration_rates` (jsonb).
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, Loader2, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const DURATIONS = [30, 45, 50, 60] as const;
type Duration = (typeof DURATIONS)[number];

// NDIS Counselling cap (Mental Health) ~ $156.16/hr (FY24/25 guideline).
// We surface a soft warning if any rate, pro-rated to one hour, exceeds this.
const NDIS_HOURLY_CAP = 156.16;

const SessionRatesCard = () => {
  const { user } = useAuth();
  const [rates, setRates] = useState<Record<Duration, string>>({ 30: '', 45: '', 50: '', 60: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('session_rate_cents, duration_rates')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        const dr = (data.duration_rates as Record<string, number> | null) ?? {};
        const next: Record<Duration, string> = { 30: '', 45: '', 50: '', 60: '' };
        for (const d of DURATIONS) {
          const cents = dr[String(d)];
          if (typeof cents === 'number' && cents > 0) {
            next[d] = (cents / 100).toFixed(2);
          }
        }
        // Backfill the 50-min slot with session_rate_cents if duration_rates lacks it.
        if (!next[50] && data.session_rate_cents) {
          next[50] = (data.session_rate_cents / 100).toFixed(2);
        }
        setRates(next);
      }
      setLoading(false);
    })();
  }, [user]);

  const updateRate = (d: Duration, value: string) => {
    setRates((prev) => ({ ...prev, [d]: value }));
  };

  const ndisExceeded = DURATIONS.some((d) => {
    const dollars = parseFloat(rates[d]);
    if (isNaN(dollars) || dollars <= 0) return false;
    const hourly = (dollars / d) * 60;
    return hourly > NDIS_HOURLY_CAP;
  });

  const handleSave = async () => {
    if (!user) return;
    const durationRates: Record<string, number> = {};
    for (const d of DURATIONS) {
      const dollars = parseFloat(rates[d]);
      if (!isNaN(dollars) && dollars >= 1) {
        durationRates[String(d)] = Math.round(dollars * 100);
      }
    }
    const fiftyMin = durationRates['50'];
    if (!fiftyMin) {
      toast.error('Please set at least the 50-minute (standard) rate.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        duration_rates: durationRates,
        session_rate_cents: fiftyMin, // mirror for backward compatibility
      })
      .eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast.error('Could not save rates');
      return;
    }
    toast.success('Session rates saved');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4 text-primary" /> Session Rates
        </CardTitle>
        <CardDescription className="text-xs">
          Set your fee per session length. The 50-minute rate is your standard and feeds into client invoices and the
          public "from $X" price on the homepage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {DURATIONS.map((d) => {
              const dollars = parseFloat(rates[d]);
              const hourly = !isNaN(dollars) && dollars > 0 ? ((dollars / d) * 60).toFixed(2) : null;
              const isStandard = d === 50;
              return (
                <div
                  key={d}
                  className={`flex items-end gap-3 rounded-lg border p-3 ${
                    isStandard ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
                  }`}
                >
                  <div className="flex-1">
                    <Label htmlFor={`rate-${d}`} className="text-xs flex items-center gap-2">
                      {d} minutes {isStandard && <span className="text-[10px] text-primary font-medium">STANDARD</span>}
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        id={`rate-${d}`}
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-7 h-9"
                        placeholder={isStandard ? '120.00' : 'Optional'}
                        value={rates[d]}
                        onChange={(e) => updateRate(d, e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground min-w-[88px]">
                    {hourly ? <>≈ ${hourly}/hr</> : <span className="opacity-50">—</span>}
                  </div>
                </div>
              );
            })}
            {ndisExceeded && (
              <Alert className="border-amber-200 bg-amber-50/60">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800">
                  One or more rates exceed the NDIS Counselling hourly cap of ${NDIS_HOURLY_CAP.toFixed(2)}. Agency-managed
                  NDIS clients won't be able to use that rate. Self-managed clients are unaffected.
                </AlertDescription>
              </Alert>
            )}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Save rates
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionRatesCard;
