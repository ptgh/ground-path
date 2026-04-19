import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ChargeClientButtonProps {
  bookingRequestId?: string;
  clientUserId: string;
  clientName?: string;
  amountCents: number;
  currency?: string;
  onCharged?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'default';
}

const ChargeClientButton = ({
  bookingRequestId,
  clientUserId,
  clientName,
  amountCents,
  currency = 'aud',
  onCharged,
  disabled,
  size = 'sm',
}: ChargeClientButtonProps) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const formatted = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);

  const handleConfirm = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('charge-client-session', {
      body: { bookingRequestId, clientUserId, amountCents },
    });
    setBusy(false);

    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? 'Charge failed');
      return;
    }
    toast.success(`Charged ${formatted} — invoice emailed to client`);
    setOpen(false);
    onCharged?.();
  };

  return (
    <>
      <Button size={size} onClick={() => setOpen(true)} disabled={disabled || amountCents < 50}>
        <CreditCard className="h-4 w-4 mr-1.5" />
        Charge {formatted}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Charge client?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                You're about to charge <strong>{clientName ?? 'this client'}</strong> the amount of{' '}
                <strong>{formatted}</strong> using their default card on file.
              </span>
              <span className="block text-destructive font-medium">
                This is a live charge. The amount will be debited immediately and the client will receive a receipt by email.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm charge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChargeClientButton;
