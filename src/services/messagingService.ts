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
  attachment_path: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  resource_url: string | null;
  resource_title: string | null;
  resource_description: string | null;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  // Resolved signed URL for rendering (not stored in DB)
  resolved_attachment_url?: string;
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

/**
 * Generate a fresh signed URL from a storage path.
 * Returns null if the path is empty or signing fails.
 */
async function resolveSignedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from('message-attachments')
    .createSignedUrl(path, 60 * 60); // 1 hour
  if (error) {
    console.error('Failed to create signed URL for', path, error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Resolve signed URLs for an array of messages that have attachment_path.
 */
async function resolveMessageAttachments(messages: Message[]): Promise<Message[]> {
  const withAttachments = messages.filter(m => m.attachment_path);
  if (withAttachments.length === 0) return messages;

  // Batch resolve signed URLs
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

    const messages = (data || []).map(m => ({
      ...m,
      sender_name: nameMap[m.sender_id] || 'Unknown',
    })) as Message[];

    // Resolve signed URLs for attachments
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

    // Fire-and-forget email notification to recipient
    this.sendEmailNotification(conversationId, receiverId, userData.user).catch(err =>
      console.warn('Email notification failed (non-blocking):', err)
    );

    return data as Message;
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

  /**
   * Check if the browser supports voice recording.
   */
  isVoiceRecordingSupported(): { supported: boolean; reason?: string } {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { supported: false, reason: 'Your browser does not support microphone access. Please try a modern browser like Chrome, Firefox, or Safari.' };
    }
    if (typeof MediaRecorder === 'undefined') {
      return { supported: false, reason: 'Your browser does not support audio recording. Please try Chrome, Firefox, or Edge.' };
    }
    return { supported: true };
  },

  /**
   * Upload a file attachment. Returns the stable storage path (not a signed URL).
   */
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

    return {
      path,
      name: file.name,
      size: file.size,
      type: attachmentType,
    };
  },

  /**
   * Upload a voice note. Returns the stable storage path.
   */
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
    return {
      path,
      name: `Voice note (${seconds}s)`,
      size: blob.size,
    };
  },

  /**
   * Get a fresh signed URL for a storage path.
   */
  async getSignedUrl(path: string): Promise<string> {
    const url = await resolveSignedUrl(path);
    if (!url) throw new Error('Failed to generate download URL');
    return url;
  },

  /**
   * Delete a message. Only the sender can delete their own messages.
   * If the message has an attachment, also delete the storage file.
   */
  async deleteMessage(messageId: string): Promise<void> {
    // First get the message to check for attachment
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

    // Delete storage file if present
    if (message.attachment_path) {
      const { error: storageError } = await supabase.storage
        .from('message-attachments')
        .remove([message.attachment_path]);
      if (storageError) {
        console.error('Failed to delete storage file:', storageError);
        // Continue with message deletion even if storage delete fails
      }
    }

    // Delete the message
    const { error } = await supabase
      .from('client_messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
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
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'client_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => callback({ ...payload.old, _deleted: true }))
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
