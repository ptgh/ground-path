
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Check, Loader2 } from 'lucide-react';
import { useMailingListSubscription } from '@/hooks/useMailingList';
import { mailingListSchema, checkRateLimit } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';

interface MailingListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MailingListModal = ({ isOpen, onClose }: MailingListModalProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const subscriptionMutation = useMailingListSubscription();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Rate limiting check
    const clientIdentifier = `mailing_${email}_${Date.now().toString().slice(0, -3)}`;
    if (!checkRateLimit(clientIdentifier, 2, 300000)) { // 2 requests per 5 minutes
      toast({
        title: "Too many requests",
        description: "Please wait a few minutes before subscribing again.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Validating subscription data:', { 
        email: email.trim(), 
        name: name.trim() || undefined 
      });
      
      const validatedData = mailingListSchema.parse({
        email: email.trim(),
        name: name.trim() || undefined,
        source: 'hero_section',
        status: 'pending'
      });

      console.log('Validation successful:', validatedData);

      await subscriptionMutation.mutateAsync({
        email: validatedData.email,
        name: validatedData.name,
        status: validatedData.status,
        source: validatedData.source
      });

      setIsSuccess(true);

      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setEmail('');
        setName('');
        setErrors({});
      }, 2000);
      
    } catch (error: any) {
      console.error('Subscription validation error:', error);
      
      if (error.errors) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          console.error('Field validation error:', err);
          const field = err.path[0];
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      
      toast({
        title: "Subscription failed",
        description: error.message || "Please check your input and try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-sage-600" />
            Join Our Mailing List
          </DialogTitle>
          <DialogDescription>
            Stay updated with our latest services, insights, and mental health resources.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">You're all set!</h3>
            <p className="text-gray-600">Check your email to confirm your subscription.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className={`focus:ring-sage-500 focus:border-sage-500 ${
                  errors.email ? 'border-red-500' : ''
                }`}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                First Name (Optional)
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your first name"
                className={`focus:ring-sage-500 focus:border-sage-500 ${
                  errors.name ? 'border-red-500' : ''
                }`}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">
                We respect your privacy. Unsubscribe at any time. 
                We'll only send you relevant updates about our services and mental health resources.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={subscriptionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-sage-600 hover:bg-sage-700"
                disabled={subscriptionMutation.isPending || !email}
              >
                {subscriptionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Subscribing...
                  </>
                ) : (
                  'Subscribe'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MailingListModal;
