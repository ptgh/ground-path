import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/microsoft_teams';

import { corsHeadersFor } from '../_shared/cors.ts';
interface TeamsNotifyRequest {
  type: 'new_request' | 'confirmed' | 'declined' | 'cancelled';
  clientName: string;
  practitionerName: string;
  date: string;
  time: string;
  dashboardUrl?: string;
}

function buildAdaptiveCard(body: TeamsNotifyRequest): string {
  const emoji = body.type === 'new_request' ? '📋' :
                body.type === 'confirmed' ? '✅' :
                body.type === 'declined' ? '❌' : '🚫';

  const title = body.type === 'new_request' ? 'New Booking Request' :
                body.type === 'confirmed' ? 'Booking Confirmed' :
                body.type === 'declined' ? 'Booking Declined' : 'Booking Cancelled';

  const description = body.type === 'new_request'
    ? `<strong>${body.clientName}</strong> has requested a session with <strong>${body.practitionerName}</strong>.`
    : body.type === 'confirmed'
    ? `<strong>${body.practitionerName}</strong> confirmed the session with <strong>${body.clientName}</strong>.`
    : body.type === 'declined'
    ? `<strong>${body.practitionerName}</strong> declined the session with <strong>${body.clientName}</strong>.`
    : `<strong>${body.clientName}</strong> cancelled their session with <strong>${body.practitionerName}</strong>.`;

  const url = body.dashboardUrl || 'https://groundpath.com.au/practitioner/dashboard?tab=booking';

  return `${emoji} <strong>${title}</strong><br/>${description}<br/>📅 ${body.date} · 🕐 ${body.time}<br/><a href="${url}">View Dashboard</a>`;
}

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = corsHeadersFor(req.headers.get('origin'));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const TEAMS_API_KEY = Deno.env.get('MICROSOFT_TEAMS_API_KEY');
    const TEAMS_TEAM_ID = Deno.env.get('TEAMS_TEAM_ID');
    const TEAMS_CHANNEL_ID = Deno.env.get('TEAMS_CHANNEL_ID');

    if (!LOVABLE_API_KEY || !TEAMS_API_KEY) {
      console.log('Teams credentials not configured, skipping notification');
      return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Teams not configured' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!TEAMS_TEAM_ID || !TEAMS_CHANNEL_ID) {
      console.log('TEAMS_TEAM_ID or TEAMS_CHANNEL_ID not set, skipping');
      return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Team/Channel IDs not configured' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: TeamsNotifyRequest = await req.json();
    const messageHtml = buildAdaptiveCard(body);

    const response = await fetch(
      `${GATEWAY_URL}/teams/${TEAMS_TEAM_ID}/channels/${TEAMS_CHANNEL_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TEAMS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: {
            contentType: 'html',
            content: messageHtml,
          },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error(`Teams API error [${response.status}]:`, JSON.stringify(data));
      return new Response(JSON.stringify({ success: false, error: `Teams API ${response.status}` }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Teams notification sent:', data.id);
    return new Response(JSON.stringify({ success: true, messageId: data.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Teams notification error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
