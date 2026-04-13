import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type NotificationType = 'new_request' | 'status_change' | 'client_cancellation';

interface BookingNotificationRequest {
  type?: NotificationType;
  practitionerId?: string;
  requestedDate?: string;
  requestedTime?: string;
  bookingId?: string;
  newStatus?: string;
}

/* ─── Helpers ─── */

const formatTime = (t: string) => {
  const [h] = t.split(':').map(Number);
  return h > 12 ? `${h - 12}:00 PM` : h === 12 ? '12:00 PM' : `${h}:00 AM`;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

async function sendEmail(to: string, subject: string, html: string): Promise<Response> {
  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Groundpath <connect@groundpath.com.au>',
      to: [to],
      subject,
      html,
    }),
  });

  if (!emailResponse.ok) {
    const errorText = await emailResponse.text();
    console.error('Resend API error:', errorText);
    return new Response(JSON.stringify({ success: true, emailSent: false, error: errorText }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const result = await emailResponse.json();
  console.log('Notification email sent:', result.id);
  return new Response(JSON.stringify({ success: true, emailSent: true }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/* ─── Handlers ─── */

async function handleNewRequest(
  supabase: ReturnType<typeof createClient>,
  body: BookingNotificationRequest,
  clientUserId: string,
): Promise<Response> {
  const { practitionerId, requestedDate, requestedTime } = body;
  if (!practitionerId || !requestedDate || !requestedTime) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: clientProfile } = await supabase
    .from('profiles').select('display_name').eq('user_id', clientUserId).single();
  const clientName = clientProfile?.display_name || 'A client';

  const { data: practitionerProfile } = await supabase
    .from('profiles').select('notification_preferences, display_name').eq('user_id', practitionerId).single();

  if (practitionerProfile?.notification_preferences?.email_messages === false) {
    return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Notifications disabled' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: { user: practitionerUser }, error: userError } = await supabase.auth.admin.getUserById(practitionerId);
  if (userError || !practitionerUser?.email) {
    return new Response(JSON.stringify({ success: true, skipped: true, reason: 'No email found' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return await sendEmail(
    practitionerUser.email,
    `New booking request from ${clientName} — Groundpath`,
    buildEmailHtml('New Booking Request', `
      <div style="background-color: #f8faf8; border-left: 3px solid #4a7c4f; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
        <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 12px 0;">
          <strong>${clientName}</strong> has requested a session with you.
        </p>
        <p style="font-size: 13px; color: #6b7280; margin: 0;">
          📅 <strong>Date:</strong> ${requestedDate}<br/>
          🕐 <strong>Time:</strong> ${requestedTime}<br/>
          📹 <strong>Type:</strong> Video session (50 min)
        </p>
      </div>`,
      'https://groundpath.com.au/practitioner/dashboard?tab=booking',
      'Review Request',
      'You can confirm or decline this request from your Groundpath dashboard.',
    ),
  );
}

async function handleStatusChange(
  supabase: ReturnType<typeof createClient>,
  body: BookingNotificationRequest,
  practitionerUserId: string,
): Promise<Response> {
  const { bookingId, newStatus } = body;
  if (!bookingId || !newStatus) {
    return new Response(JSON.stringify({ error: 'Missing bookingId or newStatus' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: booking, error: bookingErr } = await supabase
    .from('booking_requests').select('*').eq('id', bookingId).single();
  if (bookingErr || !booking) {
    return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Booking not found' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: { user: clientUser } } = await supabase.auth.admin.getUserById(booking.client_user_id);
  if (!clientUser?.email) {
    return new Response(JSON.stringify({ success: true, skipped: true, reason: 'No client email' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: practProfile } = await supabase
    .from('profiles').select('display_name').eq('user_id', practitionerUserId).single();
  const practName = practProfile?.display_name || 'Your practitioner';

  const dateStr = formatDate(booking.requested_date);
  const timeStr = `${formatTime(booking.requested_start_time)} – ${formatTime(booking.requested_end_time)}`;

  const isConfirmed = newStatus === 'confirmed';
  const statusWord = isConfirmed ? 'Confirmed' : 'Declined';
  const statusColor = isConfirmed ? '#4a7c4f' : '#dc2626';
  const statusEmoji = isConfirmed ? '✅' : '❌';
  const extraMessage = isConfirmed
    ? 'Your session is confirmed. Video link details will be provided closer to the date.'
    : 'If you\'d like to reschedule, please submit a new booking request.';

  return await sendEmail(
    clientUser.email,
    `Booking ${statusWord} — ${dateStr} — Groundpath`,
    buildEmailHtml(`${statusEmoji} Booking ${statusWord}`, `
      <div style="background-color: ${isConfirmed ? '#f8faf8' : '#fef2f2'}; border-left: 3px solid ${statusColor}; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
        <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 12px 0;">
          <strong>${practName}</strong> has <strong style="color: ${statusColor}">${statusWord.toLowerCase()}</strong> your booking request.
        </p>
        <p style="font-size: 13px; color: #6b7280; margin: 0;">
          📅 <strong>Date:</strong> ${dateStr}<br/>
          🕐 <strong>Time:</strong> ${timeStr}<br/>
          📹 <strong>Type:</strong> Video session (${booking.duration_minutes} min)
        </p>
      </div>
      <p style="font-size: 13px; color: #6b7280; text-align: center; margin: 0 0 24px 0;">
        ${extraMessage}
      </p>`,
      'https://groundpath.com.au/client-dashboard',
      'View My Bookings',
    ),
  );
}

async function handleClientCancellation(
  supabase: ReturnType<typeof createClient>,
  body: BookingNotificationRequest,
  clientUserId: string,
): Promise<Response> {
  const { bookingId } = body;
  if (!bookingId) {
    return new Response(JSON.stringify({ error: 'Missing bookingId' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: booking, error: bookingErr } = await supabase
    .from('booking_requests').select('*').eq('id', bookingId).single();
  if (bookingErr || !booking) {
    return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Booking not found' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: clientProfile } = await supabase
    .from('profiles').select('display_name').eq('user_id', clientUserId).single();
  const clientName = clientProfile?.display_name || 'A client';

  const { data: practitionerProfile } = await supabase
    .from('profiles').select('notification_preferences').eq('user_id', booking.practitioner_id).single();
  if (practitionerProfile?.notification_preferences?.email_messages === false) {
    return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Notifications disabled' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: { user: practitionerUser } } = await supabase.auth.admin.getUserById(booking.practitioner_id);
  if (!practitionerUser?.email) {
    return new Response(JSON.stringify({ success: true, skipped: true, reason: 'No email found' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const dateStr = formatDate(booking.requested_date);
  const timeStr = `${formatTime(booking.requested_start_time)} – ${formatTime(booking.requested_end_time)}`;

  return await sendEmail(
    practitionerUser.email,
    `Booking cancelled by ${clientName} — Groundpath`,
    buildEmailHtml('❌ Booking Cancelled', `
      <div style="background-color: #fef2f2; border-left: 3px solid #dc2626; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
        <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 12px 0;">
          <strong>${clientName}</strong> has cancelled their booking request.
        </p>
        <p style="font-size: 13px; color: #6b7280; margin: 0;">
          📅 <strong>Date:</strong> ${dateStr}<br/>
          🕐 <strong>Time:</strong> ${timeStr}<br/>
          📹 <strong>Type:</strong> Video session (${booking.duration_minutes} min)
        </p>
      </div>
      <p style="font-size: 13px; color: #6b7280; text-align: center; margin: 0 0 24px 0;">
        This time slot is now available for other bookings.
      </p>`,
      'https://groundpath.com.au/practitioner/dashboard?tab=booking',
      'View Dashboard',
    ),
  );
}

/* ─── Email template wrapper ─── */

function buildEmailHtml(title: string, body: string, ctaUrl?: string, ctaLabel?: string, footerText?: string): string {
  return `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0;">${title}</h1>
      </div>
      ${body}
      ${ctaUrl ? `
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="${ctaUrl}" style="display: inline-block; background-color: #4a7c4f; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 14px; font-weight: 500;">
          ${ctaLabel || 'View'}
        </a>
      </div>` : ''}
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0; line-height: 1.5;">
        ${footerText || 'Groundpath — Your mental health support hub'}
      </p>
    </div>`;
}

/* ─── Teams notification helper ─── */

async function sendTeamsNotification(payload: {
  type: 'new_request' | 'confirmed' | 'declined' | 'cancelled';
  clientName: string;
  practitionerName: string;
  date: string;
  time: string;
}): Promise<void> {
  try {
    const teamsUrl = `${supabaseUrl}/functions/v1/teams-booking-notify`;
    const res = await fetch(teamsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log('Teams notify result:', JSON.stringify(data));
  } catch (err) {
    console.error('Teams notify error (non-blocking):', err);
  }
}

/* ─── Main handler ─── */

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: authError } = await anonClient.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerUserId = claimsData.claims.sub as string;

    const body: BookingNotificationRequest = await req.json();
    const notificationType = body.type || 'new_request';

    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping notification');
      return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Email not configured' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let emailResponse: Response;
    switch (notificationType) {
      case 'status_change':
        emailResponse = await handleStatusChange(supabase, body, callerUserId);
        break;
      case 'client_cancellation':
        emailResponse = await handleClientCancellation(supabase, body, callerUserId);
        break;
      default:
        emailResponse = await handleNewRequest(supabase, body, callerUserId);
        break;
    }

    // Fire-and-forget Teams channel notification
    const teamsType = notificationType === 'status_change'
      ? (body.newStatus === 'confirmed' ? 'confirmed' : 'declined')
      : notificationType === 'client_cancellation' ? 'cancelled' : 'new_request';

    // Resolve names for Teams message
    const { data: callerProfile } = await supabase
      .from('profiles').select('display_name').eq('user_id', callerUserId).single();
    const callerName = callerProfile?.display_name || 'Unknown';

    sendTeamsNotification({
      type: teamsType as 'new_request' | 'confirmed' | 'declined' | 'cancelled',
      clientName: notificationType === 'status_change' ? 'Client' : callerName,
      practitionerName: notificationType === 'status_change' ? callerName : 'Practitioner',
      date: body.requestedDate || 'N/A',
      time: body.requestedTime || 'N/A',
    });

    return emailResponse;
  } catch (error) {
    console.error('Error in booking-notification:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
