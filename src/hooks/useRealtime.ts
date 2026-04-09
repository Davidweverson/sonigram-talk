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
      usersCache.current.set(userId, data as User);
    }
    return (data as User) || undefined;
  }, []);

  const fetchReplyTo = useCallback(async (replyToId: string | null): Promise<Message | null> => {
    if (!replyToId) return null;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('id', replyToId)
      .maybeSingle();
    if (!data) return null;
    const user = await fetchUser(data.user_id);
    return { ...data, user, created_at: data.created_at || '' } as Message;
  }, [fetchUser]);

  const fetchMessages = useCallback(async (rid: string, before?: string) => {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('room_id', rid)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    const enriched = await Promise.all(
      data.map(async (msg) => {
        const user = await fetchUser(msg.user_id);
        const reply_to = await fetchReplyTo(msg.reply_to_id);
        return { ...msg, user, reply_to, created_at: msg.created_at || '' } as Message;
      })
    );

    return enriched.reverse();
  }, [fetchUser, fetchReplyTo]);

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
          const reply_to = await fetchReplyTo(newMsg.reply_to_id || null);
          setMessages((prev) => [...prev, { ...newMsg, user, reply_to }]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const updated = payload.new as Message;
          const user = await fetchUser(updated.user_id);
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...updated, user, reply_to: m.reply_to } : m))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const deleted = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchUser, fetchReplyTo]);

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
    async (content: string, userId: string, replyToId?: string, mediaUrl?: string, mediaType?: string) => {
      if (!roomId) return;
      await supabase.from('messages').insert({
        room_id: roomId,
        user_id: userId,
        content: content.trim(),
        reply_to_id: replyToId || null,
        media_url: mediaUrl || null,
        media_type: mediaType || null,
      });
    },
    [roomId]
  );

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    await supabase
      .from('messages')
      .update({ content: newContent, edited_at: new Date().toISOString() })
      .eq('id', messageId);
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    await supabase.from('messages').delete().eq('id', messageId);
  }, []);

  return { messages, loading, hasMore, loadMore, sendMessage, editMessage, deleteMessage };
}
