import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { MailingListConfirmationEmail } from './_templates/mailing-list-confirmation.tsx';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const resendApiKey = Deno.env.get('RESEND_API_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'contact_form' | 'mailing_list_confirmation' | 'newsletter';
  to: string;
  data: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping email send');
      return new Response(JSON.stringify({ success: true, message: 'Email would be sent (dev mode)' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { type, to, data }: EmailRequest = await req.json();

    let emailContent = '';
    let subject = '';

    switch (type) {
      case 'contact_form':
        subject = `New Contact Form Submission: ${data.subject} - Ground Path`;
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">New Contact Form Submission - Ground Path</h1>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Name:</strong> ${data.name}</p>
              <p style="margin: 10px 0;"><strong>Email:</strong> ${data.email}</p>
              <p style="margin: 10px 0;"><strong>Subject:</strong> ${data.subject}</p>
              <div style="margin: 20px 0;">
                <strong>Message:</strong>
                <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px; border-left: 4px solid #2563eb;">
                  ${data.message.replace(/\n/g, '<br>')}
                </div>
              </div>
              <p style="margin: 10px 0; color: #64748b; font-size: 14px;"><em>Submitted at: ${new Date().toLocaleString()}</em></p>
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              This message was sent through the Ground Path contact form.
            </p>
          </div>
        `;
        break;
      
      case 'mailing_list_confirmation':
        subject = 'Confirm your subscription - Ground Path Professional Resources';
        
        const unsubscribeUrl = `https://groundpath.com.au/unsubscribe?email=${encodeURIComponent(to)}`;
        
        emailContent = await renderAsync(
          React.createElement(MailingListConfirmationEmail, {
            name: data.name,
            confirmationUrl: data.confirmationUrl,
            unsubscribeUrl,
          })
        );
        break;
      
      default:
        throw new Error('Invalid email type');
    }

    // For contact forms, send to admin; for confirmations, send to subscriber
    const recipient = type === 'contact_form' ? to : to;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ground Path <noreply@groundpath.com.au>',
        to: [recipient],
        subject,
        html: emailContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error('Failed to send email');
    }

    const result = await emailResponse.json();
    console.log('Email sent successfully:', result);

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);