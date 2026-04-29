import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

import { corsHeadersFor } from '../_shared/cors.ts';
function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * microsoft-org-diagnose
 *
 * Lightweight diagnostic that verifies:
 *  1. Microsoft credentials are configured
 *  2. Token exchange works (client_credentials)
 *  3. Application Access Policy is active (test onlineMeetings creation)
 *
 * Does NOT create a real booking — creates a short test meeting then immediately deletes it.
 */
serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const checks: Record<string, { status: string; detail?: string }> = {};

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Auth — admin only
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check 1: Credentials
    const tenantId = Deno.env.get('MICROSOFT_TENANT_ID');
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');

    if (!tenantId || !clientId || !clientSecret) {
      checks.credentials = { status: 'fail', detail: 'Missing MICROSOFT_TENANT_ID, CLIENT_ID, or CLIENT_SECRET' };
      return new Response(JSON.stringify({ checks }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    checks.credentials = { status: 'pass' };

    // Check 2: Integration record
    const { data: integration } = await supabase
      .from('org_microsoft_integration')
      .select('connection_status, organizer_email, service_identity_reference, teams_enabled, calendar_enabled')
      .eq('provider', 'microsoft')
      .maybeSingle();

    if (!integration || integration.connection_status !== 'connected') {
      checks.integration = { status: 'fail', detail: 'Not connected. Run Connect Microsoft 365 first.' };
      return new Response(JSON.stringify({ checks }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    checks.integration = {
      status: 'pass',
      detail: `Organizer: ${integration.organizer_email}, Teams: ${integration.teams_enabled}, Calendar: ${integration.calendar_enabled}`,
    };

    // Check 3: Token exchange
    let accessToken: string;
    try {
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
        checks.token_exchange = { status: 'fail', detail: `HTTP ${tokenResponse.status}: ${errText.substring(0, 200)}` };
        return new Response(JSON.stringify({ checks }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tokens = await tokenResponse.json();
      accessToken = tokens.access_token as string;
      checks.token_exchange = { status: 'pass' };

      const payload = parseJwtPayload(accessToken);
      const roles = Array.isArray(payload?.roles)
        ? payload.roles.filter((role): role is string => typeof role === 'string')
        : [];

      checks.app_permissions = roles.includes('OnlineMeetings.ReadWrite.All')
        ? {
            status: 'pass',
            detail: `Token roles include OnlineMeetings.ReadWrite.All${roles.includes('Calendars.ReadWrite') ? ' and Calendars.ReadWrite' : ''}`,
          }
        : {
            status: 'fail',
            detail: roles.length > 0
              ? `Token roles: ${roles.join(', ')}`
              : 'No app roles found in access token payload',
          };
    } catch (e) {
      checks.token_exchange = { status: 'fail', detail: e instanceof Error ? e.message : 'Unknown error' };
      return new Response(JSON.stringify({ checks }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check 4: Application Access Policy — create a test meeting then delete it
    const organizerIdentifier = integration.service_identity_reference || 'd16da54d-29e5-4d67-882c-9c2b3cc14a60';
    try {
      const now = new Date();
      const testStart = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      const testEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString();
      const graphUrl = `https://graph.microsoft.com/v1.0/users/${organizerIdentifier}/onlineMeetings`;

      console.info('microsoft-org-diagnose Graph request', {
        graphUrl,
        organizerIdentifier,
      });

      const meetingRes = await fetch(
        graphUrl,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: 'Groundpath Diagnostic Test — safe to delete',
            startDateTime: testStart,
            endDateTime: testEnd,
          }),
        },
      );

      if (!meetingRes.ok) {
        const errBody = await meetingRes.text();
        console.error('microsoft-org-diagnose Graph error', {
          graphUrl,
          status: meetingRes.status,
          responseBody: errBody,
        });
        checks.application_access_policy = {
          status: 'fail',
          detail: `POST ${graphUrl} returned ${meetingRes.status}: ${errBody.substring(0, 500)}`,
        };
        return new Response(JSON.stringify({ checks }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const meeting = await meetingRes.json();
      checks.application_access_policy = {
        status: 'pass',
        detail: `Test meeting created successfully (ID: ${meeting.id?.substring(0, 20)}…)`,
      };

      // Clean up — delete the test meeting
      try {
        await fetch(
          `https://graph.microsoft.com/v1.0/users/${organizerIdentifier}/onlineMeetings/${meeting.id}`,
          {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          },
        );
        checks.cleanup = { status: 'pass', detail: 'Test meeting deleted' };
      } catch {
        checks.cleanup = { status: 'warn', detail: 'Test meeting created but cleanup failed — delete manually if needed' };
      }
    } catch (e) {
      checks.application_access_policy = {
        status: 'fail',
        detail: e instanceof Error ? e.message : 'Unknown error',
      };
    }

    return new Response(JSON.stringify({ checks }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('microsoft-org-diagnose error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      checks,
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
