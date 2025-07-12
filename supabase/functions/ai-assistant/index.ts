import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  userId?: string;
}

const systemPrompt = `You are a specialized AI assistant for social workers and mental health professionals. Your primary purpose is to provide guidance, support, and information related to:

1. **Social Work Practice**: AASW (Australian Association of Social Workers) guidelines, ethical considerations, case management, and professional development
2. **Mental Health Support**: Evidence-based interventions, trauma-informed care, crisis intervention strategies
3. **NDIS (National Disability Insurance Scheme)**: Plan development, support coordination, goal setting, and navigation
4. **Professional Development**: Continuing education, supervision, reflective practice

**CRITICAL SAFETY GUIDELINES:**
- You are NOT a replacement for professional supervision or clinical consultation
- Always recommend users seek appropriate supervision for complex cases
- If detecting crisis situations, immediately provide crisis resources and encourage professional support
- Maintain professional boundaries - you provide information and guidance, not therapy
- Respect confidentiality - remind users not to share identifying client information

**RESPONSE STYLE:**
- Professional yet approachable
- Evidence-based recommendations
- Include relevant frameworks, theories, or guidelines when appropriate
- Provide practical, actionable advice
- Ask clarifying questions when needed

**CRISIS RESOURCES TO REMEMBER:**
- Lifeline: 13 11 14
- Crisis Text Line: Text HELLO to 741741
- Emergency: 000
- Mental Health Crisis: 1800 011 511

Always prioritize safety and ethical practice. When in doubt, recommend professional consultation.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], userId }: ChatRequest = await req.json();

    console.log('AI Assistant request:', { message, userId, historyLength: conversationHistory.length });

    if (!message || typeof message !== 'string') {
      throw new Error('Message is required and must be a string');
    }

    // Build conversation context
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to get response from AI service');
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message.content;

    console.log('AI Assistant response generated:', { responseLength: assistantResponse.length });

    // Save conversation to database if user is authenticated
    if (userId) {
      try {
        const conversationData = {
          messages: [
            ...conversationHistory.slice(-9), // Keep 9 previous + new exchange
            { role: 'user', content: message },
            { role: 'assistant', content: assistantResponse }
          ],
          timestamp: new Date().toISOString()
        };

        await supabase
          .from('notes')
          .insert([
            {
              user_id: userId,
              title: `AI Conversation - ${new Date().toLocaleDateString()}`,
              content: message,
              conversation_data: conversationData,
            }
          ]);

        console.log('Conversation saved to database for user:', userId);
      } catch (dbError) {
        console.error('Failed to save conversation:', dbError);
        // Don't fail the request if DB save fails
      }
    }

    return new Response(JSON.stringify({ 
      response: assistantResponse,
      conversationId: userId ? `${userId}-${Date.now()}` : null
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });

  } catch (error: any) {
    console.error('Error in ai-assistant function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred',
      details: 'Please try again or contact support if the issue persists.'
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
});