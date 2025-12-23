import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, User, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { gsap } from 'gsap';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const STORAGE_KEY = 'client_ai_conversation';

export const ClientAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch {
        return getInitialMessages();
      }
    }
    return getInitialMessages();
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const chatButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function getInitialMessages(): Message[] {
    return [
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m here to help you find the right support and answer your questions about mental health services and social work. How can I assist you today?',
        timestamp: new Date()
      }
    ];
  }

  // Save to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const clearConversation = () => {
    setMessages(getInitialMessages());
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: "Conversation cleared",
      description: "Your conversation has been reset."
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

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

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: messageContent,
          conversationHistory,
          isPublic: true, // Flag to indicate this is a public/client request
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to get AI response');
      }

      if (!data || !data.response) {
        throw new Error('Invalid response from AI service');
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      // Simulate natural typing effect
      const fullResponse = data.response;
      let displayedContent = '';
      let charIndex = 0;
      const messageId = (Date.now() + 1).toString();

      const getTypingDelay = (char: string) => {
        if (char === ' ') return 25;
        if (char === '.' || char === '!' || char === '?') return 180;
        if (char === ',' || char === ';') return 80;
        if (char === '\n') return 120;
        return Math.random() * 35 + 35;
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
            timestamp: new Date()
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
      console.error('AI Assistant error:', error);
      toast({
        title: "Unable to respond",
        description: "Please try again or contact us directly for assistance.",
        variant: "destructive"
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble responding right now. Please try again, or feel free to reach out directly through our contact page for immediate assistance.',
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

  const quickQuestions = [
    "What services do you offer?",
    "How can I access NDIS support?",
    "How do I book an appointment?",
    "What mental health resources are available?"
  ];

  // Professional GSAP Animations
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

        gsap.set(chatButtonRef.current, {
          boxShadow: "0 0 0 0 rgba(59, 130, 246, 0.3)"
        });
        
        gsap.to(chatButtonRef.current, {
          boxShadow: "0 0 0 15px rgba(59, 130, 246, 0)",
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
  }, []);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const tl = gsap.timeline();
      
      tl.fromTo(dialogRef.current, 
        { scale: 0.9, opacity: 0, y: 20 },
        { duration: 0.4, scale: 1, opacity: 1, y: 0, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            ref={chatButtonRef}
            size="lg"
            className="fixed bottom-20 right-6 h-16 w-16 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 z-50 border-2 border-blue-500/20 backdrop-blur-sm transition-all duration-300 hover:scale-110"
          >
            <MessageCircle className="h-7 w-7 text-white" />
            <span className="sr-only">Open Support Chat</span>
          </Button>
        </DialogTrigger>
        
        <DialogContent 
          ref={dialogRef}
          className="sm:max-w-md h-[600px] flex flex-col p-0 border-0 shadow-2xl bg-white backdrop-blur-md"
        >
          <DialogHeader className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <DialogTitle className="flex items-center justify-between text-xl text-gray-900">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                Support Assistant
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConversation}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              Get help finding the right support and resources
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
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question..."
                className="flex-1 border-gray-200 focus:ring-blue-500"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="bg-blue-600 hover:bg-blue-700 h-10 w-10"
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
