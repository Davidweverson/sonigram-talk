import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/types';

interface TypingRow {
  room_id: string;
  user_id: string;
  updated_at: string;
  user: User | null;
}

export function useTyping(roomId: string | null, currentUserId: string | null) {
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchTyping = useCallback(async () => {
    if (!roomId) return;
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
    const { data } = await supabase
      .from('typing_indicators')
      .select('room_id, user_id, updated_at')
      .eq('room_id', roomId)
      .gt('updated_at', fiveSecondsAgo);

    if (data) {
      // Fetch user details separately
      const userIds = data
        .map((t) => t.user_id)
        .filter((id) => id !== currentUserId);

      if (userIds.length === 0) {
        setTypingUsers([]);
        return;
      }

      const { data: users } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);

      setTypingUsers((users as User[]) || []);
    }
  }, [roomId, currentUserId]);

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
        () => {
          fetchTyping();
        }
      )
      .subscribe();

    const interval = setInterval(fetchTyping, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [roomId, currentUserId, fetchTyping]);

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

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
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
    await supabase
      .from('typing_indicators')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', currentUserId);
  }, [roomId, currentUserId]);

  return { typingUsers, startTyping, stopTyping };
}
