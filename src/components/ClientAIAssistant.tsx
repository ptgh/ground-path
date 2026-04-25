import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Send, User, Loader2, Trash2, Globe, Calendar, AlertTriangle, Phone, Mail, X, Clock, Square, Mic, CheckCircle2, BookOpen, DollarSign, HelpCircle, Sparkles } from 'lucide-react';
import VoiceCounsellingSession from './VoiceCounsellingSession';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { gsap } from 'gsap';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isCrisis?: boolean;
}

type Country = 'AU' | 'UK' | 'OTHER';

const STORAGE_KEY = 'groundpath_client_conversation';
const COUNTRY_KEY = 'groundpath_client_country';
const SESSION_MODE_KEY = 'groundpath_session_mode';
const SESSION_START_KEY = 'groundpath_session_start';
const SESSION_TIMEOUT_MINUTES = 20;

// Crisis keywords detection
const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die', 'self-harm',
  'self harm', 'cutting', 'hurt myself', 'no reason to live', 'better off dead',
  'end it all', 'take my life', 'overdose', 'jump off', 'hang myself'
];

const detectCrisisKeywords = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return CRISIS_KEYWORDS.some(keyword => lowerText.includes(keyword));
};

// URL regex to detect links in text
const URL_REGEX = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+)(?:\/[^\s)]*)?/g;

// Phone number regex - matches Australian and UK formats
const PHONE_REGEX = /\b(13\s?\d{2}\s?\d{2}|1[38]00\s?\d{2,3}\s?\d{2,3}|0[23478]\d{2}\s?\d{3}\s?\d{3,4}|116\s?123|000|999|111)\b/g;

