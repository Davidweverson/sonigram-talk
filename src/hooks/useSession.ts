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

const SESSION_KEY = 'sonigram_session';

interface SessionData {
  userId: string;
  username: string;
  avatar_url: string | null;
}

interface SessionContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, avatarUrl?: string | null) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

function toUser(session: SessionData, createdAt = ''): User {
  return {
    id: session.userId,
    username: session.username,
    avatar_url: session.avatar_url,
    created_at: createdAt,
  };
}

function toSessionData(user: Pick<User, 'id' | 'username' | 'avatar_url'>): SessionData {
  return {
    userId: user.id,
    username: user.username,
    avatar_url: user.avatar_url,
  };
}

function readStoredSession(): SessionData | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as SessionData;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function persistSession(session: SessionData) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserFromAuth = useCallback(async (authUserId: string | null) => {
    const stored = readStoredSession();

    if (stored && (!authUserId || stored.userId === authUserId)) {
      setUser(toUser(stored));
      return;
    }

    if (stored && authUserId && stored.userId !== authUserId) {
      clearStoredSession();
    }

    if (!authUserId) {
      setUser(null);
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUserId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao restaurar perfil do usuário.', error);
      setUser(null);
      return;
    }

    if (!data) {
      setUser(null);
      return;
    }

    persistSession(toSessionData(data));
    setUser({
      id: data.id,
      username: data.username,
      avatar_url: data.avatar_url,
      created_at: data.created_at ?? '',
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      const stored = readStoredSession();

      if (stored && isMounted) {
        setUser(toUser(stored));
      }

      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Erro ao inicializar sessão do Supabase.', error);
        }

        if (!isMounted) {
          return;
        }

        await syncUserFromAuth(data.session?.user?.id ?? null);
      } catch (error) {
        console.error('Falha inesperada ao restaurar a sessão.', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      if (event === 'SIGNED_OUT') {
        clearStoredSession();
        setUser(null);
        return;
      }

      if (session?.user) {
        void syncUserFromAuth(session.user.id);
        return;
      }

      const stored = readStoredSession();
      setUser(stored ? toUser(stored) : null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncUserFromAuth]);

  const login = useCallback(async (username: string, avatarUrl?: string | null): Promise<{ error?: string }> => {
    try {
      const normalizedUsername = username.trim();

      const { data: existing, error: existingError } = await supabase
        .from('users')
        .select('*')
        .eq('username', normalizedUsername)
        .maybeSingle();

      if (existingError) {
        console.error('Erro ao verificar o nome de usuário.', existingError);
        return { error: 'Erro ao verificar o nome de usuário. Tente novamente.' };
      }

      if (existing) {
        persistSession(toSessionData(existing));
        setUser({
          id: existing.id,
          username: existing.username,
          avatar_url: existing.avatar_url,
          created_at: existing.created_at ?? '',
        });
        return {};
      }

      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

      if (authError || !authData.user) {
        console.error('Erro ao criar sessão anônima.', authError);
        return { error: 'Erro ao criar conta. Tente novamente.' };
      }

      const newUser: User = {
        id: authData.user.id,
        username: normalizedUsername,
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

        console.error('Erro ao criar perfil.', insertError);
        return { error: 'Erro ao criar perfil. Tente novamente.' };
      }

      persistSession(toSessionData(newUser));
      setUser(newUser);
      return {};
    } catch (error) {
      console.error('Falha inesperada ao iniciar sessão.', error);
      return { error: 'Não foi possível entrar agora. Tente novamente.' };
    }
  }, []);

  const logout = useCallback(async () => {
    clearStoredSession();
    setUser(null);
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Erro ao encerrar sessão.', error);
      }
    } catch (error) {
      console.error('Falha inesperada ao sair.', error);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession deve ser usado dentro de SessionProvider.');
  }

  return context;
}
