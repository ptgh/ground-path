import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type NotificationType = 'new_request' | 'status_change' | 'client_cancellation' | 'client_request_received' | 'meeting_ready';

interface BookingNotificationRequest {
  type?: NotificationType;
  practitionerId?: string;
  requestedDate?: string;
  requestedTime?: string;
  bookingId?: string;
  newStatus?: string;
}

/* ─── Brand constants ─── */
const SAGE = '#7B9B85';
const SAGE_DARK = '#4a7c4f';
const INK = '#1a1a1a';
const MUTED = '#6b7280';
const SOFT_BG = '#f6f8f6';
const BORDER = '#e5e7eb';
const REVIEW_URL = 'https://groundpath.com.au/practitioner/dashboard?tab=booking';
const CLIENT_BOOKINGS_URL = 'https://groundpath.com.au/dashboard';

/* ─── Helpers ─── */

const formatTime = (t: string) => {
  const [hRaw, mRaw] = t.split(':').map(Number);
  const h = hRaw || 0;
  const m = mRaw || 0;
  const mm = m.toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${mm} ${period}`;
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
      from: 'groundpath <connect@groundpath.com.au>',
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

/* ─── Branded inline SVG icons (sage stroke, no emoji) ─── */

const iconCalendar = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${SAGE_DARK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-right:6px;"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`;
const iconClock = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${SAGE_DARK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-right:6px;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;
const iconVideo = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${SAGE_DARK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-right:6px;"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>`;
const iconHourglass = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px;margin-right:6px;"><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>`;
const iconCheck = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${SAGE_DARK}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px;margin-right:6px;"><path d="M20 6 9 17l-5-5"/></svg>`;
const iconX = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px;margin-right:6px;"><path d="M18 6 6 18M6 6l12 12"/></svg>`;

/* groundpath wordmark + spiral mark (header) */
const brandHeader = `
  <div style="text-align:center;padding:24px 0 8px;">
    <svg width="36" height="36" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
      <path d="M32 8c13 0 22 9 22 22s-9 22-22 22-22-9-22-22c0-7 4-13 10-16" stroke="${SAGE}" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path d="M32 18c7 0 12 5 12 12s-5 12-12 12-12-5-12-12c0-4 2-7 5-9" stroke="${SAGE}" stroke-width="3" stroke-linecap="round" fill="none"/>
    </svg>
    <span style="display:inline-block;vertical-align:middle;margin-left:8px;font-family:'Inter',Arial,sans-serif;font-size:18px;font-weight:500;letter-spacing:-0.01em;color:${INK};">groundpath</span>
  </div>
`;

/* ─── Email template wrapper ─── */
function buildEmailHtml(
  title: string,
  intro: string,
  detailRows: string,
  ctaUrl: string,
  ctaLabel: string,
  footerText: string,
  accentBarColor = SAGE_DARK,
  panelBg = SOFT_BG,
): string {
  return `
  <div style="background-color:#f3f4f6;padding:24px 12px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
      ${brandHeader}
      <div style="padding:8px 32px 32px;">
        <h1 style="font-size:20px;font-weight:600;color:${INK};margin:0 0 16px;text-align:center;letter-spacing:-0.01em;">${title}</h1>
        <p style="font-size:14px;color:${MUTED};line-height:1.55;margin:0 0 22px;text-align:center;">${intro}</p>
        <div style="background:${panelBg};border-left:3px solid ${accentBarColor};padding:16px 18px;border-radius:0 8px 8px 0;margin:0 0 24px;">
          ${detailRows}
        </div>
        <div style="text-align:center;margin:0 0 8px;">
          <a href="${ctaUrl}" style="display:inline-block;background-color:${SAGE_DARK};color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:500;letter-spacing:0.01em;">
            ${ctaLabel}
          </a>
        </div>
        <p style="font-size:12px;color:#9ca3af;text-align:center;margin:24px 0 0;line-height:1.5;">
          ${footerText}
        </p>
      </div>
    </div>
    <p style="text-align:center;font-size:11px;color:#9ca3af;margin:16px 0 0;">groundpath — grounded mental health support · groundpath.com.au</p>
  </div>`;
}

function buildDetailRows(date: string, time: string, durationMin: number) {
  return `
    <p style="font-size:13px;color:#374151;margin:0 0 8px;line-height:1.6;">${iconCalendar}<strong style="color:${INK};">Date</strong> &nbsp;${date}</p>
    <p style="font-size:13px;color:#374151;margin:0 0 8px;line-height:1.6;">${iconClock}<strong style="color:${INK};">Time</strong> &nbsp;${time}</p>
    <p style="font-size:13px;color:#374151;margin:0;line-height:1.6;">${iconVideo}<strong style="color:${INK};">Type</strong> &nbsp;Video session (${durationMin} min)</p>
  `;
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
    `New booking request from ${clientName} — groundpath`,
    buildEmailHtml(
      'New Booking Request — Awaiting Your Approval',
      `<strong style="color:${INK};">${clientName}</strong> has submitted a booking request and is waiting for you to confirm or decline it.`,
      buildDetailRows(requestedDate, requestedTime, 50),
      REVIEW_URL,
      'Review Booking Request',
      'Open your groundpath dashboard to confirm or decline this request.',
    ),
  );
}

async function handleClientRequestReceived(
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

  const { data: { user: clientUser } } = await supabase.auth.admin.getUserById(clientUserId);
  if (!clientUser?.email) {
    return new Response(JSON.stringify({ success: true, skipped: true, reason: 'No client email' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: practProfile } = await supabase
    .from('profiles').select('display_name').eq('user_id', practitionerId).single();
  const practName = practProfile?.display_name || 'your practitioner';

  return await sendEmail(
    clientUser.email,
    `Booking request received — pending approval — groundpath`,
    buildEmailHtml(
      'Booking Request Received',
      `Thank you — your booking request with <strong style="color:${INK};">${practName}</strong> has been received and is now <strong style="color:#b45309;">pending approval</strong>. You'll receive another email as soon as it's confirmed or declined.`,
      `<p style="font-size:13px;color:#374151;margin:0 0 10px;line-height:1.6;">${iconHourglass}<strong style="color:${INK};">Status</strong> &nbsp;Awaiting practitioner approval</p>` +
        buildDetailRows(requestedDate, requestedTime, 50),
      CLIENT_BOOKINGS_URL,
      'View My Bookings',
      'You can review or cancel pending requests anytime from your groundpath dashboard.',
      '#d97706',
      '#fffbeb',
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
  const accent = isConfirmed ? SAGE_DARK : '#dc2626';
  const panelBg = isConfirmed ? SOFT_BG : '#fef2f2';
  const titleIcon = isConfirmed ? iconCheck : iconX;
  const title = isConfirmed ? `${titleIcon}Booking Confirmed` : `${titleIcon}Booking Declined`;
  const intro = isConfirmed
    ? `Good news — <strong style="color:${INK};">${practName}</strong> has confirmed your booking. We'll send your Teams meeting link in a separate email shortly.`
    : `<strong style="color:${INK};">${practName}</strong> was unable to confirm this booking. You're welcome to submit a new request for another time.`;

  return await sendEmail(
    clientUser.email,
    `Booking ${isConfirmed ? 'confirmed' : 'declined'} — ${dateStr} — groundpath`,
    buildEmailHtml(
      title,
      intro,
      buildDetailRows(dateStr, timeStr, booking.duration_minutes),
      CLIENT_BOOKINGS_URL,
      'View My Bookings',
      isConfirmed
        ? 'Your Teams meeting link will arrive in a separate email once it has been generated.'
        : 'You can submit a new booking request anytime from your dashboard.',
      accent,
      panelBg,
    ),
  );
}

async function handleMeetingReady(
  supabase: ReturnType<typeof createClient>,
  body: BookingNotificationRequest,
): Promise<Response> {
  const { bookingId } = body;
  if (!bookingId) {
    return new Response(JSON.stringify({ error: 'Missing bookingId' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: booking, error: bookingErr } = await supabase
    .from('booking_requests').select('*').eq('id', bookingId).single();
  if (bookingErr || !booking || !booking.meeting_url) {
    return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Booking or meeting URL missing' }), {
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
    .from('profiles').select('display_name').eq('user_id', booking.practitioner_id).single();
  const practName = practProfile?.display_name || 'your practitioner';

  const dateStr = formatDate(booking.requested_date);
  const timeStr = `${formatTime(booking.requested_start_time)} – ${formatTime(booking.requested_end_time)}`;

  const TEAMS_PURPLE = '#5b5fc7';
  const meetingUrl = booking.meeting_url as string;

  const html = `
  <div style="background-color:#f3f4f6;padding:24px 12px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
      ${brandHeader}
      <div style="padding:8px 32px 32px;">
        <h1 style="font-size:20px;font-weight:600;color:${INK};margin:0 0 12px;text-align:center;letter-spacing:-0.01em;">
          ${iconCheck}Your Teams Session is Ready
        </h1>
        <p style="font-size:14px;color:${MUTED};line-height:1.6;margin:0 0 20px;text-align:center;">
          Welcome — your secure video session with <strong style="color:${INK};">${practName}</strong> is set. We're glad you're taking this step. Your conversation is private and confidential.
        </p>
        <div style="background:${SOFT_BG};border-left:3px solid ${SAGE_DARK};padding:16px 18px;border-radius:0 8px 8px 0;margin:0 0 24px;">
          ${buildDetailRows(dateStr, timeStr, booking.duration_minutes)}
        </div>
        <div style="text-align:center;margin:0 0 24px;">
          <a href="${meetingUrl}" style="display:inline-block;background-color:${TEAMS_PURPLE};color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.01em;">
            ${iconVideo.replace(SAGE_DARK, '#ffffff')}Join Teams Meeting
          </a>
        </div>
        <div style="background:#fafafa;border:1px solid ${BORDER};border-radius:8px;padding:16px 18px;margin:0 0 20px;">
          <p style="font-size:13px;font-weight:600;color:${INK};margin:0 0 10px;">How to join</p>
          <ul style="font-size:13px;color:#374151;line-height:1.7;margin:0;padding-left:18px;">
            <li>Click <strong>Join Teams Meeting</strong> about 5 minutes before your start time.</li>
            <li>Allow your browser or the Teams app to access your microphone and camera.</li>
            <li>You'll wait briefly in the lobby until ${practName} admits you to the session.</li>
            <li>No Teams account needed — you can join straight from your browser if the app isn't installed.</li>
          </ul>
        </div>
        <p style="font-size:12px;color:#9ca3af;text-align:center;margin:24px 0 0;line-height:1.5;">
          If you can't make it, please cancel from your dashboard as soon as possible so the time can be released.
        </p>
      </div>
    </div>
    <p style="text-align:center;font-size:11px;color:#9ca3af;margin:16px 0 0;">groundpath — grounded mental health support · groundpath.com.au</p>
  </div>`;

  return await sendEmail(
    clientUser.email,
    `Your Teams session is ready — ${dateStr} — groundpath`,
    html,
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
    `Booking cancelled by ${clientName} — groundpath`,
    buildEmailHtml(
      `${iconX}Booking Cancelled`,
      `<strong style="color:${INK};">${clientName}</strong> has cancelled their booking request. This time slot is now available again.`,
      buildDetailRows(dateStr, timeStr, booking.duration_minutes),
      REVIEW_URL,
      'Open Dashboard',
      'Manage your availability and incoming requests in your groundpath dashboard.',
      '#dc2626',
      '#fef2f2',
    ),
  );
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
      case 'client_request_received':
        emailResponse = await handleClientRequestReceived(supabase, body, callerUserId);
        break;
      default:
        emailResponse = await handleNewRequest(supabase, body, callerUserId);
        break;
    }

    // Fire-and-forget Teams channel notification (skip for client_request_received — it's a duplicate of new_request to the client)
    if (notificationType !== 'client_request_received') {
      const teamsType = notificationType === 'status_change'
        ? (body.newStatus === 'confirmed' ? 'confirmed' : 'declined')
        : notificationType === 'client_cancellation' ? 'cancelled' : 'new_request';

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
    }

    return emailResponse;
  } catch (error) {
    console.error('Error in booking-notification:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
