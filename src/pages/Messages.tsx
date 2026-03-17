import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ConversationList } from '@/components/messaging/ConversationList';
import { MessageThread } from '@/components/messaging/MessageThread';
import { Conversation, messagingService } from '@/services/messagingService';
import { useAuth } from '@/hooks/useAuth';

const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    loadConversations();
  }, [user]);

  useEffect(() => {
    // Auto-open conversation if practitioner_id is in URL
    const practitionerId = searchParams.get('practitioner');
    if (practitionerId && user) {
      openConversationWith(practitionerId);
    }
  }, [searchParams, user]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messagingService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openConversationWith = async (practitionerId: string) => {
    try {
      const conv = await messagingService.getOrCreateConversation(practitionerId);
      // Reload list and select
      const data = await messagingService.getConversations();
      setConversations(data);
      const found = data.find(c => c.id === conv.id);
      setSelected(found || conv);
    } catch (error) {
      console.error('Error opening conversation:', error);
    }
  };

  const handleSelect = (conversation: Conversation) => {
    setSelected(conversation);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-[73px]">
        <div className="max-w-6xl mx-auto h-[calc(100vh-73px-64px)]">
          <div className="flex h-full border-x border-border">
            {/* Sidebar */}
            <div className={`w-full md:w-80 border-r border-border flex-shrink-0 flex flex-col ${
              selected ? 'hidden md:flex' : 'flex'
            }`}>
              <div className="p-3 border-b border-border">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-sage-600" />
                  Messages
                </h2>
              </div>
              <ConversationList
                conversations={conversations}
                selectedId={selected?.id}
                onSelect={handleSelect}
                loading={loading}
              />
            </div>

            {/* Thread */}
            <div className={`flex-1 flex flex-col ${
              !selected ? 'hidden md:flex' : 'flex'
            }`}>
              {selected ? (
                <MessageThread
                  conversation={selected}
                  onBack={() => setSelected(null)}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">Select a conversation</h3>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
