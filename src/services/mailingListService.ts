import { supabase } from '@/integrations/supabase/client';

export interface MailingListSubscriber {
  id?: string;
  email: string;
  name?: string;
  status: 'pending' | 'confirmed' | 'unsubscribed';
  subscription_date?: string;
  confirmation_token?: string;
  source: string;
  preferences?: Record<string, any>;
}

export interface ContactFormSubmission {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  created_at?: string;
  updated_at?: string;
}

class MailingListService {
  private isSupabaseAvailable(): boolean {
    return supabase !== null;
  }

  async subscribeToMailingList(data: Omit<MailingListSubscriber, 'id' | 'subscription_date' | 'confirmation_token'>) {
    if (!this.isSupabaseAvailable()) {
      // Mock behavior when Supabase isn't configured
      console.log('Mock subscription:', data);
      return {
        id: 'mock-id',
        ...data,
        status: 'pending' as const,
        subscription_date: new Date().toISOString(),
        confirmation_token: 'mock-token'
      };
    }

    const confirmationToken = this.generateConfirmationToken();
    
    const { data: result, error } = await supabase!
      .from('mailing_list')
      .insert([
        {
          ...data,
          status: 'pending',
          confirmation_token: confirmationToken,
          subscription_date: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('This email is already subscribed to our mailing list.');
      }
      throw new Error('Failed to subscribe. Please try again.');
    }

    await this.sendConfirmationEmail(data.email, confirmationToken);
    return result;
  }

  async confirmSubscription(token: string) {
    if (!this.isSupabaseAvailable()) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error } = await supabase!
      .from('mailing_list')
      .update({ status: 'confirmed', confirmation_token: null })
      .eq('confirmation_token', token)
      .select()
      .single();

    if (error) {
      throw new Error('Invalid or expired confirmation token.');
    }

    return data;
  }

  async unsubscribe(email: string) {
    if (!this.isSupabaseAvailable()) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error } = await supabase!
      .from('mailing_list')
      .update({ status: 'unsubscribed' })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to unsubscribe. Please try again.');
    }

    return data;
  }

  async submitContactForm(data: Omit<ContactFormSubmission, 'id' | 'created_at' | 'updated_at'>) {
    if (!this.isSupabaseAvailable()) {
      // Mock behavior when Supabase isn't configured
      console.log('Mock contact form submission:', data);
      return {
        id: 'mock-contact-id',
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error('Failed to submit contact form. Please try again.');
    }

    await this.sendContactFormNotification(result as unknown as ContactFormSubmission);
    return result;
  }

  async getSubscribers(status?: string) {
    if (!this.isSupabaseAvailable()) {
      throw new Error('Supabase is not configured.');
    }

    let query = supabase!
      .from('mailing_list')
      .select('*')
      .order('subscription_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Failed to fetch subscribers.');
    }

    return data;
  }

  private generateConfirmationToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private async sendConfirmationEmail(email: string, token: string) {
    try {
      const { error } = await supabase!.functions.invoke('send-email', {
        body: {
          type: 'mailing_list_confirmation',
          to: email,
          data: {
            token,
            confirmationUrl: `${window.location.origin}/confirm?token=${token}`,
            name: undefined // Will be populated by the service
          }
        }
      });

      if (error) {
        console.error('Failed to send confirmation email:', error);
      } else {
        console.log('Confirmation email sent successfully to:', email);
      }
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    }
  }

  private async sendContactFormNotification(submission: ContactFormSubmission) {
    try {
      const { error } = await supabase!.functions.invoke('send-email', {
        body: {
          type: 'contact_form',
          to: 'admin@groundpath.com.au',
          data: submission
        }
      });

      if (error) {
        console.error('Failed to send contact form notification:', error);
      } else {
        console.log('Contact form notification sent successfully');
      }
    } catch (error) {
      console.error('Error sending contact form notification:', error);
    }
  }
}

export const mailingListService = new MailingListService();
