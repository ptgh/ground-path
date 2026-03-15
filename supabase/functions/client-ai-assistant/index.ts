import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ClientChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  country: 'AU' | 'UK';
  isSessionMode?: boolean;
}

// Security utilities
const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  return input
    .slice(0, 4000)
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
  ];
  return suspiciousPatterns.some(pattern => pattern.test(message));
};

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (identifier: string, maxRequests: number = 15, windowMs: number = 60000): boolean => {
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

// Country-specific resources
const getCountryResources = (country: 'AU' | 'UK') => {
  if (country === 'AU') {
    return `
**AUSTRALIAN CRISIS RESOURCES:**
- Lifeline Australia: 13 11 14 (24/7)
- Beyond Blue: 1300 22 4636
- Kids Helpline: 1800 55 1800
- Suicide Call Back Service: 1300 659 467
- Emergency Services: 000
- Mental Health Crisis: 1800 011 511

**TRUSTED AUSTRALIAN RESOURCES:**
- Beyond Blue (beyondblue.org.au) - mental health information and support
- Headspace (headspace.org.au) - youth mental health
- SANE Australia (sane.org) - complex mental health
- Black Dog Institute (blackdoginstitute.org.au) - mood disorders research
- AASW (aasw.asn.au) - Australian Association of Social Workers
- NDIS (ndis.gov.au) - National Disability Insurance Scheme
- MindSpot (mindspot.org.au) - free online mental health assessment`;
  } else {
    return `
**UK CRISIS RESOURCES:**
- Samaritans: 116 123 (24/7, free)
- Mind Infoline: 0300 123 3393
- Childline: 0800 1111
- PAPYRUS (young people): 0800 068 4141
- Emergency Services: 999
- NHS Mental Health: 111 (Option 2)

**TRUSTED UK RESOURCES:**
- Mind (mind.org.uk) - mental health information and support
- Rethink Mental Illness (rethink.org) - severe mental illness support
- NHS Mental Health (nhs.uk/mental-health) - official health service
- BACP (bacp.co.uk) - British Association for Counselling and Psychotherapy
- BASW (basw.co.uk) - British Association of Social Workers
- Young Minds (youngminds.org.uk) - children and young people
- Mental Health Foundation (mentalhealth.org.uk) - research and resources`;
  }
};

const getSystemPrompt = (country: 'AU' | 'UK', isSessionMode: boolean) => {
  const countryResources = getCountryResources(country);
  const countryContext = country === 'AU' 
    ? 'You are knowledgeable about Australian healthcare systems including Medicare, NDIS, and state-based mental health services.'
    : 'You are knowledgeable about UK healthcare systems including NHS mental health services, IAPT, and local authority social services.';

  const sessionModeContext = isSessionMode 
    ? `
**SESSION MODE ACTIVE:**
You are now in a supportive conversation session. While you are not a replacement for professional therapy, you can:
- Provide a safe, non-judgmental space for the user to express their thoughts
- Use active listening techniques and reflective responses
- Offer evidence-based coping strategies and psychoeducation
- Help explore thoughts and feelings using CBT-informed questioning
- Encourage self-compassion and validate emotions
- Gently guide towards professional support when appropriate

Maintain warmth, empathy, and patience. Use phrases like "I hear you," "That sounds difficult," and "It makes sense you feel that way."
` : '';

  return `You are Ground Path's Support Assistant - a compassionate, knowledgeable guide helping people find mental health and social work support. You represent Ground Path, a platform connecting people with professional counselling, social work services, and mental health resources.

ABOUT GROUND PATH:
Ground Path is a professional platform offering:
- Online counselling and therapy sessions with qualified practitioners
- Social work support and advocacy
- Mental health resources and educational content
- Professional tools for practitioners (social workers, counsellors, psychologists)
- NDIS support coordination (Australia)
- Community resources and directories

YOUR ROLE:
1. Help users understand what support is available to them
2. Answer questions about mental health, counselling, and social work services
3. Provide information about Ground Path's services
4. Direct users to appropriate professional help when needed
5. Share evidence-based mental health information from trusted sources
6. Be warm, supportive, and professional at all times

${countryContext}

${sessionModeContext}

CRITICAL SAFETY GUIDELINES:
- You are NOT a therapist, counsellor, or mental health professional
- You provide INFORMATION and SUPPORT, not clinical treatment
- Always recommend professional help for serious concerns
- If you detect crisis indicators (suicidal ideation, self-harm, abuse), immediately provide crisis resources
- Never diagnose conditions or recommend specific medications
- Encourage users to verify information with qualified professionals

RESPONSE GUIDELINES:
- Be warm, compassionate, and non-judgmental
- Keep responses clear and accessible (avoid jargon)
- Acknowledge emotions and validate experiences
- Provide practical, actionable information
- Reference trusted sources (NHS, Beyond Blue, MIND, BACP, AASW, etc.)
- When unsure, say so and direct to professional help
- If someone seems to want counselling, ask if they'd like to book a session with a Ground Path practitioner
- NEVER use markdown formatting - no asterisks (**), no stars (*), no hash symbols (###), no underscores for emphasis
- Write in plain text only with clear paragraph structure
- Use simple numbered lists (1. 2. 3.) or dashes (-) for lists, but no bold or italic formatting
- Keep responses clean, readable, and professional without any special formatting characters

BOOKING SESSIONS:
When someone asks about booking a session, booking an appointment, seeing a counsellor, or making an appointment, always provide this direct booking link: https://www.halaxy.com/profile/groundpath/location/1353667
Say something like: "You can book a session directly through our booking page: https://www.halaxy.com/profile/groundpath/location/1353667"

DETECTING COUNSELLING INTENT:
If the user seems to want deeper emotional support, counselling, or therapy, you should:
1. Acknowledge their need for support
2. Let them know Ground Path offers professional counselling sessions
3. Offer the booking link: https://www.halaxy.com/profile/groundpath/location/1353667
4. Ask if they'd like to continue chatting or book a session
5. If they continue in chat, switch to a more supportive, session-like mode

${countryResources}

DISCLAIMER TO INCLUDE WHEN APPROPRIATE:
"Please note: I'm an AI assistant providing general information and support. For personalised advice, diagnosis, or treatment, please consult a qualified healthcare professional."

Remember: Your goal is to be a helpful bridge connecting people with the right support, not to replace professional care.`;
};

// Detect if user might want counselling/deeper support
const detectCounsellingIntent = (message: string, history: ChatMessage[]): boolean => {
  const intentPatterns = [
    /i('m| am) feeling (depressed|anxious|sad|overwhelmed|stressed|lonely|hopeless)/i,
    /need (someone )?to talk( to)?/i,
    /can('t| cannot) cope/i,
    /struggling (with|to)/i,
    /having (a )?hard time/i,
    /don'?t know what to do/i,
    /help me (understand|deal|cope|process)/i,
    /therapy|counselling|counselor|therapist/i,
    /talk (about|through) (my|this)/i,
    /going through (a )?lot/i,
    /feeling (lost|stuck|empty|broken)/i,
    /mental health/i,
    /suicid|self[- ]?harm|hurt myself/i,
  ];
  
  const messageIndicatesIntent = intentPatterns.some(pattern => pattern.test(message));
  
  // Also check recent history for escalating emotional content
  const recentEmotionalMessages = history.filter(m => 
    m.role === 'user' && intentPatterns.some(p => p.test(m.content))
  );
  
  return messageIndicatesIntent || recentEmotionalMessages.length >= 2;
};

// Check for crisis indicators
const detectCrisis = (message: string): boolean => {
  const crisisPatterns = [
    /suicid/i,
    /kill (myself|me)/i,
    /end (my|it all)/i,
    /want to die/i,
    /self[- ]?harm/i,
    /hurt(ing)? myself/i,
    /cut(ting)? myself/i,
    /no reason to live/i,
    /better off (dead|without me)/i,
  ];
  return crisisPatterns.some(pattern => pattern.test(message));
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], country = 'AU', isSessionMode = false }: ClientChatRequest = await req.json();

    console.log('Client AI Assistant request:', { 
      country, 
      isSessionMode, 
      historyLength: conversationHistory.length, 
      messageLength: message?.length 
    });

    // Input validation
    if (!message || typeof message !== 'string') {
      throw new Error('Message is required and must be a string');
    }

    const sanitizedMessage = sanitizeInput(message);
    if (!sanitizedMessage) {
      throw new Error('Message cannot be empty');
    }

    if (sanitizedMessage.length < 1 || sanitizedMessage.length > 4000) {
      throw new Error('Message length must be between 1 and 4000 characters');
    }

    if (checkForPromptInjection(sanitizedMessage)) {
      throw new Error('Message contains prohibited content');
    }

    // Rate limiting by IP
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    if (!checkRateLimit(ipAddress, 15, 60000)) {
      throw new Error('Rate limit exceeded. Please wait before sending another message.');
    }

    // Build conversation context
    const sanitizedHistory = conversationHistory
      .slice(-10)
      .map(msg => ({
        role: msg.role,
        content: sanitizeInput(msg.content)
      }))
      .filter(msg => msg.content);

    // Detect if this might be a crisis
    const isCrisis = detectCrisis(sanitizedMessage);
    
    // Detect counselling intent
    const showCounsellingPrompt = !isSessionMode && detectCounsellingIntent(sanitizedMessage, sanitizedHistory);

    const messages: ChatMessage[] = [
      { role: 'system', content: getSystemPrompt(country, isSessionMode) },
      ...sanitizedHistory,
      { role: 'user', content: sanitizedMessage }
    ];

    // If crisis detected, add urgent instruction
    if (isCrisis) {
      messages.push({
        role: 'system',
        content: `URGENT: Crisis indicators detected. Start your response by immediately providing crisis resources for ${country}. Be compassionate but prioritise safety. Encourage immediate professional help.`
      });
    }

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
        temperature: isSessionMode ? 0.8 : 0.7,
        presence_penalty: 0.2,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to get response from AI service');
    }

    const data = await response.json();
    let assistantResponse = data.choices[0].message.content;

    // Append counselling prompt if detected
    if (showCounsellingPrompt && !isCrisis) {
      assistantResponse += `\n\nWould you like more support? I'm here to help with information, but if you'd like to speak with a professional counsellor, Ground Path offers online sessions with qualified practitioners.\n\nYou can book a session directly here: https://www.halaxy.com/profile/groundpath/location/1353667\n\nOr feel free to continue chatting with me for information and support.`;
    }

    console.log('Client AI response generated:', {
      responseLength: assistantResponse.length, 
      isCrisis,
      showCounsellingPrompt 
    });

    return new Response(JSON.stringify({ 
      response: assistantResponse,
      isCrisis,
      showCounsellingPrompt,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in client-ai-assistant function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred',
      details: 'Please try again or contact us directly for assistance.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
