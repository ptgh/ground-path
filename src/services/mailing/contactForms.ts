import { supabase } from '@/integrations/supabase/client';
import type { ContactFormSubmission } from './types';
import { sendContactFormNotification } from './emailHelpers';

const isSupabaseAvailable = (): boolean => supabase !== null;

export async function submitContactForm(
  data: Omit<ContactFormSubmission, 'id' | 'created_at' | 'updated_at'>,
) {
  if (!isSupabaseAvailable()) {
    console.log('Mock contact form submission:', data);
    return {
      id: 'mock-contact-id',
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const { data: result, error } = await supabase!
    .from('contact_forms')
    .insert([
      {
        ...data,
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error('Failed to submit contact form. Please try again.');
  }

  await sendContactFormNotification(result as unknown as ContactFormSubmission);
  return result;
}
