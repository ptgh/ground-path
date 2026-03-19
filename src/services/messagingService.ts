import { supabase } from "@/integrations/supabase/client";

export interface Conversation {
  id: string;
  user_id: string;
  practitioner_id: string;
  linked_halaxy_client_id: string | null;
  last_message_text: string | null;
  last_message_at: string;
  unread_count_user: number;
  unread_count_practitioner: number;
  status: string;
  created_at: string;
  updated_at: string;
  other_party_name?: string;
  other_party_avatar?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  resource_url: string | null;
  resource_title: string | null;
  resource_description: string | null;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VOICE_SIZE = 5 * 1024 * 1024; // 5MB

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

    let profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
    if (uniqueIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', uniqueIds);
      if (profiles) {
        profiles.forEach(p => {
          profileMap[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
        });
      }
    }

    return (data || []).map(c => {
      const otherId = c.user_id === userId ? c.practitioner_id : c.user_id;
      const profile = profileMap[otherId];
      return {
        ...c,
        other_party_name: profile?.display_name || 'Unknown',
        other_party_avatar: profile?.avatar_url || undefined,
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
    const { data, error } = await supabase
      .from('client_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const senderIds = [...new Set((data || []).map(m => m.sender_id))];
    let nameMap: Record<string, string> = {};
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', senderIds);
      if (profiles) {
        profiles.forEach(p => {
          nameMap[p.user_id] = p.display_name || 'Unknown';
        });
      }
    }

    return (data || []).map(m => ({
      ...m,
      sender_name: nameMap[m.sender_id] || 'Unknown',
    })) as Message[];
  },

  async sendMessage(
    conversationId: string,
    receiverId: string,
    messageText: string,
    options?: {
      attachmentUrl?: string;
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
        attachment_url: options?.attachmentUrl || null,
        attachment_type: options?.attachmentType || null,
        attachment_name: options?.attachmentName || null,
        attachment_size: options?.attachmentSize || null,
        resource_url: options?.resourceUrl || null,
        resource_title: options?.resourceTitle || null,
        resource_description: options?.resourceDescription || null,
      } as any)
      .select()
      .single();

    if (error) throw error;

    // Update conversation last message
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

    return data as Message;
  },

  validateFile(file: File): string | null {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return `File type .${ext} is not allowed. Supported: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type) && file.type !== '') {
      return `File type ${file.type} is not allowed.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
    }
    return null;
  },

  validateVoiceNote(blob: Blob): string | null {
    if (blob.size > MAX_VOICE_SIZE) {
      return `Voice note is too large. Maximum size is ${MAX_VOICE_SIZE / 1024 / 1024}MB.`;
    }
    return null;
  },

  async uploadAttachment(conversationId: string, file: File): Promise<{ url: string; name: string; size: number; type: string }> {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${conversationId}/${timestamp}_${safeName}`;

    const { error } = await supabase.storage
      .from('message-attachments')
      .upload(path, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('message-attachments')
      .getPublicUrl(path);

    // For private buckets, use signed URL
    const { data: signedData, error: signedError } = await supabase.storage
      .from('message-attachments')
      .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days

    if (signedError) throw signedError;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const attachmentType = ['jpg', 'jpeg', 'png'].includes(ext) ? 'image' : 'file';

    return {
      url: signedData.signedUrl,
      name: file.name,
      size: file.size,
      type: attachmentType,
    };
  },

  async uploadVoiceNote(conversationId: string, blob: Blob, durationMs: number): Promise<{ url: string; name: string; size: number }> {
    const timestamp = Date.now();
    const path = `${conversationId}/${timestamp}_voice_note.webm`;

    const { error } = await supabase.storage
      .from('message-attachments')
      .upload(path, blob, { contentType: 'audio/webm' });

    if (error) throw error;

    const { data: signedData, error: signedError } = await supabase.storage
      .from('message-attachments')
      .createSignedUrl(path, 60 * 60 * 24 * 7);

    if (signedError) throw signedError;

    const seconds = Math.round(durationMs / 1000);
    return {
      url: signedData.signedUrl,
      name: `Voice note (${seconds}s)`,
      size: blob.size,
    };
  },

  async getSignedUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('message-attachments')
      .createSignedUrl(path, 60 * 60); // 1 hour
    if (error) throw error;
    return data.signedUrl;
  },

  async markMessagesAsRead(conversationId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    await supabase
      .from('client_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userData.user.id)
      .eq('is_read', false);
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

  async linkHalaxyClient(conversationId: string, halaxyClientId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ linked_halaxy_client_id: halaxyClientId })
      .eq('id', conversationId);
    if (error) throw error;
  },

  subscribeToMessages(conversationId: string, callback: (message: any) => void) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'client_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => callback(payload.new))
      .subscribe();
  },

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
};
