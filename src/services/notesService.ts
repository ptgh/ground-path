import { supabase } from "@/integrations/supabase/client";

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conversation_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const notesService = {
  async getNotes() {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Note[];
  },

  async getNote(id: string) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Note;
  },

  async createNote(note: Omit<Note, 'id' | 'created_at' | 'updated_at' | 'user_id'>) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notes')
      .insert({
        ...note,
        user_id: userData.user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Note;
  },

  async updateNote(id: string, updates: Partial<Note>) {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Note;
  },

  async deleteNote(id: string) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};