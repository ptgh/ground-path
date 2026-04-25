import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Phone, BookOpen, User, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ClientMessagesPanel } from '@/components/messaging/ClientMessagesPanel';
import AvatarUpload from '@/components/AvatarUpload';
import SEO from '@/components/SEO';
import { scrollToSectionWithOffset } from '@/lib/utils';
import MyBookings from '@/components/booking/MyBookings';
import NextSessionCard from '@/components/booking/NextSessionCard';
import { useReturningVisitor } from '@/hooks/useReturningVisitor';

const greetingFor = (name: string | undefined, visitCount: number, streak: number): string => {
  const first = name?.split(' ')[0] ?? '';
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  if (visitCount <= 1) return `Welcome${first ? `, ${first}` : ''}. This is your space — take it gently.`;
  if (streak >= 3) return `${timeOfDay}${first ? `, ${first}` : ''}. Three visits in a row — that's care in action.`;
  return `${timeOfDay}${first ? `, ${first}` : ''} — glad you're back.`;
};

const ClientDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { visitCount: _vc2, streak: _s2 } = { visitCount: 0, streak: 0 };
  const { visitCount, streak, markMilestone } = useReturningVisitor();

  useEffect(() => {
    if (visitCount === 3 && markMilestone('three_visits')) {
      toast("Three visits in. We're glad you're making this a habit.");
    }
    if (streak >= 7 && markMilestone('seven_day_streak')) {
      toast('A week of showing up. Quietly remarkable.');
    }
  }, [visitCount, streak, markMilestone]);

  const greeting = greetingFor(profile?.display_name ?? undefined, visitCount, streak);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Dashboard" noindex />
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Welcome */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-light text-foreground inline-block relative">
              {greeting}
              <span
                aria-hidden
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[2px] w-12 rounded-full"
                style={{ background: 'hsl(var(--accent-warm))' }}
              />
            </h1>
            <p className="text-muted-foreground mt-3">Your mental health support hub</p>
          </div>

          {/* Next Session — prominent in-app launcher */}
          <NextSessionCard />

          {/* Profile Photo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AvatarUpload size="md" />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/messages')}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs">Messages</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/voice-session')}
            >
              <Phone className="h-5 w-5" />
              <span className="text-xs">Voice Support</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/resources')}
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-xs">Resources</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => {
                if (bookingMode === 'native_beta') {
                  navigate('/');
                  setTimeout(() => scrollToSectionWithOffset('booking', 96), 300);
                } else {
                  window.open(HALAXY_EXTERNAL_URL, '_blank');
                }
              }}
            >
              <User className="h-5 w-5" />
              <span className="text-xs">Book Session</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/account/billing')}
            >
              <CreditCard className="h-5 w-5" />
              <span className="text-xs">Billing</span>
            </Button>
          </div>

          {/* My Bookings */}
          <MyBookings />

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Conversations</CardTitle>
              <CardDescription>Messages with your practitioner</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientMessagesPanel />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ClientDashboard;
