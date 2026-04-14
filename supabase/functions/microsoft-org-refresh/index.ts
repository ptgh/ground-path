import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * microsoft-org-refresh
 *
 * Refreshes the Groundpath org-level Microsoft 365 OAuth tokens.
 * Called on a schedule or before token expiry.
 *
 * Production flow:
 *   1. Load current token_metadata from org_microsoft_integration
 *   2. POST to https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token
 *      with grant_type=refresh_token
 *   3. Update token_metadata with new access_token + refresh_token
 *   4. Update last_sync_at and connection_status
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

    // TODO: Production token refresh
    // const tokenMetadata = integration.token_metadata as Record<string, unknown>;
    // const refreshToken = tokenMetadata.refresh_token as string;
    //
    // const tokenResponse = await fetch(
    //   `https://login.microsoftonline.com/${integration.tenant_id}/oauth2/v2.0/token`,
    //   {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //     body: new URLSearchParams({
    //       client_id: Deno.env.get('MICROSOFT_CLIENT_ID')!,
    //       client_secret: Deno.env.get('MICROSOFT_CLIENT_SECRET')!,
    //       grant_type: 'refresh_token',
    //       refresh_token: refreshToken,
    //       scope: 'https://graph.microsoft.com/.default',
    //     }),
    //   },
    // );
    //
    // if (!tokenResponse.ok) {
    //   const errBody = await tokenResponse.text();
    //   await supabase.from('org_microsoft_integration').update({
    //     connection_status: 'token_expired',
    //   }).eq('id', integration.id);
    //   return new Response(JSON.stringify({ success: false, status: 'token_expired', error: errBody }), { ... });
    // }
    //
    // const tokens = await tokenResponse.json();
    // await supabase.from('org_microsoft_integration').update({
    //   token_metadata: { access_token: tokens.access_token, refresh_token: tokens.refresh_token, expires_at: ... },
    //   last_sync_at: new Date().toISOString(),
    //   connection_status: 'connected',
    // }).eq('id', integration.id);

    return new Response(JSON.stringify({
      success: true,
      status: 'refreshed',
      message: 'Token refresh placeholder — implement with real Microsoft Entra credentials',
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
