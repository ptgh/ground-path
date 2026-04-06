import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import Header from '@/components/Header';
import SEO from '@/components/SEO';
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <SEO title="Messages" noindex />
      <Header />
      <main className="flex-1 pt-[73px]">
        <div className="max-w-6xl mx-auto h-[calc(100vh-73px)]">
          <div className="flex h-full border-x border-border/60">
            {/* Sidebar */}
            <div className={`w-full md:w-80 border-r border-border/60 flex-shrink-0 flex flex-col ${
              selected ? 'hidden md:flex' : 'flex'
            }`}>
              <div className="p-3.5 border-b border-border/60">
                <h2 className="text-sm font-semibold flex items-center gap-2 text-foreground">
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
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 overflow-y-auto">
                  {!loading && conversations.length === 0 ? (
                    <div className="max-w-md space-y-5">
                      <div className="flex justify-center">
                        <div className="rounded-full bg-sage-100 p-4">
                          <MessageSquare className="h-8 w-8 text-sage-600" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-lg font-semibold text-foreground">Start a conversation</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Choose a practitioner below to send your first secure message
                        </p>
                      </div>
                      <div className="w-full max-w-2xl text-left mx-auto">
                        <PractitionerList />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="rounded-full bg-muted p-4">
                          <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-medium text-muted-foreground">Select a conversation</h3>
                        <p className="text-sm text-muted-foreground/70">
                          Choose from the list to start messaging
                        </p>
                      </div>
                    </div>
                  )}
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
