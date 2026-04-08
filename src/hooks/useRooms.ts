import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Room } from '@/lib/types';

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        setRooms(data);
      }
      setLoading(false);
    };

    fetchRooms();
  }, []);

  return { rooms, loading };
}
