import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';
import { mailingListService } from '@/services/mailingListService';

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_unsubscribed'>('loading');
  const [isProcessing, setIsProcessing] = useState(false);

  const email = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    if (email && !token) {
      setStatus('success'); // Show manual unsubscribe form
    } else if (email && token) {
      (async () => {
        try {
          await mailingListService.unsubscribe(email);
          setStatus('success');
        } catch (error) {
          const msg = (error as Error).message ?? '';
          if (msg.includes('already unsubscribed')) {
            setStatus('already_unsubscribed');
          } else {
            setStatus('error');
          }
        }
      })();
    } else {
      setStatus('error');
    }
  }, [email, token]);

  const handleManualUnsubscribe = async () => {
    if (!email) return;
    
    setIsProcessing(true);
    try {
      await mailingListService.unsubscribe(email);
      setStatus('success');
    } catch (error) {
      const msg = (error as Error).message ?? '';
      if (msg.includes('already unsubscribed')) {
        setStatus('already_unsubscribed');
      } else {
        setStatus('error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-sage-600 mb-4" />
            <p className="text-gray-600">Processing your unsubscribe request...</p>
          </div>
        );

      case 'success':
        if (token) {
          return (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Successfully Unsubscribed</h2>
              <p className="text-gray-600 mb-6">
                You have been successfully unsubscribed from our mailing list.
              </p>
              <p className="text-sm text-gray-500">
                You will no longer receive newsletters from Ground Path. We're sorry to see you go!
              </p>
            </div>
          );
        } else {
          return (
            <div className="text-center py-8">
              <Mail className="h-16 w-16 mx-auto text-sage-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Unsubscribe</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to unsubscribe from our mailing list?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Email: <strong>{email}</strong>
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleManualUnsubscribe}
                  disabled={isProcessing}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Unsubscribing...
                    </>
                  ) : (
                    'Unsubscribe'
                  )}
                </Button>
              </div>
            </div>
          );
        }

      case 'already_unsubscribed':
        return (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Already Unsubscribed</h2>
            <p className="text-gray-600">
              This email address is already unsubscribed from our mailing list.
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <XCircle className="h-16 w-16 mx-auto text-red-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unsubscribe Error</h2>
            <p className="text-gray-600 mb-6">
              We encountered an error processing your unsubscribe request.
            </p>
            <p className="text-sm text-gray-500">
              Please try again later or contact our support team.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-sage-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Mail className="h-6 w-6 text-sage-600" />
            Ground Path Newsletter
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
          
          {status !== 'loading' && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  Want to stay connected with Ground Path?
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = 'https://groundpath.com.au'}
                >
                  Visit Our Website
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnsubscribePage;