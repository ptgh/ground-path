import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Trash2, Star, Loader2, Receipt, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import AddCardForm from '@/components/billing/AddCardForm';
import { useSavedCards } from '@/hooks/useSavedCards';
import { useEffect } from 'react';

interface Charge {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  charged_at: string | null;
  created_at: string;
  hosted_invoice_url: string | null;
  stripe_receipt_url: string | null;
  description: string | null;
}

const formatAmount = (cents: number, currency: string) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);

const BillingPage = () => {
  const { cards, loading: loadingCards, refresh: refreshCards } = useSavedCards();
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loadingCharges, setLoadingCharges] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.functions.invoke('get-billing-history');
      if (data?.charges) setCharges(data.charges);
      setLoadingCharges(false);
    })();
  }, []);

  const handleSetDefault = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.functions.invoke('set-default-payment-method', { body: { paymentMethodId: id } });
    setBusy(null);
    if (error) {
      toast.error('Could not set default card');
      return;
    }
    toast.success('Default card updated');
    refreshCards();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this card? You can add it again later.')) return;
    setBusy(id);
    const { error } = await supabase.functions.invoke('delete-payment-method', { body: { paymentMethodId: id } });
    setBusy(null);
    if (error) {
      toast.error('Could not remove card');
      return;
    }
    toast.success('Card removed');
    refreshCards();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Billing & Payments" noindex />
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light text-foreground">Billing</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage your saved cards and view payment history.</p>
          </div>

          {/* Saved cards */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Saved Cards
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add card
              </Button>
            </CardHeader>
            <CardContent>
              {loadingCards ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : cards.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No cards saved yet. Add one to enable session payments.
                </div>
              ) : (
                <div className="space-y-2">
                  {cards.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">{c.brand} •••• {c.last4}</p>
                          <p className="text-xs text-muted-foreground">
                            Expires {String(c.exp_month).padStart(2, '0')}/{c.exp_year}
                            {c.is_default && <Badge variant="secondary" className="ml-2 text-[10px]">Default</Badge>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!c.is_default && (
                          <Button size="sm" variant="ghost" onClick={() => handleSetDefault(c.id)} disabled={busy === c.id} title="Set as default">
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)} disabled={busy === c.id} title="Remove">
                          {busy === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive/70" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing history */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5 text-primary" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCharges ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : charges.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No payments yet.</div>
              ) : (
                <div className="space-y-2">
                  {charges.map(charge => (
                    <div key={charge.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          {charge.status === 'succeeded' ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          ) : charge.status === 'failed' ? (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <Loader2 className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{formatAmount(charge.amount_cents, charge.currency)}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {charge.description ?? 'Counselling session'} ·{' '}
                            {format(new Date(charge.charged_at ?? charge.created_at), 'd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                      {charge.hosted_invoice_url && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={charge.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a card</DialogTitle>
            <DialogDescription>Your card is saved securely and only charged after a session.</DialogDescription>
          </DialogHeader>
          <AddCardForm
            onSuccess={() => { setAddOpen(false); refreshCards(); }}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingPage;
