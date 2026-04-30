import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';
import { mailingListService } from '@/services/mailingListService';
import SEO from '@/components/SEO';

const ConfirmPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_confirmed'>('loading');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    (async () => {
      try {
        await mailingListService.confirmSubscription(token);
        setStatus('success');
      } catch (error) {
        const msg = (error as Error).message ?? '';
        if (msg.includes('already confirmed') || msg.includes('not found')) {
          setStatus('already_confirmed');
        } else {
          setStatus('error');
        }
      }
    })();
  }, [token]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Confirming your subscription…</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Subscription Confirmed</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for confirming your subscription to groundpath's professional mailing list.
            </p>
            <p className="text-sm text-muted-foreground mb-4">You'll start receiving:</p>
            <ul className="text-sm text-muted-foreground text-left mb-6 space-y-1 max-w-xs mx-auto">
              <li>• Weekly curated articles on social work practice</li>
              <li>• NDIS updates and compliance guidance</li>
              <li>• Professional development opportunities</li>
              <li>• Mental health assessment tools and resources</li>
            </ul>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <a href="/practitioner/forms">Explore Professional Forms</a>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <a href="/">Return to Home</a>
              </Button>
            </div>
          </div>
        );

      case 'already_confirmed':
        return (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Already Confirmed</h2>
            <p className="text-muted-foreground mb-6">
              Your subscription is already confirmed. You should be receiving our newsletters.
            </p>
            <Button asChild>
              <a href="/">Return to Home</a>
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Confirmation Error</h2>
            <p className="text-muted-foreground mb-2">
              We couldn't confirm your subscription. The link may be expired or invalid.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Please contact <a href="mailto:connect@groundpath.com.au" className="underline text-primary">connect@groundpath.com.au</a> if this keeps happening.
            </p>
            <Button variant="outline" asChild className="w-full">
              <a href="/">Return to Home</a>
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <SEO title="Confirm Subscription" path="/confirm" noindex />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-foreground">
            <Mail className="h-6 w-6 text-primary" />
            groundpath Newsletter
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
          {status !== 'loading' && status !== 'error' && (
            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground mb-3">Questions about our services?</p>
              <Button variant="outline" size="sm" asChild>
                <a href="mailto:connect@groundpath.com.au">Contact Us</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmPage;
