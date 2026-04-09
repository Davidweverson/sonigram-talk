import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/hooks/useSession';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { User, Report, Message } from '@/lib/types';
import { Search, ArrowLeft, Ban, Volume2, VolumeX, Trash2, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { smartTimestamp } from '@/lib/timestamps';

type AdminTab = 'users' | 'reports' | 'messages';

export default function AdminPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userMessages, setUserMessages] = useState<(Message & { room_name?: string })[]>([]);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) { navigate('/chat'); return; }
  }, [isAdmin, navigate]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    setUsers((data as User[]) || []);
    setLoading(false);
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      const userIds = [...new Set(data.flatMap((r) => [r.reporter_id, r.reported_user_id]))];
      const { data: usersData } = await supabase.from('users').select('*').in('id', userIds);
      const userMap = new Map<string, User>();
      (usersData || []).forEach((u) => userMap.set(u.id, u as User));

      setReports(data.map((r) => ({
        ...r,
        reporter: userMap.get(r.reporter_id),
        reported_user: userMap.get(r.reported_user_id),
      })) as Report[]);
    } else {
      setReports([]);
    }
    setLoading(false);
  }, []);

  const fetchUserMessages = useCallback(async (userId: string) => {
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (msgs && msgs.length > 0) {
      const roomIds = [...new Set(msgs.map((m) => m.room_id))];
      const { data: rooms } = await supabase.from('rooms').select('id, name').in('id', roomIds);
      const roomMap = new Map<string, string>();
      (rooms || []).forEach((r) => roomMap.set(r.id, r.name));

      setUserMessages(msgs.map((m) => ({ ...m, room_name: roomMap.get(m.room_id), created_at: m.created_at || '' })) as (Message & { room_name?: string })[]);
    } else {
      setUserMessages([]);
    }
  }, []);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    else if (tab === 'reports') fetchReports();
  }, [tab, fetchUsers, fetchReports]);

  const toggleBan = async (u: User) => {
    await supabase.from('users').update({ is_banned: !u.is_banned }).eq('id', u.id);
    fetchUsers();
  };

  const toggleMute = async (u: User) => {
    await supabase.from('users').update({ is_muted: !u.is_muted }).eq('id', u.id);
    fetchUsers();
  };

  const deleteMsg = async (msgId: string) => {
    if (!confirm('Excluir esta mensagem?')) return;
    await supabase.from('messages').delete().eq('id', msgId);
    if (selectedUser) fetchUserMessages(selectedUser.id);
  };

  const filteredUsers = users.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()));

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/chat')} className="p-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" /> Painel Admin
            </h1>
            <p className="text-xs text-muted-foreground">Gerenciamento do Sonigram</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {(['users', 'reports', 'messages'] as AdminTab[]).map((t) => (
            <button key={t} onClick={() => { setTab(t); setSelectedUser(null); }}
              className={`px-4 py-2 text-sm rounded-xl transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'glass text-foreground hover:bg-muted/50'}`}>
              {t === 'users' ? 'Usuários' : t === 'reports' ? 'Denúncias' : 'Mensagens'}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <div className="glass rounded-2xl p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuários…"
                className="w-full bg-muted/50 rounded-xl pl-9 pr-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl bg-muted" />)}</div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold">
                      {u.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{u.username}</span>
                        {u.role === 'admin' && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">Admin</span>}
                        {u.is_banned && <span className="text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full">Banido</span>}
                        {u.is_muted && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">Mudo</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.friend_code}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setSelectedUser(u); setTab('messages'); fetchUserMessages(u.id); }}
                        className="p-2 text-muted-foreground hover:text-primary rounded-lg" title="Ver mensagens">
                        💬
                      </button>
                      <button onClick={() => toggleMute(u)}
                        className={`p-2 rounded-lg ${u.is_muted ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title={u.is_muted ? 'Desmutar' : 'Mutar'}>
                        {u.is_muted ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      </button>
                      <button onClick={() => toggleBan(u)}
                        className={`p-2 rounded-lg ${u.is_banned ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
                        title={u.is_banned ? 'Desbanir' : 'Banir'}>
                        <Ban className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'reports' && (
          <div className="glass rounded-2xl p-4">
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl bg-muted" />)}</div>
            ) : reports.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">Nenhuma denúncia</p>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">{smartTimestamp(r.created_at)}</span>
                    </div>
                    <p className="text-sm text-foreground mb-1">
                      <span className="font-semibold text-primary">{r.reporter?.username}</span> denunciou{' '}
                      <span className="font-semibold text-destructive">{r.reported_user?.username}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{r.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'messages' && (
          <div className="glass rounded-2xl p-4">
            {selectedUser && (
              <p className="text-sm text-muted-foreground mb-3">Mensagens de <span className="text-primary font-semibold">{selectedUser.username}</span></p>
            )}
            {userMessages.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                {selectedUser ? 'Nenhuma mensagem encontrada' : 'Selecione um usuário na aba Usuários'}
              </p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-thin">
                {userMessages.map((m) => (
                  <div key={m.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/20 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                        <span>#{m.room_name || '?'}</span>
                        <span>{smartTimestamp(m.created_at)}</span>
                      </div>
                      <p className="text-foreground break-words">{m.content}</p>
                    </div>
                    <button onClick={() => deleteMsg(m.id)} className="p-1 text-muted-foreground hover:text-destructive flex-shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
