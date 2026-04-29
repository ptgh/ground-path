import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

import { corsHeadersFor } from '../_shared/cors.ts';
/**
 * sync-org-booking-calendar
 *
 * Creates or updates a Microsoft calendar event for a Groundpath booking
 * using the organisation's central Microsoft 365 environment.
 *
 * Uses client_credentials flow with Calendars.ReadWrite application permission.
 */

async function getAccessToken(tenantId: string, clientId: string, clientSecret: string): Promise<string> {
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
    throw new Error(`Token request failed: ${tokenResponse.status}`);
  }
  const tokens = await tokenResponse.json();
  return tokens.access_token as string;
}

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = corsHeadersFor(req.headers.get('origin'));
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

    const tenantId = Deno.env.get('MICROSOFT_TENANT_ID');
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');

    if (!tenantId || !clientId || !clientSecret) {
      return new Response(JSON.stringify({
        success: false,
        calendar_sync_status: 'skipped',
        reason: 'Microsoft credentials not configured',
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let accessToken: string;
    try {
      accessToken = await getAccessToken(tenantId, clientId, clientSecret);
    } catch {
      return new Response(JSON.stringify({
        success: false,
        calendar_sync_status: 'failed',
        reason: 'Failed to obtain access token',
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const baseUrl = `https://graph.microsoft.com/v1.0/users/${integration.organizer_email}/calendar/events`;
    const practitionerRes = await supabase.from('profiles').select('display_name').eq('user_id', booking.practitioner_id).single();
    const practitionerName = practitionerRes.data?.display_name || 'Practitioner';

    if (action === 'create') {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: `Groundpath Session — ${practitionerName}`,
          start: {
            dateTime: `${booking.requested_date}T${booking.requested_start_time}:00`,
            timeZone: 'Australia/Sydney',
          },
          end: {
            dateTime: `${booking.requested_date}T${booking.requested_end_time}:00`,
            timeZone: 'Australia/Sydney',
          },
          isOnlineMeeting: !!booking.meeting_url,
          body: {
            contentType: 'text',
            content: `Groundpath session with ${practitionerName}. ${booking.meeting_url ? `Join: ${booking.meeting_url}` : ''}`,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Calendar event creation failed:', response.status, errText);
        await supabase.from('booking_requests').update({
          calendar_sync_status: 'failed',
          last_calendar_sync_at: new Date().toISOString(),
        }).eq('id', bookingId);

        return new Response(JSON.stringify({
          success: false,
          calendar_sync_status: 'failed',
          reason: `Graph API ${response.status}`,
        }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const event = await response.json();
      await supabase.from('booking_requests').update({
        external_calendar_event_id: event.id,
        calendar_provider: 'microsoft',
        calendar_sync_status: 'synced',
        last_calendar_sync_at: new Date().toISOString(),
      }).eq('id', bookingId);

      return new Response(JSON.stringify({
        success: true,
        calendar_sync_status: 'synced',
        external_calendar_event_id: event.id,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'cancel' && booking.external_calendar_event_id) {
      await fetch(`${baseUrl}/${booking.external_calendar_event_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      await supabase.from('booking_requests').update({
        calendar_sync_status: 'cancelled',
        last_calendar_sync_at: new Date().toISOString(),
      }).eq('id', bookingId);

      return new Response(JSON.stringify({
        success: true,
        calendar_sync_status: 'cancelled',
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      calendar_sync_status: 'no_action',
      message: `No calendar action needed for action: ${action}`,
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
