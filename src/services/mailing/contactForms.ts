import { supabase } from '@/integrations/supabase/client';
import type { ContactFormSubmission } from './types';

const isSupabaseAvailable = (): boolean => supabase !== null;

/**
 * Submit the public contact form.
 *
 * The browser only ever calls the public `contact-form-submit` edge function.
 * That function performs the row insert, fires the Teams notification, the
 * admin email, and the acknowledgement email server-side using the cron-secret
 * pattern. The browser never sees any internal secret.
 */
export async function submitContactForm(
  data: Omit<ContactFormSubmission, 'id' | 'created_at' | 'updated_at'>,
) {
  if (!isSupabaseAvailable()) {
    console.log('Mock contact form submission:', data);
    return {
      ok: true,
      contact_form_id: 'mock-contact-id',
      ...data,
    };
  }

  const { data: result, error } = await supabase!.functions.invoke('contact-form-submit', {
    body: {
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      intake_type: data.intake_type,
    },
  });

  if (error) {
    // Surface a friendly message — the function returns 429 for rate limits
    // and 400 for validation, but the SDK collapses these into a generic error.
    const msg = (error as { message?: string }).message
      ?? 'Your message could not be sent just now. Please try again in a moment.';
    throw new Error(msg);
  }

  return result;
}
