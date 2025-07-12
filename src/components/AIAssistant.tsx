import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Bot, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { gsap } from 'gsap';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIAssistant = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant specialized in social work and mental health. I can provide guidance on AASW standards, NDIS processes, ethical considerations, and evidence-based practices. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const chatButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Convert messages to conversation history format
      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      // Call the AI assistant edge function
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: messageContent,
          conversationHistory,
          userId: user?.id,
        },
      });

      if (error) {
        console.error('Error calling AI assistant:', error);
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

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI Assistant error:', error);
      toast({
        title: "AI Assistant Error",
        description: error.message || "Failed to get response from AI assistant. Please try again.",
        variant: "destructive"
      });
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m currently unable to respond. Please try again in a moment, or feel free to contact our team directly for immediate assistance.',
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
    "What is the difference between counselling and social work?",
    "How do I book an appointment?"
  ];

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  // GSAP Animations
  useEffect(() => {
    if (chatButtonRef.current) {
      // Floating animation for chat button
      gsap.to(chatButtonRef.current, {
        y: -8,
        duration: 2,
        ease: "power2.inOut",
        repeat: -1,
        yoyo: true
      });

      // Pulse effect
      gsap.set(chatButtonRef.current, {
        boxShadow: "0 0 0 0 rgba(59, 130, 246, 0.7)"
      });
      
      gsap.to(chatButtonRef.current, {
        boxShadow: "0 0 0 20px rgba(59, 130, 246, 0)",
        duration: 2,
        ease: "power2.out",
        repeat: -1
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // Dialog entrance animation
      gsap.fromTo(dialogRef.current, 
        { 
          scale: 0.8, 
          opacity: 0,
          y: 50
        },
        { 
          scale: 1, 
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "back.out(1.7)"
        }
      );
    }
  }, [isOpen]);

  return (
    <>
      {/* Floating Chat Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            ref={chatButtonRef}
            size="lg"
            className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 z-50 border-2 border-primary/20 backdrop-blur-sm transition-all duration-300 hover:scale-110"
          >
            <MessageCircle className="h-7 w-7 text-white" />
            <span className="sr-only">Open AI Assistant</span>
          </Button>
        </DialogTrigger>
        
        <DialogContent 
          ref={dialogRef}
          className="sm:max-w-md h-[700px] flex flex-col p-0 border-0 shadow-2xl bg-gradient-to-b from-background to-background/95 backdrop-blur-md"
        >
          <DialogHeader className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              Professional AI Assistant
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Expert guidance for social work and mental health professionals
            </p>
          </DialogHeader>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
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
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div className={`flex-1 space-y-1 ${
                    message.role === 'user' ? 'text-right' : ''
                  }`}>
                    <div className={`inline-block px-3 py-2 rounded-lg max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="inline-block px-3 py-2 rounded-lg bg-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="px-6 py-4 border-t bg-gradient-to-r from-muted/20 to-transparent">
              <p className="text-sm font-semibold mb-3 text-foreground">Quick questions:</p>
              <div className="grid grid-cols-1 gap-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="justify-start h-auto p-3 text-xs hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-lg transition-all duration-200"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-border/50 bg-gradient-to-r from-background to-muted/10">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about social work or counselling..."
                disabled={isLoading}
                className="flex-1 border-border/50 focus:border-primary/50 bg-background/50 backdrop-blur-sm"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!input.trim() || isLoading}
                size="sm"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              This AI assistant provides general information only. For emergencies, call 000 or Lifeline 13 11 14.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};