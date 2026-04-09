import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { DirectMessage, User } from '@/lib/types';

export function useDMs(userId: string | null) {
  const [dms, setDms] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDMs = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error || !data) {
      setLoading(false);
      return;
    }

    const otherIds = data.map((dm) => dm.user1_id === userId ? dm.user2_id : dm.user1_id);
    const { data: users } = await supabase.from('users').select('*').in('id', otherIds);
    const userMap = new Map<string, User>();
    (users || []).forEach((u) => userMap.set(u.id, u as User));

    const enriched: DirectMessage[] = data.map((dm) => ({
      ...dm,
      other_user: userMap.get(dm.user1_id === userId ? dm.user2_id : dm.user1_id),
    }));

    setDms(enriched);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchDMs(); }, [fetchDMs]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`dms:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, () => {
        fetchDMs();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchDMs]);

  const getOrCreateDM = useCallback(async (otherUserId: string): Promise<string | null> => {
    if (!userId) return null;

    // Check existing
    const { data: existing } = await supabase
      .from('direct_messages')
      .select('id')
      .or(`and(user1_id.eq.${userId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${userId})`)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: created, error } = await supabase
      .from('direct_messages')
      .insert({ user1_id: userId, user2_id: otherUserId })
      .select('id')
      .single();

    if (error || !created) return null;
    await fetchDMs();
    return created.id;
  }, [userId, fetchDMs]);

  return { dms, loading, getOrCreateDM, refresh: fetchDMs };
}
