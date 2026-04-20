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
