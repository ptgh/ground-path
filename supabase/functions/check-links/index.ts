import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, unauthorizedResponse, verifyAuth } from "../_shared/auth.ts";

// All resource URLs to check
const resourceLinks = [
  // Australian Emergency Contacts (phone numbers - skip checking)
  
  // Australian Support Services
  { url: "https://www.ndis.gov.au/participants", name: "NDIS Participants", category: "Support Services", country: "AU" },
  { url: "https://www.servicesaustralia.gov.au/mental-health-and-medicare", name: "Medicare Mental Health", category: "Support Services", country: "AU" },
  { url: "https://headspace.org.au/", name: "Headspace", category: "Support Services", country: "AU" },
  { url: "https://www.carersaustralia.com.au/", name: "Carers Australia", category: "Support Services", country: "AU" },
  
  // Australian Information
  { url: "https://www.blackdoginstitute.org.au/", name: "Black Dog Institute", category: "Information", country: "AU" },
  { url: "https://www.sane.org/", name: "SANE Australia", category: "Information", country: "AU" },
  { url: "https://au.reachout.com/", name: "ReachOut", category: "Information", country: "AU" },
  { url: "https://blueknot.org.au/", name: "Blue Knot Foundation", category: "Information", country: "AU" },
  
  // UK Support Services
  { url: "https://www.nhs.uk/mental-health/talking-therapies-medicine-treatments/talking-therapies-and-counselling/nhs-talking-therapies/", name: "NHS Talking Therapies", category: "Support Services", country: "UK" },
  { url: "https://www.nhs.uk/mental-health/nhs-voluntary-charity-services/nhs-services/children-young-people-mental-health-services-cypmhs/", name: "CAMHS", category: "Support Services", country: "UK" },
  { url: "https://www.citizensadvice.org.uk/", name: "Citizens Advice", category: "Support Services", country: "UK" },
  { url: "https://www.carersuk.org/", name: "Carers UK", category: "Support Services", country: "UK" },
  { url: "https://combatstress.org.uk/", name: "Combat Stress", category: "Support Services", country: "UK" },
  
  // UK Information
  { url: "https://www.mind.org.uk/", name: "Mind", category: "Information", country: "UK" },
  { url: "https://www.rethink.org/", name: "Rethink Mental Illness", category: "Information", country: "UK" },
  { url: "https://www.youngminds.org.uk/", name: "Young Minds", category: "Information", country: "UK" },
  { url: "https://www.thesurvivorstrust.org/", name: "The Survivors Trust", category: "Information", country: "UK" },
  
  // Professional Resources - Australia
  { url: "https://www.aasw.asn.au/about-aasw/ethics-standards/code-of-ethics", name: "AASW Code of Ethics", category: "Standards", country: "AU" },
  { url: "https://www.aasw.asn.au/about-aasw/ethics-standards/practice-standards/", name: "AASW Practice Standards", category: "Standards", country: "AU" },
  { url: "https://www.ahpra.gov.au/Registration/Registration-Standards.aspx", name: "AHPRA Registration Standards", category: "Standards", country: "AU" },
  { url: "https://www.pacfa.org.au/ethics-standards/", name: "PACFA Ethics", category: "Standards", country: "AU" },
  { url: "https://www.aasw.asn.au/careers-study/continuing-professional-development", name: "AASW CPD", category: "CPD", country: "AU" },
  { url: "https://www.aasw.asn.au/about-aasw/ethics-standards/supervision-standards", name: "AASW Supervision", category: "CPD", country: "AU" },
  { url: "https://www.ndis.gov.au/providers", name: "NDIS Provider Portal", category: "NDIS", country: "AU" },
  { url: "https://www.ndiscommission.gov.au/providers/registered-ndis-providers/provider-obligations-and-requirements/ndis-practice-standards", name: "NDIS Practice Standards", category: "NDIS", country: "AU" },
  { url: "https://www.ndis.gov.au/providers/pricing-arrangements", name: "NDIS Pricing", category: "NDIS", country: "AU" },
  { url: "https://www.psychiatry.org/psychiatrists/practice/dsm", name: "DSM-5-TR", category: "Clinical", country: "AU" },
  { url: "https://www.corc.uk.net/outcome-experience-measures/", name: "CORC Outcome Measures", category: "Clinical", country: "AU" },
  
  // Professional Resources - UK
  { url: "https://www.socialworkengland.org.uk/standards/professional-standards/", name: "SWE Standards", category: "Standards", country: "UK" },
  { url: "https://www.basw.co.uk/about-basw/code-ethics", name: "BASW Code of Ethics", category: "Standards", country: "UK" },
  { url: "https://www.hcpc-uk.org/standards/standards-of-proficiency/social-workers-in-england/", name: "HCPC Standards", category: "Standards", country: "UK" },
  { url: "https://www.bacp.co.uk/events-and-resources/ethics-and-standards/ethical-framework-for-the-counselling-professions/", name: "BACP Ethical Framework", category: "Standards", country: "UK" },
  { url: "https://www.socialworkengland.org.uk/cpd/", name: "SWE CPD", category: "CPD", country: "UK" },
  { url: "https://www.basw.co.uk/cpd-and-events", name: "BASW CPD", category: "CPD", country: "UK" },
  { url: "https://www.researchinpractice.org.uk/", name: "Research in Practice", category: "CPD", country: "UK" },
  { url: "https://www.england.nhs.uk/mental-health/", name: "NHS Mental Health", category: "NHS", country: "UK" },
  { url: "https://www.nice.org.uk/guidance/conditions-and-diseases/mental-health-and-behavioural-conditions", name: "NICE Guidelines", category: "NHS", country: "UK" },
  { url: "https://www.skillsforcare.org.uk/", name: "Skills for Care", category: "NHS", country: "UK" },
  { url: "https://icd.who.int/en", name: "ICD-11", category: "Clinical", country: "UK" },
  { url: "https://www.coresystemtrust.org.uk/", name: "CORE Outcome Measures", category: "Clinical", country: "UK" },
  { url: "https://www.scie.org.uk/", name: "SCIE", category: "Clinical", country: "UK" },
];

