import { supabase } from "@/integrations/supabase/client";

export interface Conversation {
  id: string;
  user_id: string;
  practitioner_id: string;
  last_message_text: string | null;
  last_message_at: string;
  unread_count_user: number;
  unread_count_practitioner: number;
  status: string;
  created_at: string;
  updated_at: string;
  other_party_name?: string;
  other_party_avatar?: string;
  other_party_role?: 'practitioner' | 'client';
  other_party_user_id?: string;
  is_self_conversation?: boolean;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  attachment_url: string | null;
  attachment_path: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  resource_url: string | null;
  resource_title: string | null;
  resource_description: string | null;
  is_read: boolean;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
  sender_name?: string;
  resolved_attachment_url?: string;
  // Client-side only fields
  _status?: MessageStatus;
  _tempId?: string;
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_VOICE_SIZE = 5 * 1024 * 1024;

async function resolveSignedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from('message-attachments')
    .createSignedUrl(path, 60 * 60);
  if (error) {
    console.error('Failed to create signed URL for', path, error);
    return null;
  }
  return data.signedUrl;
}

async function resolveMessageAttachments(messages: Message[]): Promise<Message[]> {
  const withAttachments = messages.filter(m => m.attachment_path);
  if (withAttachments.length === 0) return messages;

  const urlMap = new Map<string, string | null>();
  await Promise.all(
    withAttachments.map(async (m) => {
      if (m.attachment_path && !urlMap.has(m.attachment_path)) {
        const url = await resolveSignedUrl(m.attachment_path);
        urlMap.set(m.attachment_path!, url);
      }
    })
  );

  return messages.map(m => ({
    ...m,
    resolved_attachment_url: m.attachment_path ? (urlMap.get(m.attachment_path) ?? undefined) : undefined,
  }));
}

function getMessageStatus(msg: Message, currentUserId: string): MessageStatus {
  if (msg.sender_id !== currentUserId) return 'read'; // not relevant for received
  if (msg.read_at || msg.is_read) return 'read';
  if (msg.delivered_at) return 'delivered';
  return 'sent';
}

