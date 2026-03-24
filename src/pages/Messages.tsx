import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import Header from '@/components/Header';
import { ConversationList } from '@/components/messaging/ConversationList';
import { MessageThread } from '@/components/messaging/MessageThread';
import { PractitionerList } from '@/components/PractitionerCard';
import { Conversation, messagingService } from '@/services/messagingService';
import { useAuth } from '@/hooks/useAuth';

const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await messagingService.getConversations();
      setConversations(data);
      return data;
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user, loadConversations]);

  useEffect(() => {
    if (!user) return;

    // Auto-open conversation from ?practitioner=<id>
    const practitionerId = searchParams.get('practitioner');
    if (practitionerId) {
      openConversationWith(practitionerId);
      return;
    }

    // Auto-open conversation from ?open=<conversation_id> (dashboard widget)
    const openId = searchParams.get('open');
    if (openId && conversations.length > 0) {
      const found = conversations.find(c => c.id === openId);
      if (found) setSelected(found);
    }
  }, [searchParams, user, conversations.length]);

  const openConversationWith = async (practitionerId: string) => {
    try {
      const conv = await messagingService.getOrCreateConversation(practitionerId);
      const data = await loadConversations();
      const found = data.find(c => c.id === conv.id);
      setSelected(found || conv);
    } catch (error) {
      console.error('Error opening conversation:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-[73px]">
        <div className="max-w-6xl mx-auto h-[calc(100vh-73px)]">
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
                onSelect={setSelected}
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
