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

// Security utilities
const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove potential XSS vectors and limit length
  return input
    .slice(0, 4000) // Max 4000 characters
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

const checkForPromptInjection = (message: string): boolean => {
  const suspiciousPatterns = [
    /ignore\s+previous\s+instructions/i,
    /forget\s+everything/i,
    /you\s+are\s+now/i,
    /system\s*:?\s*ignore/i,
    /override\s+your\s+instructions/i,
    /pretend\s+to\s+be/i,
    /role\s*play/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(message));
};

// Rate limiting storage (in memory for this edge function)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

const systemPrompt = `You are a specialized AI assistant designed exclusively for social work practitioners, mental health professionals, and students on the education pathway. You are NOT a client-facing service.

YOUR AUDIENCE:
- Registered social workers and mental health professionals
- Social work students and trainees
- Supervisors and educators
- Allied health professionals

YOUR EXPERTISE:

1. Professional Standards and Ethics: AASW Code of Ethics, practice standards, ethical decision-making frameworks, boundary management, professional conduct
2. Clinical Practice: Evidence-based interventions, therapeutic modalities, assessment tools (PHQ-9, GAD-7, DASS-21, etc.), case formulation, treatment planning
3. Documentation: Progress notes (SOAP, DAP, BIRP formats), clinical assessments, case notes, report writing, record-keeping requirements
4. NDIS Practice: Plan development, support coordination, functional assessments, goal writing, plan reviews, NDIA processes
5. Supervision and Professional Development: Supervision frameworks, reflective practice, CPD requirements, AASW registration pathways, career development
6. Theoretical Frameworks: Trauma-informed care, strengths-based practice, systems theory, person-centred approaches, cognitive-behavioural frameworks
7. Education Pathway: MSW requirements, field placement guidance, competency frameworks, transitioning to practice

IMPORTANT BOUNDARIES:
- You help practitioners with their professional practice - you do NOT provide direct client services
- If someone asks client-type questions (e.g., "How do I book an appointment?", "I'm feeling depressed"), politely redirect them to appropriate services or clarify you're designed for practitioners
- Remind users not to share identifying client information
- Recommend professional supervision for complex clinical decisions

RESPONSE STYLE:
- Collegial and professional - speak practitioner-to-practitioner
- Reference specific frameworks, guidelines, and evidence
- Provide practical, actionable guidance
- Use professional terminology appropriate for the field
- Offer to elaborate on complex topics
- NEVER use markdown formatting - no asterisks (**), no stars (*), no hash symbols (###), no underscores for emphasis
- Write in plain text only with clear paragraph structure
- Use simple numbered lists (1. 2. 3.) or dashes (-) for lists, but no bold or italic formatting
- Keep responses clean, readable, and professional without any special formatting characters

Always prioritize ethical practice and evidence-based guidance.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], userId }: ChatRequest = await req.json();

    console.log('AI Assistant request:', { userId, historyLength: conversationHistory.length, messageLength: message?.length });

    // Input validation and sanitization
    if (!message || typeof message !== 'string') {
      throw new Error('Message is required and must be a string');
    }

    const sanitizedMessage = sanitizeInput(message);
    if (!sanitizedMessage) {
      throw new Error('Message cannot be empty after sanitization');
    }

    if (sanitizedMessage.length < 1 || sanitizedMessage.length > 4000) {
      throw new Error('Message length must be between 1 and 4000 characters');
    }

    // Check for prompt injection attempts
    if (checkForPromptInjection(sanitizedMessage)) {
      throw new Error('Message contains prohibited content');
    }

    // Rate limiting
    const identifier = userId || 'anonymous';
    if (!checkRateLimit(identifier, 10, 60000)) { // 10 requests per minute
      throw new Error('Rate limit exceeded. Please wait before sending another message.');
    }

    // Build conversation context with sanitized history
    const sanitizedHistory = conversationHistory
      .slice(-8) // Keep last 8 messages for context (reduced for security)
      .map(msg => ({
        role: msg.role,
        content: sanitizeInput(msg.content)
      }))
      .filter(msg => msg.content); // Remove empty messages

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...sanitizedHistory,
      { role: 'user', content: sanitizedMessage }
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
          max_tokens: 800, // Reduced for security
          temperature: 0.7,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
          user: userId, // Track user for OpenAI safety
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
        // Build full conversation transcript
        const allMessages = [
          ...sanitizedHistory.slice(-7),
          { role: 'user', content: sanitizedMessage },
          { role: 'assistant', content: assistantResponse }
        ];
        
        // Format transcript for the content field
        const transcriptText = allMessages.map(m => {
          const role = m.role === 'user' ? 'You' : 'AI Assistant';
          return `${role}: ${m.content}`;
        }).join('\n\n---\n\n');

        const conversationData = {
          messages: allMessages,
          timestamp: new Date().toISOString(),
          metadata: {
            user_agent: req.headers.get('user-agent')?.slice(0, 200),
            ip_hash: req.headers.get('x-forwarded-for')?.split(',')[0]?.slice(0, 45)
          }
        };

        await supabase
          .from('notes')
          .insert([
            {
              user_id: userId,
              title: `AI Conversation - ${new Date().toLocaleDateString()}`,
              content: transcriptText, // Full transcript in content
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