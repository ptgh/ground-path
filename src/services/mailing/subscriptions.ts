import { supabase } from '@/integrations/supabase/client';
import type { MailingListSubscriber } from './types';
import { generateConfirmationToken, sendConfirmationEmail } from './emailHelpers';

const isSupabaseAvailable = (): boolean => supabase !== null;

export async function subscribeToMailingList(
  data: Omit<MailingListSubscriber, 'id' | 'subscription_date' | 'confirmation_token'>,
) {
  if (!isSupabaseAvailable()) {
    console.log('Mock subscription:', data);
    return {
      id: 'mock-id',
      ...data,
      status: 'pending' as const,
      subscription_date: new Date().toISOString(),
      confirmation_token: 'mock-token',
    };
  }

  const confirmationToken = generateConfirmationToken();

  const { data: result, error } = await supabase!
    .from('mailing_list')
    .insert([
      {
        ...data,
        status: 'pending',
        confirmation_token: confirmationToken,
        subscription_date: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('This email is already subscribed to our mailing list.');
    }
    throw new Error('Failed to subscribe. Please try again.');
  }

  await sendConfirmationEmail(data.email, confirmationToken);
  return result;
}

export async function confirmSubscription(token: string) {
  if (!isSupabaseAvailable()) {
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

/**
 * Unsubscribe by token — proves the holder of the original email link.
 * The legacy "by email" path has been removed; tokenised links are required.
 */
export async function unsubscribe(token: string) {
  if (!isSupabaseAvailable()) {
    throw new Error('Supabase is not configured.');
  }

  const { data: existing } = await supabase!
    .from('mailing_list')
    .select('id, status')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (!existing) {
    throw new Error('Subscription not found.');
  }
  if (existing.status === 'unsubscribed') {
    throw new Error('already unsubscribed');
  }

  const { data, error } = await supabase!
    .from('mailing_list')
    .update({ status: 'unsubscribed' })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to unsubscribe. Please try again.');
  }

  return data;
}

export async function getSubscribers(status?: string) {
  if (!isSupabaseAvailable()) {
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
