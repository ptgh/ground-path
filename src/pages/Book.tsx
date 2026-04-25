import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { PractitionerList } from '@/components/PractitionerCard';
import { toast } from 'sonner';

const Book = () => {
  const navigate = useNavigate();

  // Backwards-compat: old deep-links and the auth round-trip pointed here with
  // ?practitioner=<uuid>. Forward them to the unified hub so the booking lives
  // in exactly one place.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get('practitioner');
    if (requestedId) {
      navigate(`/practitioner/${requestedId}#booking`, { replace: true });
      return;
    }

    // Auto-resume after auth: if we stored a pending selection, route to the
    // practitioner hub with the booking anchor and let InlineBookingPanel
    // restore the slot from sessionStorage.
    const intent = params.get('intent');
    if (intent === 'book') {
      const stored = sessionStorage.getItem('pending_booking_selection');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { practitionerId: string };
          if (parsed.practitionerId) {
            navigate(`/practitioner/${parsed.practitionerId}#booking`, { replace: true });
            return;
          }
        } catch {
          sessionStorage.removeItem('pending_booking_selection');
        }
      }
      toast.message('Sign in complete — pick a practitioner to continue.');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Book a Session"
        path="/book"
        description="Browse verified groundpath practitioners and book a confidential online counselling session."
      />
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Book a Session</h1>
            <p className="text-muted-foreground mt-1">
              Choose a practitioner to view their profile, credentials, and book directly.
            </p>
          </header>

          <Alert className="border-amber-200 bg-amber-50/60 mb-6">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              <span className="font-semibold">Beta Booking</span> — Groundpath's native booking system is in early testing.
            </AlertDescription>
          </Alert>

          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <CalendarIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground/80">
                Each practitioner has their own profile page where you can read their bio, see registrations,
                and book a session — all in one place.
              </p>
            </CardContent>
          </Card>

          <PractitionerList />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Book;
