import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Bot, User, Loader2, History, Trash2, Plus, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { gsap } from 'gsap';
import { aiConversationService, ConversationMessage, AIConversation } from '@/services/aiConversationService';

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
      content: 'Welcome! I\'m your professional development assistant for social work and mental health practitioners. I can help with AASW standards, clinical documentation, supervision frameworks, evidence-based practices, and NDIS processes. What would you like to explore?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const stopStreamingRef = useRef(false);
  const { toast } = useToast();
  const chatButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Load conversation history when dialog opens
  useEffect(() => {
    if (isOpen && user) {
      loadConversationHistory();
    }
  }, [isOpen, user]);

  const loadConversationHistory = async () => {
    if (!user) return;
    try {
      setLoadingHistory(true);
      const history = await aiConversationService.getConversations();
      setConversations(history);
    } catch (error) {
      console.error('Error loading conversation history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveConversation = async (newMessages: Message[]) => {
    if (!user || newMessages.length <= 1) return;

    try {
      const conversationMessages: ConversationMessage[] = newMessages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString()
      }));

      if (currentConversationId) {
        await aiConversationService.updateConversation(currentConversationId, conversationMessages);
      } else {
        const firstUserMessage = newMessages.find(m => m.role === 'user');
        const title = firstUserMessage 
          ? aiConversationService.generateTitle(firstUserMessage.content)
          : 'AI Conversation';
        const id = await aiConversationService.createConversation(title, conversationMessages);
        setCurrentConversationId(id);
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const loadConversation = async (conversation: AIConversation) => {
    const loadedMessages: Message[] = conversation.messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp)
    }));
    setMessages(loadedMessages);
    setCurrentConversationId(conversation.id);
    setShowHistory(false);
  };

  const startNewConversation = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Welcome! I\'m your professional development assistant for social work and mental health practitioners. I can help with AASW standards, clinical documentation, supervision frameworks, evidence-based practices, and NDIS processes. What would you like to explore?',
        timestamp: new Date()
      }
    ]);
    setCurrentConversationId(null);
    setShowHistory(false);
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      await aiConversationService.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (currentConversationId === conversationId) {
        startNewConversation();
      }
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed from your history."
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation.",
        variant: "destructive"
      });
    }
  };

  const stopStreaming = () => {
    stopStreamingRef.current = true;
    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    stopStreamingRef.current = false;

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
      // Convert messages to conversation history format - add null check
      const conversationHistory = (messages || []).map(msg => ({
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

      // Simulate natural character-by-character streaming
      const fullResponse = data.response;
      let displayedContent = '';
      let charIndex = 0;
      const messageId = (Date.now() + 1).toString();

      const getTypingDelay = (char: string, nextChar?: string) => {
        // Faster typing for spaces and common characters
        if (char === ' ') return 30;
        // Longer pauses after sentences and commas for natural flow
        if (char === '.' || char === '!' || char === '?') return 200;
        if (char === ',' || char === ';') return 100;
        if (char === '\n') return 150;
        // Variable speed for regular characters (more natural)
        return Math.random() * 40 + 40; // 40-80ms range
      };

      const streamCharacter = () => {
        if (stopStreamingRef.current) {
          // Streaming was stopped - save what we have
          const partialMessage: Message = {
            id: messageId,
            role: 'assistant',
            content: displayedContent || '(Response stopped)',
            timestamp: new Date()
          };
          const partialMessages = [...newMessages, partialMessage];
          saveConversation(partialMessages);
          setIsLoading(false);
          return;
        }

        if (charIndex < fullResponse.length) {
          displayedContent += fullResponse[charIndex];
          const currentChar = fullResponse[charIndex];
          const nextChar = fullResponse[charIndex + 1];
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

          const delay = getTypingDelay(currentChar, nextChar);
          setTimeout(streamCharacter, delay);
        } else {
          // Streaming complete - save conversation and set loading false
          const finalMessages = [...newMessages, assistantMessage];
          saveConversation(finalMessages);
          setIsLoading(false);
        }
      };

      streamCharacter();
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
    "What are the AASW CPD requirements?",
    "How do I write effective progress notes?",
    "Explain trauma-informed practice principles",
    "NDIS plan review best practices"
  ];

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  // Professional GSAP Animations
  useEffect(() => {
    let tl: GSAPTimeline;
    
    const initAnimations = () => {
      if (chatButtonRef.current) {
        tl = gsap.timeline();
        
        // Entrance animation - more professional
        tl.from(chatButtonRef.current, {
          duration: 0.6,
          scale: 0,
          opacity: 0,
          ease: "back.out(1.4)"
        });

        // Subtle floating animation
        gsap.to(chatButtonRef.current, {
          y: -4,
          duration: 3,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        });

        // Professional pulse effect with valid colors
        gsap.set(chatButtonRef.current, {
          boxShadow: "0 0 0 0 rgba(139, 155, 133, 0.3)"
        });
        
        gsap.to(chatButtonRef.current, {
          boxShadow: "0 0 0 15px rgba(139, 155, 133, 0)",
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
      
      // Professional dialog entrance
      tl.fromTo(dialogRef.current, 
        { 
          scale: 0.9, 
          opacity: 0,
          y: 20 
        },
        { 
          duration: 0.4,
          scale: 1,
          opacity: 1,
          y: 0,
          ease: "power2.out"
        }
      );
      
      // Animate content elements sequentially
      tl.from(".dialog-header", {
        duration: 0.3,
        opacity: 0,
        y: -10,
        ease: "power1.out"
      }, "-=0.2");
      
      tl.from(".chat-messages", {
        duration: 0.3,
        opacity: 0,
        y: 10,
        ease: "power1.out"
      }, "-=0.1");
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
              className="fixed bottom-20 right-6 h-16 w-16 rounded-full shadow-2xl bg-sage-600 hover:bg-sage-700 z-50 border-2 border-sage-500/20 backdrop-blur-sm transition-all duration-300 hover:scale-110"
            >
              <svg width="36" height="36" viewBox="0 0 40 40" className="text-white">
                <path
                  d="M20 6 C 28 8, 32 16, 30 24 C 28 30, 22 32, 16 30 C 12 28, 10 24, 12 20 C 13 18, 15 17, 17 18 C 18 18.5, 18.5 19, 18 19.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="sr-only">Open Professional Assistant</span>
            </Button>
        </DialogTrigger>
        
        <DialogContent 
          ref={dialogRef}
          className="sm:max-w-lg lg:max-w-2xl w-[calc(100%-2rem)] max-h-[90vh] h-[700px] lg:h-[80vh] flex flex-col p-0 border-2 border-border shadow-2xl bg-card backdrop-blur-md rounded-2xl overflow-hidden"
        >
          <DialogHeader className="dialog-header p-6 border-b border-gray-200 bg-gradient-to-r from-sage-50 to-white">
            <DialogTitle className="flex items-center justify-between text-xl text-gray-900">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-sage-600 flex items-center justify-center shadow-md">
                  <svg width="24" height="24" viewBox="0 0 40 40" className="text-white">
                    <path
                      d="M20 6 C 28 8, 32 16, 30 24 C 28 30, 22 32, 16 30 C 12 28, 10 24, 12 20 C 13 18, 15 17, 17 18 C 18 18.5, 18.5 19, 18 19.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                Professional Assistant
              </div>
              {user && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startNewConversation}
                    className="h-8 w-8 p-0"
                    title="New conversation"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="h-8 w-8 p-0"
                    title="View history"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              Professional development support for practitioners, students, and educators
            </p>
          </DialogHeader>

          {/* History Panel */}
          {showHistory && user ? (
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">Conversation History</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(false)}
                  >
                    Back to chat
                  </Button>
                </div>
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No previous conversations found.
                  </p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div 
                          className="flex-1 min-w-0"
                          onClick={() => loadConversation(conv)}
                        >
                          <p className="font-medium text-sm truncate">{conv.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(conv.updatedAt).toLocaleDateString()} - {conv.messages.length} messages
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          ) : (
            <>
              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4 chat-messages">
                <div className="space-y-4">
                  {(messages || []).map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.role === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-sage-600 text-white' 
                          : 'bg-gray-100'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                           <svg width="20" height="20" viewBox="0 0 40 40" className="text-sage-600">
                            <path
                              d="M20 6 C 28 8, 32 16, 30 24 C 28 30, 22 32, 16 30 C 12 28, 10 24, 12 20 C 13 18, 15 17, 17 18 C 18 18.5, 18.5 19, 18 19.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <div className={`flex-1 space-y-1 ${
                        message.role === 'user' ? 'text-right' : ''
                      }`}>
                        <div className={`inline-block px-3 py-2 rounded-lg max-w-[80%] ${
                          message.role === 'user'
                            ? 'bg-sage-600 text-white ml-auto'
                            : 'bg-gray-50 text-gray-900'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                         <p className="text-xs text-gray-500">
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
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 40 40" className="text-sage-600">
                          <path
                            d="M20 6 C 28 8, 32 16, 30 24 C 28 30, 22 32, 16 30 C 12 28, 10 24, 12 20 C 13 18, 15 17, 17 18 C 18 18.5, 18.5 19, 18 19.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="inline-block px-3 py-2 rounded-lg bg-gray-50">
                          <Loader2 className="h-4 w-4 animate-spin text-sage-600" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Quick Questions */}
              {messages && messages.length === 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-sage-50/50">
                  <p className="text-sm font-semibold mb-3 text-gray-900">Quick questions:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {(quickQuestions || []).map((question, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="justify-start h-auto p-3 text-xs hover:bg-sage-100 border border-transparent hover:border-sage-200 rounded-lg transition-all duration-200 text-gray-700"
                        onClick={() => handleQuickQuestion(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-6 border-t border-gray-200 bg-white">
                <div className="flex gap-3">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about..."
                    disabled={isLoading}
                    className="flex-1 border-gray-300 focus:border-sage-500 bg-white"
                  />
                  <Button 
                    onClick={isLoading ? stopStreaming : sendMessage} 
                    disabled={!input.trim() && !isLoading}
                    size="sm"
                    className={isLoading ? "bg-red-500 hover:bg-red-600 shadow-md hover:shadow-lg transition-all duration-200" : "bg-sage-600 hover:bg-sage-700 shadow-md hover:shadow-lg transition-all duration-200"}
                  >
                    {isLoading ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="sr-only">{isLoading ? 'Stop response' : 'Send message'}</span>
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  This assistant provides general information only. For emergencies, call 000 or Lifeline 13 11 14.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};