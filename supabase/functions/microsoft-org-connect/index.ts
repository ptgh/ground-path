import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * microsoft-org-connect
 *
 * Initiates or completes the Groundpath org-level Microsoft 365 connection.
 * Uses client_credentials flow (application permissions) — no user login needed.
 *
 * Required Entra app permissions (Application type):
 *   - OnlineMeetings.ReadWrite.All
 *   - Calendars.ReadWrite
 *
 * Required secrets:
 *   - MICROSOFT_TENANT_ID
 *   - MICROSOFT_CLIENT_ID
 *   - MICROSOFT_CLIENT_SECRET
 */
serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = user.id;

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { organizer_email } = body;

    if (!organizer_email) {
      return new Response(JSON.stringify({ error: 'organizer_email is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load Microsoft credentials from secrets
    const tenantId = Deno.env.get('MICROSOFT_TENANT_ID');
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');

    if (!tenantId || !clientId || !clientSecret) {
      return new Response(JSON.stringify({
        error: 'Microsoft credentials not configured',
        detail: 'MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, and MICROSOFT_CLIENT_SECRET must be set as Edge Function secrets.',
      }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Perform client_credentials OAuth token exchange
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
      console.error('Microsoft token exchange failed:', tokenResponse.status, errText);
      return new Response(JSON.stringify({
        error: 'Microsoft token exchange failed',
        detail: `Status ${tokenResponse.status}: ${errText}`,
        connection_status: 'failed',
      }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token as string;
    const expiresIn = tokens.expires_in as number; // seconds

    // Resolve the organizer's Entra object ID so Graph calls use the canonical ID
    let userObjectId: string | null = null;
    try {
      const userRes = await fetch(
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(organizer_email)}?$select=id,userPrincipalName,displayName`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        },
      );
      if (userRes.ok) {
        const userData = await userRes.json();
        userObjectId = userData.id as string;
        console.info('Resolved organizer object ID:', userObjectId, 'UPN:', userData.userPrincipalName);
      } else {
        const errText = await userRes.text();
        console.warn('Could not resolve organizer object ID:', userRes.status, errText.substring(0, 300));
      }
    } catch (e) {
      console.warn('Error resolving organizer object ID:', e instanceof Error ? e.message : e);
    }

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const integrationRecord = {
      provider: 'microsoft',
      integration_mode: 'org_managed',
      tenant_id: tenantId,
      organizer_email,
      service_identity_reference: userObjectId,
      teams_enabled: true,
      calendar_enabled: true,
      connection_status: 'connected',
      connected_at: now,
      disconnected_at: null,
      scopes: ['OnlineMeetings.ReadWrite.All', 'Calendars.ReadWrite'],
      config_version: 1,
      token_metadata: {
        access_token: accessToken,
        expires_at: expiresAt,
        token_type: tokens.token_type || 'Bearer',
      },
    };

    // Upsert — only one org integration record
    const { data: existing } = await supabase
      .from('org_microsoft_integration')
      .select('id')
      .eq('provider', 'microsoft')
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('org_microsoft_integration')
        .update(integrationRecord)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('org_microsoft_integration')
        .insert(integrationRecord);
      if (error) throw error;
    }

    return new Response(JSON.stringify({
      success: true,
      connection_status: 'connected',
      organizer_email,
      message: 'Microsoft 365 integration connected successfully.',
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('microsoft-org-connect error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
