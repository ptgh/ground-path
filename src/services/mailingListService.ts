/**
 * Backwards-compatible facade for mailing-list functionality.
 * The implementation has been split into focused modules under `src/services/mailing/`.
 *
 * Existing call sites continue to use `mailingListService.method(...)` unchanged.
 */
import {
  subscribeToMailingList,
  confirmSubscription,
  unsubscribe,
  getSubscribers,
} from './mailing/subscriptions';
import { submitContactForm } from './mailing/contactForms';

export type { MailingListSubscriber, ContactFormSubmission } from './mailing/types';

export const mailingListService = {
  subscribeToMailingList,
  confirmSubscription,
  /**
   * Tokenised unsubscribe. Pass the unsubscribe_token from the email link.
   * The optional `opts` argument is accepted for backwards compatibility
   * but the legacy "by email" path has been removed — only tokens are honoured.
   */
  unsubscribe: (token: string, _opts?: { byToken?: boolean }) => unsubscribe(token),
  submitContactForm,
  getSubscribers,
};
