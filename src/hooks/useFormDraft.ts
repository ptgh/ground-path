import { useState, useEffect, useCallback, useRef } from 'react';
import { formDraftService } from '@/services/formDraftService';
import { toast } from 'sonner';

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export function useFormDraft<T extends Record<string, unknown>>(
  formType: string,
  initialData: T
) {
  const [formData, setFormData] = useState<T>(initialData);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasChangesRef = useRef(false);

  // Check for existing draft on mount
  useEffect(() => {
    const existingDraft = formDraftService.loadDraftFromCache(formType);
    if (existingDraft) {
      setHasDraft(true);
    }
  }, [formType]);

  // Auto-save to cache
  useEffect(() => {
    if (hasChangesRef.current) {
      formDraftService.saveDraftToCache(formType, formData);
      setLastSaved(formDraftService.getTimeSinceLastSave(formType));
    }
  }, [formData, formType]);

  // Update last saved display periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSince = formDraftService.getTimeSinceLastSave(formType);
      if (timeSince) {
        setLastSaved(timeSince);
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [formType]);

  // Set up auto-save to database
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(async () => {
      if (hasChangesRef.current && draftId) {
        try {
          setIsSaving(true);
          await formDraftService.updateDraftInDatabase(draftId, formData);
          setLastSaved('Just now');
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [draftId, formData]);

  // Update form data with change tracking
  const updateFormData = useCallback((updates: Partial<T>) => {
    hasChangesRef.current = true;
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Restore draft from cache
  const restoreDraft = useCallback(() => {
    const draft = formDraftService.loadDraftFromCache(formType);
    if (draft) {
      setFormData(draft.formData as T);
      setHasDraft(false);
      toast.success('Draft restored');
    }
  }, [formType]);

  // Discard draft from cache
  const discardDraft = useCallback(() => {
    formDraftService.clearDraftFromCache(formType);
    setHasDraft(false);
    toast.info('Draft discarded');
  }, [formType]);

  // Save draft to database
  const saveDraft = useCallback(async (clientId?: string) => {
    try {
      setIsSaving(true);
      
      if (draftId) {
        await formDraftService.updateDraftInDatabase(draftId, formData);
      } else {
        const newDraftId = await formDraftService.saveDraftToDatabase(formType, formData, clientId);
        if (newDraftId) {
          setDraftId(newDraftId);
        }
      }
      
      setLastSaved('Just now');
      toast.success('Draft saved');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  }, [draftId, formData, formType]);

  // Complete form and save to database
  const completeForm = useCallback(async (
    clientId?: string,
    score?: number,
    interpretation?: string
  ) => {
    try {
      setIsSaving(true);
      
      if (draftId) {
        await formDraftService.completeDraft(draftId, formData, score, interpretation);
      } else {
        await formDraftService.saveAsCompleted(formType, formData, clientId, score, interpretation);
      }
      
      // Clear cache after successful save
      formDraftService.clearDraftFromCache(formType);
      
      toast.success('Form completed and saved');
      return true;
    } catch (error) {
      console.error('Error completing form:', error);
      toast.error('Failed to save form');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [draftId, formData, formType]);

  // Clear all drafts
  const clearDraft = useCallback(() => {
    formDraftService.clearDraftFromCache(formType);
    setDraftId(null);
    setLastSaved(null);
    hasChangesRef.current = false;
  }, [formType]);

  return {
    formData,
    setFormData: updateFormData,
    draftId,
    lastSaved,
    isSaving,
    hasDraft,
    restoreDraft,
    discardDraft,
    saveDraft,
    completeForm,
    clearDraft
  };
}