export const messagingService = {
  async getConversations(): Promise<Conversation[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');
    const userId = userData.user.id;

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user_id.eq.${userId},practitioner_id.eq.${userId}`)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    const otherIds = (data || []).map(c =>
      c.user_id === userId ? c.practitioner_id : c.user_id
    );
    const uniqueIds = [...new Set(otherIds)];

    const profileMap: Record<string, { display_name: string | null; avatar_url: string | null; user_type: string | null }> = {};
    if (uniqueIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, user_type')
        .in('user_id', uniqueIds);
      if (profiles) {
        profiles.forEach(p => {
          profileMap[p.user_id] = {
            display_name: p.display_name,
            avatar_url: p.avatar_url,
            user_type: p.user_type,
          };
        });
      }
    }

    return (data || []).map(c => {
      const isSelf = c.user_id === c.practitioner_id;
      const otherId = c.user_id === userId ? c.practitioner_id : c.user_id;
      const profile = profileMap[otherId];
      const role: 'practitioner' | 'client' =
        profile?.user_type === 'practitioner' ? 'practitioner' : 'client';
      const fallbackName = role === 'practitioner' ? 'Practitioner' : 'Client';
      return {
        ...c,
        other_party_user_id: otherId,
        other_party_name: isSelf ? 'Personal Notes' : (profile?.display_name?.trim() || fallbackName),
        other_party_avatar: profile?.avatar_url || undefined,
        other_party_role: role,
        is_self_conversation: isSelf,
      };
    }) as Conversation[];
  },

  async getOrCreateConversation(practitionerId: string): Promise<Conversation> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');
    const userId = userData.user.id;

    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('practitioner_id', practitionerId)
      .maybeSingle();

    if (existing) return existing as Conversation;

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId, practitioner_id: practitionerId })
      .select()
      .single();

    if (error) throw error;
    return data as Conversation;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData?.user?.id;

    const { data, error } = await supabase
      .from('client_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const senderIds = [...new Set((data || []).map(m => m.sender_id))];
    const nameMap: Record<string, string> = {};
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', senderIds);
      if (profiles) {
        profiles.forEach(p => {
          nameMap[p.user_id] = p.display_name || 'User';
        });
      }
    }

    const messages = (data || []).map(m => ({
      ...m,
      sender_name: nameMap[m.sender_id] || 'User',
      _status: currentUserId ? getMessageStatus(m as Message, currentUserId) : ('sent' as MessageStatus),
    })) as Message[];

    return resolveMessageAttachments(messages);
  },

  async sendMessage(
    conversationId: string,
    receiverId: string,
    messageText: string,
    options?: {
      attachmentPath?: string;
      attachmentType?: string;
      attachmentName?: string;
      attachmentSize?: number;
      resourceUrl?: string;
      resourceTitle?: string;
      resourceDescription?: string;
    }
  ): Promise<Message> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('client_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userData.user.id,
        receiver_id: receiverId,
        message_text: messageText,
        attachment_path: options?.attachmentPath || null,
        attachment_type: options?.attachmentType || null,
        attachment_name: options?.attachmentName || null,
        attachment_size: options?.attachmentSize || null,
        resource_url: options?.resourceUrl || null,
        resource_title: options?.resourceTitle || null,
        resource_description: options?.resourceDescription || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select()
      .single();

    if (error) throw error;

    const previewText = options?.attachmentType === 'voice_note'
      ? '🎤 Voice note'
      : options?.attachmentName
        ? `📎 ${options.attachmentName}`
        : options?.resourceUrl
          ? `🔗 ${options.resourceTitle || 'Resource'}`
          : messageText.substring(0, 100);

    await supabase
      .from('conversations')
      .update({
        last_message_text: previewText,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    this.sendEmailNotification(conversationId, receiverId, userData.user).catch(err =>
      console.warn('Email notification failed (non-blocking):', err)
    );

    return { ...data, _status: 'sent' } as Message;
  },

  validateFile(file: File): string | null {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return `File type ".${ext || 'unknown'}" is not supported. Allowed types: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}.`;
    }
    if (file.type && !ALLOWED_FILE_TYPES.includes(file.type)) {
      return `File format "${file.type}" is not supported. Please use PDF, DOC, DOCX, JPG, or PNG files.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return `File is too large (${sizeMB} MB). Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.`;
    }
    if (file.size === 0) {
      return 'File appears to be empty. Please select a valid file.';
    }
    return null;
  },

  validateVoiceNote(blob: Blob): string | null {
    if (blob.size > MAX_VOICE_SIZE) {
      const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);
      return `Voice note is too large (${sizeMB} MB). Maximum allowed size is ${MAX_VOICE_SIZE / (1024 * 1024)} MB.`;
    }
    if (blob.size === 0) {
      return 'Voice recording appears to be empty. Please try again.';
    }
    return null;
  },

  isVoiceRecordingSupported(): { supported: boolean; reason?: string } {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { supported: false, reason: 'Your browser does not support microphone access. Please try a modern browser like Chrome, Firefox, or Safari.' };
    }
    if (typeof MediaRecorder === 'undefined') {
      return { supported: false, reason: 'Your browser does not support audio recording. Please try Chrome, Firefox, or Edge.' };
    }
    return { supported: true };
  },

  async uploadAttachment(conversationId: string, file: File): Promise<{ path: string; name: string; size: number; type: string }> {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${conversationId}/${timestamp}_${safeName}`;

    const { error } = await supabase.storage
      .from('message-attachments')
      .upload(path, file);

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Upload failed: ${error.message}. Please check your connection and try again.`);
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const attachmentType = ['jpg', 'jpeg', 'png'].includes(ext) ? 'image' : 'file';

    return { path, name: file.name, size: file.size, type: attachmentType };
  },

  async uploadVoiceNote(conversationId: string, blob: Blob, durationMs: number): Promise<{ path: string; name: string; size: number }> {
    const timestamp = Date.now();
    const path = `${conversationId}/${timestamp}_voice_note.webm`;

    const { error } = await supabase.storage
      .from('message-attachments')
      .upload(path, blob, { contentType: 'audio/webm' });

    if (error) {
      console.error('Voice note upload error:', error);
      throw new Error(`Voice note upload failed: ${error.message}. Please try again.`);
    }

    const seconds = Math.round(durationMs / 1000);
    return { path, name: `Voice note (${seconds}s)`, size: blob.size };
  },

  async getSignedUrl(path: string): Promise<string> {
    const url = await resolveSignedUrl(path);
    if (!url) throw new Error('Failed to generate download URL');
    return url;
  },

  async deleteMessage(messageId: string): Promise<void> {
    const { data: message, error: fetchError } = await supabase
      .from('client_messages')
      .select('id, sender_id, attachment_path')
      .eq('id', messageId)
      .single();

    if (fetchError) throw fetchError;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || userData.user.id !== message.sender_id) {
      throw new Error('You can only delete your own messages');
    }

    if (message.attachment_path) {
      const { error: storageError } = await supabase.storage
        .from('message-attachments')
        .remove([message.attachment_path]);
      if (storageError) {
        console.error('Failed to delete storage file:', storageError);
      }
    }

    const { error } = await supabase
      .from('client_messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  },

  async markMessagesAsRead(conversationId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const now = new Date().toISOString();
    // Set both delivered_at (if not yet set) and read_at in one update
    // so status progresses correctly: sent → delivered → read
    await supabase
      .from('client_messages')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ is_read: true, read_at: now, delivered_at: now } as any)
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userData.user.id)
      .eq('is_read', false);
  },

  async markMessagesAsDelivered(conversationId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const now = new Date().toISOString();
    await supabase
      .from('client_messages')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ delivered_at: now } as any)
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userData.user.id)
      .is('delivered_at', null);
  },

  async getUnreadCount(): Promise<number> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 0;

    const { count, error } = await supabase
      .from('client_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userData.user.id)
      .eq('is_read', false);

    if (error) return 0;
    return count || 0;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async sendEmailNotification(conversationId: string, recipientId: string, sender: any): Promise<void> {
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', sender.id)
      .single();

    await supabase.functions.invoke('message-notification', {
      body: {
        recipientId,
        senderName: senderProfile?.display_name || 'A client',
        conversationId,
      },
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribeToMessages(conversationId: string, callback: (message: any) => void) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'client_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => callback(payload.new))
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'client_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => callback({ ...payload.new, _updated: true }))
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'client_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => callback({ ...payload.old, _deleted: true }))
      .subscribe();
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribeToConversations(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`conversations:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
      }, (payload) => callback(payload))
      .subscribe();
  },

  /**
   * Join a presence channel for typing indicators.
   */
  getTypingChannel(conversationId: string) {
    return supabase.channel(`typing:${conversationId}`);
  },
};
