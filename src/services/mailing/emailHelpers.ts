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

/**
 * Notify the inbox owner that a new contact-form submission arrived.
 */
export async function sendContactFormNotification(submission: ContactFormSubmission) {
  if (!supabase) return;
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'contact_form',
        to: 'admin@groundpath.com.au',
        data: submission,
      },
    });
    if (error) {
      console.error('Failed to send contact form notification:', error);
    }
  } catch (error) {
    console.error('Error sending contact form notification:', error);
  }
}

export function generateConfirmationToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
