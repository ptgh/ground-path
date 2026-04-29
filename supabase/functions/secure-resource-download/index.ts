// Generates a short-lived signed URL for a secure resource and logs the
// download attempt (success or failure) to public.secure_resource_downloads.
// Auth is enforced in code: the caller must present a valid Supabase JWT.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

import { corsHeadersFor } from '../_shared/cors.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const SIGNED_URL_TTL_SECONDS = 60; // very short-lived

async function hashIp(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const data = new TextEncoder().encode(ip + (Deno.env.get('SUPABASE_JWKS') ?? ''));
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Identify the caller from their JWT
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return new Response(
      JSON.stringify({ error: 'Unauthenticated' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
  const userId = userData.user.id;

  const userAgent = req.headers.get('user-agent') ?? null;
  const ipHeader =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('cf-connecting-ip') ??
    null;
  const ipHash = await hashIp(ipHeader);

  let body: { resource_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const resourceId = body.resource_id;
  if (!resourceId || typeof resourceId !== 'string') {
    return new Response(
      JSON.stringify({ error: 'resource_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const logAttempt = async (succeeded: boolean, failure_reason?: string) => {
    await adminClient.from('secure_resource_downloads').insert({
      resource_id: resourceId,
      user_id: userId,
      succeeded,
      failure_reason: failure_reason ?? null,
      user_agent: userAgent,
      ip_hash: ipHash,
    });
  };

  // Look up the resource (admin client bypasses RLS so we can detect "hidden")
  const { data: resource, error: resErr } = await adminClient
    .from('secure_resources')
    .select('id, storage_path, is_published, mime_type, title')
    .eq('id', resourceId)
    .maybeSingle();

  if (resErr || !resource) {
    await logAttempt(false, 'resource_not_found');
    return new Response(
      JSON.stringify({ error: 'Resource not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  if (!resource.is_published) {
    await logAttempt(false, 'resource_unpublished');
    return new Response(
      JSON.stringify({ error: 'Resource not available' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const { data: signed, error: signErr } = await adminClient.storage
    .from('resources')
    .createSignedUrl(resource.storage_path, SIGNED_URL_TTL_SECONDS, {
      download: resource.title || true,
    });

  if (signErr || !signed?.signedUrl) {
    await logAttempt(false, 'signed_url_failed');
    return new Response(
      JSON.stringify({ error: 'Could not generate download link' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  await logAttempt(true);

  return new Response(
    JSON.stringify({
      url: signed.signedUrl,
      expires_in: SIGNED_URL_TTL_SECONDS,
      mime_type: resource.mime_type,
      title: resource.title,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
