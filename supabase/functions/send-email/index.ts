import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { MailingListConfirmationEmail } from './_templates/mailing-list-confirmation.tsx';
import { getCorsHeaders, unauthorizedResponse, verifyAuth, SYSTEM_CALLER_USER_ID } from '../_shared/auth.ts';
import { writeAudit, fireAndForgetOpsLog } from '../_shared/m365.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const resendApiKey = Deno.env.get('RESEND_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey!);

interface EmailRequest {
  type: 'contact_form' | 'mailing_list_confirmation' | 'newsletter';
  to: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

/**
 * Fire-and-forget audit writer for send-email.
 *
 * Writes one m365_audit_log row per invocation + mirrors to OpsLog Excel.
 * Never awaits / blocks the user-visible response. Any failure is swallowed
 * and logged to console — the email send is what matters; the audit row is
 * observability only.
 *
 * PII discipline: request_metadata only contains `to`, `subject`,
 * `template_name`, and `triggered_by`. The email body / template `data`
 * payload is never logged.
 */
function emitSendEmailAudit(args: {
  to: string;
  subject: string;
  templateName: string;
  triggeredBy: string | null;
  status: 'success' | 'error';
  messageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  latencyMs: number;
  req: Request;
}): void {
  const requestMetadata = {
    to: args.to,
    subject: args.subject,
    template_name: args.templateName,
    triggered_by: args.triggeredBy,
  };
  const responseMetadata = args.status === 'success'
    ? { message_id: args.messageId ?? null }
    : {
        error_code: args.errorCode ?? null,
        error_message: (args.errorMessage ?? '').slice(0, 500),
      };

  const p = writeAudit(
    supabase,
    { userId: SYSTEM_CALLER_USER_ID, email: args.triggeredBy ?? null },
    {
      function_name: 'send-email',
      action: 'send',
      target: args.to,
      status: args.status,
      error_message: args.status === 'error' ? (args.errorMessage ?? '').slice(0, 500) : null,
      request_metadata: {
        ...requestMetadata,
        response_metadata: responseMetadata,
        latency_ms: args.latencyMs,
      },
    },
    args.req,
  ).catch((err) => console.error('send-email audit write failed (non-fatal):', err));

  // deno-lint-ignore no-explicit-any
  const er = (globalThis as any).EdgeRuntime;
  if (er && typeof er.waitUntil === 'function') {
    try { er.waitUntil(p); } catch { /* ignore */ }
  }

  // Mirror to OpsLog Excel (also fire-and-forget). Same shape as Postgres row.
  fireAndForgetOpsLog(
    supabase,
    { email: args.triggeredBy ?? null },
    {
      function_name: 'send-email',
      action: 'send',
      target: `${args.templateName}:${args.to}`,
      status: args.status,
      duration_ms: args.latencyMs,
      notes: args.status === 'success'
        ? `message_id=${args.messageId ?? ''}`
        : `error=${(args.errorMessage ?? '').slice(0, 200)}`,
    },
  );
}

const handler = async (req: Request): Promise<Response> => {
  // Capture latency clock BEFORE any awaits / DB calls so audit reflects
  // total wall-clock time from request entry to response dispatch.
  const startedAt = Date.now();

  const origin = req.headers.get('origin');
  // send-email is user-facing, so also allow local dev origin
  const corsHeaders = getCorsHeaders(origin, true);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify JWT authentication
  const { userId, error: authError } = await verifyAuth(req, supabaseUrl, supabaseAnonKey);
  if (authError) {
    return unauthorizedResponse(corsHeaders);
  }

  // Resolve triggered_by: cron trigger name > caller email > null.
  // We do NOT block on resolving the caller email — best-effort lookup.
  const cronTrigger = req.headers.get('X-Cron-Trigger');
  let triggeredBy: string | null = cronTrigger ?? null;
  if (!triggeredBy && userId && userId !== SYSTEM_CALLER_USER_ID) {
    try {
      const { data: u } = await supabase.auth.admin.getUserById(userId);
      triggeredBy = u?.user?.email ?? null;
    } catch {
      triggeredBy = null;
    }
  }

  try {
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping email send');
      emitSendEmailAudit({
        to: 'unknown',
        subject: 'unknown',
        templateName: 'unknown',
        triggeredBy,
        status: 'success',
        messageId: null,
        latencyMs: Date.now() - startedAt,
        req,
      });
      return new Response(JSON.stringify({ success: true, message: 'Email would be sent (dev mode)' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { type, to, data }: EmailRequest = await req.json();

    let emailContent = '';
    let subject = '';

    switch (type) {
      case 'contact_form':
        subject = `New Contact Form Submission: ${data.subject} - groundpath`;
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">New Contact Form Submission - groundpath</h1>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Name:</strong> ${data.name}</p>
              <p style="margin: 10px 0;"><strong>Email:</strong> ${data.email}</p>
              <p style="margin: 10px 0;"><strong>Subject:</strong> ${data.subject}</p>
              <div style="margin: 20px 0;">
                <strong>Message:</strong>
                <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px; border-left: 4px solid #2563eb;">
                  ${data.message.replace(/\n/g, '<br>')}
                </div>
              </div>
              <p style="margin: 10px 0; color: #64748b; font-size: 14px;"><em>Submitted at: ${new Date().toLocaleString()}</em></p>
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              This message was sent through the groundpath contact form.
            </p>
          </div>
        `;
        break;
      
      case 'mailing_list_confirmation': {
        subject = 'Confirm your subscription - groundpath professional resources';

        // Look up the per-subscriber unsubscribe token (set by DB default on insert)
        const { data: sub } = await supabase
          .from('mailing_list')
          .select('unsubscribe_token')
          .eq('email', to)
          .maybeSingle();

        const unsubscribeUrl = sub?.unsubscribe_token
          ? `https://groundpath.com.au/unsubscribe?token=${sub.unsubscribe_token}`
          : `https://groundpath.com.au/unsubscribe`;

        emailContent = await renderAsync(
          React.createElement(MailingListConfirmationEmail, {
            name: data.name,
            confirmationUrl: data.confirmationUrl,
            unsubscribeUrl,
          })
        );
        break;
      }
      
      default:
        throw new Error('Invalid email type');
    }

    // For contact forms, send to admin; for confirmations, send to subscriber
    const recipient = type === 'contact_form' ? to : to;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'groundpath <noreply@groundpath.com.au>',
        to: [recipient],
        subject,
        html: emailContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      emitSendEmailAudit({
        to: recipient,
        subject,
        templateName: type,
        triggeredBy,
        status: 'error',
        errorCode: `resend_http_${emailResponse.status}`,
        errorMessage: errorText,
        latencyMs: Date.now() - startedAt,
        req,
      });
      throw new Error('Failed to send email');
    }

    const result = await emailResponse.json();
    console.log('Email sent successfully:', result);

    emitSendEmailAudit({
      to: recipient,
      subject,
      templateName: type,
      triggeredBy,
      status: 'success',
      messageId: result?.id ?? null,
      latencyMs: Date.now() - startedAt,
      req,
    });

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-email function:', error);
    const msg = error instanceof Error ? error.message : String(error);
    // Only emit a generic-error audit row if we haven't already emitted one
    // for the specific Resend HTTP failure above. The duplicate-on-throw is
    // acceptable observability noise; double-counting is preferable to a
    // missing row when the function blew up before the send.
    if (!msg.includes('Failed to send email')) {
      emitSendEmailAudit({
        to: 'unknown',
        subject: 'unknown',
        templateName: 'unknown',
        triggeredBy,
        status: 'error',
        errorCode: 'handler_exception',
        errorMessage: msg,
        latencyMs: Date.now() - startedAt,
        req,
      });
    }
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
