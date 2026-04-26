import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { Conversation, messagingService } from '@/services/messagingService';
import { formatDistanceToNow } from 'date-fns';
import { shortName, initials } from '@/lib/displayName';

export const ClientMessagesPanel = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [convos, count] = await Promise.all([
        messagingService.getConversations(),
        messagingService.getUnreadCount(),
      ]);
      setConversations(convos);
      setUnreadTotal(count);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Client Messages
          {unreadTotal > 0 && (
            <Badge className="bg-sage-600 hover:bg-sage-600 text-white text-xs">
              {unreadTotal} unread
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Recent client conversations</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-sage-600 border-t-transparent rounded-full" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 text-sm">
            No client messages yet
          </p>
        ) : (
          <div className="space-y-3">
            {conversations.slice(0, 5).map((conv) => {
              const label = conv.is_self_conversation
                ? 'Personal Notes'
                : shortName({
                    displayName: conv.other_party_display_name,
                    userId: conv.other_party_user_id || conv.id,
                    role: conv.other_party_role,
                  });
              return (
              <button
                key={conv.id}
                onClick={() => navigate(`/messages?open=${conv.id}`)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src={conv.other_party_avatar} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {initials(conv.other_party_display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{label}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {conv.last_message_text || 'No messages'}
                  </p>
                </div>
              </button>
              );
            })}
            <Button
              variant="ghost"
              className="w-full mt-2"
              size="sm"
              onClick={() => navigate('/messages')}
            >
              View All Messages <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
