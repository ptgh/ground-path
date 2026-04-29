import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

import { corsHeadersFor } from '../_shared/cors.ts';
/**
 * microsoft-org-refresh
 *
 * Refreshes the Groundpath org-level Microsoft 365 access token.
 * Uses client_credentials flow — no refresh_token needed (just re-request).
 * Can be called on a schedule or before token expiry.
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

    // Load org integration
    const { data: integration, error: fetchErr } = await supabase
      .from('org_microsoft_integration')
      .select('*')
      .eq('provider', 'microsoft')
      .maybeSingle();

    if (fetchErr || !integration) {
      return new Response(JSON.stringify({
        success: false,
        status: 'not_configured',
        message: 'No Microsoft integration found',
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (integration.connection_status !== 'connected') {
      return new Response(JSON.stringify({
        success: false,
        status: integration.connection_status,
        message: 'Integration is not in connected state — cannot refresh',
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
        status: 'misconfigured',
        message: 'Microsoft credentials not configured in secrets',
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Client credentials flow — just request a new token
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
      const errBody = await tokenResponse.text();
      console.error('Token refresh failed:', tokenResponse.status, errBody);
      await supabase.from('org_microsoft_integration').update({
        connection_status: 'token_expired',
      }).eq('id', integration.id);

      return new Response(JSON.stringify({
        success: false,
        status: 'token_expired',
        error: errBody,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tokens = await tokenResponse.json();
    const expiresAt = new Date(Date.now() + (tokens.expires_in as number) * 1000).toISOString();

    await supabase.from('org_microsoft_integration').update({
      token_metadata: {
        access_token: tokens.access_token,
        expires_at: expiresAt,
        token_type: tokens.token_type || 'Bearer',
      },
      last_sync_at: new Date().toISOString(),
      connection_status: 'connected',
    }).eq('id', integration.id);

    return new Response(JSON.stringify({
      success: true,
      status: 'refreshed',
      expires_at: expiresAt,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('microsoft-org-refresh error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
