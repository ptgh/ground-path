import { supabase } from '@/integrations/supabase/client';
import type { ContactFormSubmission } from './types';

/**
 * Send the double opt-in confirmation email to a new subscriber.
 * Edge function `send-email` injects the tokenised unsubscribe link.
 */
export async function sendConfirmationEmail(email: string, token: string) {
  if (!supabase) return;
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'mailing_list_confirmation',
        to: email,
        data: {
          token,
          confirmationUrl: `https://groundpath.com.au/confirm?token=${token}`,
          name: undefined,
        },
      },
    });
    if (error) {
      console.error('Failed to send confirmation email:', error);
    }
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

// sendContactFormNotification has moved server-side: the public
// `contact-form-submit` edge function now invokes `send-email` internally
// using the cron-secret pattern, so the browser never needs to call it.

export function generateConfirmationToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
