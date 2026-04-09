import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Friendship, User } from '@/lib/types';

export function useFriends(userId: string | null) {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFriendships = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Fetch user details for each friendship
    const userIds = new Set<string>();
    data.forEach((f) => {
      userIds.add(f.requester_id);
      userIds.add(f.receiver_id);
    });
    userIds.delete(userId);

    const { data: users } = await supabase
      .from('users')
      .select('*')
      .in('id', Array.from(userIds));

    const userMap = new Map<string, User>();
    (users || []).forEach((u) => userMap.set(u.id, u as User));

    const enriched: Friendship[] = data.map((f) => ({
      ...f,
      status: f.status as Friendship['status'],
      requester: userMap.get(f.requester_id),
      receiver: userMap.get(f.receiver_id),
    }));

    setFriends(enriched.filter((f) => f.status === 'accepted'));
    setPendingRequests(enriched.filter((f) => f.status === 'pending' && f.receiver_id === userId));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchFriendships();
  }, [fetchFriendships]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`friendships:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friendships',
      }, () => {
        fetchFriendships();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchFriendships]);

  const addFriend = useCallback(async (friendCode: string): Promise<{ error?: string }> => {
    if (!userId) return { error: 'Não autenticado.' };

    const { data: target, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('friend_code', friendCode.trim().toUpperCase())
      .maybeSingle();

    if (findError || !target) return { error: 'Código de amigo não encontrado.' };
    if (target.id === userId) return { error: 'Você não pode adicionar a si mesmo.' };

    const { error } = await supabase.from('friendships').insert({
      requester_id: userId,
      receiver_id: target.id,
    });

    if (error) {
      if (error.code === '23505') return { error: 'Pedido já enviado.' };
      return { error: 'Erro ao enviar pedido.' };
    }
    return {};
  }, [userId]);

  const acceptRequest = useCallback(async (friendshipId: string) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
  }, []);

  const rejectRequest = useCallback(async (friendshipId: string) => {
    await supabase.from('friendships').update({ status: 'rejected' }).eq('id', friendshipId);
  }, []);

  const removeFriend = useCallback(async (friendshipId: string) => {
    await supabase.from('friendships').delete().eq('id', friendshipId);
  }, []);

  return { friends, pendingRequests, loading, addFriend, acceptRequest, rejectRequest, removeFriend, refresh: fetchFriendships };
}
