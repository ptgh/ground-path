import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const SessionRateCard = () => {
  const { user } = useAuth();
  const [rate, setRate] = useState<string>('');
  const [currency] = useState<string>('AUD');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('session_rate_cents')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.session_rate_cents) {
        setRate((data.session_rate_cents / 100).toFixed(2));
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const dollars = parseFloat(rate);
    if (isNaN(dollars) || dollars < 1) {
      toast.error('Enter a valid rate (minimum $1)');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ session_rate_cents: Math.round(dollars * 100) })
      .eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast.error('Could not save rate');
      return;
    }
    toast.success('Session rate saved');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4 text-primary" />
          Session Rate
        </CardTitle>
        <CardDescription className="text-xs">
          The default amount charged when you bill a client for a completed session.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="session-rate" className="text-xs">Rate per session ({currency})</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="session-rate"
                  type="number"
                  step="0.01"
                  min="1"
                  className="pl-7"
                  placeholder="180.00"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Save
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionRateCard;