// Helper to render text with clickable links and phone numbers
const renderMessageWithLinks = (text: string): React.ReactNode => {
  const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '');
  
  // Combined regex to match URLs and phone numbers
  const COMBINED_REGEX = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+)(?:\/[^\s)]*)?|\b(13\s?\d{2}\s?\d{2}|1[38]00\s?\d{2,3}\s?\d{2,3}|0[23478]\d{2}\s?\d{3}\s?\d{3,4}|116\s?123|000|999|111)\b/g;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = COMBINED_REGEX.exec(cleanText)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(cleanText.slice(lastIndex, match.index));
    }
    
    const matchedText = match[0];
    
    // Check if it's a phone number (group 2 matched)
    if (match[2]) {
      const phoneDigits = matchedText.replace(/\s/g, '');
      parts.push(
        <a
          key={`phone-${match.index}`}
          href={`tel:${phoneDigits}`}
          className="text-blue-600 hover:text-blue-800 underline"
          onClick={(e) => e.stopPropagation()}
        >
          {matchedText}
        </a>
      );
    } else {
      // It's a URL
      const href = matchedText.startsWith('http') ? matchedText : `https://${matchedText}`;
      parts.push(
        <a
          key={`url-${match.index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
          onClick={(e) => e.stopPropagation()}
        >
          {matchedText}
        </a>
      );
    }
    
    lastIndex = match.index + matchedText.length;
  }
  
  // Add remaining text
  if (lastIndex < cleanText.length) {
    parts.push(cleanText.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : cleanText;
};

export const ClientAIAssistant = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [country] = useState<Country>('AU');
  const [showCountryPrompt] = useState(false);
  const [isSessionMode, setIsSessionMode] = useState(() => {
    return localStorage.getItem(SESSION_MODE_KEY) === 'true';
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCounsellingPrompt, setShowCounsellingPrompt] = useState(false);
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const [showSessionTimeout, setShowSessionTimeout] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showVoiceSession, setShowVoiceSession] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const chatButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stopStreamingRef = useRef(false);

  const getInitialMessage = (): Message => ({
    id: '1',
    role: 'assistant',
    content: `Hello! I'm groundpath's Support Assistant. I'm here to help you find the right mental health and social work support in Australia.\n\nI can answer questions about:\n• Our counselling and therapy services\n• Mental health resources and information\n• NDIS support and navigation\n• Finding the right professional support\n\nPlease note: I provide information and guidance, not clinical advice. For personalised treatment, please consult a qualified professional.\n\nHow can I help you today?`,
    timestamp: new Date()
  });

  // Crisis resources - Australian only (UK/international held for future admin toggle)
  const getCrisisResources = useCallback(() => {
    return {
      primary: { name: 'Lifeline Australia', number: '13 11 14' },
      secondary: { name: 'Beyond Blue', number: '1300 22 4636' },
      emergency: '000',
      text: 'Crisis Text Line: Text 0477 131 114'
    };
  }, []);

  // Session timeout logic
  const startSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
    }
    
    const startTime = Date.now();
    localStorage.setItem(SESSION_START_KEY, startTime.toString());
    
    sessionTimerRef.current = setTimeout(() => {
      setShowSessionTimeout(true);
    }, SESSION_TIMEOUT_MINUTES * 60 * 1000);
  }, []);

  const resetSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
    }
    setShowSessionTimeout(false);
    if (isSessionMode) {
      startSessionTimer();
    }
  }, [isSessionMode, startSessionTimer]);

  // Check for existing session on mount
  useEffect(() => {
    if (isSessionMode) {
      const savedStart = localStorage.getItem(SESSION_START_KEY);
      if (savedStart) {
        const elapsed = Date.now() - parseInt(savedStart);
        const remaining = (SESSION_TIMEOUT_MINUTES * 60 * 1000) - elapsed;
        if (remaining > 0) {
          sessionTimerRef.current = setTimeout(() => {
            setShowSessionTimeout(true);
          }, remaining);
        } else {
          setShowSessionTimeout(true);
        }
      } else {
        startSessionTimer();
      }
    }
    
    return () => {
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
      }
    };
  }, [isSessionMode, startSessionTimer]);

  // Check messages for crisis keywords
  useEffect(() => {
    const hasCrisis = messages.some(msg => 
      msg.role === 'user' && detectCrisisKeywords(msg.content)
    );
    setShowCrisisBanner(hasCrisis);
  }, [messages]);

  // Save to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(COUNTRY_KEY, country);
  }, [country]);

  useEffect(() => {
    localStorage.setItem(SESSION_MODE_KEY, String(isSessionMode));
  }, [isSessionMode]);

  // Close country dropdown on outside click
  useEffect(() => {
    if (!countryOpen) return;
    const handler = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [countryOpen]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // selectCountry kept for future admin toggle
  const selectCountry = (_selectedCountry: Country) => {
    // Country switching disabled - AU only for now
    setMessages([getInitialMessage()]);
  };

  const clearConversation = () => {
    setMessages([getInitialMessage()]);
    setIsSessionMode(false);
    setShowCounsellingPrompt(false);
    setShowCrisisBanner(false);
    setShowSessionTimeout(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_MODE_KEY);
    localStorage.removeItem(SESSION_START_KEY);
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
    }
    toast({
      title: "Conversation cleared",
      description: "Your conversation has been reset."
    });
  };

  const startSessionMode = () => {
    setIsSessionMode(true);
    setShowCounsellingPrompt(false);
    startSessionTimer();
    
    const sessionMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `I'm now in support session mode. While I'm not a replacement for professional therapy, I'm here to listen and provide a supportive space.\n\n🟡 Session Active\n\nTake your time to share what's on your mind. I'll listen without judgment and offer what support I can.\n\nRemember: If you'd prefer to speak with a qualified counsellor, groundpath offers professional online sessions.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, sessionMessage]);
    toast({
      title: "Support session started",
      description: "I'm here to listen and support you.",
    });
  };

  const handleEmailTranscript = async () => {
    if (!emailAddress.trim() || !emailAddress.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setIsSendingEmail(true);
    
    try {
      // Format transcript
      const transcript = messages.map(msg => {
        const time = new Date(msg.timestamp).toLocaleString();
        const role = msg.role === 'user' ? 'You' : 'groundpath Support';
        return `[${time}] ${role}:\n${msg.content.replace(/\*\*/g, '').replace(/\*/g, '')}`;
      }).join('\n\n---\n\n');

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailAddress,
          subject: 'Your groundpath Conversation Transcript',
          template: 'transcript',
          data: {
            transcript,
            country,
            date: new Date().toLocaleDateString()
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Transcript sent",
        description: `Your conversation has been emailed to ${emailAddress}`
      });
      setShowEmailModal(false);
      setEmailAddress('');
    } catch (error) {
      console.error('Email error:', error);
      toast({
        title: "Failed to send",
        description: "Please try again or copy the conversation manually.",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const stopStreaming = () => {
    stopStreamingRef.current = true;
    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    stopStreamingRef.current = false;

    // Reset session timer on activity
    if (isSessionMode) {
      resetSessionTimer();
    }

    // Handle session mode choice
    if (showCounsellingPrompt) {
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('book') || lowerInput.includes('session') || lowerInput.includes('counsellor') || lowerInput.includes('practitioner')) {
        window.open('/contact', '_blank');
        setShowCounsellingPrompt(false);
        return;
      } else if (lowerInput.includes('continue') || lowerInput.includes('chat')) {
        startSessionMode();
        setInput('');
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const messageContent = input.trim();
    setInput('');
    setIsLoading(true);
    setShowCounsellingPrompt(false);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('client-ai-assistant', {
        body: {
          message: messageContent,
          conversationHistory,
          country,
          isSessionMode,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to get response');
      }

      if (!data || !data.response) {
        throw new Error('Invalid response from AI service');
      }

      // Check if we should show counselling prompt
      if (data.showCounsellingPrompt && !isSessionMode) {
        setShowCounsellingPrompt(true);
      }

      const messageId = (Date.now() + 1).toString();
      const fullResponse = data.response;
      let displayedContent = '';
      let charIndex = 0;

      const getTypingDelay = (char: string) => {
        if (char === ' ') return 20;
        if (char === '.' || char === '!' || char === '?') return 150;
        if (char === ',' || char === ';') return 60;
        if (char === '\n') return 100;
        return Math.random() * 30 + 25;
      };

      const streamCharacter = () => {
        if (stopStreamingRef.current) {
          // Streaming was stopped
          setIsLoading(false);
          return;
        }

        if (charIndex < fullResponse.length) {
          displayedContent += fullResponse[charIndex];
          const currentChar = fullResponse[charIndex];
          charIndex++;
          
          const streamingMessage: Message = {
            id: messageId,
            role: 'assistant',
            content: displayedContent,
            timestamp: new Date(),
            isCrisis: data.isCrisis
          };

          setMessages(prev => {
            const filtered = prev.filter(msg => msg.id !== messageId);
            return [...filtered, streamingMessage];
          });

          const delay = getTypingDelay(currentChar);
          setTimeout(streamCharacter, delay);
        } else {
          // Streaming complete
          setIsLoading(false);
        }
      };

      streamCharacter();
    } catch (error) {
      console.error('Client AI Assistant error:', error);
      toast({
        title: "Unable to respond",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });
      
      const crisisInfo = getCrisisResources();
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'm having trouble responding right now. If you need immediate support:\n\n${crisisInfo.primary.name}: ${crisisInfo.primary.number}\n${crisisInfo.secondary.name}: ${crisisInfo.secondary.number}\nEmergency: ${crisisInfo.emergency}\n\nOr visit our contact page to reach us directly.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick intents — each one either navigates to a real page (more useful than
  // dumping the question into the input) or seeds a relevant prompt.
  type QuickIntent =
    | { kind: 'navigate'; label: string; icon: typeof Calendar; href: string }
    | { kind: 'prompt'; label: string; icon: typeof Calendar; prompt: string };
  const quickIntents: QuickIntent[] = [
    { kind: 'navigate', label: 'Book a session', icon: Calendar, href: '/book' },
    { kind: 'navigate', label: 'Pricing & FAQ', icon: DollarSign, href: '/#faq' },
    { kind: 'navigate', label: 'Resources', icon: BookOpen, href: '/resources' },
    { kind: 'prompt', label: 'NDIS support?', icon: HelpCircle, prompt: 'How can I access NDIS support through groundpath?' },
    { kind: 'prompt', label: 'What is groundpath?', icon: Sparkles, prompt: 'What services does groundpath offer?' },
  ];

  // Animations
  useEffect(() => {
    let tl: GSAPTimeline;
    
    const initAnimations = () => {
      if (chatButtonRef.current) {
        tl = gsap.timeline();
        
        tl.from(chatButtonRef.current, {
          duration: 0.6,
          scale: 0,
          opacity: 0,
          ease: "back.out(1.4)"
        });

        gsap.to(chatButtonRef.current, {
          y: -4,
          duration: 3,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        });

        const buttonColor = isSessionMode ? 'rgba(234, 179, 8, 0.4)' : 'rgba(59, 130, 246, 0.3)';
        gsap.set(chatButtonRef.current, {
          boxShadow: `0 0 0 0 ${buttonColor}`
        });
        
        gsap.to(chatButtonRef.current, {
          boxShadow: `0 0 0 15px rgba(0, 0, 0, 0)`,
          duration: 3,
          ease: "power2.out",
          repeat: -1
        });
      }
    };

    initAnimations();

    return () => {
      if (tl) tl.kill();
      gsap.killTweensOf(chatButtonRef.current);
    };
  }, [isSessionMode]);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      gsap.fromTo(dialogRef.current, 
        { scale: 0.9, opacity: 0, y: 20 },
        { duration: 0.4, scale: 1, opacity: 1, y: 0, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  // Session mode colors - using sage/primary theme
  const sessionColor = isSessionMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90';
  const sessionBorderColor = isSessionMode ? 'border-amber-400/30' : 'border-primary/20';
  const sessionHeaderBg = isSessionMode ? 'from-amber-50 to-white' : 'from-primary/5 to-white';
  const sessionAccent = isSessionMode ? 'text-amber-600' : 'text-primary';
  const sessionBg = isSessionMode ? 'bg-amber-600' : 'bg-primary';

  const crisisResources = getCrisisResources();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            ref={chatButtonRef}
            size="lg"
            className={`fixed bottom-20 right-6 h-16 w-16 rounded-full shadow-2xl ${sessionColor} z-50 border-2 ${sessionBorderColor} backdrop-blur-sm transition-all duration-300 hover:scale-110`}
          >
            <MessageCircle className="h-7 w-7 text-white" />
            <span className="sr-only">Open Support Chat</span>
          </Button>
        </DialogTrigger>
        
        <DialogContent 
          ref={dialogRef}
          className="max-w-md lg:max-w-2xl w-[calc(100%-2rem)] max-h-[90vh] min-h-[520px] flex flex-col p-0 border-2 border-border shadow-2xl bg-card backdrop-blur-md rounded-2xl overflow-hidden"
        >
          {/* Crisis Banner - Shows when crisis keywords detected */}
          {showCrisisBanner && (
            <div className="bg-red-600 text-white px-4 py-3 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 animate-pulse" />
                  <span className="font-semibold text-sm">Immediate Support Available</span>
                </div>
                <button 
                  onClick={() => setShowCrisisBanner(false)}
                  className="text-white/80 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs mb-3 text-red-100">
                If you're in crisis, please reach out to a helpline now. You don't have to face this alone.
              </p>
              <div className="flex flex-wrap gap-2">
                <a 
                  href={`tel:${crisisResources.primary.number.replace(/\s/g, '')}`}
                  className="flex items-center gap-1.5 bg-white text-red-600 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-red-50 transition-colors"
                >
                  <Phone className="h-3 w-3" />
                  {crisisResources.primary.name}: {crisisResources.primary.number}
                </a>
                <a 
                  href={`tel:${crisisResources.emergency}`}
                  className="flex items-center gap-1.5 bg-red-700 text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-red-800 transition-colors"
                >
                  <Phone className="h-3 w-3" />
                  Emergency: {crisisResources.emergency}
                </a>
              </div>
            </div>
          )}

          {/* Session Timeout Reminder */}
          {showSessionTimeout && isSessionMode && (
            <div className="bg-amber-100 border-b border-amber-200 px-4 py-3 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">You've been chatting for a while</span>
              </div>
              <p className="text-xs text-amber-700 mb-3">
                Taking a break can be helpful. Would you like to speak with a professional counsellor?
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => window.open('/contact', '_blank')}
                  className="text-xs bg-amber-600 hover:bg-amber-700"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Book a session
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetSessionTimer}
                  className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  Continue chatting
                </Button>
              </div>
            </div>
          )}

          {/* Country Selection Overlay */}
          {showCountryPrompt && (
            <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 rounded-lg">
              <div className="bg-white rounded-2xl shadow-xl border border-border p-8 w-full max-w-[300px]">
                <div className="flex justify-center mb-5">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground text-center mb-2">Welcome to groundpath</h3>
                <p className="text-muted-foreground text-center text-sm mb-6">Please select your location so I can provide relevant resources and information.</p>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'AU' as Country, label: 'Australia' },
                    { value: 'UK' as Country, label: 'UK' },
                    { value: 'OTHER' as Country, label: 'Global' },
                  ].map((c) => (
                    <Button
                      key={c.value}
                      onClick={() => selectCountry(c.value)}
                      variant="outline"
                      className="w-full justify-start gap-3 px-4 py-3 text-sm border-border hover:bg-muted/50 rounded-xl"
                    >
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      {c.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Email Modal */}
          {showEmailModal && (
            <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 rounded-lg">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Email Transcript</h3>
                  <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  We'll send a copy of this conversation to your email for your records.
                </p>
                <Input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="your@email.com"
                  className="mb-4"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleEmailTranscript}
                    disabled={isSendingEmail}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {isSendingEmail ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Send Transcript
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogHeader className={`p-4 border-b border-border bg-gradient-to-r ${sessionHeaderBg}`}>
            <DialogTitle className="flex items-center justify-between text-lg text-foreground">
              <div className="flex items-center gap-3">
                {/* Logo */}
                <svg width="32" height="32" viewBox="0 0 40 40" className="flex-shrink-0">
                  <path
                    d="M20 6 C 28 8, 32 16, 30 24 C 28 30, 22 32, 16 30 C 12 28, 10 24, 12 20 C 13 18, 15 17, 17 18 C 18 18.5, 18.5 19, 18 19.5"
                    fill="none"
                    stroke="#7B9B85"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>
                  <span className="block font-medium">groundpath</span>
                  {isSessionMode && (
                    <span className="text-xs font-normal text-amber-600 flex items-center gap-1">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                      Session Mode Active
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setIsOpen(false); setTimeout(() => setShowVoiceSession(true), 300); }}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                  title="AI counselling session"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmailModal(true)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                  title="Email transcript"
                >
                  <Mail className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearConversation}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  title="Clear conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {/* Country fixed to AU - admin can re-enable dropdown */}
              </div>
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {isSessionMode 
                ? "I'm here to listen. This is a supportive space, not professional therapy."
                : "Get help finding mental health support and resources"
              }
            </p>
          </DialogHeader>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? `${sessionBg} text-white` 
                      : message.isCrisis 
                        ? 'bg-red-100' 
                        : 'bg-gray-100'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : message.isCrisis ? (
                      <AlertTriangle className={`h-4 w-4 text-red-600`} />
                    ) : (
                      <MessageCircle className={`h-4 w-4 ${sessionAccent}`} />
                    )}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    message.role === 'user'
                      ? `${sessionBg} text-white`
                      : message.isCrisis
                        ? 'bg-red-50 text-gray-800 border border-red-200'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {renderMessageWithLinks(message.content)}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <MessageCircle className={`h-4 w-4 ${sessionAccent}`} />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-1.5">
                   <div className={`w-2 h-2 ${isSessionMode ? 'bg-amber-400' : 'bg-primary/60'} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
                       <div className={`w-2 h-2 ${isSessionMode ? 'bg-amber-400' : 'bg-primary/60'} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
                       <div className={`w-2 h-2 ${isSessionMode ? 'bg-amber-400' : 'bg-primary/60'} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Counselling Prompt */}
          {showCounsellingPrompt && (
            <div className="px-4 py-3 bg-amber-50 border-t border-amber-200">
              <p className="text-sm text-amber-800 mb-3">Would you like more support?</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={startSessionMode}
                  variant="outline"
                  className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  💬 Continue chatting
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.open('/contact', '_blank')}
                  className="text-xs bg-amber-600 hover:bg-amber-700"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Book a session
                </Button>
              </div>
            </div>
          )}

          {/* Quick Questions */}
          {messages.length <= 1 && !showCountryPrompt && (
            <div className="px-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Quick questions:</p>
                <Button
                  size="sm"
                  onClick={() => { setIsOpen(false); setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }), 300); }}
                  className="text-xs bg-primary hover:bg-primary/90 h-7 px-3"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Book a Session
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className={`text-xs px-3 py-1.5 rounded-full ${
                      isSessionMode 
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' 
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    } transition-colors`}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="px-4 py-2 bg-muted/50 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">
              AI assistant providing information only. Not a substitute for professional advice. Crisis: Lifeline 13 11 14
            </p>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-card rounded-b-2xl">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isSessionMode ? "Share what's on your mind..." : "Type your question..."}
                className={`flex-1 border-gray-200 focus:ring-2 ${isSessionMode ? 'focus:ring-amber-500' : 'focus:ring-primary'}`}
                disabled={isLoading}
              />
              <Button
                onClick={isLoading ? stopStreaming : sendMessage}
                disabled={!isLoading && !input.trim()}
                size="icon"
                className={isLoading ? `bg-muted-foreground/80 hover:bg-muted-foreground h-10 w-10 rounded-lg` : `${sessionColor} h-10 w-10`}
              >
                {isLoading ? (
                  <Square className="h-3.5 w-3.5" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {showVoiceSession && (
        <VoiceCounsellingSession onClose={() => setShowVoiceSession(false)} initialCountry={country} />
      )}
    </>
  );
};

export default ClientAIAssistant;
