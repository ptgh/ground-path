import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';
import { mailingListService } from '@/services/mailingListService';
import SEO from '@/components/SEO';

type Status = 'loading' | 'success' | 'error' | 'already_unsubscribed';

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');

  const token = searchParams.get('token');

  useEffect(() => {
    // Token-only unsubscribe — proves the holder of the email link
    if (!token) {
      setStatus('error');
      return;
    }
    (async () => {
      try {
        await mailingListService.unsubscribe(token, { byToken: true });
        setStatus('success');
      } catch (error) {
        const msg = (error as Error).message ?? '';
        if (msg.includes('already unsubscribed')) setStatus('already_unsubscribed');
        else setStatus('error');
      }
    })();
  }, [token]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Processing your unsubscribe request…</p>
          </div>
        );

      case 'confirm':
        return (
          <div className="text-center py-8">
            <Mail className="h-16 w-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Confirm Unsubscribe</h2>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to unsubscribe from our mailing list?
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Email: <strong className="text-foreground">{email}</strong>
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => window.history.back()} disabled={isProcessing}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleManualUnsubscribe} disabled={isProcessing}>
                {isProcessing ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Unsubscribing…</>
                ) : (
                  'Unsubscribe'
                )}
              </Button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Successfully Unsubscribed</h2>
            <p className="text-muted-foreground mb-2">
              You've been removed from our mailing list.
            </p>
            <p className="text-sm text-muted-foreground">
              We're sorry to see you go. You can resubscribe anytime from our website.
            </p>
          </div>
        );

      case 'already_unsubscribed':
        return (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Already Unsubscribed</h2>
            <p className="text-muted-foreground">
              This address is already unsubscribed from our mailing list.
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Unsubscribe Error</h2>
            <p className="text-muted-foreground mb-2">
              We couldn't process your request. The link may be invalid or expired.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact <a href="mailto:connect@groundpath.com.au" className="underline text-primary">connect@groundpath.com.au</a> and we'll remove you manually.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <SEO title="Unsubscribe" path="/unsubscribe" noindex />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-foreground">
            <Mail className="h-6 w-6 text-primary" />
            groundpath Newsletter
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
          {status !== 'loading' && (
            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Want to stay connected with groundpath?
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://groundpath.com.au">Visit Our Website</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnsubscribePage;
