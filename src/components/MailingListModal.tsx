
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MailingListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MailingListModal = ({ isOpen, onClose }: MailingListModalProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual Supabase integration
      console.log('Subscribing:', { email, name, source: 'hero_section' });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSuccess(true);
      toast({
        title: "Welcome aboard! 🎉",
        description: "Thanks for joining our mailing list. Check your email to confirm your subscription.",
      });

      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setEmail('');
        setName('');
      }, 2000);
      
    } catch (error) {
      toast({
        title: "Oops! Something went wrong",
        description: "Please try again later or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
                className="focus:ring-sage-500 focus:border-sage-500"
              />
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
                className="focus:ring-sage-500 focus:border-sage-500"
              />
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
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-sage-600 hover:bg-sage-700"
                disabled={isLoading || !email}
              >
                {isLoading ? (
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
