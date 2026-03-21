import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const TYPING_TIMEOUT_MS = 3000;

export function useTypingIndicator(conversationId: string, userId: string | undefined) {
  const [othersTyping, setOthersTyping] = useState<string[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!userId || !conversationId) return;

    const channel = supabase.channel(`typing:${conversationId}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typingUsers: string[] = [];
        for (const key of Object.keys(state)) {
          if (key !== userId) {
            const presences = state[key] as any[];
            if (presences.some(p => p.typing)) {
              typingUsers.push(key);
            }
          }
        }
        setOthersTyping(typingUsers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ typing: false });
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [conversationId, userId]);

  const sendTyping = useCallback(() => {
    if (!channelRef.current || !userId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      channelRef.current.track({ typing: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      channelRef.current?.track({ typing: false });
    }, TYPING_TIMEOUT_MS);
  }, [userId]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current && channelRef.current) {
      isTypingRef.current = false;
      channelRef.current.track({ typing: false });
    }
  }, []);

  return { othersTyping, sendTyping, stopTyping };
}
