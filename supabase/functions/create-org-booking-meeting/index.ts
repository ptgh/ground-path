import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * create-org-booking-meeting
 *
 * Creates a unique, private Teams meeting for a confirmed native Groundpath booking
 * using the organisation's central Microsoft 365 environment.
 *
 * Privacy model:
 *  - Each booking gets its own distinct meeting (never reused)
 *  - Lobby is enabled by default (lobbyBypassScope = 'organizer')
 *  - allowedPresenters = 'roleIsPresenter' — practitioner is treated as presenter
 *  - Attendees are restricted to practitioner + client emails where available
 *
 * Production flow (TODO — requires Microsoft Entra app with OnlineMeetings.ReadWrite):
 *  1. Load org Microsoft integration + validate connected state
 *  2. Load booking + practitioner/client details
 *  3. POST https://graph.microsoft.com/v1.0/users/{organizer}/onlineMeetings
 *  4. Persist meeting_url, external_meeting_id, meeting_status to booking_requests
 */
serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Authenticate caller
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } },
    );
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const { data: claimsData, error: authErr } = await anonClient.auth.getClaims(token);
    if (authErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerUserId = claimsData.claims.sub as string;

    const { bookingId } = await req.json();
    if (!bookingId) {
      return new Response(JSON.stringify({ error: 'bookingId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load booking
    const { data: booking, error: bkErr } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bkErr || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate caller is the practitioner for this booking
    if (booking.practitioner_id !== callerUserId) {
      return new Response(JSON.stringify({ error: 'Only the assigned practitioner can create meetings' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (booking.status !== 'confirmed') {
      return new Response(JSON.stringify({ error: 'Booking must be confirmed before creating a meeting' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if meeting already exists
    if (booking.meeting_url && booking.meeting_status === 'created') {
      return new Response(JSON.stringify({
        success: true,
        already_exists: true,
        meeting_url: booking.meeting_url,
        meeting_status: 'created',
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load org Microsoft integration
    const { data: integration } = await supabase
      .from('org_microsoft_integration')
      .select('*')
      .eq('provider', 'microsoft')
      .maybeSingle();

    if (!integration || integration.connection_status !== 'connected') {
      // Record the attempt
      await supabase.from('booking_requests').update({
        meeting_status: 'skipped',
        meeting_last_error: integration
          ? `Microsoft integration status: ${integration.connection_status}`
          : 'Microsoft integration not configured',
        meeting_last_attempt_at: new Date().toISOString(),
        meeting_retry_count: (booking.meeting_retry_count || 0) + 1,
      }).eq('id', bookingId);

      return new Response(JSON.stringify({
        success: false,
        meeting_status: 'skipped',
        reason: integration
          ? `Microsoft integration is ${integration.connection_status}, not connected`
          : 'Microsoft 365 integration has not been configured',
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!integration.teams_enabled) {
      await supabase.from('booking_requests').update({
        meeting_status: 'skipped',
        meeting_last_error: 'Teams meetings are disabled in org settings',
        meeting_last_attempt_at: new Date().toISOString(),
      }).eq('id', bookingId);

      return new Response(JSON.stringify({
        success: false,
        meeting_status: 'skipped',
        reason: 'Teams meetings are disabled in organisation settings',
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load practitioner + client details for meeting metadata
    const [practitionerRes, clientRes] = await Promise.all([
      supabase.from('profiles').select('display_name').eq('user_id', booking.practitioner_id).single(),
      supabase.auth.admin.getUserById(booking.client_user_id),
    ]);
    const practitionerName = practitionerRes.data?.display_name || 'Practitioner';
    const clientEmail = clientRes.data?.user?.email;

    const startDatetime = `${booking.requested_date}T${booking.requested_start_time}`;
    const endDatetime = `${booking.requested_date}T${booking.requested_end_time}`;

    // TODO: Production Microsoft Graph call
    // Replace this block with real Graph API call when Entra app is registered:
    //
    // const accessToken = (integration.token_metadata as Record<string, unknown>).access_token;
    // const graphResponse = await fetch(
    //   `https://graph.microsoft.com/v1.0/users/${integration.organizer_email}/onlineMeetings`,
    //   {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${accessToken}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       subject: `Groundpath Session — ${practitionerName}`,
    //       startDateTime: startDatetime,
    //       endDateTime: endDatetime,
    //       lobbyBypassSettings: {
    //         scope: 'organizer',           // Only organizer bypasses lobby
    //         isDialInBypassEnabled: false,
    //       },
    //       allowedPresenters: 'roleIsPresenter',
    //       participants: {
    //         attendees: [
    //           ...(clientEmail ? [{ upn: clientEmail, role: 'attendee' }] : []),
    //           // Practitioner doesn't need a Microsoft account — they join via link
    //         ],
    //       },
    //       isEntryExitAnnounced: false,
    //     }),
    //   },
    // );
    //
    // if (!graphResponse.ok) {
    //   const errBody = await graphResponse.text();
    //   await supabase.from('booking_requests').update({
    //     meeting_status: 'failed',
    //     meeting_last_error: `Graph API ${graphResponse.status}: ${errBody}`,
    //     meeting_last_attempt_at: new Date().toISOString(),
    //     meeting_retry_count: (booking.meeting_retry_count || 0) + 1,
    //   }).eq('id', bookingId);
    //   return new Response(JSON.stringify({ success: false, meeting_status: 'failed', error: errBody }), { ... });
    // }
    //
    // const meetingData = await graphResponse.json();
    // const meetingUrl = meetingData.joinWebUrl;
    // const externalMeetingId = meetingData.id;

    // --- Placeholder: simulate meeting creation failure since Graph is not connected ---
    await supabase.from('booking_requests').update({
      meeting_status: 'pending',
      meeting_provider: 'microsoft_teams',
      organizer_email: integration.organizer_email,
      meeting_access_policy: 'restricted',
      lobby_policy: 'everyone',
      meeting_last_attempt_at: new Date().toISOString(),
      meeting_last_error: 'Microsoft Graph OAuth not yet completed — meeting will be created when connected',
      meeting_retry_count: (booking.meeting_retry_count || 0) + 1,
    }).eq('id', bookingId);

    console.log(`Meeting creation attempted for booking ${bookingId} — awaiting Graph OAuth completion`);

    return new Response(JSON.stringify({
      success: false,
      meeting_status: 'pending',
      reason: 'Microsoft Graph OAuth not yet completed. Meeting will be created automatically once connected.',
      booking_id: bookingId,
      organizer_email: integration.organizer_email,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('create-org-booking-meeting error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
