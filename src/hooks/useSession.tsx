import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/types';

interface SessionContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, username: string) => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  updateProfile: (updates: Partial<Pick<User, 'username' | 'avatar_url' | 'bio'>>) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return data as User;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const profile = await fetchProfile(session.user.id);
          if (isMounted) setUser(profile);
        }
      } catch (e) {
        console.error('Erro ao restaurar sessão.', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT') {
        setUser(null);
        return;
      }
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (isMounted) setUser(profile);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signup = useCallback(async (email: string, password: string, username: string): Promise<{ error?: string }> => {
    try {
      const trimmed = username.trim();

      // Check username availability
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', trimmed)
        .maybeSingle();

      if (existing) return { error: 'Nome de usuário já está em uso.' };

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          return { error: 'Este email já está cadastrado.' };
        }
        return { error: authError.message };
      }

      if (!authData.user) return { error: 'Erro ao criar conta.' };

      const { error: insertError } = await supabase.from('users').insert({
        id: authData.user.id,
        username: trimmed,
        avatar_url: null,
      });

      if (insertError) {
        if (insertError.code === '23505') return { error: 'Nome de usuário já está em uso.' };
        return { error: 'Erro ao criar perfil.' };
      }

      const profile = await fetchProfile(authData.user.id);
      if (profile) setUser(profile);
      return {};
    } catch {
      return { error: 'Erro inesperado. Tente novamente.' };
    }
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Invalid login')) {
          return { error: 'Email ou senha incorretos.' };
        }
        return { error: error.message };
      }
      if (!data.user) return { error: 'Erro ao entrar.' };

      const profile = await fetchProfile(data.user.id);
      if (profile?.is_banned) {
        await supabase.auth.signOut();
        return { error: 'Sua conta foi banida.' };
      }
      if (profile) setUser(profile);
      return {};
    } catch {
      return { error: 'Erro inesperado. Tente novamente.' };
    }
  }, [fetchProfile]);

  const resetPassword = useCallback(async (email: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { error: error.message };
      return {};
    } catch {
      return { error: 'Erro ao enviar email de recuperação.' };
    }
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { error: error.message };
      return {};
    } catch {
      return { error: 'Erro ao atualizar senha.' };
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Pick<User, 'username' | 'avatar_url' | 'bio'>>): Promise<{ error?: string }> => {
    if (!user) return { error: 'Não autenticado.' };
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);
      if (error) {
        if (error.code === '23505') return { error: 'Nome de usuário já está em uso.' };
        return { error: 'Erro ao atualizar perfil.' };
      }
      setUser(prev => prev ? { ...prev, ...updates } : null);
      return {};
    } catch {
      return { error: 'Erro inesperado.' };
    }
  }, [user]);

  const logout = useCallback(async () => {
    setUser(null);
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, resetPassword, updatePassword, updateProfile, logout }),
    [user, loading, login, signup, resetPassword, updatePassword, updateProfile, logout]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession deve ser usado dentro de SessionProvider.');
  return context;
}
