import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { NewsletterEmail } from "./_templates/newsletter.tsx";
import { getCorsHeaders, unauthorizedResponse, verifyAuth } from "../_shared/auth.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface NewsletterRequest {
  subject: string;
  previewText?: string;
  articles: Array<{
    title: string;
    summary: string;
    link: string;
    category: string;
  }>;
  testEmail?: string; // If provided, send only to this email for testing
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  // send-newsletter is triggered from the admin UI, so also allow local dev origin
  const corsHeaders = getCorsHeaders(origin, true);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify JWT authentication
  const { userId, error: authError } = await verifyAuth(req, supabaseUrl, supabaseAnonKey);
  if (authError) {
    return unauthorizedResponse(corsHeaders);
  }

  try {
    const body: NewsletterRequest = await req.json();
    
    let recipients: string[] = [];
    
    if (body.testEmail) {
      // Test mode - send only to specified email
      recipients = [body.testEmail];
      console.log('Sending test newsletter to:', body.testEmail);
    } else {
      // Production mode - get all confirmed subscribers (with their unsubscribe tokens)
      const { data: subscribers, error } = await supabase
        .from('mailing_list')
        .select('email, unsubscribe_token')
        .eq('status', 'confirmed');

      if (error) {
        throw new Error(`Failed to fetch subscribers: ${error.message}`);
      }

      recipients = subscribers.map(sub => sub.email);
      console.log(`Sending newsletter to ${recipients.length} confirmed subscribers`);

      if (recipients.length === 0) {
        return new Response(
          JSON.stringify({ error: "No recipients found", message: "No confirmed subscribers" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }

      // Send one email per subscriber so each has a tokenised unsubscribe link
      const results = [];
      for (const sub of subscribers) {
        const unsubscribeUrl = sub.unsubscribe_token
          ? `https://groundpath.com.au/unsubscribe?token=${sub.unsubscribe_token}`
          : `https://groundpath.com.au/unsubscribe`;

        const html = await renderAsync(
          NewsletterEmail({
            subject: body.subject,
            previewText: body.previewText || "Your latest professional development updates from groundpath",
            articles: body.articles,
            unsubscribeUrl,
          }),
        );

        const emailResponse = await resend.emails.send({
          from: "groundpath newsletter <newsletter@groundpath.com.au>",
          to: [sub.email],
          subject: body.subject,
          html,
        });
        results.push(emailResponse);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('Newsletter sent successfully to all recipients');
      return new Response(
        JSON.stringify({
          success: true,
          recipientCount: recipients.length,
          batches: results.length,
          message: 'Newsletter sent to all confirmed subscribers',
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Test-mode path (single recipient, no token)
    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recipients found", message: "Test email provided but no confirmed subscribers" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const html = await renderAsync(
      NewsletterEmail({
        subject: body.subject,
        previewText: body.previewText || "Your latest professional development updates from groundpath",
        articles: body.articles,
        unsubscribeUrl: "https://groundpath.com.au/unsubscribe",
      }),
    );

    const emailResponse = await resend.emails.send({
      from: "groundpath newsletter <newsletter@groundpath.com.au>",
      to: recipients,
      subject: body.subject,
      html,
    });

    return new Response(
      JSON.stringify({
        success: true,
        recipientCount: recipients.length,
        batches: 1,
        message: 'Test newsletter sent successfully',
        emailResponse,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );

  } catch (error) {
    console.error("Error in send-newsletter function:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);