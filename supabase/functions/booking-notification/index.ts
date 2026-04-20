import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type NotificationType = 'new_request' | 'status_change' | 'client_cancellation' | 'client_request_received' | 'meeting_ready' | 'session_reminder';

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
const SAGE_TINT = '#eef3ef';
const SAGE_DARK = '#4a7c4f';
const INK = '#1a1a1a';
const MUTED = '#6b7280';
const SOFT_BG = '#f6f8f6';
const BORDER = '#e5e7eb';
const REVIEW_URL = 'https://groundpath.com.au/practitioner/dashboard?tab=booking&view=sessions';
const CLIENT_BOOKINGS_URL = 'https://groundpath.com.au/dashboard';
const SESSION_URL = (bookingId: string) => `https://groundpath.com.au/session/${bookingId}`;

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

/**
 * Build an iCalendar (.ics) attachment for the booking session.
 * Times are AEST (+10:00). Converted to UTC for DTSTART/DTEND.
 */
function buildIcsAttachment(
  bookingId: string,
  date: string,
  startTime: string,
  endTime: string,
  practitionerName: string,
  meetingUrl: string,
): EmailAttachment {
  const norm = (t: string) => (t.length === 5 ? `${t}:00` : t);
  // AEST is +10:00 — subtract 10h to get UTC
  const toUtcStamp = (d: string, t: string): string => {
    const local = new Date(`${d}T${norm(t)}+10:00`);
    const y = local.getUTCFullYear();
    const mo = String(local.getUTCMonth() + 1).padStart(2, '0');
    const da = String(local.getUTCDate()).padStart(2, '0');
    const h = String(local.getUTCHours()).padStart(2, '0');
    const mi = String(local.getUTCMinutes()).padStart(2, '0');
    const s = String(local.getUTCSeconds()).padStart(2, '0');
    return `${y}${mo}${da}T${h}${mi}${s}Z`;
  };
  const dtStart = toUtcStamp(date, startTime);
  const dtEnd = toUtcStamp(date, endTime);
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const escape = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
  const summary = escape(`groundpath session with ${practitionerName}`);
  const description = escape(
    `Your secure video session with ${practitionerName}.\n\nJoin Teams Meeting: ${meetingUrl}\n\nClick the link about 5 minutes before your start time. You'll wait briefly in the lobby until you're admitted.`,
  );
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//groundpath//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${bookingId}@groundpath.com.au`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${escape(meetingUrl)}`,
    `URL:${meetingUrl}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${summary}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  // base64 encode
  const b64 = btoa(unescape(encodeURIComponent(ics)));
  return {
    filename: 'groundpath-session.ics',
    content: b64,
    contentType: 'text/calendar; charset=utf-8; method=PUBLISH',
  };
}


interface EmailAttachment {
  filename: string;
  content: string; // base64
  contentType?: string;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: EmailAttachment[],
): Promise<Response> {
  const payload: Record<string, unknown> = {
    from: 'groundpath <connect@groundpath.com.au>',
    to: [to],
    subject,
    html,
  };
  if (attachments && attachments.length > 0) {
    payload.attachments = attachments;
  }

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
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

/* groundpath wordmark + spiral mark (header)
   Hosted PNG (most email clients block inline SVG).
   Width 480 keeps it crisp on retina; falls back to alt text "groundpath" when images are blocked. */
/* Compact email header — small circular logo + wordmark, not a full banner.
   Renders cleanly in Gmail/Apple Mail; "GP" text fallback if image blocked. */
const LOGO_URL = 'https://groundpath.com.au/email/groundpath-logo.png';
const brandHeader = `
  <div style="background:#ffffff;text-align:center;padding:24px 16px 12px;border-bottom:1px solid ${BORDER};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
      <tr>
        <td style="vertical-align:middle;padding-right:10px;">
          <div style="width:36px;height:36px;border-radius:50%;background:${SAGE_TINT};color:${SAGE};font-weight:700;font-size:14px;line-height:36px;text-align:center;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
            <img src="${LOGO_URL}" width="36" height="36" alt="GP" style="display:block;width:36px;height:36px;border-radius:50%;border:0;outline:none;text-decoration:none;" />
          </div>
        </td>
        <td style="vertical-align:middle;">
          <span style="font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:600;color:${INK};letter-spacing:-0.01em;">groundpath</span>
        </td>
      </tr>
    </table>
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

  // Sage hourglass icon (consistent brand colour, no amber)
  const iconHourglassSage = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${SAGE_DARK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px;margin-right:6px;"><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>`;

  return await sendEmail(
    clientUser.email,
    `Booking request received — pending approval — groundpath`,
    buildEmailHtml(
      'Booking Request Received',
      `Thank you — your booking request with <strong style="color:${INK};">${practName}</strong> has been received and is now <strong style="color:${SAGE_DARK};">pending approval</strong>. You'll receive another email as soon as it's confirmed or declined.`,
      `<p style="font-size:13px;color:#374151;margin:0 0 10px;line-height:1.6;">${iconHourglassSage}<strong style="color:${INK};">Status</strong> &nbsp;Awaiting practitioner approval</p>` +
        buildDetailRows(requestedDate, requestedTime, 50),
      CLIENT_BOOKINGS_URL,
      'View My Bookings',
      'You can review or cancel pending requests anytime from your groundpath dashboard.',
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
        <div style="text-align:center;margin:0 0 16px;">
          <a href="${meetingUrl}" style="display:inline-block;background-color:${TEAMS_PURPLE};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.01em;margin:0 4px 8px;">
            ${iconVideo.replace(SAGE_DARK, '#ffffff')}Join Teams Meeting
          </a>
        </div>
        <div style="text-align:center;margin:0 0 24px;">
          <a href="${SESSION_URL(booking.id)}" style="display:inline-block;background-color:#ffffff;color:${SAGE_DARK};text-decoration:none;padding:11px 28px;border-radius:8px;font-size:14px;font-weight:500;border:1.5px solid ${SAGE_DARK};">
            Open in groundpath
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

  const ics = buildIcsAttachment(
    booking.id,
    booking.requested_date,
    booking.requested_start_time,
    booking.requested_end_time,
    practName,
    meetingUrl,
  );

  return await sendEmail(
    clientUser.email,
    `Your Teams session is ready — ${dateStr} — groundpath`,
    html,
    [ics],
  );
}

/**
 * Send a 24-hour reminder email to the client with the Teams join link,
 * how-to-join guide, and ICS attachment. Marks the booking as reminded.
 */
async function handleSessionReminder(
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
  if (bookingErr || !booking) {
    return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Booking not found' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (booking.status !== 'confirmed') {
    return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Booking not confirmed' }), {
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
  const meetingUrl = (booking.meeting_url as string) || '';

  const joinBlock = meetingUrl
    ? `<div style="text-align:center;margin:0 0 12px;">
         <a href="${meetingUrl}" style="display:inline-block;background-color:${TEAMS_PURPLE};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.01em;margin:0 4px 8px;">
           ${iconVideo.replace(SAGE_DARK, '#ffffff')}Join Teams Meeting
         </a>
       </div>
       <div style="text-align:center;margin:0 0 24px;">
         <a href="${SESSION_URL(booking.id)}" style="display:inline-block;background-color:#ffffff;color:${SAGE_DARK};text-decoration:none;padding:11px 28px;border-radius:8px;font-size:14px;font-weight:500;border:1.5px solid ${SAGE_DARK};">
           Open in groundpath
         </a>
       </div>`
    : `<p style="font-size:13px;color:#b45309;text-align:center;margin:0 0 24px;">Your Teams meeting link will arrive shortly. Please check your inbox closer to the session time.</p>`;

  const html = `
  <div style="background-color:#f3f4f6;padding:24px 12px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
      ${brandHeader}
      <div style="padding:8px 32px 32px;">
        <h1 style="font-size:20px;font-weight:600;color:${INK};margin:0 0 12px;text-align:center;letter-spacing:-0.01em;">
          ${iconClock}Reminder — Your Session is Tomorrow
        </h1>
        <p style="font-size:14px;color:${MUTED};line-height:1.6;margin:0 0 20px;text-align:center;">
          A friendly reminder that your secure video session with <strong style="color:${INK};">${practName}</strong> is coming up. We're here whenever you're ready.
        </p>
        <div style="background:${SOFT_BG};border-left:3px solid ${SAGE_DARK};padding:16px 18px;border-radius:0 8px 8px 0;margin:0 0 24px;">
          ${buildDetailRows(dateStr, timeStr, booking.duration_minutes)}
        </div>
        ${joinBlock}
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
          Need to reschedule? Cancel from your dashboard as soon as possible so the time can be released.
        </p>
      </div>
    </div>
    <p style="text-align:center;font-size:11px;color:#9ca3af;margin:16px 0 0;">groundpath — grounded mental health support · groundpath.com.au</p>
  </div>`;

  const attachments: EmailAttachment[] = meetingUrl
    ? [buildIcsAttachment(booking.id, booking.requested_date, booking.requested_start_time, booking.requested_end_time, practName, meetingUrl)]
    : [];

  const result = await sendEmail(
    clientUser.email,
    `Reminder — your session is tomorrow (${dateStr}) — groundpath`,
    html,
    attachments,
  );

  // Mark as reminded so we don't double-send
  await supabase.from('booking_requests')
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq('id', bookingId);

  return result;
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

    const token = authHeader.replace('Bearer ', '');
    let callerUserId = '';

    // Allow service-role calls (used by other edge functions like create-org-booking-meeting
    // and send-booking-reminders for fire-and-forget notifications). Otherwise validate user JWT.
    if (token === supabaseServiceRoleKey) {
      callerUserId = 'service-role';
    } else {
      const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claimsData, error: authError } = await anonClient.auth.getClaims(token);
      if (authError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      callerUserId = claimsData.claims.sub as string;
    }

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
      case 'meeting_ready':
        emailResponse = await handleMeetingReady(supabase, body);
        break;
      case 'session_reminder':
        emailResponse = await handleSessionReminder(supabase, body);
        break;
      default:
        emailResponse = await handleNewRequest(supabase, body, callerUserId);
        break;
    }

    // Fire-and-forget Teams channel notification (skip for client_request_received — it's a duplicate of new_request to the client)
    if (notificationType !== 'client_request_received' && notificationType !== 'meeting_ready' && notificationType !== 'session_reminder') {
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
