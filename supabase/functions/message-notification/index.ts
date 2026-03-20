import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  recipientId: string;
  senderName: string;
  conversationId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Verify the caller is authenticated using getClaims
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: authError } = await anonClient.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerId = claimsData.claims.sub as string;

    const { recipientId, senderName, conversationId }: NotificationRequest = await req.json();

    if (!recipientId || !conversationId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the caller is a participant in this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, user_id, practitioner_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (conversation.user_id !== caller.id && conversation.practitioner_id !== caller.id) {
      return new Response(JSON.stringify({ error: 'Not a participant' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check recipient's notification preferences
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('notification_preferences, display_name')
      .eq('user_id', recipientId)
      .single();

    const emailEnabled = recipientProfile?.notification_preferences?.email_messages !== false;

    if (!emailEnabled) {
      return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Email notifications disabled' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get recipient email
    const { data: { user: recipientUser }, error: userError } = await supabase.auth.admin.getUserById(recipientId);
    if (userError || !recipientUser?.email) {
      console.error('Could not find recipient email:', userError);
      return new Response(JSON.stringify({ success: true, skipped: true, reason: 'No email found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping email notification');
      return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Email not configured' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send email notification
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Groundpath <connect@groundpath.com.au>',
        to: [recipientUser.email],
        subject: `New message from ${senderName || 'a participant'} — Groundpath`,
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 28px;">
              <h1 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0;">
                New Message
              </h1>
            </div>
            <div style="background-color: #f8faf8; border-left: 3px solid #4a7c4f; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
              <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
                You have a new message from <strong>${senderName || 'a participant'}</strong> in Groundpath.
              </p>
            </div>
            <div style="text-align: center; margin-bottom: 28px;">
              <a href="https://groundpath.com.au/practitioner/messages"
                 style="display: inline-block; background-color: #4a7c4f; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 14px; font-weight: 500;">
                View Message
              </a>
            </div>
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0; line-height: 1.5;">
              For your privacy, the message content is not included in this email.<br/>
              You can manage notification preferences in your Groundpath dashboard.
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      // Don't fail the whole request - notification is best-effort
      return new Response(JSON.stringify({ success: true, emailSent: false, error: errorText }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await emailResponse.json();
    console.log('Message notification sent:', result.id);

    return new Response(JSON.stringify({ success: true, emailSent: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in message-notification:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
