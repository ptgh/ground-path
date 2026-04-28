export interface MailingListSubscriber {
  id?: string;
  email: string;
  name?: string;
  status: 'pending' | 'confirmed' | 'unsubscribed';
  subscription_date?: string;
  confirmation_token?: string;
  source: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  preferences?: Record<string, any>;
}

export type IntakeType = 'client' | 'practitioner' | 'other';
export type IntakeSource = 'form' | 'inbox';

export interface ContactFormSubmission {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  intake_type: IntakeType;
  intake_source?: IntakeSource;
  external_message_id?: string | null;
  created_at?: string;
  updated_at?: string;
}
