import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MarkCompleteAndChargeButtonProps {
  bookingRequestId: string;
  clientUserId: string;
  clientName?: string;
  amountCents: number | null;
  currency?: string;
  hasCardOnFile: boolean;
  onComplete: () => void;
}

const MarkCompleteAndChargeButton = ({
  bookingRequestId,
  clientUserId,
  clientName,
  amountCents,
  currency = 'aud',
  hasCardOnFile,
  onComplete,
}: MarkCompleteAndChargeButtonProps) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const canCharge = !!amountCents && amountCents >= 50 && hasCardOnFile;
  const formatted = amountCents
    ? new Intl.NumberFormat('en-AU', { style: 'currency', currency: currency.toUpperCase() }).format(amountCents / 100)
    : '';

  const markCompleteOnly = async () => {
    setBusy(true);
    const { error } = await supabase.from('booking_requests').update({ status: 'completed' }).eq('id', bookingRequestId);
    setBusy(false);
    if (error) {
      toast.error('Could not mark complete');
      return;
    }
    toast.success('Session marked complete');
    setOpen(false);
    onComplete();
  };

  const completeAndCharge = async () => {
    setBusy(true);
    // Mark complete first
    const { error: updErr } = await supabase.from('booking_requests').update({ status: 'completed' }).eq('id', bookingRequestId);
    if (updErr) {
      setBusy(false);
      toast.error('Could not mark complete');
      return;
    }
    // Then charge
    const { data, error } = await supabase.functions.invoke('charge-client-session', {
      body: { bookingRequestId, clientUserId, amountCents },
    });
    setBusy(false);
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? 'Charge failed — session marked complete, please retry charge manually');
      setOpen(false);
      onComplete();
      return;
    }
    toast.success(`Session complete · ${formatted} charged · receipt emailed`);
    setOpen(false);
    onComplete();
  };

  const handleClick = () => {
    if (!canCharge) {
      // No card or no rate — just complete silently with a toast hint
      markCompleteOnly();
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleClick} disabled={busy}>
        {busy ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
        Mark complete
      </Button>

      <AlertDialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark session complete</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Charge <strong>{clientName ?? 'this client'}</strong> <strong>{formatted}</strong> using their default card on file?
              </span>
              <span className="block text-destructive font-medium text-xs">
                This is a live charge. The amount will be debited immediately and the client will receive a receipt by email.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <Button variant="ghost" onClick={markCompleteOnly} disabled={busy}>
              Skip — complete only
            </Button>
            <AlertDialogAction onClick={completeAndCharge} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
              Complete & charge {formatted}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MarkCompleteAndChargeButton;
