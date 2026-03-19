import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Link2, ArrowLeft, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Conversation, Message, messagingService } from '@/services/messagingService';
import { MessageAttachment } from '@/components/messaging/MessageAttachment';
import { VoiceRecorder } from '@/components/messaging/VoiceRecorder';
import { ResourceShareForm } from '@/components/messaging/ResourceShareForm';
import { useAuth } from '@/hooks/useAuth';
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
  const [halaxyId, setHalaxyId] = useState(conversation.linked_halaxy_client_id || '');
  const [showHalaxyLink, setShowHalaxyLink] = useState(false);
  const [linkedHalaxy, setLinkedHalaxy] = useState(conversation.linked_halaxy_client_id || '');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, profile } = useAuth();

  const isPractitioner = user?.id === conversation.practitioner_id;
  const receiverId = isPractitioner ? conversation.user_id : conversation.practitioner_id;

  useEffect(() => {
    loadMessages();
    messagingService.markMessagesAsRead(conversation.id);
    setLinkedHalaxy(conversation.linked_halaxy_client_id || '');
    setHalaxyId(conversation.linked_halaxy_client_id || '');

    const channel = messagingService.subscribeToMessages(conversation.id, (newMsg) => {
      setMessages(prev => [...prev, { ...newMsg, sender_name: newMsg.sender_id === user?.id ? (profile?.display_name || 'You') : conversation.other_party_name }]);
      if (newMsg.receiver_id === user?.id) {
        messagingService.markMessagesAsRead(conversation.id);
      }
    });

    return () => { channel.unsubscribe(); };
  }, [conversation.id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await messagingService.getMessages(conversation.id);
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

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || sending) return;
    try {
      setSending(true);
      setNewMessage('');
      await messagingService.sendMessage(conversation.id, receiverId, text);
    } catch {
      toast.error('Failed to send message');
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
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
        attachmentUrl: attachment.url,
        attachmentType: attachment.type,
        attachmentName: attachment.name,
        attachmentSize: attachment.size,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
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
        attachmentUrl: voiceNote.url,
        attachmentType: 'voice_note',
        attachmentName: voiceNote.name,
        attachmentSize: voiceNote.size,
      });
    } catch {
      toast.error('Failed to send voice note');
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

  const handleLinkHalaxy = async () => {
    const trimmed = halaxyId.trim();
    if (!trimmed) { toast.error('Please enter a valid Halaxy Client ID'); return; }
    try {
      await messagingService.linkHalaxyClient(conversation.id, trimmed);
      setLinkedHalaxy(trimmed);
      toast.success('Linked to Halaxy client record');
      setShowHalaxyLink(false);
    } catch {
      toast.error('Failed to link Halaxy client');
    }
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    msgs.forEach(msg => {
      const date = format(new Date(msg.created_at), 'MMMM d, yyyy');
      const last = groups[groups.length - 1];
      if (last && last.date === date) { last.messages.push(msg); }
      else { groups.push({ date, messages: [msg] }); }
    });
    return groups;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-card">
        {onBack && (
          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="h-9 w-9">
          <AvatarImage src={conversation.other_party_avatar} />
          <AvatarFallback className="text-xs bg-sage-100 text-sage-700">
            {(conversation.other_party_name || '?')[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">{conversation.other_party_name}</h3>
          {linkedHalaxy && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-sage-600" />
              <span className="text-[10px] text-sage-600 font-medium">Halaxy Linked · {linkedHalaxy}</span>
            </div>
          )}
        </div>
        {isPractitioner && (
          <div className="flex items-center gap-1">
            {!linkedHalaxy ? (
              <Button variant="ghost" size="sm" className="text-xs text-sage-600 hover:text-sage-700" onClick={() => setShowHalaxyLink(!showHalaxyLink)}>
                <Link2 className="h-3.5 w-3.5 mr-1" />
                Link Halaxy
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="text-xs text-sage-600" onClick={() => window.open(`https://www.halaxy.com/clients/${linkedHalaxy}`, '_blank')}>
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Halaxy
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Halaxy link input */}
      {showHalaxyLink && isPractitioner && (
        <div className="flex items-center gap-2 p-2 bg-sage-50 dark:bg-sage-900/20 border-b border-border">
          <Input placeholder="Halaxy Client ID..." value={halaxyId} onChange={(e) => setHalaxyId(e.target.value)} className="h-8 text-sm flex-1" />
          <Button size="sm" className="h-8 bg-sage-600 hover:bg-sage-700 text-white" onClick={handleLinkHalaxy} disabled={!halaxyId.trim()}>Link</Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={() => { setShowHalaxyLink(false); setHalaxyId(linkedHalaxy || ''); }}>Cancel</Button>
        </div>
      )}

      {linkedHalaxy && isPractitioner && (
        <div className="px-3 py-1.5 bg-muted/50 border-b border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            Groundpath messages are separate from Halaxy clinical records. Do not store clinical notes here.
          </p>
        </div>
      )}

      {/* Resource share form — practitioner only */}
      {showResourceForm && isPractitioner && (
        <ResourceShareForm onSubmit={handleResourceShare} onCancel={() => setShowResourceForm(false)} />
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-sage-600 border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          groupMessagesByDate(messages).map(group => (
            <div key={group.date}>
              <div className="flex items-center justify-center my-4">
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{group.date}</span>
              </div>
              {group.messages.map((msg) => {
                const isOwn = msg.sender_id === user?.id;
                const hasText = msg.message_text && msg.message_text.trim().length > 0;
                return (
                  <div key={msg.id} className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                      isOwn ? 'bg-sage-600 text-white rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'
                    }`}>
                      {hasText && <p className="text-sm whitespace-pre-wrap break-words">{msg.message_text}</p>}
                      <MessageAttachment message={msg} isOwn={isOwn} />
                      <span className={`text-[10px] mt-0.5 block ${isOwn ? 'text-white/60' : 'text-muted-foreground'}`}>
                        {format(new Date(msg.created_at), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
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
          {isPractitioner && (
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
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-9"
            disabled={sending || uploading}
          />
          <Button
            size="icon"
            className="h-9 w-9 bg-sage-600 hover:bg-sage-700 text-white"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending || uploading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