async function checkLink(url: string): Promise<{ status: number | null; error: string | null }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'GroundPath Link Checker/1.0',
      },
    });
    
    clearTimeout(timeoutId);
    return { status: response.status, error: null };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { status: null, error: 'Timeout after 10 seconds' };
    }
    return { status: null, error: error.message || 'Unknown error' };
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  // check-links is admin-only; restrict to production origins
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify JWT authentication
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const { userId, error: authError } = await verifyAuth(req, supabaseUrl, supabaseAnonKey);
  if (authError) {
    return unauthorizedResponse(corsHeaders);
  }

  try {
    console.log('Starting link health check...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const results: Array<{
      url: string;
      name: string;
      category: string;
      country: string;
      status: number | null;
      is_broken: boolean;
      error: string | null;
    }> = [];
    
    let brokenCount = 0;
    
    // Check each link
    for (const link of resourceLinks) {
      console.log(`Checking: ${link.name} - ${link.url}`);
      const { status, error } = await checkLink(link.url);
      
      const is_broken = status === null || status >= 400;
      if (is_broken) brokenCount++;
      
      results.push({
        url: link.url,
        name: link.name,
        category: link.category,
        country: link.country,
        status,
        is_broken,
        error,
      });
      
      // Upsert to database
      const { error: dbError } = await supabase
        .from('link_health')
        .upsert({
          url: link.url,
          resource_name: link.name,
          category: link.category,
          country: link.country,
          status_code: status,
          is_broken,
          error_message: error,
          last_checked: new Date().toISOString(),
        }, { onConflict: 'url' });
      
      if (dbError) {
        console.error(`DB error for ${link.url}:`, dbError);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`Link check complete. ${brokenCount} broken links found out of ${resourceLinks.length}`);
    
    // If there are broken links, log them prominently
    if (brokenCount > 0) {
      const brokenLinks = results.filter(r => r.is_broken);
      console.log('Broken links:', JSON.stringify(brokenLinks, null, 2));
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        total_checked: resourceLinks.length,
        broken_count: brokenCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Link check error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});