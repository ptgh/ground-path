import { supabase } from "@/integrations/supabase/client";

export interface FormDraft {
  formType: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: Record<string, any>;
  lastSaved: string;
}

const DRAFT_KEY_PREFIX = 'form_draft_';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export const formDraftService = {
  // Get the draft key for a specific form type
  getDraftKey(formType: string): string {
    return `${DRAFT_KEY_PREFIX}${formType.toLowerCase().replace(/\s+/g, '_')}`;
  },

  // Save draft to localStorage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveDraftToCache(formType: string, formData: Record<string, any>): void {
    const key = this.getDraftKey(formType);
    const draft: FormDraft = {
      formType,
      formData,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(draft));
  },

  // Load draft from localStorage
  loadDraftFromCache(formType: string): FormDraft | null {
    const key = this.getDraftKey(formType);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored) as FormDraft;
    } catch {
      return null;
    }
  },

  // Clear draft from localStorage
  clearDraftFromCache(formType: string): void {
    const key = this.getDraftKey(formType);
    localStorage.removeItem(key);
  },

  // Check if a draft exists
  hasDraft(formType: string): boolean {
    const key = this.getDraftKey(formType);
    return localStorage.getItem(key) !== null;
  },

  // Get time since last save
  getTimeSinceLastSave(formType: string): string | null {
    const draft = this.loadDraftFromCache(formType);
    if (!draft) return null;
    
    const lastSaved = new Date(draft.lastSaved);
    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  },

  // Save draft to database
  async saveDraftToDatabase(
    formType: string, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData: Record<string, any>,
    clientId?: string
  ): Promise<string | null> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('form_submissions')
      .insert({
        form_type: formType,
        form_data: formData,
        practitioner_id: userData.user.id,
        client_id: clientId || null,
        status: 'draft',
        completed_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  },

  // Update existing draft in database
  async updateDraftInDatabase(
    draftId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase
      .from('form_submissions')
      .update({
        form_data: formData,
        completed_at: new Date().toISOString()
      })
      .eq('id', draftId);

    if (error) throw error;
  },

  // Complete a draft (change status from draft to completed)
  async completeDraft(
    draftId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData: Record<string, any>,
    score?: number,
    interpretation?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('form_submissions')
      .update({
        form_data: formData,
        status: 'completed',
        score: score || null,
        interpretation: interpretation || null,
        completed_at: new Date().toISOString()
      })
      .eq('id', draftId);

    if (error) throw error;
  },

  // Save as completed directly
  async saveAsCompleted(
    formType: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData: Record<string, any>,
    clientId?: string,
    score?: number,
    interpretation?: string
  ): Promise<string | null> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('form_submissions')
      .insert({
        form_type: formType,
        form_data: formData,
        practitioner_id: userData.user.id,
        client_id: clientId || null,
        status: 'completed',
        score: score || null,
        interpretation: interpretation || null,
        completed_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  },

  // Get user's drafts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getUserDrafts(): Promise<any[]> {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('status', 'draft')
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Delete a draft
  async deleteDraft(draftId: string): Promise<void> {
    const { error } = await supabase
      .from('form_submissions')
      .delete()
      .eq('id', draftId)
      .eq('status', 'draft');

    if (error) throw error;
  }
};
