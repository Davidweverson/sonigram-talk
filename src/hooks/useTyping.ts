import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/types';

export function useTyping(roomId: string | null, currentUserId: string | null) {
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const typingRef = useRef(false);

  // Subscribe to typing changes
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`typing:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          // Fetch current typing users
          const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
          const { data } = await supabase
            .from('typing_indicators')
            .select('*, user:users(*)')
            .eq('room_id', roomId)
            .gt('updated_at', fiveSecondsAgo);

          if (data) {
            const users = data
              .filter((t) => t.user_id !== currentUserId)
              .map((t) => t.user as unknown as User)
              .filter(Boolean);
            setTypingUsers(users);
          }
        }
      )
      .subscribe();

    // Clean stale indicators periodically
    const interval = setInterval(async () => {
      const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
      const { data } = await supabase
        .from('typing_indicators')
        .select('*, user:users(*)')
        .eq('room_id', roomId)
        .gt('updated_at', fiveSecondsAgo);

      if (data) {
        const users = data
          .filter((t) => t.user_id !== currentUserId)
          .map((t) => t.user as unknown as User)
          .filter(Boolean);
        setTypingUsers(users);
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [roomId, currentUserId]);

  const startTyping = useCallback(async () => {
    if (!roomId || !currentUserId) return;

    await supabase.from('typing_indicators').upsert(
      {
        room_id: roomId,
        user_id: currentUserId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'room_id,user_id' }
    );

    // Clear after 3 seconds of inactivity
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    typingRef.current = true;
    timeoutRef.current = setTimeout(async () => {
      typingRef.current = false;
      await supabase
        .from('typing_indicators')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', currentUserId);
    }, 3000);
  }, [roomId, currentUserId]);

  const stopTyping = useCallback(async () => {
    if (!roomId || !currentUserId) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    typingRef.current = false;
    await supabase
      .from('typing_indicators')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', currentUserId);
  }, [roomId, currentUserId]);

  return { typingUsers, startTyping, stopTyping };
}
