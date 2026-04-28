import { supabase } from '@/integrations/supabase/client';
import type { ContactFormSubmission } from './types';
import { sendContactFormNotification } from './emailHelpers';

const isSupabaseAvailable = (): boolean => supabase !== null;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Fire a Teams ops-alerts notification for a new contact-form submission.
 * Failures are swallowed so Teams problems never break the form submission
 * or the email notification (which has already fired by the time this runs).
 */
async function notifyTeamsOpsAlert(submission: ContactFormSubmission) {
  if (!supabase) return;
  try {
    const intakeType = submission.intake_type;
    const importance = intakeType === 'client' || intakeType === 'practitioner' ? 'high' : 'normal';
    const submittedAt = submission.created_at ?? new Date().toISOString();
    const bodyHtml = `
<p><b>From:</b> ${escapeHtml(submission.name)} (${escapeHtml(submission.email)})</p>
<p><b>Type:</b> ${escapeHtml(intakeType)} &middot; <b>Source:</b> form</p>
<p><b>Subject:</b> ${escapeHtml(submission.subject)}</p>
<p><b>Message:</b></p>
<p>${escapeHtml(submission.message).replace(/\n/g, '<br>')}</p>
<p><i>Submitted at ${escapeHtml(submittedAt)}</i></p>`.trim();

    const { error } = await supabase.functions.invoke('ms-teams-notify', {
      body: {
        configKey: 'teams.alerts',
        subject: `New ${intakeType} via form — ${submission.subject}`,
        bodyHtml,
        importance,
      },
    });
    if (error) console.error('Teams ops-alert notify failed (non-fatal):', error);
  } catch (err) {
    console.error('Teams ops-alert notify threw (non-fatal):', err);
  }
}

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

  const submittedAt = new Date().toISOString();
  // Generate the id client-side so we have it for the ack-email invoke
  // without needing a SELECT-after-INSERT (anon role has INSERT but not
  // SELECT on contact_forms).
  const insertedId = crypto.randomUUID();
  const submission: ContactFormSubmission = {
    ...data,
    id: insertedId,
    status: 'new',
    intake_source: 'form',
    created_at: submittedAt,
    updated_at: submittedAt,
  };

  const { error } = await supabase!
    .from('contact_forms')
    .insert([
      {
        ...submission,
        status: 'new',
        intake_source: 'form',
        created_at: submittedAt,
        updated_at: submittedAt,
      },
    ]);

  if (error) {
    throw new Error('Your message could not be sent just now. Please try again in a moment.');
  }

  const insertedId = inserted?.id ?? null;
  const finalSubmission: ContactFormSubmission = insertedId
    ? { ...submission, id: insertedId }
    : submission;

  await sendContactFormNotification(finalSubmission);
  // Teams is best-effort and must not break the form submission.
  await notifyTeamsOpsAlert(finalSubmission);

  // Auto-ack: fire-and-forget. Resend / function outages must not break
  // the form submission — the row's acknowledgement_status stays 'pending'
  // and can be retried later.
  if (insertedId) {
    try {
      const ackPromise = supabase!.functions.invoke('send-contact-acknowledgement', {
        body: { contact_form_id: insertedId },
      });
      // Detach: don't await. Surface errors to console only.
      ackPromise
        .then(({ error: ackErr }) => {
          if (ackErr) console.error('send-contact-acknowledgement (form) failed (non-fatal):', ackErr);
        })
        .catch((err) => console.error('send-contact-acknowledgement (form) threw (non-fatal):', err));
    } catch (err) {
      console.error('send-contact-acknowledgement (form) invoke threw (non-fatal):', err);
    }
  }

  return finalSubmission;
}
