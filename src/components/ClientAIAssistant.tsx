import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Send, User, Loader2, Trash2, Globe, Calendar, AlertTriangle } from 'lucide-react';
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

type Country = 'AU' | 'UK';

const STORAGE_KEY = 'groundpath_client_conversation';
const COUNTRY_KEY = 'groundpath_client_country';
const SESSION_MODE_KEY = 'groundpath_session_mode';

export const ClientAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [country, setCountry] = useState<Country>(() => {
    const stored = localStorage.getItem(COUNTRY_KEY);
    return (stored as Country) || 'AU';
  });
  const [showCountryPrompt, setShowCountryPrompt] = useState(() => {
    return !localStorage.getItem(COUNTRY_KEY);
  });
  const [isSessionMode, setIsSessionMode] = useState(() => {
    return localStorage.getItem(SESSION_MODE_KEY) === 'true';
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((m: any) => ({
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
  const { toast } = useToast();
  const chatButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getInitialMessage = (selectedCountry: Country): Message => ({
    id: '1',
    role: 'assistant',
    content: `Hello! I'm Ground Path's Support Assistant. I'm here to help you find the right mental health and social work support${selectedCountry === 'AU' ? ' in Australia' : ' in the UK'}.\n\nI can answer questions about:\n• Our counselling and therapy services\n• Mental health resources and information\n• ${selectedCountry === 'AU' ? 'NDIS support and navigation' : 'NHS mental health services'}\n• Finding the right professional support\n\n**Please note:** I provide information and guidance, not clinical advice. For personalised treatment, please consult a qualified professional.\n\nHow can I help you today?`,
    timestamp: new Date()
  });

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

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const selectCountry = (selectedCountry: Country) => {
    setCountry(selectedCountry);
    setShowCountryPrompt(false);
    setMessages([getInitialMessage(selectedCountry)]);
  };

  const clearConversation = () => {
    setMessages([getInitialMessage(country)]);
    setIsSessionMode(false);
    setShowCounsellingPrompt(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_MODE_KEY);
    toast({
      title: "Conversation cleared",
      description: "Your conversation has been reset."
    });
  };

  const startSessionMode = () => {
    setIsSessionMode(true);
    setShowCounsellingPrompt(false);
    const sessionMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `I'm now in **support session mode**. While I'm not a replacement for professional therapy, I'm here to listen and provide a supportive space.\n\n🟡 **Session Active**\n\nTake your time to share what's on your mind. I'll listen without judgment and offer what support I can.\n\n*Remember: If you'd prefer to speak with a qualified counsellor, Ground Path offers professional online sessions.*`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, sessionMessage]);
    toast({
      title: "Support session started",
      description: "I'm here to listen and support you.",
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

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
        }
      };

      streamCharacter();
    } catch (error: any) {
      console.error('Client AI Assistant error:', error);
      toast({
        title: "Unable to respond",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'm having trouble responding right now. If you need immediate support:\n\n${country === 'AU' 
          ? '**Lifeline Australia:** 13 11 14\n**Beyond Blue:** 1300 22 4636\n**Emergency:** 000' 
          : '**Samaritans:** 116 123\n**Mind:** 0300 123 3393\n**Emergency:** 999'}\n\nOr visit our [Contact Page](/contact) to reach us directly.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = country === 'AU' ? [
    "What services does Ground Path offer?",
    "How can I access NDIS support?",
    "How do I book a counselling session?",
    "What mental health resources are available?"
  ] : [
    "What services does Ground Path offer?",
    "How do I access NHS mental health support?",
    "How do I book a counselling session?",
    "What mental health resources are available?"
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

  // Session mode colors
  const sessionColor = isSessionMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700';
  const sessionBorderColor = isSessionMode ? 'border-amber-400/30' : 'border-blue-500/20';
  const sessionHeaderBg = isSessionMode ? 'from-amber-50 to-white' : 'from-blue-50 to-white';
  const sessionAccent = isSessionMode ? 'text-amber-600' : 'text-blue-600';
  const sessionBg = isSessionMode ? 'bg-amber-600' : 'bg-blue-600';

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
          className="sm:max-w-md h-[650px] flex flex-col p-0 border-0 shadow-2xl bg-white backdrop-blur-md"
        >
          {/* Country Selection Overlay */}
          {showCountryPrompt && (
            <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 rounded-lg">
              <Globe className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Ground Path</h3>
              <p className="text-gray-600 text-center mb-6">Please select your location so I can provide relevant resources and information.</p>
              <div className="flex gap-4">
                <Button 
                  onClick={() => selectCountry('AU')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700"
                >
                  🇦🇺 Australia
                </Button>
                <Button 
                  onClick={() => selectCountry('UK')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700"
                >
                  🇬🇧 United Kingdom
                </Button>
              </div>
            </div>
          )}

          <DialogHeader className={`p-4 border-b border-gray-200 bg-gradient-to-r ${sessionHeaderBg}`}>
            <DialogTitle className="flex items-center justify-between text-lg text-gray-900">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full ${sessionBg} flex items-center justify-center shadow-md`}>
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="block">Ground Path Support</span>
                  {isSessionMode && (
                    <span className="text-xs font-normal text-amber-600 flex items-center gap-1">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                      Session Mode Active
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearConversation}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  title="Clear conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Select value={country} onValueChange={(v) => setCountry(v as Country)}>
                  <SelectTrigger className="w-20 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AU">🇦🇺 AU</SelectItem>
                    <SelectItem value="UK">🇬🇧 UK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </DialogTitle>
            <p className="text-xs text-gray-500 mt-1">
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
                      {message.content.replace(/\*\*/g, '').replace(/\*/g, '')}
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
                      <div className={`w-2 h-2 ${isSessionMode ? 'bg-amber-400' : 'bg-blue-400'} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
                      <div className={`w-2 h-2 ${isSessionMode ? 'bg-amber-400' : 'bg-blue-400'} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
                      <div className={`w-2 h-2 ${isSessionMode ? 'bg-amber-400' : 'bg-blue-400'} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
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
              <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className={`text-xs px-3 py-1.5 rounded-full ${
                      isSessionMode 
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' 
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    } transition-colors`}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 text-center">
              AI assistant providing information only. Not a substitute for professional advice. 
              {country === 'AU' ? ' Crisis: Lifeline 13 11 14' : ' Crisis: Samaritans 116 123'}
            </p>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isSessionMode ? "Share what's on your mind..." : "Type your question..."}
                className={`flex-1 border-gray-200 focus:ring-2 ${isSessionMode ? 'focus:ring-amber-500' : 'focus:ring-blue-500'}`}
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                size="icon"
                className={`${sessionColor} h-10 w-10`}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClientAIAssistant;
