import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Message, User } from '@/lib/types';

const PAGE_SIZE = 50;

export function useRealtime(roomId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const usersCache = useRef<Map<string, User>>(new Map());

  const fetchUser = useCallback(async (userId: string): Promise<User | undefined> => {
    if (usersCache.current.has(userId)) {
      return usersCache.current.get(userId);
    }
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (data) {
      usersCache.current.set(userId, data);
    }
    return data || undefined;
  }, []);

  const fetchMessages = useCallback(async (roomId: string, before?: string) => {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    // Enrich with user data
    const enriched = await Promise.all(
      data.map(async (msg) => ({
        ...msg,
        user: await fetchUser(msg.user_id),
      }))
    );

    return enriched.reverse();
  }, [fetchUser]);

  // Load initial messages
  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setHasMore(true);
    setMessages([]);

    fetchMessages(roomId).then((msgs) => {
      setMessages(msgs);
      setHasMore(msgs.length >= PAGE_SIZE);
      setLoading(false);
    });
  }, [roomId, fetchMessages]);

  // Subscribe to realtime
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          const user = await fetchUser(newMsg.user_id);
          setMessages((prev) => [...prev, { ...newMsg, user }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchUser]);

  const loadMore = useCallback(async () => {
    if (!roomId || !hasMore || loading) return;
    const oldest = messages[0];
    if (!oldest) return;

    setLoading(true);
    const older = await fetchMessages(roomId, oldest.created_at);
    setHasMore(older.length >= PAGE_SIZE);
    setMessages((prev) => [...older, ...prev]);
    setLoading(false);
  }, [roomId, hasMore, loading, messages, fetchMessages]);

  const sendMessage = useCallback(
    async (content: string, userId: string) => {
      if (!roomId) return;
      await supabase.from('messages').insert({
        room_id: roomId,
        user_id: userId,
        content: content.trim(),
      });
    },
    [roomId]
  );

  return { messages, loading, hasMore, loadMore, sendMessage };
}
