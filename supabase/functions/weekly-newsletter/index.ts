import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { NewsletterEmail } from './_templates/newsletter.tsx';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const resendApiKey = Deno.env.get('RESEND_API_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

import { corsHeadersFor } from '../_shared/cors.ts';
interface Article {
  title: string;
  summary: string;
  url: string;
  category: string;
}

const generateCuratedContent = async (): Promise<{ articles: Article[]; weeklyTip: string }> => {
  try {
    const prompt = `As an expert in social work and mental health, generate a weekly newsletter content with the following structure:

    1. Create 4-5 curated articles covering:
       - Social work best practices
       - NDIS updates and guidance
       - Mental health innovations
       - Professional development
       - Policy updates or industry news

    2. Include a weekly professional tip for social workers

    For each article, provide:
    - Title (engaging and professional)
    - Summary (2-3 sentences)
    - Category (one of: "Best Practices", "NDIS Updates", "Mental Health", "Professional Development", "Policy & News")
    - URL (use realistic Australian social work websites like: aasw.asn.au, ndis.gov.au, beyondblue.org.au, lifeline.org.au, or health.gov.au)

    Format the response as JSON with this structure:
    {
      "articles": [
        {
          "title": "...",
          "summary": "...",
          "category": "...",
          "url": "..."
        }
      ],
      "weeklyTip": "..."
    }

    Make content relevant to Australian social workers and mental health professionals. Focus on practical, actionable insights.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are an expert content curator for social work and mental health professionals in Australia.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    
    return content;
  } catch (error) {
    console.error('Error generating content:', error);
    // Fallback content
    return {
      articles: [
        {
          title: "Effective Trauma-Informed Care Practices in Social Work",
          summary: "Learn the latest evidence-based approaches to trauma-informed care that can improve client outcomes and professional practice.",
          category: "Best Practices",
          url: "https://aasw.asn.au/practitioner-resources/trauma-informed-care"
        },
        {
          title: "NDIS Plan Review Process: What Social Workers Need to Know",
          summary: "Understanding the updated NDIS plan review process and how to better support participants through transitions.",
          category: "NDIS Updates",
          url: "https://ndis.gov.au/participants/plan-reviews"
        }
      ],
      weeklyTip: "When documenting client interactions, focus on strengths-based language that highlights client capabilities and progress, not just deficits. This approach supports better outcomes and maintains client dignity."
    };
  }
};

const sendNewsletterToSubscribers = async () => {
  try {
    console.log('Starting weekly newsletter generation...');

    // Generate content using OpenAI
    const { articles, weeklyTip } = await generateCuratedContent();
    console.log('Generated content:', { articles: articles.length, weeklyTip: !!weeklyTip });

    // Get confirmed subscribers (with their unsubscribe tokens)
    const { data: subscribers, error: subscribersError } = await supabase
      .from('mailing_list')
      .select('email, name, unsubscribe_token')
      .eq('status', 'confirmed');

    if (subscribersError) {
      throw new Error(`Failed to fetch subscribers: ${subscribersError.message}`);
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('No confirmed subscribers found');
      return { sent: 0, message: 'No confirmed subscribers' };
    }

    console.log(`Found ${subscribers.length} confirmed subscribers`);

    let successCount = 0;
    let errorCount = 0;

    // Send newsletter to each subscriber
    for (const subscriber of subscribers) {
      try {
        const unsubscribeUrl = subscriber.unsubscribe_token
          ? `https://groundpath.com.au/unsubscribe?token=${subscriber.unsubscribe_token}`
          : `https://groundpath.com.au/unsubscribe`;

        // Render the React email template
        const emailHtml = await renderAsync(
          React.createElement(NewsletterEmail, {
            subscriberName: subscriber.name,
            articles,
            weeklyTip,
            unsubscribeUrl,
          })
        );

        // Send email using Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'groundpath newsletter <newsletter@groundpath.com.au>',
            to: [subscriber.email],
            subject: `This Week in Social Work - ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}`,
            html: emailHtml,
          }),
        });

        if (emailResponse.ok) {
          successCount++;
          console.log(`Newsletter sent successfully to: ${subscriber.email}`);
        } else {
          errorCount++;
          const errorText = await emailResponse.text();
          console.error(`Failed to send to ${subscriber.email}:`, errorText);
        }

        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        errorCount++;
        console.error(`Error sending to ${subscriber.email}:`, error);
      }
    }

    return {
      sent: successCount,
      errors: errorCount,
      total: subscribers.length,
      message: `Newsletter sent to ${successCount} subscribers with ${errorCount} errors`
    };

  } catch (error) {
    console.error('Error in newsletter generation:', error);
    throw error;
  }
};

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Weekly newsletter function triggered');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!resendApiKey) {
      throw new Error('Resend API key not configured');
    }

    const result = await sendNewsletterToSubscribers();

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in weekly newsletter function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});