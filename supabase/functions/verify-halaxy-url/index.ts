const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate it's a Halaxy URL
    const trimmedUrl = url.trim();
    const halaxyPattern = /^https?:\/\/(www\.)?halaxy\.com\/(profile|book)\//i;
    if (!halaxyPattern.test(trimmedUrl)) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL must be a valid Halaxy profile or booking URL (e.g. https://www.halaxy.com/profile/...)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the URL is reachable
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(trimmedUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Groundpath-Verification/1.0',
        },
        redirect: 'follow',
      });

      clearTimeout(timeout);

      const isLive = response.ok || response.status === 301 || response.status === 302;

      // Check response body for signs of a valid profile page
      let hasProfileContent = false;
      if (response.ok) {
        const body = await response.text();
        // Halaxy profile pages typically contain these markers
        hasProfileContent = body.includes('halaxy') && (
          body.includes('book') ||
          body.includes('appointment') ||
          body.includes('profile') ||
          body.includes('practitioner') ||
          body.includes('location')
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          verified: isLive && hasProfileContent,
          status_code: response.status,
          url: trimmedUrl,
          verified_at: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (fetchError) {
      clearTimeout(timeout);
      const isTimeout = fetchError instanceof DOMException && fetchError.name === 'AbortError';
      return new Response(
        JSON.stringify({
          success: true,
          verified: false,
          error: isTimeout ? 'Request timed out' : 'Could not reach URL',
          url: trimmedUrl,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error verifying Halaxy URL:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
