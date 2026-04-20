// Practitioner subscription card — gates appearing in /book directory.
// A$25/month, 14-day free trial, AUD. Uses Stripe Checkout via edge function.
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Loader2, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Subscription {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  stripe_price_id: string;
}

const PractitionerSubscriptionCard = () => {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-practitioner-subscription', {
        method: 'POST',
      });
      if (error) throw error;
      setSub(data?.subscription ?? null);
    } catch (e) {
      console.error('Failed to load subscription:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh on Stripe Checkout return
    const params = new URLSearchParams(window.location.search);
    if (params.get('sub') === 'success') {
      // Stripe webhook may take a few seconds — poll briefly
      const t = setTimeout(load, 2500);
      return () => clearTimeout(t);
    }
  }, [load]);

  const handleSubscribe = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-practitioner-subscription', {
        method: 'POST',
        body: {
          successUrl: `${window.location.origin}/practitioner/dashboard?sub=success`,
          cancelUrl: `${window.location.origin}/practitioner/dashboard?sub=cancelled`,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to start checkout';
      toast.error(msg);
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel directory listing at end of current period? You can resubscribe any time.')) return;
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke('cancel-practitioner-subscription', {
        method: 'POST',
      });
      if (error) throw error;
      toast.success('Subscription will end at the close of your current period.');
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to cancel subscription';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" />
            Directory Listing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking status…
          </div>
        </CardContent>
      </Card>
    );
  }

  const isActive = sub && ['active', 'trialing'].includes(sub.status) &&
    (!sub.current_period_end || new Date(sub.current_period_end) > new Date());
  const isPastDue = sub?.status === 'past_due';
  const isTrialing = sub?.status === 'trialing';
  const renewLabel = sub?.current_period_end
    ? format(new Date(sub.current_period_end), 'd MMM yyyy')
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4 text-primary" />
          Directory Listing
        </CardTitle>
        <CardDescription>
          A$25/month — appears in the public booking directory and accepts new client bookings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status panel */}
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {isActive ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-foreground">
                  {isTrialing ? 'Free trial active' : 'Subscription active'}
                </span>
                <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50">
                  {sub?.status}
                </Badge>
              </>
            ) : isPastDue ? (
              <>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-foreground">Payment past due</span>
                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                  past_due
                </Badge>
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Not subscribed</span>
                <Badge variant="outline" className="text-xs">Inactive</Badge>
              </>
            )}
          </div>
          {isActive && renewLabel && (
            <p className="text-xs text-muted-foreground pl-6">
              {sub?.cancel_at_period_end ? `Ends on ${renewLabel}` : `Renews on ${renewLabel}`}
            </p>
          )}
        </div>

        {/* What it unlocks */}
        {!isActive && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription className="text-xs space-y-1">
              <p className="font-medium text-foreground">Subscription unlocks:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                <li>Listing on the public /book directory</li>
                <li>Accepting new client booking requests</li>
              </ul>
              <p className="font-medium text-foreground pt-1">Always free:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                <li>Forms, notes, AI assistant, CPD log</li>
                <li>Messaging existing clients</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isActive ? (
            <Button
              size="sm"
              onClick={handleSubscribe}
              disabled={busy}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
              Activate listing — 14-day free trial
            </Button>
          ) : !sub?.cancel_at_period_end ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={busy}
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              {busy && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              Cancel listing
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubscribe} disabled={busy} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {busy && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              Reactivate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PractitionerSubscriptionCard;
