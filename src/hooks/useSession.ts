import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/types';

const SESSION_KEY = 'sonigram_session';

interface SessionData {
  userId: string;
  username: string;
  avatar_url: string | null;
}

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const data: SessionData = JSON.parse(stored);
        setUser({
          id: data.userId,
          username: data.username,
          avatar_url: data.avatar_url,
          created_at: '',
        });
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, avatarUrl?: string | null): Promise<{ error?: string }> => {
    // Check if username exists
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      // Login with existing user
      const session: SessionData = {
        userId: existing.id,
        username: existing.username,
        avatar_url: existing.avatar_url,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setUser(existing);
      return {};
    }

    // Sign up anonymously then create user
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError || !authData.user) {
      return { error: 'Erro ao criar conta. Tente novamente.' };
    }

    const newUser: User = {
      id: authData.user.id,
      username,
      avatar_url: avatarUrl || null,
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: newUser.id,
        username: newUser.username,
        avatar_url: newUser.avatar_url,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        return { error: 'Nome de usuário já está em uso.' };
      }
      return { error: 'Erro ao criar perfil. Tente novamente.' };
    }

    const session: SessionData = {
      userId: newUser.id,
      username: newUser.username,
      avatar_url: newUser.avatar_url,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(newUser);
    return {};
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    supabase.auth.signOut();
  }, []);

  return { user, loading, login, logout };
}
