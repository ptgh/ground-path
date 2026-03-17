import { useState, useEffect } from 'react';
import { messagingService } from '@/services/messagingService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchCount = async () => {
      const count = await messagingService.getUnreadCount();
      setUnreadCount(count);
    };

    fetchCount();

    // Subscribe to new messages for real-time badge updates
    const channel = supabase
      .channel(`unread:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => fetchCount()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'client_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => fetchCount()
      )
      .subscribe();

    // Poll every 30s as fallback
    const interval = setInterval(fetchCount, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [user?.id]);

  return unreadCount;
};
