import { useState, useMemo } from 'react';
import { Search, UserPlus, Settings, MessageSquare, Users, Bell } from 'lucide-react';
import type { Room, Friendship, DirectMessage } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatSidebarProps {
  rooms: Room[];
  loading: boolean;
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  friends?: Friendship[];
  dms?: DirectMessage[];
  onOpenDM?: (userId: string) => void;
  onOpenFriends?: () => void;
  onOpenSettings?: () => void;
  pendingCount?: number;
  unreadRooms?: Set<string>;
  currentUserId?: string;
}

export function ChatSidebar({
  rooms, loading, activeRoomId, onSelectRoom,
  friends = [], dms = [], onOpenDM, onOpenFriends, onOpenSettings,
  pendingCount = 0, unreadRooms = new Set(), currentUserId
}: ChatSidebarProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'rooms' | 'friends'>('rooms');

  const filtered = useMemo(() => {
    if (!search.trim()) return rooms;
    const q = search.toLowerCase();
    return rooms.filter((r) => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
  }, [rooms, search]);

  return (
    <div className="h-full flex flex-col glass-strong">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-heading text-xl font-bold text-foreground">
            <span className="text-primary">Soni</span>gram
          </h1>
          <div className="flex gap-1">
            <button onClick={onOpenFriends} className="p-2 text-muted-foreground hover:text-primary transition-colors relative" aria-label="Amigos">
              <Users className="h-4 w-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
            <button onClick={onOpenSettings} className="p-2 text-muted-foreground hover:text-primary transition-colors" aria-label="Configurações">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-1 mb-3">
          <button onClick={() => setTab('rooms')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === 'rooms' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            Salas
          </button>
          <button onClick={() => setTab('friends')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === 'friends' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            Amigos
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'rooms' ? 'Buscar salas…' : 'Buscar amigos…'}
            className="w-full bg-muted/50 rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            aria-label="Buscar"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {tab === 'rooms' ? (
          loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-xl bg-muted" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-20 bg-muted" />
                  <Skeleton className="h-2 w-32 bg-muted" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Nenhuma sala encontrada</p>
          ) : (
            filtered.map((room) => (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group ${
                  activeRoomId === room.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50 border border-transparent'
                }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg relative ${
                  activeRoomId === room.id ? 'bg-primary/20' : 'bg-muted/50'
                } transition-colors`}>
                  {room.icon || '💬'}
                  {unreadRooms.has(room.id) && activeRoomId !== room.id && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-medium block truncate ${activeRoomId === room.id ? 'text-primary' : 'text-foreground'}`}>
                      {room.name}
                    </span>
                    {room.read_only && <span className="text-[10px] text-muted-foreground">📢</span>}
                  </div>
                  {room.description && <span className="text-xs text-muted-foreground truncate block">{room.description}</span>}
                </div>
              </button>
            ))
          )
        ) : (
          <>
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-2">Nenhum amigo ainda</p>
                <button onClick={onOpenFriends}
                  className="text-primary text-xs hover:underline flex items-center gap-1 mx-auto">
                  <UserPlus className="h-3 w-3" /> Adicionar amigo
                </button>
              </div>
            ) : (
              friends.map((f) => {
                const friend = currentUserId === f.requester_id ? f.receiver : f.requester;
                if (!friend) return null;
                return (
                  <button
                    key={f.id}
                    onClick={() => onOpenDM?.(friend.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold">
                      {friend.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate block">{friend.username}</span>
                    </div>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
