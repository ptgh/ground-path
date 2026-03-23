import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Phone, BookOpen, User } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ClientMessagesPanel } from '@/components/messaging/ClientMessagesPanel';

const ClientDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Welcome */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-light text-foreground">
              Welcome{profile?.display_name ? `, ${profile.display_name}` : ''}
            </h1>
            <p className="text-muted-foreground mt-2">Your mental health support hub</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
              onClick={() => window.open('https://www.halaxy.com/profile/groundpath/location/1353667', '_blank')}
            >
              <User className="h-5 w-5" />
              <span className="text-xs">Book Session</span>
            </Button>
          </div>

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
