import { supabase } from "@/integrations/supabase/client";

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

export const aiConversationService = {
  // Create a new conversation
  async createConversation(title: string, messages: ConversationMessage[]): Promise<string | null> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    // Convert messages to JSON-compatible format
    const messagesJson = messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp
    }));

    // Build full transcript for the content field
    const transcriptText = messages.map(m => {
      const role = m.role === 'user' ? 'You' : 'AI Assistant';
      return `${role}: ${m.content}`;
    }).join('\n\n---\n\n');

    const { data, error } = await supabase
      .from('notes')
      .insert([{
        user_id: userData.user.id,
        title: title,
        content: transcriptText, // Full transcript in content
        conversation_data: { messages: messagesJson }
      }])
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  },

  // Update an existing conversation
  async updateConversation(conversationId: string, messages: ConversationMessage[]): Promise<void> {
    // Convert messages to JSON-compatible format
    const messagesJson = messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp
    }));

    // Build full transcript for the content field
    const transcriptText = messages.map(m => {
      const role = m.role === 'user' ? 'You' : 'AI Assistant';
      return `${role}: ${m.content}`;
    }).join('\n\n---\n\n');

    const { error } = await supabase
      .from('notes')
      .update({
        content: transcriptText, // Full transcript in content
        conversation_data: { messages: messagesJson },
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) throw error;
  },

  // Get all AI conversations for current user
  async getConversations(): Promise<AIConversation[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .like('title', 'AI Conversation%')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(note => ({
      id: note.id,
      title: note.title,
      messages: (note.conversation_data as any)?.messages || [],
      createdAt: note.created_at || '',
      updatedAt: note.updated_at || ''
    }));
  },

  // Get a specific conversation
  async getConversation(conversationId: string): Promise<AIConversation | null> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) return null;

    return {
      id: data.id,
      title: data.title,
      messages: (data.conversation_data as any)?.messages || [],
      createdAt: data.created_at || '',
      updatedAt: data.updated_at || ''
    };
  },

  // Delete a conversation
  async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  },

  // Generate a title based on the first user message
  generateTitle(firstMessage: string): string {
    const date = new Date().toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    // Create a brief summary from the first message
    const summary = firstMessage.length > 50 
      ? firstMessage.substring(0, 47) + '...'
      : firstMessage;
    
    return `AI Conversation - ${date}`;
  }
};
