import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ExternalLink, Banknote, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConnectAccount {
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements_currently_due: string[] | null;
}

export default function PractitionerPayoutsCard() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<ConnectAccount | null>(null);
  const [working, setWorking] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-connect-account-status');
      if (error) throw error;
      setAccount(data?.account ?? null);
    } catch (err) {
      console.error('Failed to load Connect status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const startOnboarding = async () => {
    setWorking(true);
    try {
      const baseUrl = window.location.origin;
      const returnUrl = `${baseUrl}/practitioner/dashboard?tab=billing&connect=return`;
      const refreshUrl = `${baseUrl}/practitioner/dashboard?tab=billing&connect=refresh`;

      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: { returnUrl, refreshUrl },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No onboarding URL returned');
      }
    } catch (err) {
      console.error('Connect onboarding failed:', err);
      toast.error(err instanceof Error ? err.message : 'Could not start Stripe onboarding. Please try again.');
      setWorking(false);
    }
  };

  const openStripeDashboard = async () => {
    setWorking(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-login-link', {
        body: {},
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank', 'noopener');
    } catch (err) {
      console.error('Stripe login link failed:', err);
      toast.error('Could not open Stripe dashboard.');
    } finally {
      setWorking(false);
    }
  };

  const ready = !!account?.charges_enabled && !!account?.payouts_enabled;
  const inProgress = !!account && !ready;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Banknote className="h-5 w-5 text-primary" />
              Payouts (Stripe Connect)
            </CardTitle>
            <CardDescription>
              Connect your bank account to receive client session payments directly.
            </CardDescription>
          </div>
          {ready && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Active
            </Badge>
          )}
          {inProgress && (
            <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400">
              <AlertCircle className="mr-1 h-3 w-3" />
              Onboarding incomplete
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading payout status…
          </div>
        ) : !account ? (
          <>
            <div className="rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-foreground">
              <p className="font-medium">How payouts work</p>
              <ul className="mt-2 space-y-1.5 text-muted-foreground">
                <li>• Clients pay your set session rate via card on file.</li>
                <li>• groundpath fee: <strong className="text-foreground">5% + A$1.00</strong> per session.</li>
                <li>• Stripe processing (~1.7% + A$0.30) is deducted from your payout.</li>
                <li>• Payouts land weekly to your bank, every Friday.</li>
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                Until onboarding is complete, charges are held in groundpath and transferred to you once you finish.
              </p>
            </div>
            <Button onClick={startOnboarding} disabled={working} className="w-full">
              {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Connect bank account with Stripe
            </Button>
          </>
        ) : ready ? (
          <>
            <div className="rounded-lg border border-border/60 bg-muted/40 p-4 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Card payments</span>
                <span className="font-medium text-foreground">Enabled</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Bank payouts</span>
                <span className="font-medium text-foreground">Enabled (weekly · Friday)</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Platform fee</span>
                <span className="font-medium text-foreground">5% + A$1.00 per session</span>
              </div>
            </div>
            <Button variant="outline" onClick={openStripeDashboard} disabled={working} className="w-full">
              {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
              Open Stripe dashboard
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-lg border border-amber-500/30 bg-amber-50 p-4 text-sm text-foreground dark:bg-amber-950/30">
              <p className="font-medium">Finish onboarding to receive payouts</p>
              {account.requirements_currently_due && account.requirements_currently_due.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Stripe still needs: {account.requirements_currently_due.slice(0, 3).join(', ')}
                  {account.requirements_currently_due.length > 3 ? '…' : ''}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Until then, client charges are held in groundpath and released to you on completion.
              </p>
            </div>
            <Button onClick={startOnboarding} disabled={working} className="w-full">
              {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continue Stripe onboarding
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
