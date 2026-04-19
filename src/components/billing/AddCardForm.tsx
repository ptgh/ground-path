import { useEffect, useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useStripeLoader } from '@/lib/stripeLoader';

interface AddCardFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
  submitLabel?: string;
}

const CARD_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: 'hsl(var(--foreground))',
      '::placeholder': { color: 'hsl(var(--muted-foreground))' },
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    invalid: { color: 'hsl(var(--destructive))' },
  },
};

const CardCaptureInner = ({ onSuccess, onCancel, submitLabel = 'Save card' }: AddCardFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.functions.invoke('create-setup-intent');
      if (error || !data?.clientSecret) {
        toast.error('Could not initialise card capture');
        return;
      }
      setClientSecret(data.clientSecret);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setSubmitting(true);
    const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card },
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message ?? 'Could not save card');
      return;
    }
    if (setupIntent?.status === 'succeeded') {
      toast.success('Card saved');
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-md border border-input bg-background px-3 py-3">
        <CardElement options={CARD_OPTIONS} />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>Stored securely by Stripe. Groundpath never sees your card details.</span>
      </div>
      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!stripe || !clientSecret || submitting} className="flex-1">
          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

const AddCardForm = (props: AddCardFormProps) => {
  const stripePromise = useStripeLoader();
  if (!stripePromise) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <Elements stripe={stripePromise}>
      <CardCaptureInner {...props} />
    </Elements>
  );
};

export default AddCardForm;
