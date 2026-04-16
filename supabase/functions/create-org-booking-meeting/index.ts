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
 * using the organisation's central Microsoft 365 environment (client_credentials flow).
 *
 * Privacy model:
 *  - Each booking gets its own distinct meeting (never reused)
 *  - Lobby is enabled by default
 *  - Only the organizer identity and invited attendees can bypass the lobby
 *
 * Requires Entra app permission: OnlineMeetings.ReadWrite.All
 * Plus an application access policy granting the app permission to create
 * meetings on behalf of the organizer user.
 */

async function getValidAccessToken(supabase: ReturnType<typeof createClient>, integration: Record<string, unknown>) {
  const tokenMeta = integration.token_metadata as Record<string, unknown> | null;
  const expiresAt = tokenMeta?.expires_at as string | undefined;

  // If token expires within 5 minutes, refresh it
  if (expiresAt && new Date(expiresAt).getTime() > Date.now() + 5 * 60 * 1000) {
    return tokenMeta!.access_token as string;
  }

  // Refresh token using client_credentials
  const tenantId = Deno.env.get('MICROSOFT_TENANT_ID');
  const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
  const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Microsoft credentials not configured');
  }

  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'https://graph.microsoft.com/.default',
      }),
    },
  );

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    throw new Error(`Token refresh failed: ${tokenResponse.status} ${errText}`);
  }

  const tokens = await tokenResponse.json();
  const newExpiresAt = new Date(Date.now() + (tokens.expires_in as number) * 1000).toISOString();

  // Persist refreshed token
  await supabase.from('org_microsoft_integration').update({
    token_metadata: {
      access_token: tokens.access_token,
      expires_at: newExpiresAt,
      token_type: tokens.token_type || 'Bearer',
    },
    last_sync_at: new Date().toISOString(),
    connection_status: 'connected',
  }).eq('id', integration.id);

  return tokens.access_token as string;
}

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
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerUserId = user.id;

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

    // Get a valid access token (auto-refreshes if expired)
    let accessToken: string;
    try {
      accessToken = await getValidAccessToken(supabase, integration as unknown as Record<string, unknown>);
    } catch (tokenErr) {
      await supabase.from('booking_requests').update({
        meeting_status: 'failed',
        meeting_last_error: `Token error: ${tokenErr instanceof Error ? tokenErr.message : 'Unknown'}`,
        meeting_last_attempt_at: new Date().toISOString(),
        meeting_retry_count: (booking.meeting_retry_count || 0) + 1,
      }).eq('id', bookingId);

      return new Response(JSON.stringify({
        success: false,
        meeting_status: 'failed',
        reason: 'Failed to obtain Microsoft access token',
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load practitioner name for meeting subject
    const { data: practitionerProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', booking.practitioner_id)
      .single();
    const practitionerName = practitionerProfile?.display_name || 'Practitioner';

    // Build meeting start/end with timezone
    const startDatetime = `${booking.requested_date}T${booking.requested_start_time}:00`;
    const endDatetime = `${booking.requested_date}T${booking.requested_end_time}:00`;

    // Create meeting via Microsoft Graph using application permissions
    // POST /users/{userId}/onlineMeetings (requires OnlineMeetings.ReadWrite.All + application access policy)
    // Use Object ID (service_identity_reference) for Graph calls — required by application access policy
    const organizerIdentifier = integration.service_identity_reference || 'd16da54d-29e5-4d67-882c-9c2b3cc14a60';
    const graphResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${organizerIdentifier}/onlineMeetings`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: `Groundpath Session — ${practitionerName}`,
          startDateTime: startDatetime,
          endDateTime: endDatetime,
          lobbyBypassSettings: {
            scope: 'organizer',
            isDialInBypassEnabled: false,
          },
          allowedPresenters: 'roleIsPresenter',
          isEntryExitAnnounced: false,
        }),
      },
    );

    if (!graphResponse.ok) {
      const errBody = await graphResponse.text();
      console.error('Graph meeting creation failed:', graphResponse.status, errBody);

      await supabase.from('booking_requests').update({
        meeting_status: 'failed',
        meeting_provider: 'microsoft_teams',
        organizer_email: integration.organizer_email,
        meeting_last_error: `Graph API ${graphResponse.status}: ${errBody.substring(0, 500)}`,
        meeting_last_attempt_at: new Date().toISOString(),
        meeting_retry_count: (booking.meeting_retry_count || 0) + 1,
      }).eq('id', bookingId);

      return new Response(JSON.stringify({
        success: false,
        meeting_status: 'failed',
        reason: `Microsoft Graph error: ${graphResponse.status}`,
        detail: errBody.substring(0, 500),
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const meetingData = await graphResponse.json();
    const meetingUrl = meetingData.joinWebUrl as string;
    const externalMeetingId = meetingData.id as string;
    const now = new Date().toISOString();

    // Persist meeting details to booking
    await supabase.from('booking_requests').update({
      meeting_url: meetingUrl,
      meeting_provider: 'microsoft_teams',
      external_meeting_id: externalMeetingId,
      meeting_created_at: now,
      meeting_status: 'created',
      meeting_access_policy: 'restricted',
      lobby_policy: 'organizer',
      organizer_email: integration.organizer_email,
      meeting_last_error: null,
      meeting_last_attempt_at: now,
    }).eq('id', bookingId);

    console.log(`Teams meeting created for booking ${bookingId}: ${meetingUrl}`);

    return new Response(JSON.stringify({
      success: true,
      meeting_status: 'created',
      meeting_url: meetingUrl,
      external_meeting_id: externalMeetingId,
      organizer_email: integration.organizer_email,
      meeting_created_at: now,
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
