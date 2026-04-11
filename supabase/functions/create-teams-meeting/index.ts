import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/microsoft_teams';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreateMeetingRequest {
  bookingId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const TEAMS_API_KEY = Deno.env.get('MICROSOFT_TEAMS_API_KEY');
    if (!TEAMS_API_KEY) {
      throw new Error('MICROSOFT_TEAMS_API_KEY is not configured');
    }

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

    const body: CreateMeetingRequest = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return new Response(JSON.stringify({ error: 'Missing bookingId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the booking
    const { data: booking, error: bookingErr } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only the practitioner can create meetings for their bookings
    if (booking.practitioner_id !== callerUserId) {
      return new Response(JSON.stringify({ error: 'Only the practitioner can create meeting links' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (booking.status !== 'confirmed') {
      return new Response(JSON.stringify({ error: 'Booking must be confirmed before creating a meeting' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get client name for the meeting subject
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', booking.client_user_id)
      .single();
    const clientName = clientProfile?.display_name || 'Client';

    // Build meeting times
    const startDateTime = `${booking.requested_date}T${booking.requested_start_time}`;
    const endDateTime = `${booking.requested_date}T${booking.requested_end_time}`;

    // Create Teams online meeting via Microsoft Graph
    const meetingResponse = await fetch(`${GATEWAY_URL}/me/onlineMeetings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TEAMS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: `Groundpath Session — ${clientName}`,
        startDateTime,
        endDateTime,
        lobbyBypassSettings: {
          scope: 'everyone',
          isDialInBypassEnabled: true,
        },
      }),
    });

    if (!meetingResponse.ok) {
      const errorBody = await meetingResponse.text();
      console.error('Teams API error:', meetingResponse.status, errorBody);
      return new Response(JSON.stringify({
        error: 'Failed to create Teams meeting',
        details: errorBody,
        status: meetingResponse.status,
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const meeting = await meetingResponse.json();
    const joinUrl = meeting.joinWebUrl || meeting.joinUrl;

    // Store the meeting link in practitioner_notes
    await supabase
      .from('booking_requests')
      .update({
        practitioner_notes: `Teams Meeting: ${joinUrl}`,
      })
      .eq('id', bookingId);

    console.log('Teams meeting created for booking:', bookingId);

    return new Response(JSON.stringify({
      success: true,
      joinUrl,
      meetingId: meeting.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-teams-meeting:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
