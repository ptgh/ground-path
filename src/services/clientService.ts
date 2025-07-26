import { supabase } from "@/integrations/supabase/client";

export interface Client {
  id: string;
  practitioner_id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  contact_phone?: string;
  contact_email?: string;
  emergency_contact?: Record<string, any>;
  presenting_concerns?: string;
  intake_date?: string;
  status: 'active' | 'inactive' | 'discharged';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  client_id: string;
  practitioner_id: string;
  form_type: string;
  form_data: Record<string, any>;
  score?: number;
  interpretation?: string;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export const clientService = {
  // Client CRUD operations
  async getClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Client[];
  },

  async getClient(id: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Client;
  },

  async createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'practitioner_id'>) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...client,
        practitioner_id: userData.user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Client;
  },

  async updateClient(id: string, updates: Partial<Client>) {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Client;
  },

  async deleteClient(id: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Form submission operations
  async getClientFormSubmissions(clientId: string) {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('client_id', clientId)
      .order('completed_at', { ascending: false });
    
    if (error) throw error;
    return data as FormSubmission[];
  },

  async saveFormSubmission(submission: Omit<FormSubmission, 'id' | 'created_at' | 'updated_at' | 'practitioner_id'>) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('form_submissions')
      .insert({
        ...submission,
        practitioner_id: userData.user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as FormSubmission;
  }
};