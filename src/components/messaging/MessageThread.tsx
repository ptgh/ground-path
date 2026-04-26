import { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Link2, ArrowLeft, Trash2, RotateCcw, NotebookPen, Sparkles, Copy, ShieldCheck } from 'lucide-react';
import { Conversation, Message, MessageStatus as MsgStatusType, messagingService } from '@/services/messagingService';
import { MessageAttachment } from '@/components/messaging/MessageAttachment';
import { MessageStatus } from '@/components/messaging/MessageStatus';
import { TypingIndicator } from '@/components/messaging/TypingIndicator';
import { VoiceRecorder } from '@/components/messaging/VoiceRecorder';
import { ResourceShareForm } from '@/components/messaging/ResourceShareForm';
import { MessageExportMenu } from '@/components/messaging/MessageExportMenu';
import { ClientPreviewPopover } from '@/components/messaging/ClientPreviewPopover';
import { AIAssistPanel } from '@/components/messaging/AIAssistPanel';
import { messageExportService } from '@/services/messageExportService';
import { useAuth } from '@/hooks/useAuth';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface MessageThreadProps {
  conversation: Conversation;
  onBack?: () => void;
}

export const MessageThread = ({ conversation, onBack }: MessageThreadProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [showAIAssist, setShowAIAssist] = useState(false);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [failedMessages, setFailedMessages] = useState<Map<string, { text: string; options?: any }>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, profile } = useAuth();

  const isSelf = conversation.user_id === conversation.practitioner_id;
  const isPractitioner = user?.id === conversation.practitioner_id;
  const receiverId = isSelf
    ? user?.id || conversation.user_id
    : isPractitioner ? conversation.user_id : conversation.practitioner_id;
  const otherPartyName = isSelf ? 'Personal Notes' : (conversation.other_party_name || 'Conversation');
  const otherPartyRole = conversation.other_party_role || (isPractitioner ? 'client' : 'practitioner');

  const { othersTyping, sendTyping, stopTyping } = useTypingIndicator(conversation.id, user?.id);

  useEffect(() => {
    loadMessages();
    messagingService.markMessagesAsRead(conversation.id);
    messagingService.markMessagesAsDelivered(conversation.id);

    const channel = messagingService.subscribeToMessages(conversation.id, (payload) => {
      if (payload._deleted) {
        setMessages(prev => prev.filter(m => m.id !== payload.id));
        messageIdsRef.current.delete(payload.id);
        return;
      }

      if (payload._updated) {
        // Recalculate status from updated fields (read_at, delivered_at)
        setMessages(prev => prev.map(m => {
          if (m.id !== payload.id) return m;
          const updated = { ...m, ...payload, _updated: undefined };
          // Recalculate _status for own messages
          if (updated.sender_id === user?.id) {
            if (updated.read_at || updated.is_read) updated._status = 'read';
            else if (updated.delivered_at) updated._status = 'delivered';
            else updated._status = 'sent';
          }
          return updated;
        }));
        return;
      }

      // Dedup: skip if we already have this message (by real ID)
      if (messageIdsRef.current.has(payload.id)) return;
      messageIdsRef.current.add(payload.id);

      const newMsg: Message = {
        ...payload,
        sender_name: payload.sender_id === user?.id ? (profile?.display_name || 'You') : conversation.other_party_name,
        _status: payload.sender_id === user?.id ? 'sent' : 'read',
      };

      // Replace only the oldest matching optimistic message from this sender
      setMessages(prev => {
        const optimisticIdx = prev.findIndex(m =>
          m._tempId &&
          m.sender_id === payload.sender_id &&
          (m._status === 'sending' || m._status === 'failed')
        );
        if (optimisticIdx !== -1) {
          const updated = [...prev];
          updated[optimisticIdx] = newMsg;
          return updated;
        }
        return [...prev, newMsg];
      });

      if (payload.receiver_id === user?.id) {
        messagingService.markMessagesAsRead(conversation.id);
      }
    });

    return () => { channel.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  useEffect(() => { scrollToBottom(); }, [messages, othersTyping]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await messagingService.getMessages(conversation.id);
      messageIdsRef.current = new Set(data.map(m => m.id));
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  const handleSend = async (retryTempId?: string) => {
    const text = retryTempId
      ? failedMessages.get(retryTempId)?.text || ''
      : newMessage.trim();
    if (!text || sending) return;

    const tempId = retryTempId || `temp_${Date.now()}_${Math.random()}`;

    // Remove from failed if retrying
    if (retryTempId) {
      setFailedMessages(prev => {
        const next = new Map(prev);
        next.delete(retryTempId);
        return next;
      });
    }

    // Optimistic message
    const optimistic: Message = {
      id: tempId,
      _tempId: tempId,
      _status: 'sending',
      conversation_id: conversation.id,
      sender_id: user?.id || '',
      receiver_id: receiverId,
      message_text: text,
      attachment_url: null,
      attachment_path: null,
      attachment_type: null,
      attachment_name: null,
      attachment_size: null,
      resource_url: null,
      resource_title: null,
      resource_description: null,
      is_read: false,
      delivered_at: null,
      read_at: null,
      created_at: new Date().toISOString(),
      sender_name: profile?.display_name || 'You',
    };

    if (!retryTempId) setNewMessage('');
    setMessages(prev => [...prev.filter(m => m._tempId !== tempId), optimistic]);
    stopTyping();

    try {
      setSending(true);
      await messagingService.sendMessage(conversation.id, receiverId, text);
      // The realtime INSERT event will replace the optimistic message
    } catch {
      // Mark as failed, preserve text
      setMessages(prev => prev.map(m => m._tempId === tempId ? { ...m, _status: 'failed' as MsgStatusType } : m));
      setFailedMessages(prev => new Map(prev).set(tempId, { text }));
      toast.error('Failed to send message. Tap to retry.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim()) sendTyping();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const validationError = messagingService.validateFile(file);
    if (validationError) { toast.error(validationError); return; }

    try {
      setUploading(true);
      const attachment = await messagingService.uploadAttachment(conversation.id, file);
      await messagingService.sendMessage(conversation.id, receiverId, '', {
        attachmentPath: attachment.path,
        attachmentType: attachment.type,
        attachmentName: attachment.name,
        attachmentSize: attachment.size,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error?.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleVoiceRecorded = async (blob: Blob, durationMs: number) => {
    const validationError = messagingService.validateVoiceNote(blob);
    if (validationError) { toast.error(validationError); return; }

    try {
      setUploading(true);
      const voiceNote = await messagingService.uploadVoiceNote(conversation.id, blob, durationMs);
      await messagingService.sendMessage(conversation.id, receiverId, '', {
        attachmentPath: voiceNote.path,
        attachmentType: 'voice_note',
        attachmentName: voiceNote.name,
        attachmentSize: voiceNote.size,
      });
    } catch (error) {
      toast.error(error?.message || 'Failed to send voice note. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleResourceShare = async (resource: { url: string; title: string; description: string }) => {
    try {
      setSending(true);
      setShowResourceForm(false);
      await messagingService.sendMessage(conversation.id, receiverId, '', {
        resourceUrl: resource.url,
        resourceTitle: resource.title,
        resourceDescription: resource.description,
      });
    } catch {
      toast.error('Failed to share resource');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      setDeletingId(messageId);
      await messagingService.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      toast.error(error?.message || 'Failed to delete message');
    } finally {
      setDeletingId(null);
    }
  };

  

  const groupMessagesByDate = useCallback((msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    msgs.forEach(msg => {
      const date = format(new Date(msg.created_at), 'MMMM d, yyyy');
      const last = groups[groups.length - 1];
      if (last && last.date === date) { last.messages.push(msg); }
      else { groups.push({ date, messages: [msg] }); }
    });
    return groups;
  }, []);

  const NOTE_QUICK_STARTS = [
    { label: 'Reflection', text: "Reflection — \nWhat I noticed: \nWhat I'm sitting with: \nNext step: " },
    { label: 'Supervision prompt', text: 'For supervision — case theme:\nQuestion to bring:\n' },
    { label: 'Reminder', text: 'Reminder: ' },
  ];

  return (
    <div className={`flex h-full ${isSelf ? 'bg-gradient-to-b from-amber-50/30 to-background' : ''}`}>
      <div className="flex flex-col flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-card">
        {onBack && (
          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        {isSelf ? (
          <>
            <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <NotebookPen className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold truncate">Personal Notes</h3>
              <p className="text-[11px] text-muted-foreground truncate">Private space — only you can see this</p>
            </div>
          </>
        ) : isPractitioner && conversation.other_party_user_id ? (
          <>
            <ClientPreviewPopover
              clientUserId={conversation.other_party_user_id}
              trigger={
                <button className="flex items-center gap-3 min-w-0 hover:opacity-90 transition-opacity">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={conversation.other_party_avatar} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {(otherPartyName || '?')[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left min-w-0">
                    <h3 className="text-sm font-semibold truncate">{otherPartyName}</h3>
                    <Badge variant="outline" className="h-4 mt-0.5 px-1.5 text-[9px] border-sage-300 text-sage-700 font-normal">
                      Client · click for details
                    </Badge>
                  </div>
                </button>
              }
            />
          </>
        ) : (
          <>
            <Avatar className="h-9 w-9">
              <AvatarImage src={conversation.other_party_avatar} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {(otherPartyName || '?')[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold truncate">{otherPartyName}</h3>
              <Badge variant="outline" className="h-4 mt-0.5 px-1.5 text-[9px] border-primary/30 text-primary font-normal">
                {otherPartyRole === 'practitioner' ? 'Practitioner' : 'Client'}
              </Badge>
            </div>
          </>
        )}

        <div className="flex items-center gap-1 ml-auto">
          {isPractitioner && !isSelf && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${showAIAssist ? 'text-sage-700 bg-sage-100' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setShowAIAssist(v => !v)}
              title="AI assist"
              aria-label="Toggle AI assist"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          )}
          <MessageExportMenu
            messages={messages}
            ownerName={profile?.display_name || 'You'}
            otherPartyName={otherPartyName}
            isSelfConversation={isSelf}
          />
        </div>
      </div>

      {/* Resource share form — practitioner only, not in self mode */}
      {showResourceForm && isPractitioner && !isSelf && (
        <ResourceShareForm onSubmit={handleResourceShare} onCancel={() => setShowResourceForm(false)} />
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-sage-600 border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            {isSelf ? (
              <>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                  <NotebookPen className="h-5 w-5 text-amber-700" />
                </div>
                <h4 className="text-sm font-semibold mb-1">Your Personal Notes</h4>
                <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                  A private journal for clinical reflections, supervision prompts and reminders. Only you can see this.
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {NOTE_QUICK_STARTS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { setNewMessage(q.text); inputRef.current?.focus(); }}
                      className="text-xs px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
                    >
                      + {q.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <ShieldCheck className="h-8 w-8 text-sage-600/40 mb-2" />
                <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Messages are private between you and {otherPartyName}.</p>
              </>
            )}
          </div>
        ) : (
          groupMessagesByDate(messages).map(group => (
            <div key={group.date}>
              <div className="flex items-center justify-center my-4">
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{group.date}</span>
              </div>
              {group.messages.map((msg, idx) => {
                const isOwn = msg.sender_id === user?.id;
                const showName = idx === 0 || group.messages[idx - 1]?.sender_id !== msg.sender_id;
                const hasText = msg.message_text && msg.message_text.trim().length > 0;
                const isFailed = msg._status === 'failed';
                const isSending = msg._status === 'sending';

                return (
                  <div key={msg.id} className={`flex flex-col mb-2 group ${isOwn ? 'items-end' : 'items-start'}`}>
                    {showName && (
                      <span className={`text-[10px] font-medium text-muted-foreground mb-0.5 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                        {isSelf ? 'Note' : (isOwn ? 'You' : (conversation.other_party_name || msg.sender_name || 'Client'))}
                      </span>
                    )}
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    {/* Delete button for own messages (not optimistic) */}
                    {isOwn && !msg._tempId && (
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity self-center mr-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={async () => {
                            await messageExportService.copyMessage(msg, false);
                            toast.success('Message copied');
                          }}
                          title="Copy message"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteMessage(msg.id)}
                          disabled={deletingId === msg.id}
                          title="Delete message"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {!isOwn && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity self-center ml-1 text-muted-foreground hover:text-foreground"
                        onClick={async () => {
                          await messageExportService.copyMessage(msg, true);
                          toast.success('Copied with timestamp');
                        }}
                        title="Copy with timestamp"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                        isFailed
                          ? 'bg-destructive/10 text-foreground border border-destructive/30 rounded-br-md'
                          : isSending
                            ? (isSelf ? 'bg-amber-500/70 text-white rounded-br-md' : 'bg-sage-600/70 text-white rounded-br-md')
                            : isOwn
                              ? (isSelf ? 'bg-amber-500 text-white rounded-br-md' : 'bg-sage-600 text-white rounded-br-md')
                              : 'bg-muted text-foreground rounded-bl-md'
                      }`}
                      onClick={isFailed && msg._tempId ? () => handleSend(msg._tempId) : undefined}
                      role={isFailed ? 'button' : undefined}
                      tabIndex={isFailed ? 0 : undefined}
                    >
                      {hasText && <p className="text-sm whitespace-pre-wrap break-words">{msg.message_text}</p>}
                      <MessageAttachment message={msg} isOwn={isOwn} />

                      <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : ''}`}>
                        <span className={`text-[10px] ${isOwn && !isFailed ? 'text-white/60' : isFailed ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {isFailed ? (
                            <span className="flex items-center gap-1">
                              <RotateCcw className="h-2.5 w-2.5" /> Tap to retry
                            </span>
                          ) : (
                            format(new Date(msg.created_at), 'h:mm a')
                          )}
                        </span>
                        {isOwn && !isFailed && !isSelf && (
                          <MessageStatus status={msg._status || 'sent'} />
                        )}
                      </div>
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <TypingIndicator names={othersTyping} />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Input area */}
      <div className="border-t border-border p-3 bg-card">
        {uploading && (
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            <div className="animate-spin h-3 w-3 border-2 border-sage-600 border-t-transparent rounded-full" />
            Uploading...
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || sending}
            title="Attach file (PDF, DOC, JPG, PNG)"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <VoiceRecorder onRecorded={handleVoiceRecorded} disabled={uploading || sending} />
          {isPractitioner && !isSelf && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setShowResourceForm(!showResourceForm)}
              disabled={uploading || sending}
              title="Share a resource"
            >
              <Link2 className="h-4 w-4" />
            </Button>
          )}
          <Input
            ref={inputRef}
            placeholder={isSelf ? 'Add a note…' : 'Type a message...'}
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="flex-1 h-9"
            disabled={uploading}
          />
          <Button
            size="icon"
            className={`h-9 w-9 text-white ${isSelf ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'}`}
            onClick={() => handleSend()}
            disabled={!newMessage.trim() || uploading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      </div>
      {showAIAssist && isPractitioner && !isSelf && (
        <div className="hidden md:flex">
          <AIAssistPanel
            messages={messages}
            isPractitioner={isPractitioner}
            onClose={() => setShowAIAssist(false)}
            onInsertDraft={(text) => { setNewMessage(text); inputRef.current?.focus(); }}
          />
        </div>
      )}
    </div>
  );
};
