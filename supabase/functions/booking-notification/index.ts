import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type NotificationType = 'new_request' | 'status_change';

interface BookingNotificationRequest {
  type?: NotificationType;
  // For new_request
  practitionerId?: string;
  requestedDate?: string;
  requestedTime?: string;
  // For status_change
  bookingId?: string;
  newStatus?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: authError } = await anonClient.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerUserId = claimsData.claims.sub as string;

    const body: BookingNotificationRequest = await req.json();
    const notificationType = body.type || 'new_request';

    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping notification');
      return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Email not configured' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (notificationType === 'status_change') {
      return await handleStatusChange(supabase, body, callerUserId);
    }

    // Default: new_request (practitioner notification)
    return await handleNewRequest(supabase, body, callerUserId);

  } catch (error) {
    console.error('Error in booking-notification:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleNewRequest(
  supabase: ReturnType<typeof createClient>,
  body: BookingNotificationRequest,
  clientUserId: string,
): Promise<Response> {
  const { practitionerId, requestedDate, requestedTime } = body;

  if (!practitionerId || !requestedDate || !requestedTime) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: clientProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', clientUserId)
    .single();
  const clientName = clientProfile?.display_name || 'A client';

  const { data: practitionerProfile } = await supabase
    .from('profiles')
    .select('notification_preferences, display_name')
    .eq('user_id', practitionerId)
    .single();

  const emailEnabled = practitionerProfile?.notification_preferences?.email_messages !== false;
  if (!emailEnabled) {
    return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Notifications disabled' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: { user: practitionerUser }, error: userError } = await supabase.auth.admin.getUserById(practitionerId);
  if (userError || !practitionerUser?.email) {
    return new Response(JSON.stringify({ success: true, skipped: true, reason: 'No email found' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return await sendEmail(
    practitionerUser.email,
    `New booking request from ${clientName} — Groundpath`,
    `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0;">New Booking Request</h1>
      </div>
      <div style="background-color: #f8faf8; border-left: 3px solid #4a7c4f; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
        <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 12px 0;">
          <strong>${clientName}</strong> has requested a session with you.
        </p>
        <p style="font-size: 13px; color: #6b7280; margin: 0;">
          📅 <strong>Date:</strong> ${requestedDate}<br/>
          🕐 <strong>Time:</strong> ${requestedTime}<br/>
          📹 <strong>Type:</strong> Video session (50 min)
        </p>
      </div>
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="https://groundpath.com.au/dashboard" style="display: inline-block; background-color: #4a7c4f; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 14px; font-weight: 500;">
          Review Request
        </a>
      </div>
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0; line-height: 1.5;">
        You can confirm or decline this request from your Groundpath dashboard.
      </p>
    </div>
    `,
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
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fetch booking details
  const { data: booking, error: bookingErr } = await supabase
    .from('booking_requests')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingErr || !booking) {
    return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Booking not found' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get client email
  const { data: { user: clientUser } } = await supabase.auth.admin.getUserById(booking.client_user_id);
  if (!clientUser?.email) {
    return new Response(JSON.stringify({ success: true, skipped: true, reason: 'No client email' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get practitioner name
  const { data: practProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', practitionerUserId)
    .single();
  const practName = practProfile?.display_name || 'Your practitioner';

  const formatTime = (t: string) => {
    const [h] = t.split(':').map(Number);
    return h > 12 ? `${h - 12}:00 PM` : h === 12 ? '12:00 PM' : `${h}:00 AM`;
  };

  const dateStr = new Date(booking.requested_date + 'T00:00:00').toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
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
    `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0;">
          ${statusEmoji} Booking ${statusWord}
        </h1>
      </div>
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
      </p>
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="https://groundpath.com.au/client-dashboard" style="display: inline-block; background-color: #4a7c4f; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 14px; font-weight: 500;">
          View My Bookings
        </a>
      </div>
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0; line-height: 1.5;">
        Groundpath — Your mental health support hub
      </p>
    </div>
    `,
  );
}

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
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const result = await emailResponse.json();
  console.log('Notification email sent:', result.id);

  return new Response(JSON.stringify({ success: true, emailSent: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
