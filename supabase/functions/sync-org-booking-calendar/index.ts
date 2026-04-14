import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * sync-org-booking-calendar
 *
 * Creates or updates a Microsoft calendar event for a Groundpath booking
 * using the organisation's central Microsoft 365 environment.
 *
 * Triggered on:
 *  - Booking confirmation (create event)
 *  - Booking reschedule (update event)
 *  - Booking cancellation (cancel/delete event)
 *
 * Production flow (TODO — requires Microsoft Entra app with Calendars.ReadWrite):
 *  1. Load org Microsoft integration
 *  2. Load booking details
 *  3. POST/PATCH/DELETE https://graph.microsoft.com/v1.0/users/{organizer}/calendar/events
 *  4. Persist external_calendar_event_id, calendar_sync_status to booking_requests
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

    const { bookingId, action = 'create' } = await req.json();
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

    // Load org Microsoft integration
    const { data: integration } = await supabase
      .from('org_microsoft_integration')
      .select('*')
      .eq('provider', 'microsoft')
      .maybeSingle();

    if (!integration || integration.connection_status !== 'connected') {
      return new Response(JSON.stringify({
        success: false,
        calendar_sync_status: 'skipped',
        reason: 'Microsoft integration not connected',
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!integration.calendar_enabled) {
      return new Response(JSON.stringify({
        success: false,
        calendar_sync_status: 'skipped',
        reason: 'Calendar sync is disabled in org settings',
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // TODO: Production Microsoft Graph calendar operations
    //
    // const accessToken = (integration.token_metadata as Record<string, unknown>).access_token;
    // const baseUrl = `https://graph.microsoft.com/v1.0/users/${integration.organizer_email}/calendar/events`;
    //
    // if (action === 'create') {
    //   const response = await fetch(baseUrl, {
    //     method: 'POST',
    //     headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       subject: `Groundpath Session — ${practitionerName}`,
    //       start: { dateTime: startDatetime, timeZone: 'Australia/Sydney' },
    //       end: { dateTime: endDatetime, timeZone: 'Australia/Sydney' },
    //       isOnlineMeeting: true,
    //       onlineMeetingProvider: 'teamsForBusiness',
    //     }),
    //   });
    //   const event = await response.json();
    //   // Update booking with calendar event ID
    // }
    //
    // if (action === 'cancel' && booking.external_calendar_event_id) {
    //   await fetch(`${baseUrl}/${booking.external_calendar_event_id}`, {
    //     method: 'DELETE',
    //     headers: { 'Authorization': `Bearer ${accessToken}` },
    //   });
    // }

    // Placeholder response
    await supabase.from('booking_requests').update({
      calendar_provider: 'microsoft',
      calendar_sync_status: 'pending',
      last_calendar_sync_at: new Date().toISOString(),
    }).eq('id', bookingId);

    return new Response(JSON.stringify({
      success: true,
      calendar_sync_status: 'pending',
      message: `Calendar ${action} placeholder — implement with real Microsoft Graph credentials`,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('sync-org-booking-calendar error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
