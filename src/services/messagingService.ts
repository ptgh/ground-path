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
  // Joined fields
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
  is_read: boolean;
  created_at: string;
  sender_name?: string;
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

    // Fetch profile names for the other party
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

    // Check existing
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('practitioner_id', practitionerId)
      .maybeSingle();

    if (existing) return existing as Conversation;

    // Create new
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        practitioner_id: practitionerId,
      })
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

    // Get sender names
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

  async sendMessage(conversationId: string, receiverId: string, messageText: string, attachmentUrl?: string): Promise<Message> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('client_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userData.user.id,
        receiver_id: receiverId,
        message_text: messageText,
        attachment_url: attachmentUrl || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation last message
    await supabase
      .from('conversations')
      .update({
        last_message_text: messageText.substring(0, 100),
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    return data as Message;
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => callback(payload.new)
      )
      .subscribe();
  },

  subscribeToConversations(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => callback(payload)
      )
      .subscribe();
  },
};
