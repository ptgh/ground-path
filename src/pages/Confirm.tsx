import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';
import { mailingListService } from '@/services/mailingListService';

const ConfirmPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_confirmed'>('loading');

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      handleConfirmation();
    } else {
      setStatus('error');
    }
  }, [token]);

  const handleConfirmation = async () => {
    try {
      await mailingListService.confirmSubscription(token!);
      setStatus('success');
    } catch (error: any) {
      if (error.message.includes('already confirmed') || error.message.includes('not found')) {
        setStatus('already_confirmed');
      } else {
        setStatus('error');
      }
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-sage-600 mb-4" />
            <p className="text-gray-600">Confirming your subscription...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Confirmed!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for confirming your subscription to groundpath's professional mailing list.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You'll start receiving our curated content including:
            </p>
            <ul className="text-sm text-gray-600 text-left mb-6 space-y-1">
              <li>• Weekly curated articles on social work best practices</li>
              <li>• NDIS updates and compliance guidance</li>
              <li>• Professional development opportunities</li>
              <li>• Mental health assessment tools and resources</li>
            </ul>
            <div className="space-y-3">
              <Button
                onClick={() => window.location.href = '/professional-forms'}
                className="w-full bg-sage-600 hover:bg-sage-700 text-white"
              >
                Explore Professional Forms
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          </div>
        );

      case 'already_confirmed':
        return (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Already Confirmed</h2>
            <p className="text-gray-600 mb-6">
              Your subscription is already confirmed. You should be receiving our newsletters.
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              className="bg-sage-600 hover:bg-sage-700 text-white"
            >
              Return to Home
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <XCircle className="h-16 w-16 mx-auto text-red-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmation Error</h2>
            <p className="text-gray-600 mb-6">
              We encountered an error confirming your subscription.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              The confirmation link may be expired or invalid.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => window.location.href = '/'}
                className="w-full bg-sage-600 hover:bg-sage-700 text-white"
              >
                Return to Home
              </Button>
              <p className="text-xs text-gray-400">
                If you continue to have issues, please contact our support team.
              </p>
            </div>
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
            groundpath Newsletter
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
          
          {status !== 'loading' && status !== 'error' && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  Questions about our services?
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = 'mailto:connect@groundpath.com.au'}
                >
                  Contact Us
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmPage;