import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { MessageSquare, Search } from 'lucide-react';
import { Conversation, messagingService } from '@/services/messagingService';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  loading?: boolean;
}

export const ConversationList = ({ conversations, selectedId, onSelect, loading }: ConversationListProps) => {
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  const filtered = conversations.filter(c =>
    (c.other_party_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const getUnreadCount = (c: Conversation) => {
    if (!user) return 0;
    return c.user_id === user.id ? c.unread_count_user : c.unread_count_practitioner;
  };

  if (loading) {
    return (
      <div className="p-3 space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3.5 w-24 rounded bg-muted" />
              <div className="h-3 w-36 rounded bg-muted/70" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? 'No conversations found' : 'No messages yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((conversation) => {
              const isSelected = selectedId === conversation.id;
              const unread = getUnreadCount(conversation);
              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelect(conversation)}
                  className={`w-full text-left p-3 hover:bg-accent/50 transition-colors ${
                    isSelected ? 'bg-primary/5 dark:bg-primary/10 border-l-2 border-primary' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={conversation.other_party_avatar} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {(conversation.other_party_name || '?')[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium truncate ${unread > 0 ? 'text-foreground' : 'text-foreground/80'}`}>
                          {conversation.other_party_name}
                        </span>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`text-xs truncate ${unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {conversation.last_message_text || 'Start a conversation'}
                        </p>
                        {unread > 0 && (
                          <Badge className="ml-2 h-5 min-w-[20px] flex items-center justify-center text-[10px] bg-sage-600 hover:bg-sage-600 text-white">
                            {unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
