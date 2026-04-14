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
 * In production, this would:
 *   1. Accept an OAuth authorization code from the Microsoft Entra admin consent flow
 *   2. Exchange it for access + refresh tokens via Microsoft Graph
 *   3. Store encrypted token metadata in org_microsoft_integration
 *   4. Validate the tenant and organizer email
 *
 * Currently scaffolded with placeholder logic — real Graph OAuth exchange
 * must be completed when Groundpath registers a custom Entra app with
 * OnlineMeetings.ReadWrite and Calendars.ReadWrite scopes.
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
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const { data: claimsData, error: authErr } = await anonClient.auth.getClaims(token);
    if (authErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Check admin role
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
    const { tenant_id, organizer_email } = body;

    if (!tenant_id || !organizer_email) {
      return new Response(JSON.stringify({ error: 'tenant_id and organizer_email are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // TODO: Production Microsoft Graph OAuth exchange
    // 1. Use body.authorization_code to call:
    //    POST https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token
    //    with client_id, client_secret, code, redirect_uri, grant_type=authorization_code
    // 2. Validate response, extract access_token + refresh_token
    // 3. Call GET https://graph.microsoft.com/v1.0/me to verify organizer identity
    // 4. Store encrypted tokens in token_metadata
    //
    // For now, we create/update the integration record in 'pending_validation' state.
    // The connection_status will be 'connected' only when real OAuth is completed.

    const integrationRecord = {
      provider: 'microsoft',
      integration_mode: 'org_managed',
      tenant_id,
      organizer_email,
      teams_enabled: true,
      calendar_enabled: false,
      connection_status: 'pending_validation',
      connected_at: null,
      scopes: ['OnlineMeetings.ReadWrite', 'Calendars.ReadWrite'],
      config_version: 1,
      token_metadata: {
        note: 'Real OAuth tokens must be stored here after Microsoft Entra app registration',
        placeholder: true,
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
      connection_status: 'pending_validation',
      message: 'Microsoft integration record created. Complete OAuth flow to activate.',
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
